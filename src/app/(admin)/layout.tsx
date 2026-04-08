import { redirect } from 'next/navigation'
import OwnerLayout from "@/components/owner-layout"
import { getCurrentUser } from "@/lib/session"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') redirect('/login')
  return <OwnerLayout user={{ name: user.name, email: user.email, image: user.image }}>{children}</OwnerLayout>
}
