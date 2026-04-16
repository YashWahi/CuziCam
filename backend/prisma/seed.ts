import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const colleges = [
    { name: 'Indian Institute of Technology Delhi', domain: 'iitd.ac.in', city: 'Delhi', country: 'India' },
    { name: 'Indian Institute of Technology Bombay', domain: 'iitb.ac.in', city: 'Mumbai', country: 'India' },
    { name: 'Delhi University', domain: 'du.ac.in', city: 'Delhi', country: 'India' },
    { name: 'BITS Pilani', domain: 'bits-pilani.ac.in', city: 'Pilani', country: 'India' },
    { name: 'Massachusetts Institute of Technology', domain: 'mit.edu', city: 'Cambridge', country: 'USA' },
  ]

  for (const c of colleges) {
    const college = await prisma.college.upsert({
      where: { domain: c.domain },
      update: {},
      create: c,
    })
    console.log(`Created/Updated college: ${college.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
