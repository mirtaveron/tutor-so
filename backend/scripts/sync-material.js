const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_DIR = path.join(__dirname, '../../..'); // e:\_UNS\Sistemas Operativos 2026
const DEST_DIR = path.join(__dirname, '../../frontend/public/material');

async function syncMaterial() {
  console.log('Iniciando sincronización automática del material...\n');
  
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const items = fs.readdirSync(SOURCE_DIR);

  // Obtener el máximo order actual de Unidades para no pisar
  let maxUnit = await prisma.unit.findFirst({ orderBy: { order: 'desc' } });
  let unitOrder = maxUnit ? maxUnit.order + 1 : 1;

  for (const item of items) {
    // Ignorar las carpetas del proyecto y archivos que no queramos
    if (item === 'os-uns-app' || item.startsWith('.')) continue;

    const itemPath = path.join(SOURCE_DIR, item);
    const stat = fs.statSync(itemPath);

    // Si es una carpeta (Ej: "1- Conceptos Generales")
    if (stat.isDirectory()) {
      console.log(`[+] Procesando Unidad: ${item}`);
      
      const unit = await prisma.unit.create({
        data: {
          title: item.replace(/^\d+-\s*/, ''), // Remover "1- "
          order: unitOrder++,
        }
      });

      const destUnitDir = path.join(DEST_DIR, item);
      if (!fs.existsSync(destUnitDir)) fs.mkdirSync(destUnitDir, { recursive: true });

      const subItems = fs.readdirSync(itemPath);
      let lessonOrder = 1;

      for (const subItem of subItems) {
        if (subItem.toLowerCase().endsWith('.pdf')) {
          console.log(`    -> Importando lección: ${subItem}`);
          const pdfSourcePath = path.join(itemPath, subItem);
          const pdfDestPath = path.join(destUnitDir, subItem);
          
          fs.copyFileSync(pdfSourcePath, pdfDestPath);

          const pdfUrl = `/material/${encodeURIComponent(item)}/${encodeURIComponent(subItem)}`;
          const isTP = subItem.toLowerCase().includes('practico') || subItem.toLowerCase().includes('act');

          await prisma.lesson.create({
            data: {
              unitId: unit.id,
              title: subItem.replace('.pdf', ''),
              type: isTP ? 'PRACTICAL_WORK' : 'SUMMARY',
              content: `### ${subItem.replace('.pdf', '')}\n\n<iframe src="${pdfUrl}" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Archivo (Si no podés visualizarlo)](${pdfUrl})`,
              order: lessonOrder++
            }
          });
        }
      }
    }
  }

  // Ahora procesar los PDFs sueltos
  const loosePdfs = items.filter(i => {
    const p = path.join(SOURCE_DIR, i);
    return fs.existsSync(p) && fs.statSync(p).isFile() && i.toLowerCase().endsWith('.pdf');
  });
  
  if (loosePdfs.length > 0) {
    console.log(`\n[+] Procesando material general...`);
    const generalUnit = await prisma.unit.create({
      data: {
        title: 'Material Adicional y Prácticos',
        description: 'Archivos sueltos, bibliografía e historia de los SO.',
        order: unitOrder++,
      }
    });

    let generalLessonOrder = 1;
    for (const file of loosePdfs) {
      console.log(`    -> Importando: ${file}`);
      const pdfSourcePath = path.join(SOURCE_DIR, file);
      const pdfDestPath = path.join(DEST_DIR, file);
      
      fs.copyFileSync(pdfSourcePath, pdfDestPath);
      const pdfUrl = `/material/${encodeURIComponent(file)}`;
      
      const isTP = file.toLowerCase().includes('practico') || file.toLowerCase().includes('act');

      await prisma.lesson.create({
        data: {
          unitId: generalUnit.id,
          title: file.replace('.pdf', ''),
          type: isTP ? 'PRACTICAL_WORK' : 'SUMMARY',
          content: `### ${file.replace('.pdf', '')}\n\n<iframe src="${pdfUrl}" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Archivo](${pdfUrl})`,
          order: generalLessonOrder++
        }
      });
    }
  }

  console.log('\n¡Sincronización finalizada con éxito! Actualizá el navegador.');
}

syncMaterial()
  .catch(e => {
    console.error('Error durante la sincronización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
