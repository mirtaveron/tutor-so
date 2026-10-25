const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUMMARY_PATH = 'C:/Users/mircv/.gemini/antigravity/brain/5cc6c6bd-a092-48ad-9b89-98a0f5c38373/resumen_examen_parcial_so_uns.md';
const DEST_PUBLIC = path.join(__dirname, '../../frontend/public/material/Resumen_Examen_Parcial_SO_UNS.md');

async function addPrintableSummary() {
  console.log('Agregando Resumen Integral a la plataforma...');

  const content = fs.readFileSync(SUMMARY_PATH, 'utf-8');
  fs.copyFileSync(SUMMARY_PATH, DEST_PUBLIC);

  const unitExamenes = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } }
  });

  if (!unitExamenes) {
    console.error('No se encontró la unidad de Exámenes');
    return;
  }

  const title = '📋 Resumen Integral para Examen Parcial (Listo para Imprimir)';

  let lesson = await prisma.lesson.findFirst({
    where: { unitId: unitExamenes.id, title: title }
  });

  const printButtonHeader = `<div class="not-prose mb-6 flex justify-end print:hidden">
  <button onclick="window.print()" class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors">
    🖨️ Imprimir Resumen / Guardar en PDF
  </button>
</div>\n\n`;

  const finalContent = printButtonHeader + content;

  if (!lesson) {
    await prisma.lesson.create({
      data: {
        unitId: unitExamenes.id,
        title: title,
        type: 'SUMMARY',
        content: finalContent,
        order: 0 // para que aparezca primero arriba de los parciales
      }
    });
    console.log('+ Creada lección de Resumen Integral');
  } else {
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        content: finalContent,
        order: 0
      }
    });
    console.log('= Actualizada lección de Resumen Integral');
  }

  console.log('Resumen integrado exitosamente.');
}

addPrintableSummary()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
