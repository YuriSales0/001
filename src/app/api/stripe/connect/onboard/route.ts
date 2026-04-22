import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * POST /api/stripe/connect/onboard
 *
 * Creates or resumes a Stripe Connect Standard account onboarding
 * for CREW or MANAGER users. Returns the Account Link URL where the
 * user completes identity verification and bank setup.
 */
export async function POST(_request: NextRequest) {
  const guard = await requireRole(['CREW', 'MANAGER', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, email: true, name: true, stripeConnectId: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const returnPath = user.role === 'CREW' ? '/crew' : '/manager/profile'

  try {
    let accountId = user.stripeConnectId

    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: 'standard',
        country: 'ES',
        email: user.email,
        metadata: { userId: user.id, role: user.role ?? '' },
        business_profile: {
          name: user.name || undefined,
          product_description: 'HostMasters property management services',
        },
      })
      accountId = account.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectId: accountId },
      })
    }

    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/onboard-refresh?accountId=${accountId}`,
      return_url: `${APP_URL}${returnPath}?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe Connect onboard error:', error)
    return NextResponse.json({ error: 'Failed to create onboarding link' }, { status: 500 })
  }
}
