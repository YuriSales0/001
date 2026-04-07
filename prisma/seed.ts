import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const COMMISSION_RATE = 0.18
const PAYOUT_DELAY_DAYS = 7

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostmaster.es'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
  const hash = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', password: hash },
    create: {
      email: adminEmail,
      name: 'Hostmaster Admin',
      role: 'ADMIN',
      password: hash,
      language: 'en',
    },
  })

  console.log(`Seeded admin: ${adminEmail}`)

  // Backfill payouts for any existing reservation that lacks one
  const reservations = await prisma.reservation.findMany({ include: { payouts: true } })
  for (const r of reservations) {
    if (r.payouts.length === 0) {
      const commission = +(r.amount * COMMISSION_RATE).toFixed(2)
      const net = +(r.amount - commission).toFixed(2)
      const scheduledFor = new Date(r.checkOut)
      scheduledFor.setDate(scheduledFor.getDate() + PAYOUT_DELAY_DAYS)
      await prisma.payout.create({
        data: {
          reservationId: r.id,
          propertyId: r.propertyId,
          grossAmount: r.amount,
          commission,
          netAmount: net,
          scheduledFor,
        },
      })
    }
  }

  if (adminEmail !== 'admin@hostmaster.es') {
    const stale = await prisma.user.findUnique({ where: { email: 'admin@hostmaster.es' } })
    if (stale) {
      await prisma.user.delete({ where: { email: 'admin@hostmaster.es' } })
      console.log('Removed stale admin@hostmaster.es')
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
