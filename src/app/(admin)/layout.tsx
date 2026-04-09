import { redirect } from 'next/navigation'
import ManagerLayout from "@/components/manager-layout"
import { getCurrentUser, resolveEffectiveUser } from "@/lib/session"

export const dynamic = 'force-dynamic'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const realUser = await getCurrentUser()
  if (!realUser) redirect('/login')
  if (!realUser.isSuperUser && realUser.role !== 'ADMIN') redirect('/login')
  const effectiveUser = realUser.isSuperUser ? await resolveEffectiveUser(realUser) : realUser
  return <ManagerLayout user={{ name: effectiveUser.name, email: effectiveUser.email, image: effectiveUser.image }} role="ADMIN">{children}</ManagerLayout>
}
