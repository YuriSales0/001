import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

export type AppRole = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'

export type EffectiveUser = {
  id: string
  email: string
  role: AppRole
  language: string
  name: string | null
  image?: string | null
  isSuperUser: boolean
  isCaptain: boolean
}

export async function getCurrentUser(): Promise<EffectiveUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role as AppRole,
    language: session.user.language,
    name: (session.user as { name?: string | null }).name ?? null,
    image: (session.user as { image?: string | null }).image ?? null,
    isSuperUser: (session.user as { isSuperUser?: boolean }).isSuperUser ?? false,
    isCaptain: (session.user as { isCaptain?: boolean }).isCaptain ?? false,
  }
}

/** Returns the effective user: impersonated user if SUPERUSER is impersonating, otherwise real user */
export async function resolveEffectiveUser(realUser: EffectiveUser): Promise<EffectiveUser> {
  if (!realUser.isSuperUser) return realUser

  const cookieStore = cookies()
  const viewAs = cookieStore.get('hm_view_as')?.value
  if (!viewAs) return realUser

  try {
    const { userId } = JSON.parse(viewAs) as { userId: string }
    const impersonated = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, language: true, name: true, image: true, isCaptain: true },
    })
    if (!impersonated) return realUser
    return {
      id: impersonated.id,
      email: impersonated.email,
      role: impersonated.role as AppRole,
      language: impersonated.language,
      name: impersonated.name,
      image: impersonated.image ?? null,
      isSuperUser: false,
      isCaptain: impersonated.isCaptain,
    }
  } catch {
    return realUser
  }
}

export async function requireRole(roles: AppRole[]) {
  const user = await getCurrentUser()
  if (!user) return { error: 'unauthorized' as const, status: 401, user: null }

  // Super users bypass all role checks
  if (user.isSuperUser) {
    const effective = await resolveEffectiveUser(user)
    return { error: null, status: 200, user: effective }
  }

  if (!roles.includes(user.role)) return { error: 'forbidden' as const, status: 403, user }
  return { error: null, status: 200, user }
}
