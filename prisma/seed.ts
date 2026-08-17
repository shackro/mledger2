import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Minimal seed: create an admin user and account for testing
  const adminPin = await import('bcryptjs').then(m => m.hash('1234', 10))

  const admin = await prisma.user.upsert({
    where: { phone: '254700000000' },
    update: {},
    create: {
      phone: '254700000000',
      name: 'Admin User',
      pinHash: adminPin,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  await prisma.account.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      accountNumber: 'MPESA1000001',
      balance: 100000.0,
      currency: 'KES',
    },
  })

  console.log('Seed finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
