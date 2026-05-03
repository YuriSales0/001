import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { forgotPasswordSubject, forgotPasswordBody, normalizeEmailLocale } from '@/lib/email-i18n'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Generates single-use 1h reset token, sends email with link to /set-password.
 * Does NOT reveal whether email exists (always returns ok:true).
 * Rate-limited via middleware (3/min).
 *
 * Reuses the VerificationToken model + /api/auth/set-password endpoint.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email || '').toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Always respond ok regardless of whether user exists (prevent enumeration)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, language: true },
  })

  if (!user) {
    return NextResponse.json({ ok: true })
  }

  // Invalidate any existing reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: `set-password:${user.id}` },
  })

  // Generate fresh single-use token (1h expiry — shorter than admin invite flow)
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: {
      identifier: `set-password:${user.id}`,
      token,
      expires,
    },
  })

  const resetUrl = `${APP_URL}/set-password?token=${token}`
  const firstName = user.name?.split(' ')[0] || ''
  const loc = normalizeEmailLocale(user.language)

  // Best-effort email send
  try {
    await sendEmail({
      to: user.email,
      subject: forgotPasswordSubject[loc],
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
          <h2 style="margin:0 0 8px;font-size:20px;color:#0B1E3A;">${forgotPasswordBody.title(loc, firstName)}</h2>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">
            ${forgotPasswordBody.intro(loc)}
          </p>
          <p style="margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#B08A3E;color:#0B1E3A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
              ${forgotPasswordBody.cta(loc)}
            </a>
          </p>
          <p style="font-size:13px;color:#999;margin:0;">${forgotPasswordBody.footer(loc)}</p>
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
    console.error('[forgot-password] email error:', err)
    // Don't leak — still return ok
  }

  return NextResponse.json({ ok: true })
}
