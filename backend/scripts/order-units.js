const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const units = await prisma.unit.findMany({ orderBy: { order: 'asc' } });
  
  for (const u of units) {
    let order = u.order;
    if (u.title.includes('Conceptos Generales')) order = 1;
    if (u.title.includes('Procesos')) order = 2;
    if (u.title.includes('Planificacion')) order = 3;
    if (u.title.includes('Material Adicional')) order = 99; // ensure it's always last
    
    await prisma.unit.update({
      where: { id: u.id },
      data: { order: order }
    });
    console.log(order, u.title);
  }
}
run().finally(() => prisma.$disconnect());
