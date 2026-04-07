import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export type AppRole = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role as AppRole,
    language: session.user.language,
  }
}

export async function requireRole(roles: AppRole[]) {
  const user = await getCurrentUser()
  if (!user) return { error: 'unauthorized' as const, status: 401, user: null }
  if (!roles.includes(user.role)) return { error: 'forbidden' as const, status: 403, user }
  return { error: null, status: 200, user }
}
