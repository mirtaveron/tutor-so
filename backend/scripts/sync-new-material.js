const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_DIR = path.join(__dirname, '../../..'); 
const DEST_DIR = path.join(__dirname, '../../frontend/public/material');

async function getOrCreateUnit(title, defaultOrder) {
  let unit = await prisma.unit.findFirst({ where: { title: { contains: title } } });
  if (!unit) {
    unit = await prisma.unit.create({
      data: {
        title: title,
        order: defaultOrder
      }
    });
  }
  return unit;
}

async function addLesson(unit, fileName, sourceSubDir) {
  const existing = await prisma.lesson.findFirst({
    where: { unitId: unit.id, title: fileName.replace('.pdf', '') }
  });
  if (existing) {
    console.log(`- Lección ya existe: ${fileName}`);
    return;
  }

  const pdfSourcePath = path.join(SOURCE_DIR, sourceSubDir, fileName);
  if (!fs.existsSync(pdfSourcePath)) {
    console.log(`- Archivo no encontrado: ${pdfSourcePath}`);
    return;
  }

  const destUnitDir = sourceSubDir ? path.join(DEST_DIR, sourceSubDir) : DEST_DIR;
  if (!fs.existsSync(destUnitDir)) fs.mkdirSync(destUnitDir, { recursive: true });

  const pdfDestPath = path.join(destUnitDir, fileName);
  fs.copyFileSync(pdfSourcePath, pdfDestPath);

  const pdfUrl = sourceSubDir 
    ? `/material/${encodeURIComponent(sourceSubDir)}/${encodeURIComponent(fileName)}`
    : `/material/${encodeURIComponent(fileName)}`;

  const isTP = fileName.toLowerCase().includes('practico') || fileName.toLowerCase().includes('act');

  const maxOrderLesson = await prisma.lesson.findFirst({
    where: { unitId: unit.id },
    orderBy: { order: 'desc' }
  });
  const newOrder = maxOrderLesson ? maxOrderLesson.order + 1 : 1;

  await prisma.lesson.create({
    data: {
      unitId: unit.id,
      title: fileName.replace('.pdf', ''),
      type: isTP ? 'PRACTICAL_WORK' : 'SUMMARY',
      content: `### ${fileName.replace('.pdf', '')}\n\n<iframe src="${pdfUrl}" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Archivo](${pdfUrl})`,
      order: newOrder
    }
  });
  console.log(`+ Lección agregada: ${fileName} a la Unidad "${unit.title}"`);
}

async function run() {
  console.log('Sincronizando nuevo material...');

  // 1. Agregar a la carpeta Procesos
  const unitProcesos = await getOrCreateUnit('Procesos', 2);
  await addLesson(unitProcesos, 'SO-Comunicación Mem-Mensa-2026.pdf', '2- Procesos');
  await addLesson(unitProcesos, 'ipc_2026.pdf', '2- Procesos');
  await addLesson(unitProcesos, 'procesos_hilos_2026.pdf', '2- Procesos');

  // 2. Crear/Sincronizar Planificacion
  const unitPlanificacion = await getOrCreateUnit('Planificacion', 3);
  await addLesson(unitPlanificacion, 'SO- Planificacion de Procesos - Conceptos Grales - 2026.pdf', '3- Planificacion');

  // 3. Agregar TP3 y ejemplos al material adicional
  const unitAdicional = await getOrCreateUnit('Material Adicional', 4);
  await addLesson(unitAdicional, 'Practico3-2026.pdf', '');

  console.log('Sincronización completada.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
