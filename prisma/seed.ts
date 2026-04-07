import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
