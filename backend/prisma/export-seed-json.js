const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportData() {
  console.log('Exportando contenido completo de la base de datos a seed-data.json...');

  const units = await prisma.unit.findMany({
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  const outputPath = path.join(__dirname, 'seed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(units, null, 2), 'utf-8');

  console.log(`Exportadas ${units.length} unidades con éxito a: ${outputPath}`);
  let totalLessons = 0;
  let totalSteps = 0;
  units.forEach(u => {
    totalLessons += u.lessons.length;
    u.lessons.forEach(l => {
      totalSteps += l.steps.length;
    });
  });
  console.log(`Total lecciones: ${totalLessons}, Total ejercicios/pasos: ${totalSteps}`);
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
