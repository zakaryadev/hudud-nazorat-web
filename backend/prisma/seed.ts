import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Tashkilot
  const org = await prisma.organization.upsert({
    where: { tin: '300000000' },
    update: {},
    create: { name: 'Namuna tashkilot', tin: '300000000' },
  });

  // Admin
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '+998900000000' },
    update: {},
    create: {
      orgId: org.id,
      fullName: 'Administrator',
      phone: '+998900000000',
      passwordHash: adminPass,
      role: 'ADMIN',
    },
  });

  // Xodim
  const empPass = await bcrypt.hash('xodim123', 10);
  const employee = await prisma.user.upsert({
    where: { phone: '+998901111111' },
    update: {},
    create: {
      orgId: org.id,
      fullName: 'Xodim Ism Familiya',
      phone: '+998901111111',
      passwordHash: empPass,
      role: 'EMPLOYEE',
    },
  });

  // Hudud (Nukus markazi, radius 200 m) — xodimga biriktiramiz
  const territory = await prisma.territory.create({
    data: {
      orgId: org.id,
      name: 'Nukus — markaziy nuqta',
      address: 'Nukus sh.',
      latitude: 42.4531,
      longitude: 59.6103,
      radiusM: 200,
      assignees: { connect: { id: employee.id } },
    },
  });

  console.log('Seed tayyor:');
  console.log('  Tashkilot:', org.name);
  console.log('  Admin login: +998900000000 / admin123');
  console.log('  Xodim login: +998901111111 / xodim123');
  console.log('  Hudud:', territory.name, `(${territory.latitude}, ${territory.longitude})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
