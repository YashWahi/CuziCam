import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      email: { in: ['test@mit.edu', 'test2@mit.edu'] }
    },
    data: { 
      isEmailVerified: true,
      isVerified: true
    }
  })
  console.log(`Updated state for ${result.count} test users.`)
}

main().finally(() => prisma.$disconnect())
