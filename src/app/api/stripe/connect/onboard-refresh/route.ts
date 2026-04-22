import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * GET /api/stripe/connect/onboard-refresh
 *
 * Called by Stripe when the AccountLink expires or the user refreshes.
 * Creates a new AccountLink and redirects the user back to onboarding.
 */
export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
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
