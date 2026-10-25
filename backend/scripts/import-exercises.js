const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_DIR = path.join(__dirname, '../../..'); 
const DEST_DIR = path.join(__dirname, '../../frontend/public/material');

async function importExercises() {
  console.log('Importando ejercicios de ejemplo...');
  const unitAdicional = await prisma.unit.findFirst({ where: { title: { contains: 'Material Adicional' } } });
  
  if (!unitAdicional) return;

  const basePath = path.join(SOURCE_DIR, 'Cursada 2026', 'Actividades de laboratorio');
  
  // Folders to check
  const folders = ['1', '3'];

  for (const folder of folders) {
    const folderPath = path.join(basePath, folder);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (file.startsWith('~$')) continue; // skip word temp files

      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      let maxOrder = await prisma.lesson.findFirst({
        where: { unitId: unitAdicional.id },
        orderBy: { order: 'desc' }
      });
      let order = maxOrder ? maxOrder.order + 1 : 1;

      // check if exists
      const existing = await prisma.lesson.findFirst({
        where: { unitId: unitAdicional.id, title: file }
      });
      if (existing) continue;

      let content = `### ${file}\n\n`;

      if (['.c', '.sh', '.txt'].includes(ext)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lang = ext === '.c' ? 'c' : ext === '.sh' ? 'bash' : 'text';
        content += `\`\`\`${lang}\n${fileContent}\n\`\`\``;
      } else if (ext === '.pdf') {
        const destDir = path.join(DEST_DIR, 'Ejercicios');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(filePath, path.join(destDir, file));
        const url = `/material/Ejercicios/${encodeURIComponent(file)}`;
        content += `<iframe src="${url}" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`;
      } else {
        // Just a placeholder for docx
        content += `*Archivo ${ext} (Formato no visualizable directamente)*`;
      }

      await prisma.lesson.create({
        data: {
          unitId: unitAdicional.id,
          title: file,
          type: 'SUMMARY',
          content: content,
          order: order
        }
      });
      console.log(`+ Agregado ejercicio: ${file}`);
    }
  }
}

importExercises()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
