import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import ManagerLayout from '@/components/manager-layout'

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isSuperUser && user.role !== 'MANAGER' && user.role !== 'ADMIN') redirect('/me')
  return <ManagerLayout user={{ name: user.name, email: user.email, image: user.image }} role={user.role}>{children}</ManagerLayout>
}
