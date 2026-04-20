import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export type AuthenticatedPartner = {
  id: string
  name: string
  email: string | null
  tier: string
  referralCode: string
  status: string
}

/**
 * Get the authenticated partner from the hm_partner_token cookie.
 * Returns null if not authenticated.
 */
export async function getPartnerFromCookie(): Promise<AuthenticatedPartner | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('hm_partner_token')?.value

  if (!token) return null

  try {
    // @ts-expect-error Partner model pending prisma generate
    const partner = await prisma.partner.findFirst({
      where: { loginToken: token, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        referralCode: true,
        status: true,
      },
    })

    if (!partner) return null

    // Update last login
    // @ts-expect-error Partner model pending prisma generate
    await prisma.partner.update({
      where: { id: partner.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {})

    return partner as AuthenticatedPartner
  } catch {
    return null
  }
}
