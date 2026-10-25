const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_DIR = path.join(__dirname, '../../..'); 
const DEST_DIR = path.join(__dirname, '../../frontend/public/material');

async function getOrCreateUnit(title, order) {
  let unit = await prisma.unit.findFirst({ where: { title: { contains: title } } });
  if (!unit) {
    unit = await prisma.unit.create({
      data: {
        title: title,
        order: order
      }
    });
  } else {
    unit = await prisma.unit.update({
      where: { id: unit.id },
      data: { order: order }
    });
  }
  return unit;
}

async function addOrUpdateLesson(unit, fileName, sourceSubDir, type = 'SUMMARY') {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '');
  const ext = path.extname(fileName).toLowerCase();

  const pdfSourcePath = sourceSubDir ? path.join(SOURCE_DIR, sourceSubDir, fileName) : path.join(SOURCE_DIR, fileName);
  if (!fs.existsSync(pdfSourcePath)) {
    console.log(`- Archivo no encontrado: ${pdfSourcePath}`);
    return null;
  }

  const destSubDir = sourceSubDir ? path.join(DEST_DIR, sourceSubDir) : DEST_DIR;
  if (!fs.existsSync(destSubDir)) fs.mkdirSync(destSubDir, { recursive: true });

  const destFilePath = path.join(destSubDir, fileName);
  fs.copyFileSync(pdfSourcePath, destFilePath);

  const fileUrl = sourceSubDir 
    ? `/material/${encodeURIComponent(sourceSubDir)}/${encodeURIComponent(fileName)}`
    : `/material/${encodeURIComponent(fileName)}`;

  let content = '';
  if (ext === '.pdf') {
    content = `### ${cleanTitle}\n\n<iframe src="${fileUrl}" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Archivo](${fileUrl})`;
  } else if (ext === '.mp4') {
    content = `### ${cleanTitle}\n\n<video controls width="100%" style="border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 20px;" src="${fileUrl}"></video>\n\n<br/>[📥 Descargar Video](${fileUrl})`;
  } else if (['.c', '.sh', '.txt'].includes(ext)) {
    const rawCode = fs.readFileSync(pdfSourcePath, 'utf-8');
    const lang = ext === '.c' ? 'c' : ext === '.sh' ? 'bash' : 'text';
    content = `### ${cleanTitle}\n\n\`\`\`${lang}\n${rawCode}\n\`\`\`\n\n[📥 Descargar Archivo Fuente](${fileUrl})`;
  }

  let lesson = await prisma.lesson.findFirst({
    where: { unitId: unit.id, title: cleanTitle }
  });

  if (!lesson) {
    const maxOrder = await prisma.lesson.findFirst({
      where: { unitId: unit.id },
      orderBy: { order: 'desc' }
    });
    const nextOrder = maxOrder ? maxOrder.order + 1 : 1;

    lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        title: cleanTitle,
        type: type,
        content: content,
        order: nextOrder
      }
    });
    console.log(`+ Creada lección: "${cleanTitle}" en "${unit.title}"`);
  } else {
    lesson = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content: content, type: type }
    });
    console.log(`= Actualizada lección: "${cleanTitle}" en "${unit.title}"`);
  }

  return lesson;
}

async function run() {
  console.log('Iniciando carga de Planificación y Sincronización...\n');

  // 1. Completar Unidad 3: Planificación
  const unit3 = await getOrCreateUnit('Planificacion', 3);
  await addOrUpdateLesson(unit3, 'SO- Planificacion de Procesos - Conceptos Grales - 2026.pdf', '3- Planificacion');
  await addOrUpdateLesson(unit3, 'SO - Ejemplos Procesos y Planificación -  2026.pdf', '3- Planificacion');
  await addOrUpdateLesson(unit3, 'SO- Planificacion de Procesos - Multiprocesadores y Tpo Real - 2026.pdf', '3- Planificacion');

  // 2. Crear y Cargar Unidad 4: Sincronización
  const unit4 = await getOrCreateUnit('Sincronización', 4);
  await addOrUpdateLesson(unit4, 'SO- Sincronización de Procesos - Introducción 2026.pdf', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'SO- Sincronización de Procesos- Soluciones Software y Problemas Genenrales 2026.pdf', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'SO- Sincronización de Procesos - Ejemplos SO - 2026.pdf', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'SO-Interbloqueos - 2026.pdf', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'Problema de lectores y escritores animado.mp4', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'ejercicio1.c', '4- Sincronización');
  await addOrUpdateLesson(unit4, 'ejercicio2.c', '4- Sincronización');

  // 3. Unidad Material Adicional y Prácticos (orden 99)
  const unitAdicional = await getOrCreateUnit('Material Adicional y Prácticos', 99);
  await addOrUpdateLesson(unitAdicional, 'Practico4-2026.pdf', '', 'PRACTICAL_WORK');
  await addOrUpdateLesson(unitAdicional, 'Practico5-2026.pdf', '', 'PRACTICAL_WORK');

  // Asegurar orden de unidades
  await prisma.unit.updateMany({ where: { title: { contains: 'Conceptos Generales' } }, data: { order: 1 } });
  await prisma.unit.updateMany({ where: { title: { contains: 'Procesos' } }, data: { order: 2 } });
  await prisma.unit.updateMany({ where: { title: { contains: 'Planificacion' } }, data: { order: 3 } });
  await prisma.unit.updateMany({ where: { title: { contains: 'Sincronización' } }, data: { order: 4 } });
  await prisma.unit.updateMany({ where: { title: { contains: 'Material Adicional' } }, data: { order: 99 } });

  console.log('\nSincronización de Unidades 3 y 4 y PDFs completada con éxito.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
