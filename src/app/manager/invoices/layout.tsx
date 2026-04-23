import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function ManagerInvoicesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') redirect('/manager/commission')
  return <>{children}</>
}
