/**
 * Demo Clients — one per plan, to exercise the contract + activation flow.
 *
 * Run:   npx tsx prisma/seed-demo-clients.ts
 *
 * Creates (or upserts) 4 demo clients and seeds each with a Master Service
 * Agreement at the correct plan tier. Each client also gets a demo property
 * in a state that matches their contract-signing progress:
 *
 *   STARTER — master unsigned, property in PENDING_APPROVAL (blocked on sign)
 *   BASIC   — master SIGNED, property ACTIVE (happy path)
 *   MID     — master SIGNED, property PENDING_APPROVAL (awaiting admin)
 *   PREMIUM — master signed, property ACTIVE, + per-property legacy contract as addendum
 *
 * Passwords: all `demo12345` so you can log in quickly.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  ensureClientMasterContract,
  generateClientMasterTerms,
  buildClientCompensation,
} from '../src/lib/contracts'

const prisma = new PrismaClient()

type PlanTier = 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM'

const DEMOS: Array<{
  email: string
  name: string
  plan: PlanTier
  propertyName: string
  propertyCity: string
  propertyStatus: 'PENDING_APPROVAL' | 'ACTIVE' | 'CONTRACT_PENDING'
  masterSigned: boolean
  withLegacyPerPropertyContract?: boolean
}> = [
  {
    email: 'mario.starter@demo.hm',
    name: 'Mário Starter',
    plan: 'STARTER',
    propertyName: 'Casa Mário (demo)',
    propertyCity: 'Almuñécar',
    propertyStatus: 'PENDING_APPROVAL',
    masterSigned: false,
  },
  {
    email: 'bruno.basic@demo.hm',
    name: 'Bruno Basic',
    plan: 'BASIC',
    propertyName: 'Villa Bruno (demo)',
    propertyCity: 'La Herradura',
    propertyStatus: 'ACTIVE',
    masterSigned: true,
  },
  {
    email: 'mia.mid@demo.hm',
    name: 'Mia Mid',
    plan: 'MID',
    propertyName: 'Apartamento Mia (demo)',
    propertyCity: 'Salobreña',
    propertyStatus: 'PENDING_APPROVAL',
    masterSigned: true,
  },
  {
    email: 'paulo.premium@demo.hm',
    name: 'Paulo Premium',
    plan: 'PREMIUM',
    propertyName: 'Finca Paulo (demo)',
    propertyCity: 'Motril',
    propertyStatus: 'ACTIVE',
    masterSigned: true,
    withLegacyPerPropertyContract: true,
  },
]

async function main() {
  const passwordHash = await bcrypt.hash('demo12345', 12)

  for (const demo of DEMOS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
        subscriptionPlan: demo.plan,
        subscriptionStatus: 'active',
        emailVerified: new Date(),
      },
      create: {
        email: demo.email,
        name: demo.name,
        password: passwordHash,
        role: 'CLIENT',
        language: 'en',
        subscriptionPlan: demo.plan,
        subscriptionStatus: 'active',
        emailVerified: new Date(),
      },
    })

    await ensureClientMasterContract({ userId: user.id, plan: demo.plan, ownerName: user.name })

    if (demo.masterSigned) {
      const master = await prisma.contract.findFirst({
        where: { userId: user.id, type: 'CLIENT_SERVICE', propertyId: null },
        orderBy: { createdAt: 'desc' },
      })
      if (master && !master.signedByUser) {
        await prisma.contract.update({
          where: { id: master.id },
          data: { signedByUser: true, signedAt: new Date(), status: 'ACTIVE' },
        })
      }
    }

    const property = await prisma.property.upsert({
      where: { id: `demo-${demo.email}` },
      update: {
        name: demo.propertyName,
        city: demo.propertyCity,
        status: demo.propertyStatus,
      },
      create: {
        id: `demo-${demo.email}`,
        ownerId: user.id,
        name: demo.propertyName,
        address: '123 Demo Street',
        city: demo.propertyCity,
        bedrooms: 2,
        status: demo.propertyStatus,
        photos: ['https://placehold.co/800x600?text=Demo'],
        houseRules: ['NO_SMOKING', 'QUIET_22_08'],
      },
    })

    if (demo.withLegacyPerPropertyContract) {
      const existing = await prisma.contract.findFirst({
        where: { userId: user.id, propertyId: property.id, type: 'CLIENT_SERVICE' },
      })
      if (!existing) {
        await prisma.contract.create({
          data: {
            userId: user.id,
            propertyId: property.id,
            type: 'CLIENT_SERVICE',
            title: `Property Addendum — ${property.name}`,
            terms: generateClientMasterTerms(demo.plan, user.name),
            compensation: buildClientCompensation(demo.plan),
            startDate: new Date(),
            status: 'ACTIVE',
            signedByUser: true,
            signedByAdmin: true,
            signedAt: new Date(),
            notes: 'Legacy per-property addendum — master agreement supersedes for commercial terms.',
          },
        })
      }
    }

    console.log(
      `✓ ${demo.email.padEnd(30)} plan=${demo.plan.padEnd(8)} ` +
      `masterSigned=${demo.masterSigned ? 'yes' : 'no '} ` +
      `property=${demo.propertyStatus}`
    )
  }

  console.log('\nAll demo clients share password: demo12345\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
