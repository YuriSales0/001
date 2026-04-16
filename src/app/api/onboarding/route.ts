import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/onboarding — check if user needs onboarding
 * POST /api/onboarding — save wizard data and mark complete
 */
export async function GET() {
  const guard = await requireRole(['MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      onboardingCompleted: true,
      onboardingData: true,
      role: true,
      name: true,
      phone: true,
      crewContractType: true,
      crewMonthlyRate: true,
      crewTaskRate: true,
      managerSubscriptionShare: true,
      managerCommissionShare: true,
      contracts: {
        where: { status: 'ACTIVE' },
        select: { id: true, type: true, title: true, signedByUser: true },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    needsOnboarding: !user.onboardingCompleted,
    role: user.role,
    currentData: {
      name: user.name,
      phone: user.phone,
      crewContractType: user.crewContractType,
      crewMonthlyRate: user.crewMonthlyRate,
      crewTaskRate: user.crewTaskRate,
      managerSubscriptionShare: user.managerSubscriptionShare,
      managerCommissionShare: user.managerCommissionShare,
    },
    pendingContracts: user.contracts.filter(c => !c.signedByUser),
    completedAt: user.onboardingData ? (user.onboardingData as { completedAt?: string }).completedAt : null,
  })
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json()
  const { step, data, complete } = body as {
    step?: string
    data: Record<string, unknown>
    complete?: boolean
  }

  // Build update based on role
  const update: Record<string, unknown> = {}

  // Common fields
  if (data.name) update.name = data.name
  if (data.phone) update.phone = data.phone
  if (data.language) update.language = data.language

  // Crew-specific — CREW can set non-financial preferences but NOT their own rates
  if (me.role === 'CREW') {
    // Compensation fields (contractType, monthlyRate, taskRate, hourlyRate) are ADMIN-only
    if (data.skills) update.crewSkills = JSON.stringify(data.skills)
    if (data.availability) update.crewAvailability = JSON.stringify(data.availability)
  }

  // Manager-specific
  if (me.role === 'MANAGER') {
    if (data.subscriptionShare !== undefined) update.managerSubscriptionShare = Number(data.subscriptionShare) || null
    if (data.commissionShare !== undefined) update.managerCommissionShare = Number(data.commissionShare) || null
  }

  // Sign pending contracts — only contracts belonging to this user
  if (data.signContractIds && Array.isArray(data.signContractIds)) {
    for (const contractId of data.signContractIds) {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId as string },
        select: { userId: true },
      })
      if (!contract || contract.userId !== me.id) {
        return NextResponse.json({ error: 'Forbidden: contract does not belong to you' }, { status: 403 })
      }
      await prisma.contract.update({
        where: { id: contractId as string },
        data: { signedByUser: true, signedAt: new Date() },
      })
    }
  }

  // Save onboarding data
  const existingData = await prisma.user.findUnique({
    where: { id: me.id },
    select: { onboardingData: true },
  })
  const prevData = (existingData?.onboardingData as Record<string, unknown>) ?? {}
  update.onboardingData = {
    ...prevData,
    [step ?? 'general']: data,
    lastStep: step,
    updatedAt: new Date().toISOString(),
    ...(complete ? { completedAt: new Date().toISOString() } : {}),
  }

  if (complete) {
    update.onboardingCompleted = true
  }

  const user = await prisma.user.update({
    where: { id: me.id },
    data: update,
    select: { id: true, onboardingCompleted: true },
  })

  return NextResponse.json(user)
}
