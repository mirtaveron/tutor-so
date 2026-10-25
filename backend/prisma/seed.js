const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos (Seeding)...');

  // 1. Crear un usuario de prueba (Admin)
  const password_hash = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@uns.edu.ar' },
    update: {},
    create: {
      email: 'admin@uns.edu.ar',
      password_hash,
      role: 'ADMIN',
    },
  });
  console.log('✓ Usuario admin configurado (admin@uns.edu.ar / 123456)');

  // 2. Cargar unidades, lecciones y pasos desde seed-data.json si existe
  const dataPath = path.join(__dirname, 'seed-data.json');
  if (fs.existsSync(dataPath)) {
    const units = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Cargando ${units.length} unidades y sus lecciones...`);

    for (const u of units) {
      let unit = await prisma.unit.findFirst({
        where: { title: u.title }
      });

      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            title: u.title,
            description: u.description,
            order: u.order
          }
        });
      } else {
        unit = await prisma.unit.update({
          where: { id: unit.id },
          data: {
            description: u.description,
            order: u.order
          }
        });
      }

      for (const l of u.lessons) {
        let lesson = await prisma.lesson.findFirst({
          where: { unitId: unit.id, title: l.title }
        });

        if (!lesson) {
          lesson = await prisma.lesson.create({
            data: {
              unitId: unit.id,
              title: l.title,
              content: l.content,
              type: l.type,
              order: l.order
            }
          });
        } else {
          lesson = await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              content: l.content,
              type: l.type,
              order: l.order
            }
          });
        }

        // Si la lección tiene pasos interactivos
        if (l.steps && l.steps.length > 0) {
          await prisma.step.deleteMany({
            where: { lessonId: lesson.id }
          });

          await prisma.step.createMany({
            data: l.steps.map(s => ({
              lessonId: lesson.id,
              order: s.order,
              instruction: s.instruction,
              explanation: s.explanation,
              codeSnippet: s.codeSnippet
            }))
          });
        }
      }
    }
    console.log('✓ Todas las unidades, lecciones y pasos fueron importados exitosamente.');
  } else {
    console.warn('No se encontró seed-data.json, se crearon los datos básicos.');
  }

  console.log('Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
