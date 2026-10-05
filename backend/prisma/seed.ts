import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sozlamalar (env):
//   ORG_NAME, ORG_TIN, ADMIN_PHONE, ADMIN_PASSWORD, ADMIN_NAME  — tashkilot va birinchi admin
//   SEED_DEMO=1|0 — namuna xodim va hudud (productionda standart 0, aks holda 1)
// Productionda ADMIN_PASSWORD majburiy (standart parol bilan ishga tushirilmaydi).
const prod = process.env.NODE_ENV === 'production';
const demo = process.env.SEED_DEMO ? process.env.SEED_DEMO === '1' : !prod;

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || (prod ? '' : 'admin123');
  if (!adminPassword) throw new Error('Productionda ADMIN_PASSWORD majburiy');
  const adminPhone = process.env.ADMIN_PHONE || '+998900000000';
  const orgName = process.env.ORG_NAME || 'Namuna tashkilot';
  const tin = process.env.ORG_TIN || (demo ? '300000000' : undefined);

  // Tashkilot
  const org = tin
    ? await prisma.organization.upsert({ where: { tin }, update: {}, create: { name: orgName, tin } })
    : (await prisma.organization.findFirst({ where: { name: orgName } })) ??
      (await prisma.organization.create({ data: { name: orgName } }));

  // Admin
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      orgId: org.id,
      fullName: process.env.ADMIN_NAME || 'Administrator',
      phone: adminPhone,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });
  console.log('Seed tayyor:');
  console.log('  Tashkilot:', org.name);
  console.log('  Admin login:', adminPhone, prod ? '(parol ADMIN_PASSWORD dan)' : `/ ${adminPassword}`);

  if (!demo) return;

  // Namuna xodim va hudud (faqat dev/demo)
  const employee = await prisma.user.upsert({
    where: { phone: '+998901111111' },
    update: {},
    create: {
      orgId: org.id,
      fullName: 'Xodim Ism Familiya',
      phone: '+998901111111',
      passwordHash: await bcrypt.hash('xodim123', 10),
      role: 'EMPLOYEE',
    },
  });
  const name = 'Nukus — markaziy nuqta';
  const territory =
    (await prisma.territory.findFirst({ where: { orgId: org.id, name } })) ??
    (await prisma.territory.create({
      data: {
        orgId: org.id,
        name,
        address: 'Nukus sh.',
        latitude: 42.4531,
        longitude: 59.6103,
        radiusM: 200,
        assignees: { connect: { id: employee.id } },
      },
    }));
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
