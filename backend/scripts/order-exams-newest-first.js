const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Ordenando exámenes de más reciente (2026) a más antiguo (2022) ===\n');

  const unit = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } },
    include: { lessons: { orderBy: { order: 'asc' } } }
  });

  if (!unit) throw new Error('No se encontró la unidad Exámenes y Evaluaciones');

  // Orden deseado: resúmenes primero (0..4), luego exámenes del más reciente al más antiguo (10..18)
  const desiredOrder = [
    { match: 'resumen integral', order: 0 },
    { match: 'resumen tema 1', order: 1 },
    { match: 'resumen tema 2', order: 2 },
    { match: 'resumen tema 3', order: 3 },
    { match: 'resumen tema 4', order: 4 },
    { match: 'parcial 2026', order: 10 },
    { match: 'actividades 5', order: 11 },
    { match: 'laboratorio 2026', order: 12 },
    { match: 'recuperatorio 2025', order: 13 },
    { match: 'laboratorio 2025', order: 14 },
    { match: 'parcial 2025', order: 15 },
    { match: 'parcial 2024', order: 16 },
    { match: 'parcial 2023', order: 17 },
    { match: 'parcial 2022', order: 18 }
  ];

  for (const lesson of unit.lessons) {
    const t = lesson.title.toLowerCase();
    const found = desiredOrder.find(d => t.includes(d.match));
    if (found && lesson.order !== found.order) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { order: found.order }
      });
      console.log(`✓ [order=${found.order}] ${lesson.title}`);
    } else if (found) {
      console.log(`= [order=${found.order}] ${lesson.title}`);
    }
  }

  // Exportar a seed-data.json
  const units = await prisma.unit.findMany({
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          steps: { orderBy: { order: 'asc' } }
        }
      }
    }
  });

  const seedPath = path.join(__dirname, '../prisma/seed-data.json');
  fs.writeFileSync(seedPath, JSON.stringify(units, null, 2), 'utf-8');
  console.log('\n✓ seed-data.json actualizado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
