const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showDb() {
  const units = await prisma.unit.findMany({
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' }, include: { steps: true } } }
  });

  for (const u of units) {
    console.log(`=== Unidad [order=${u.order}]: ${u.title} (ID: ${u.id}) ===`);
    for (const l of u.lessons) {
      console.log(`  - [${l.type}] (order=${l.order}) ${l.title} (Steps: ${l.steps.length})`);
    }
  }
}

showDb().finally(() => prisma.$disconnect());
