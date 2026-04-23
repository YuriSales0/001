import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * POST /api/invites — Admin creates a user with role + contract + sends invite
 *
 * Body: {
 *   email, name, role: MANAGER|CREW|CLIENT,
 *   // Manager-specific
 *   managerSubscriptionShare?, managerCommissionShare?,
 *   // Crew-specific
 *   crewContractType?, crewMonthlyRate?, crewTaskRate?,
 *   // Client-specific
 *   subscriptionPlan?, managerId?,
 *   // Contract
 *   contractTerms?, contractTitle?,
 * }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { email, name, role } = body

  if (!email || !role || !['MANAGER', 'CREW', 'CLIENT'].includes(role)) {
    return NextResponse.json({ error: 'email and role (MANAGER|CREW|CLIENT) required' }, { status: 400 })
  }

  // Managers can only invite CLIENTs, and the invitee is always assigned to them
  if (me.role === 'MANAGER' && role !== 'CLIENT') {
    return NextResponse.json({ error: 'Managers can only invite clients' }, { status: 403 })
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: `User ${email} already exists` }, { status: 409 })
  }

  // Build user data based on role
  const userData: Record<string, unknown> = {
    email,
    name: name ?? null,
    role,
    onboardingCompleted: false,
  }

  if (role === 'MANAGER') {
    if (body.managerSubscriptionShare !== undefined) userData.managerSubscriptionShare = Number(body.managerSubscriptionShare)
    if (body.managerCommissionShare !== undefined) userData.managerCommissionShare = Number(body.managerCommissionShare)
  }

  if (role === 'CREW') {
    if (body.crewContractType) userData.crewContractType = body.crewContractType
    if (body.crewMonthlyRate !== undefined) userData.crewMonthlyRate = Number(body.crewMonthlyRate)
    if (body.crewTaskRate !== undefined) userData.crewTaskRate = Number(body.crewTaskRate)
  }

  if (role === 'CLIENT') {
    if (body.subscriptionPlan) userData.subscriptionPlan = body.subscriptionPlan
    // Force managerId = me.id when a Manager invites; Admin can assign freely
    if (me.role === 'MANAGER') {
      userData.managerId = me.id
    } else if (body.managerId) {
      userData.managerId = body.managerId
    }
  }

  // Create user
  const user = await prisma.user.create({
    data: userData as Parameters<typeof prisma.user.create>[0]['data'],
  })

  // Create contract if terms provided
  let contract = null
  if (body.contractTerms) {
    const contractType = role === 'MANAGER' ? 'MANAGER_AGREEMENT'
      : role === 'CREW' ? (body.crewContractType === 'MONTHLY' ? 'CREW_MONTHLY' : 'CREW_FREELANCER')
      : 'CLIENT_SERVICE'

    contract = await prisma.contract.create({
      data: {
        userId: user.id,
        type: contractType,
        title: body.contractTitle ?? `Contrato ${role} — ${name ?? email}`,
        terms: body.contractTerms,
        compensation: role === 'MANAGER' ? {
          subscriptionShare: body.managerSubscriptionShare,
          commissionShare: body.managerCommissionShare,
        } : role === 'CREW' ? {
          contractType: body.crewContractType,
          monthlyRate: body.crewMonthlyRate,
          taskRate: body.crewTaskRate,
        } : {
          plan: body.subscriptionPlan,
        },
        startDate: new Date(),
        signedByAdmin: true,
      },
    })
  }

  // Generate signup link
  const signupUrl = `${APP_URL}/register?email=${encodeURIComponent(email)}&role=${role}`

  // Send invite email
  try {
    await sendEmail({
      to: email,
      subject: `Convite HostMasters — ${role === 'MANAGER' ? 'Manager' : role === 'CREW' ? 'Equipa operacional' : 'Proprietário'}`,
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
          <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Bem-vindo à HostMasters</h2>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">
            Olá${name ? ` ${name.split(' ')[0]}` : ''},<br><br>
            Foste convidado para a plataforma HostMasters como <strong>${role === 'MANAGER' ? 'Manager' : role === 'CREW' ? 'membro da equipa operacional' : 'proprietário'}</strong>.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${signupUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Criar a minha conta
            </a>
          </p>
          <p style="font-size:13px;color:#999;">Este link é exclusivo para ti. Ao registar-te, vais completar um setup inicial e ${contract ? 'aceitar o contrato de serviço' : 'configurar o teu perfil'}.</p>
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
    console.error('Invite email error:', err)
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
    contract: contract ? { id: contract.id, type: contract.type, title: contract.title } : null,
    signupUrl,
    emailSent: true,
  }, { status: 201 })
}
