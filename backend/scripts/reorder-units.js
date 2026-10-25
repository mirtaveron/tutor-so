const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reorder() {
  const units = await prisma.unit.findMany({ orderBy: { order: 'asc' } });
  let currentOrder = 1;
  for (const unit of units) {
    await prisma.unit.update({
      where: { id: unit.id },
      data: { order: currentOrder++ }
    });
  }
  console.log('Unidades reordenadas correctamente.');
}

reorder()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
