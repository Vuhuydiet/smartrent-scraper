import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
