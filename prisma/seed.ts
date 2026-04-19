import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** Commission rates per plan */
const PLAN_COMMISSION: Record<string, number> = {
  STARTER: 0.20,
  BASIC:   0.20,
  MID:     0.18,
  PREMIUM: 0.15,
}
const DEFAULT_COMMISSION = 0.18
const PAYOUT_DELAY_DAYS = 7

async function main() {
  // ── Yuri (owner / superuser) ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'yurisales968@gmail.com' },
    update: { isSuperUser: true, role: 'ADMIN', password: await bcrypt.hash('asdasd123@', 12) },
    create: {
      email: 'yurisales968@gmail.com',
      name: 'Yuri Sales',
      role: 'ADMIN',
      password: await bcrypt.hash('asdasd123@', 12),
      language: 'pt',
      isSuperUser: true,
    },
  })
  console.log('✓ admin:   yurisales968@gmail.com (superuser)')

  // ── Demo Manager ──────────────────────────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hostmaster.es' },
    update: {},
    create: {
      email: 'manager@hostmaster.es',
      name: 'Ana García',
      role: 'MANAGER',
      password: await bcrypt.hash('manager123', 12),
      language: 'es',
      subscriptionPlan: 'MID',
      subscriptionStatus: 'active',
    },
  })
  console.log('✓ manager: manager@hostmaster.es / manager123')

  // ── Demo Crew ─────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'crew@hostmaster.es' },
    update: {},
    create: {
      email: 'crew@hostmaster.es',
      name: 'Carlos Limpio',
      role: 'CREW',
      password: await bcrypt.hash('crew123', 12),
      language: 'es',
    },
  })
  console.log('✓ crew:    crew@hostmaster.es / crew123')

  // ── Demo Client ───────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'client@hostmaster.es' },
    update: {},
    create: {
      email: 'client@hostmaster.es',
      name: 'María Propietaria',
      role: 'CLIENT',
      password: await bcrypt.hash('client123', 12),
      language: 'es',
      managerId: manager.id,
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'active',
    },
  })
  console.log('✓ client:  client@hostmaster.es / client123')

  // ── Backfill payouts ──────────────────────────────────────────────────────
  const reservations = await prisma.reservation.findMany({
    include: {
      payouts: true,
      property: { include: { owner: true } },
    },
  })

  for (const r of reservations) {
    if (r.payouts.length === 0) {
      const plan = r.property.owner.subscriptionPlan ?? 'MID'
      const rate = PLAN_COMMISSION[plan] ?? DEFAULT_COMMISSION
      const commission = +(r.amount * rate).toFixed(2)
      const net        = +(r.amount - commission).toFixed(2)
      const scheduledFor = new Date(r.checkOut)
      scheduledFor.setDate(scheduledFor.getDate() + PAYOUT_DELAY_DAYS)

      await prisma.payout.create({
        data: {
          reservationId: r.id,
          propertyId:    r.propertyId,
          grossAmount:   r.amount,
          commission,
          commissionRate: +(rate * 100).toFixed(1),
          netAmount:     net,
          scheduledFor,
          platform:      r.platform ?? undefined,
        },
      })
    }
  }

  // ── Clean up legacy demo admin if it exists ────────────────────────────────
  const staleAdmin = await prisma.user.findUnique({ where: { email: 'admin@hostmaster.es' } })
  if (staleAdmin) {
    await prisma.user.delete({ where: { email: 'admin@hostmaster.es' } })
    console.log('Removed stale admin@hostmaster.es')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
