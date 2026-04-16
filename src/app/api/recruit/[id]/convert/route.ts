import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

// Default compensation
const DEFAULT_MANAGER_SUB_SHARE = 0.15
const DEFAULT_MANAGER_COMM_SHARE = 0.03

/**
 * POST /api/recruit/[id]/convert
 *
 * Converts a recruit application into a real User (MANAGER or CREW)
 * with optional custom compensation, generates a contract, and sends invite email.
 *
 * Body: {
 *   managerSubscriptionShare?, managerCommissionShare?,   // Manager
 *   crewContractType?, crewMonthlyRate?, crewTaskRate?,   // Crew
 *   contractTerms?, contractTitle?,
 * }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const app = await prisma.recruitApplication.findUnique({ where: { id: params.id } })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (app.convertedToUserId) {
    return NextResponse.json({ error: 'Application already converted' }, { status: 400 })
  }

  // Check if user already exists with this email
  const existing = await prisma.user.findUnique({ where: { email: app.email } })
  if (existing) {
    return NextResponse.json({ error: `User ${app.email} already exists` }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))

  // Build user data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userData: any = {
    email: app.email,
    name: app.name,
    role: app.role,
    onboardingCompleted: false,
  }

  if (app.role === 'MANAGER') {
    userData.managerSubscriptionShare = body.managerSubscriptionShare ?? DEFAULT_MANAGER_SUB_SHARE
    userData.managerCommissionShare = body.managerCommissionShare ?? DEFAULT_MANAGER_COMM_SHARE
  }

  if (app.role === 'CREW') {
    if (body.crewContractType) userData.crewContractType = body.crewContractType
    if (body.crewMonthlyRate !== undefined) userData.crewMonthlyRate = Number(body.crewMonthlyRate)
    if (body.crewTaskRate !== undefined) userData.crewTaskRate = Number(body.crewTaskRate)
    if (app.skills && app.skills.length > 0) userData.crewSkills = JSON.stringify(app.skills)
  }

  // Create everything atomically
  const { user, contract } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData })

    let contract = null
    if (body.contractTerms) {
      const contractType = app.role === 'MANAGER'
        ? 'MANAGER_AGREEMENT'
        : body.crewContractType === 'MONTHLY' ? 'CREW_MONTHLY' : 'CREW_FREELANCER'

      contract = await tx.contract.create({
        data: {
          userId: user.id,
          type: contractType,
          title: body.contractTitle ?? `Contract ${app.role} — ${app.name}`,
          terms: body.contractTerms,
          compensation: app.role === 'MANAGER' ? {
            subscriptionShare: userData.managerSubscriptionShare,
            commissionShare: userData.managerCommissionShare,
          } : {
            contractType: body.crewContractType,
            monthlyRate: body.crewMonthlyRate,
            taskRate: body.crewTaskRate,
          },
          startDate: new Date(),
          signedByAdmin: true,
        },
      })
    }

    // Mark application as converted + accepted
    await tx.recruitApplication.update({
      where: { id: app.id },
      data: {
        status: 'ACCEPTED',
        convertedToUserId: user.id,
        convertedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: guard.user!.id,
      },
    })

    return { user, contract }
  })

  // Send invite email (best-effort — don't fail if email service down)
  const signupUrl = `${APP_URL}/register?email=${encodeURIComponent(app.email)}&role=${app.role}`
  const firstName = app.name.split(' ')[0]
  const roleLabel = app.role === 'MANAGER' ? 'Manager' : 'Crew'

  try {
    await sendEmail({
      to: app.email,
      subject: `Welcome to HostMasters — ${roleLabel}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#111827;padding:24px 32px;">
          <span style="font-size:20px;font-weight:700;color:#fff;">Host<span style="color:#C9A84C;">Masters</span></span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Welcome ${firstName}</h2>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">
            Your ${roleLabel} application has been approved. Create your account to complete your setup.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${signupUrl}" style="display:inline-block;background:#C9A84C;color:#111827;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Create my account →
            </a>
          </p>
          <p style="font-size:13px;color:#999;">This link is exclusive to you. After creating your account you'll review and sign your service agreement.</p>
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
    console.error('[recruit convert] invite email failed', err)
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
    contract: contract ? { id: contract.id } : null,
    signupUrl,
  }, { status: 201 })
}
