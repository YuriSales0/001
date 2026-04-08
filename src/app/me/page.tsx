import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Me() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  switch (user.role) {
    case 'ADMIN':
      redirect('/dashboard')
    case 'CLIENT':
      redirect('/client/dashboard')
    case 'MANAGER':
      redirect('/manager/dashboard')
    case 'CREW':
      redirect('/crew')
    default:
      redirect('/login')
  }
}
