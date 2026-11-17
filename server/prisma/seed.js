const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  for (const network of [
    { code: 'SAFARICOM', name: 'Safaricom' },
    { code: 'AIRTEL', name: 'Airtel' },
  ]) {
    await prisma.network.upsert({
      where: { code: network.code },
      update: { name: network.name },
      create: network,
    });
  }
}

main().finally(() => prisma.$disconnect());
