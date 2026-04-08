import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import OwnerLayout from '@/components/owner-layout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') redirect('/me')
  return <OwnerLayout>{children}</OwnerLayout>
}
