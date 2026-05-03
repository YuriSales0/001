import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { twoFASubject, twoFABody, normalizeEmailLocale } from '@/lib/email-i18n'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login-init
 * Body: { email, password }
 *
 * Validates credentials. If 2FA is enabled for the user, generates a 6-digit
 * email code, persists it (10min expiry), sends it, and returns require2FA:true.
 *
 * The client then collects the code and submits all three (email, password, code)
 * to NextAuth's /api/auth/callback/credentials, where authorize() validates the
 * code in addition to the password.
 *
 * If 2FA is NOT enabled, returns require2FA:false and the client proceeds
 * with normal NextAuth signin (email + password).
 *
 * Rate-limited via middleware (3/min per IP, same as forgot-password).
 *
 * Security:
 *  - Doesn't reveal whether email exists vs wrong password vs no 2FA — all
 *    invalid scenarios return 401 with same shape.
 *  - Code is single-use; subsequent code requests invalidate the previous.
 *  - 5 failed code verifications trigger code invalidation (forces re-init).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''
  if (!email || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      emailVerified: true,
      language: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
    },
  })

  if (!user || !user.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: 'EMAIL_NOT_VERIFIED' }, { status: 401 })
  }

  // Credentials are valid. Check 2FA.
  if (!user.twoFactorEnabled) {
    return NextResponse.json({ ok: true, require2FA: false })
  }

  // Generate 6-digit code (cryptographically random, no bias)
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  // Invalidate any existing 2FA codes for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: `2fa:${user.id}` },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: `2fa:${user.id}`,
      token: code,
      expires,
    },
  })

  // Send email (best-effort; failure surfaces to client)
  const loc = normalizeEmailLocale(user.language)
  try {
    await sendEmail({
      to: user.email,
      subject: twoFASubject(loc, code),
      html: `<!DOCTYPE html>
<html lang="${loc}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0B1E3A;padding:24px 32px;">
          <span style="font-size:20px;font-weight:700;color:#fff;">Host<span style="color:#B08A3E;">Masters</span></span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#0B1E3A;">${twoFABody.title(loc)}</h2>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">${twoFABody.intro(loc)}</p>
          <div style="text-align:center;padding:24px;background:#f9f9f7;border-radius:8px;margin:0 0 24px;">
            <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0B1E3A;">${code}</span>
          </div>
          <p style="font-size:13px;color:#999;margin:0;">${twoFABody.footer(loc)}</p>
        </td></tr>
        <tr><td style="background:#f9f9f7;padding:20px 32px;border-top:1px solid #ececec;">
          <p style="margin:0;font-size:12px;color:#999;">HostMasters · Costa Tropical, Spain</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  } catch (err) {
    console.error('[login-init] 2FA email error:', err)
    return NextResponse.json({ error: 'Could not send verification code' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, require2FA: true, method: user.twoFactorMethod || 'EMAIL' })
}
