import { redirect } from 'next/navigation'
import { getCurrentUser, resolveEffectiveUser } from '@/lib/session'
import ManagerLayout from '@/components/manager-layout'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const realUser = await getCurrentUser()
  if (!realUser) redirect('/login')
  if (!realUser.isSuperUser && realUser.role !== 'MANAGER' && realUser.role !== 'ADMIN') redirect('/me')
  const user = realUser.isSuperUser ? await resolveEffectiveUser(realUser) : realUser
  return <ManagerLayout user={{ name: user.name, email: user.email, image: user.image }} role={user.role}>{children}</ManagerLayout>
}
