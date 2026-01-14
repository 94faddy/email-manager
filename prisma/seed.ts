// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true
    }
  })
  console.log('✅ Created admin user:', admin.username)

  // Create demo user
  const userPassword = await bcrypt.hash('user1234', 12)
  
  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      password: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      isActive: true
    }
  })
  console.log('✅ Created demo user:', user.username)

  // Create sample website (you should sync from Plesk instead)
  const website = await prisma.website.upsert({
    where: { pleskDomainId: 1 },
    update: {},
    create: {
      pleskDomainId: 1,
      domainName: 'example.com',
      asciiName: 'example.com',
      hostingType: 'virtual',
      isActive: true
    }
  })
  console.log('✅ Created sample website:', website.domainName)

  // Grant demo user access to the website
  await prisma.userWebsite.upsert({
    where: {
      userId_websiteId: {
        userId: user.id,
        websiteId: website.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      websiteId: website.id,
      canCreate: true,
      canDelete: false,
      maxEmails: 5
    }
  })
  console.log('✅ Granted website access to demo user')

  console.log('\n🎉 Seed completed!')
  console.log('\nDefault credentials:')
  console.log('Admin: admin / admin123')
  console.log('User: demo / user1234')
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