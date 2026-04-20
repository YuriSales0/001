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
        lastLoginAt: true,
      },
    })

    if (!partner) return null

    // Token expires after 30 days of inactivity
    const lastLogin = (partner as any).lastLoginAt as Date | null
    if (lastLogin) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (lastLogin < thirtyDaysAgo) {
        // @ts-expect-error Partner model pending prisma generate
        await prisma.partner.update({
          where: { id: partner.id },
          data: { loginToken: null },
        }).catch(() => {})
        return null
      }
    }

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
