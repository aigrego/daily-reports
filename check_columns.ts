import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`DESCRIBE users`;
    console.log('Users table columns:');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
