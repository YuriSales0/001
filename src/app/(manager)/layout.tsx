import { redirect } from 'next/navigation'
import ManagerLayout from "@/components/manager-layout"
import { getCurrentUser } from "@/lib/session"

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') redirect('/me')
  return <ManagerLayout user={{ name: user.name, email: user.email, image: user.image }}>{children}</ManagerLayout>
}
