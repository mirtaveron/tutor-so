const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTIFACT_PATH = 'C:/Users/mircv/.gemini/antigravity/brain/5cc6c6bd-a092-48ad-9b89-98a0f5c38373/resumen_examen_parcial_so_uns.md';
const PUBLIC_PATH = path.join(__dirname, '../../frontend/public/material/Resumen_Examen_Parcial_SO_UNS.md');

function cleanMath(raw) {
  let text = raw;

  // 1. Reemplazos específicos de bloques de fórmulas con $$
  text = text.replace(
    /\$\$U = \\sum_\{i=1\}\^n \\frac\{C_i\}\{T_i\}\$\$/g,
    '**U = Σ (Ci / Ti)**'
  );

  text = text.replace(
    /\$\$U \\le n \\cdot \(2\^\{1\/n\} - 1\)\$\$/g,
    '**U ≤ n · (2^(1/n) - 1)**'
  );

  text = text.replace(
    /\$\$R_i\^\{\(0\)\} = C_i\$\$/g,
    '**R_i^(0) = C_i**'
  );

  text = text.replace(
    /\$\$R_i\^\{\(k\+1\)\} = C_i \+ \\sum_\{j \\in hp\(i\)\} \\left\\lceil \\frac\{R_i\^\{\(k\)\}\}\{T_j\} \\right\\rceil C_j\$\$/g,
    '**R_i^(k+1) = C_i + Σ ( ⌈ R_i^(k) / T_j ⌉ · C_j )**'
  );

  text = text.replace(
    /\$\$U \\le 1\.0 \\quad \(100\\%\)\$\$/g,
    '**U ≤ 1.0 (100% de la CPU)**'
  );

  text = text.replace(
    /\$\$Need\[i, j\] = Max\[i, j\] - Allocation\[i, j\]\$\$/g,
    '**Need[i, j] = Max[i, j] - Allocation[i, j]**'
  );

  text = text.replace(
    /\$\$Available = Existencias\\_Totales - \\sum Allocation\$\$/g,
    '**Available = Existencias_Totales - Σ Allocation**'
  );

  text = text.replace(
    /\$\$Finish\[i\] == false \\quad \\text\{y\} \\quad Need_i \\le Work\$\$/g,
    '**Finish[i] == false  y  Need_i ≤ Work**'
  );

  text = text.replace(
    /\$\$Work = Work \+ Allocation_i\$\$/g,
    '**Work = Work + Allocation_i**'
  );

  text = text.replace(
    /\$\$Finish\[i\] = true\$\$/g,
    '**Finish[i] = true**'
  );

  text = text.replace(
    /\$\$\\text\{Garantizado Libre de Deadlock si y solo si:\} \\quad m \\ge n \\cdot \(K - 1\) \+ 1\$\$/g,
    '**Garantizado Libre de Deadlock si y solo si:  m ≥ n · (K - 1) + 1**'
  );

  text = text.replace(
    /\$\$6 \\ge n \\cdot \(2 - 1\) \+ 1 \\implies 6 \\ge n \+ 1 \\implies \\mathbf\{n \\le 5\}\$\$/g,
    '**6 ≥ n · (2 - 1) + 1  ⇒  6 ≥ n + 1  ⇒  n ≤ 5**'
  );

  // 2. Reemplazos de símbolos matemáticos LaTeX comunes
  text = text.replace(/\\\$/g, '___ESC_DOL___');
  text = text.replace(/\\to/g, '→');
  text = text.replace(/\\implies/g, '⇒');
  text = text.replace(/\\le/g, '≤');
  text = text.replace(/\\ge/g, '≥');
  text = text.replace(/\\approx/g, '≈');
  text = text.replace(/\\cdot/g, '·');
  text = text.replace(/\\quad/g, ' ');
  text = text.replace(/\\text\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathbf\{([^}]+)\}/g, '$1');

  // Reemplazar subíndices de procesos como $P_1$, $P_3$, $P_{alta}$, $P_{baja}$, $P_{media}$
  text = text.replace(/\$P_\{alta\}\$/g, '**P_alta**');
  text = text.replace(/\$P_\{media\}\$/g, '**P_media**');
  text = text.replace(/\$P_\{baja\}\$/g, '**P_baja**');
  text = text.replace(/\$P_0\$/g, 'P0');
  text = text.replace(/\$P_1\$/g, 'P1');
  text = text.replace(/\$P_2\$/g, 'P2');
  text = text.replace(/\$P_3\$/g, 'P3');
  text = text.replace(/\$P_4\$/g, 'P4');
  text = text.replace(/\$P_i\$/g, 'Pi');
  text = text.replace(/\$P_j\$/g, 'Pj');
  text = text.replace(/\$p_i\$/g, 'p_i');
  text = text.replace(/\$\\tau_i\$/g, 'τ_i');
  text = text.replace(/\$T_\{retorno\}\$/g, 'T_retorno');
  text = text.replace(/\$T_\{fin\}\$/g, 'T_fin');
  text = text.replace(/\$T_\{llegada\}\$/g, 'T_llegada');
  text = text.replace(/\$\\tau_\{n\+1\}\$/g, 'τ_(n+1)');
  text = text.replace(/\$t_n\$/g, 't_n');
  text = text.replace(/\$\\tau_n\$/g, 'τ_n');
  text = text.replace(/\$\\alpha\$/g, 'α');
  text = text.replace(/\$q\$/g, 'q');
  text = text.replace(/\$s\$/g, 's');
  text = text.replace(/\$t=(\d+)\$/g, 't=$1');
  text = text.replace(/\$m\$/g, 'm');
  text = text.replace(/\$n\$/g, 'n');
  text = text.replace(/\$K\$/g, 'K');
  text = text.replace(/\$U\$/g, 'U');
  text = text.replace(/\$Need\$/g, 'Need');
  text = text.replace(/\$Allocation\$/g, 'Allocation');
  text = text.replace(/\$Available\$/g, 'Available');
  text = text.replace(/\$Request\$/g, 'Request');
  text = text.replace(/\$Request_i\$/g, 'Request_i');
  text = text.replace(/\$Available'\$/g, "Available'");
  text = text.replace(/\$Allocation_i'\$/g, "Allocation_i'");
  text = text.replace(/\$Need_i'\$/g, "Need_i'");
  text = text.replace(/\$Need_i\$/g, 'Need_i');
  text = text.replace(/\$Work\$/g, 'Work');
  text = text.replace(/\$Finish\$/g, 'Finish');
  text = text.replace(/\$Finish\[i\]\$/g, 'Finish[i]');
  text = text.replace(/\$Max\$/g, 'Max');
  text = text.replace(/\$T_i\$/g, 'T_i');
  text = text.replace(/\$C_i\$/g, 'C_i');
  text = text.replace(/\$D_i\$/g, 'D_i');
  text = text.replace(/\$d_i\$/g, 'd_i');
  text = text.replace(/\$R_i\$/g, 'R_i');
  text = text.replace(/\$\\tau_i\$/g, 'τ_i');
  text = text.replace(/\$Bit = (\d+)\$/g, 'Bit = $1');

  // Limpiar cualquier $ suelto restante alrededor de letras o palabras cortas
  text = text.replace(/\$([^$]+)\$/g, '$1');
  text = text.replace(/\$\$([^$]+)\$\$/g, '$1');

  text = text.replace(/___ESC_DOL___/g, '$');

  return text;
}

async function run() {
  console.log('Limpiando fórmulas matemáticas en el resumen...');

  let content = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
  content = cleanMath(content);
  fs.writeFileSync(ARTIFACT_PATH, content, 'utf-8');
  fs.writeFileSync(PUBLIC_PATH, content, 'utf-8');
  console.log('- Archivos de markdown actualizados.');

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

  console.log('¡Base de datos y archivos actualizados con tipografía limpia sin $$!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
