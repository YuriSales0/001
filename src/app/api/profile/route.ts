import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      image: true, bio: true, commissionRate: true,
      role: true, subscriptionPlan: true, subscriptionStatus: true,
      createdAt: true,
    },
  })
  return NextResponse.json(full)
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, phone, bio, image, commissionRate, language, currentPassword, newPassword } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (name        !== undefined) data.name           = name
  if (phone       !== undefined) data.phone          = phone
  if (bio         !== undefined) data.bio            = bio
  if (image       !== undefined) data.image          = image
  if (language    !== undefined && ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da', 'no'].includes(language))
    data.language = language
  if (commissionRate !== undefined && ['ADMIN','MANAGER','CREW'].includes(user.role))
    data.commissionRate = commissionRate

  // Password change
  if (newPassword) {
    if (currentPassword) {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id } })
      if (fullUser?.password) {
        const ok = await bcrypt.compare(currentPassword, fullUser.password)
        if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    }
    data.password = await bcrypt.hash(newPassword, 10)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true, name: true, email: true, phone: true,
      image: true, bio: true, commissionRate: true,
      role: true, subscriptionPlan: true,
    },
  })
  return NextResponse.json(updated)
}
