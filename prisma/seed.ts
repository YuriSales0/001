import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** Commission rates per plan (must mirror src/lib/finance.ts) */
const PLAN_COMMISSION: Record<string, number> = {
  STARTER: 0.22,
  BASIC:   0.19,
  MID:     0.17,
  PREMIUM: 0.13,
}
const DEFAULT_COMMISSION = 0.22
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

  // ── Consumable Categories & Products (reference stock, qty=0) ────────────
  const categories = [
    // LAUNDERABLE — roupa de cama e banho (ciclo: uso → lavagem → retorno)
    { name: 'Lençóis Casal',           type: 'LAUNDERABLE', unit: 'set',     lifecycle: 60, items: [
      'Lençol casal 150×200 branco', 'Lençol casal 150×200 cinza', 'Lençol casal 135×190 branco',
    ]},
    { name: 'Lençóis Solteiro',        type: 'LAUNDERABLE', unit: 'set',     lifecycle: 60, items: [
      'Lençol solteiro 90×200 branco', 'Lençol solteiro 90×200 cinza',
    ]},
    { name: 'Fronhas',                 type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 80, items: [
      'Fronha 50×70 branca', 'Fronha 50×70 cinza',
    ]},
    { name: 'Cobertores',             type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 40, items: [
      'Cobertor casal polar branco', 'Cobertor solteiro polar branco',
    ]},
    { name: 'Toalhas Banho',          type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 50, items: [
      'Toalha banho 70×140 branca', 'Toalha banho 70×140 cinza',
    ]},
    { name: 'Toalhas Rosto',          type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 60, items: [
      'Toalha rosto 50×100 branca', 'Toalha rosto 50×100 cinza',
    ]},
    { name: 'Toalhas Cozinha',        type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 40, items: [
      'Pano cozinha algodão branco', 'Pano cozinha microfibra',
    ]},
    { name: 'Tapetes WC',             type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 30, items: [
      'Tapete WC antiderrapante branco', 'Tapete WC antiderrapante cinza',
    ]},
    { name: 'Panos de Chão',          type: 'LAUNDERABLE', unit: 'unit',    lifecycle: 20, items: [
      'Pano chão microfibra', 'Esfregona algodão',
    ]},

    // DISPOSABLE — consumíveis descartáveis (não retornam)
    { name: 'Papel Higiénico',         type: 'DISPOSABLE',  unit: 'roll',    lifecycle: null, items: [
      'Papel higiénico dupla folha (pack 4)', 'Papel higiénico tripla folha (pack 4)',
    ]},
    { name: 'Sabonete',               type: 'DISPOSABLE',  unit: 'unit',    lifecycle: null, items: [
      'Sabonete individual 30g', 'Sabonete líquido doseador 250ml',
    ]},
    { name: 'Champô / Gel Duche',     type: 'DISPOSABLE',  unit: 'unit',    lifecycle: null, items: [
      'Champô individual 30ml', 'Gel duche individual 30ml', 'Kit amenities (champô+gel+body lotion)',
    ]},
    { name: 'Detergente Multiusos',    type: 'DISPOSABLE',  unit: 'litre',   lifecycle: null, items: [
      'Detergente multiusos 1L', 'Detergente vidros spray 750ml',
    ]},
    { name: 'Lava-Loiça',             type: 'DISPOSABLE',  unit: 'litre',   lifecycle: null, items: [
      'Lava-loiça concentrado 1L', 'Pastilhas máquina loiça (pack 30)',
    ]},
    { name: 'Sacos do Lixo',          type: 'DISPOSABLE',  unit: 'unit',    lifecycle: null, items: [
      'Saco lixo 30L (rolo 25)', 'Saco lixo 50L (rolo 15)',
    ]},
    { name: 'Esponjas e Esfregões',    type: 'DISPOSABLE',  unit: 'unit',    lifecycle: null, items: [
      'Esponja dupla face (pack 3)', 'Esfregão inox (pack 2)',
    ]},
    { name: 'Papel de Cozinha',        type: 'DISPOSABLE',  unit: 'roll',    lifecycle: null, items: [
      'Rolo papel cozinha (pack 2)',
    ]},

    // DURABLE — equipamento reutilizável
    { name: 'Aspirador',              type: 'DURABLE',     unit: 'unit',    lifecycle: null, items: [
      'Aspirador vertical sem fio', 'Aspirador robot',
    ]},
    { name: 'Ferro de Engomar',       type: 'DURABLE',     unit: 'unit',    lifecycle: null, items: [
      'Ferro vapor vertical', 'Tábua de engomar',
    ]},
    { name: 'Secador de Cabelo',      type: 'DURABLE',     unit: 'unit',    lifecycle: null, items: [
      'Secador 2000W', 'Secador viagem dobrável',
    ]},

    // WELCOME_KIT — kits de boas-vindas (upsell)
    { name: 'Welcome Kit Básico',      type: 'WELCOME_KIT', unit: 'kit',     lifecycle: null, items: [
      'Vinho tinto local 750ml', 'Queijo curado 200g', 'Azeite extra virgem 250ml',
    ]},
    { name: 'Welcome Kit Premium',     type: 'WELCOME_KIT', unit: 'kit',     lifecycle: null, items: [
      'Vinho reserva 750ml', 'Queijo artesanal 300g', 'Fruta fresca variada', 'Bolo regional',
    ]},
    { name: 'Welcome Kit Familiar',    type: 'WELCOME_KIT', unit: 'kit',     lifecycle: null, items: [
      'Sumos naturais (pack 3)', 'Snacks variados', 'Fruta fresca', 'Bolachas artesanais',
    ]},
  ]

  for (const cat of categories) {
    const created = await prisma.consumableCategory.upsert({
      where: { id: cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      update: {},
      create: {
        id: cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: cat.name,
        type: cat.type as any,
        unit: cat.unit,
        standardLifecycle: cat.lifecycle,
      },
    })

    // Create StockLevel with zero quantities
    await prisma.stockLevel.upsert({
      where: { categoryId: created.id },
      update: {},
      create: {
        categoryId: created.id,
        totalItems: 0,
        available: 0,
        deployed: 0,
        inLaundry: 0,
        inTransit: 0,
        quarantine: 0,
        retired: 0,
        minimumLevel: cat.type === 'DISPOSABLE' ? 20 : cat.type === 'LAUNDERABLE' ? 5 : 2,
        criticalLevel: cat.type === 'DISPOSABLE' ? 5 : cat.type === 'LAUNDERABLE' ? 2 : 1,
      },
    })

    console.log(`  ✓ Category: ${cat.name} (${cat.type}) — ${cat.items.length} products`)
  }
  console.log('✓ Consumable categories & products seeded (stock qty=0)')

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
