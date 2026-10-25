const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTIFACT_PATH = 'C:/Users/mircv/.gemini/antigravity/brain/5cc6c6bd-a092-48ad-9b89-98a0f5c38373/resumen_examen_parcial_so_uns.md';
const PUBLIC_PATH = path.join(__dirname, '../../frontend/public/material/Resumen_Examen_Parcial_SO_UNS.md');

async function fix() {
  console.log('Reemplazando formulas residuales y asegurando tablas...');

  let content = fs.readFileSync(ARTIFACT_PATH, 'utf-8');

  // Reemplazar tokens específicos
  content = content.replace(/\\tau_\{n\+1\} = \\alpha t_n \+ \(1-\\alpha\)\\tau_n/g, 'τ_(n+1) = α · t_n + (1 - α) · τ_n');
  content = content.replace(/\\infty/g, '∞');
  content = content.replace(/\\sqrt\{2\}/g, '√2');
  content = content.replace(/\\sqrt\[3\]\{2\}/g, '³√2');
  content = content.replace(/\\ln\(2\)/g, 'ln(2)');
  content = content.replace(/Liu \\& Layland/g, 'Liu & Layland');
  content = content.replace(/\\\{P_0, P_1, \\dots, P_n\\\}/g, '{P0, P1, ..., Pn}');

  // Limpiar cualquier otra barra invertida suelta
  content = content.replace(/\\le/g, '≤');
  content = content.replace(/\\ge/g, '≥');
  content = content.replace(/\\to/g, '→');
  content = content.replace(/\\implies/g, '⇒');
  content = content.replace(/\\approx/g, '≈');

  fs.writeFileSync(ARTIFACT_PATH, content, 'utf-8');
  fs.writeFileSync(PUBLIC_PATH, content, 'utf-8');

  const printButtonHeader = `<div class="not-prose mb-6 flex justify-end print:hidden">
  <button onclick="window.print()" class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors">
    🖨️ Imprimir Resumen / Guardar en PDF
  </button>
</div>\n\n`;

  const finalContent = printButtonHeader + content;

  const title = '📋 Resumen Integral para Examen Parcial (Listo para Imprimir)';
  await prisma.lesson.updateMany({
    where: { title: title },
    data: { content: finalContent }
  });

  console.log('¡Contenido actualizado en disco y base de datos!');
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
