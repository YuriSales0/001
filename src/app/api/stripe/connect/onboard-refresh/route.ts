import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { requireRole } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['CREW', 'ADMIN'])
  if (guard.error) {
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return NextResponse.redirect(`${APP_URL}/crew?connect=error`)
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.user!.id },
    select: { stripeConnectId: true },
  })
  if (user?.stripeConnectId !== accountId) {
    return NextResponse.redirect(`${APP_URL}/crew?connect=error`)
  }

  try {
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect/onboard-refresh?accountId=${accountId}`,
      return_url: `${APP_URL}/crew?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.redirect(accountLink.url)
  } catch (error) {
    console.error('Stripe Connect refresh error:', error)
    return NextResponse.redirect(`${APP_URL}/crew?connect=error`)
  }
}
