const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTIFACT_PATH = 'C:/Users/mircv/.gemini/antigravity/brain/5cc6c6bd-a092-48ad-9b89-98a0f5c38373/resumen_examen_parcial_so_uns.md';
const PUBLIC_PATH = path.join(__dirname, '../../frontend/public/material/Resumen_Examen_Parcial_SO_UNS.md');

async function fixButton() {
  console.log('Removiendo onclick de HTML en markdown...');

  let content = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
  content = content.replace(/<div class="not-prose[\s\S]*?<\/div>\s*/g, '');

  fs.writeFileSync(ARTIFACT_PATH, content, 'utf-8');
  fs.writeFileSync(PUBLIC_PATH, content, 'utf-8');

  const title = '📋 Resumen Integral para Examen Parcial (Listo para Imprimir)';
  await prisma.lesson.updateMany({
    where: { title: title },
    data: { content: content }
  });

  console.log('¡Limpiado exitosamente!');
}

fixButton()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
