const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RESUMENES_DIR = path.resolve(__dirname, '../../../Resumenes');
const PUBLIC_RESUMENES_DIR = path.resolve(__dirname, '../../frontend/public/material/Resumenes');

async function main() {
  console.log('=== Agregando 4 Resúmenes por Tema en Exámenes y Evaluaciones ===\n');

  const unit = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } },
    include: { lessons: { orderBy: { order: 'asc' } } }
  });

  if (!unit) {
    throw new Error('No se encontró la unidad Exámenes y Evaluaciones');
  }

  fs.mkdirSync(PUBLIC_RESUMENES_DIR, { recursive: true });

  const topicSummaries = [
    {
      file: '1_Resumen_Conceptos_Generales.md',
      title: 'Resumen Tema 1: Conceptos Generales y Estructuras del SO',
      oldTitle: '📘 Resumen Tema 1: Conceptos Generales y Estructuras del SO',
      order: 1
    },
    {
      file: '2_Resumen_Procesos_Hilos_IPC.md',
      title: 'Resumen Tema 2: Procesos, Hilos (Threads) e IPC',
      oldTitle: '📘 Resumen Tema 2: Procesos, Hilos (Threads) e IPC',
      order: 2
    },
    {
      file: '3_Resumen_Planificacion_CPU_Tiempo_Real.md',
      title: 'Resumen Tema 3: Planificación de CPU, Multiprocesadores y Tiempo Real',
      oldTitle: '📘 Resumen Tema 3: Planificación de CPU, Multiprocesadores y Tiempo Real',
      order: 3
    },
    {
      file: '4_Resumen_Sincronizacion_e_Interbloqueos.md',
      title: 'Resumen Tema 4: Sincronización de Procesos e Interbloqueos',
      oldTitle: '📘 Resumen Tema 4: Sincronización de Procesos e Interbloqueos',
      order: 4
    }
  ];

  // 1. Reordenar los exámenes existentes para dejar espacio limpio después del Resumen Integral (order=0)
  //    Resúmenes por tema: order 1..4
  //    Parciales y Laboratorios: order 10..N (preservando su orden relativo actual)
  const existingExams = unit.lessons.filter(
    l => !l.title.toLowerCase().includes('resumen')
  );

  let nextExamOrder = 10;
  for (const exam of existingExams) {
    if (exam.order !== nextExamOrder) {
      await prisma.lesson.update({
        where: { id: exam.id },
        data: { order: nextExamOrder }
      });
    }
    nextExamOrder++;
  }
  console.log(`✓ Reordenados ${existingExams.length} exámenes (order 10..${nextExamOrder - 1}).`);

  // Limpiar emoji del título del Resumen Integral y asegurar order = 0
  const integral = unit.lessons.find(l => l.title.toLowerCase().includes('integral'));
  if (integral) {
    const cleanIntegralTitle = 'Resumen Integral para Examen Parcial (Listo para Imprimir)';
    const cleanIntegralContent = (integral.content || '')
      .replace(/^# 🎓 /gm, '# ')
      .replace(/^### 📌 /gm, '### ');
    await prisma.lesson.update({
      where: { id: integral.id },
      data: {
        title: cleanIntegralTitle,
        content: cleanIntegralContent,
        order: 0
      }
    });
    console.log(`✓ Actualizado título e iconos del Resumen Integral: "${cleanIntegralTitle}"`);
  }

  // 2. Insertar o actualizar los 4 resúmenes por tema (renombrando si tenían emoji previo)
  for (const item of topicSummaries) {
    const srcPath = path.join(RESUMENES_DIR, item.file);
    const dstPath = path.join(PUBLIC_RESUMENES_DIR, item.file);
    const content = fs.readFileSync(srcPath, 'utf-8');
    fs.copyFileSync(srcPath, dstPath);

    const existing = await prisma.lesson.findFirst({
      where: {
        unitId: unit.id,
        OR: [{ title: item.title }, { title: item.oldTitle }]
      }
    });

    if (!existing) {
      await prisma.lesson.create({
        data: {
          unitId: unit.id,
          title: item.title,
          type: 'SUMMARY',
          content,
          order: item.order
        }
      });
      console.log(`+ Creada lección (order=${item.order}): ${item.title}`);
    } else {
      await prisma.lesson.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          type: 'SUMMARY',
          content,
          order: item.order
        }
      });
      console.log(`✓ Actualizada lección (order=${item.order}): ${item.title}`);
    }
  }

  // 3. Exportar la BD actualizada a backend/prisma/seed-data.json
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

  const seedPath = path.join(__dirname, '../prisma/seed-data.json');
  fs.writeFileSync(seedPath, JSON.stringify(units, null, 2), 'utf-8');
  console.log(`\n✓ Archivo prisma/seed-data.json actualizado con éxito (${units.length} unidades).`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
