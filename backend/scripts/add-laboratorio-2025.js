const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_DIR = path.resolve(__dirname, '../../../Examenes/Laboratorio_Licencias_2025');
const DEST_DIR = path.resolve(__dirname, '../../frontend/public/material/Examenes/Laboratorio_Licencias_2025');

async function main() {
  console.log('=== Agregando Parcial de Laboratorio 2025 a la plataforma ===\n');

  // Asegurar directorio destino
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  // Copiar archivos a frontend public
  if (fs.existsSync(LAB_DIR)) {
    const files = fs.readdirSync(LAB_DIR);
    for (const f of files) {
      fs.copyFileSync(path.join(LAB_DIR, f), path.join(DEST_DIR, f));
      console.log(`- Copiado ${f} a public/material/Examenes/Laboratorio_Licencias_2025/`);
    }
  }

  // Leer código C e informe
  const cCode = fs.readFileSync(path.join(LAB_DIR, 'centro_computos.c'), 'utf-8');
  const makefileContent = fs.readFileSync(path.join(LAB_DIR, 'Makefile'), 'utf-8');

  // Buscar unidad de exámenes
  const unit = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } }
  });

  if (!unit) {
    console.error('No se encontró la unidad Exámenes y Evaluaciones');
    return;
  }

  const lessonTitle = 'Parcial de Laboratorio 2025 - Sincronización de Licencias';

  let lesson = await prisma.lesson.findFirst({
    where: { unitId: unit.id, title: lessonTitle }
  });

  const lessonContent = `# Parcial de Laboratorio - Segundo Cuatrimestre 2025
**Universidad Nacional del Sur (UNS)** - Sistemas Operativos

Control y asignación concurrente de 20 licencias especializadas para usuarios con demanda variable (1 a 3 licencias), persistencia en Base de Datos compartida y prevención de interbloqueos.`;

  if (!lesson) {
    lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        title: lessonTitle,
        type: 'PRACTICAL_WORK',
        content: lessonContent,
        order: 6
      }
    });
    console.log(`+ Creada lección: ${lessonTitle}`);
  } else {
    lesson = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        content: lessonContent,
        order: 6
      }
    });
    console.log(`✓ Actualizada lección: ${lessonTitle}`);
  }

  // Limpiar pasos previos si existen
  await prisma.step.deleteMany({
    where: { lessonId: lesson.id }
  });

  const steps = [
    {
      order: 1,
      instruction: 'Planteo del Problema y Requisitos de Concurrencia',
      explanation: `### Enunciado Oficial
Un centro de cómputos controla el uso de licencias de un software especializado:
- Se disponen un total de **20 licencias**.
- Cada usuario puede requerir entre **1 y 3 licencias**.
- Si consigue las licencias requeridas, realiza su trabajo.
- Al terminar guarda sus resultados en una **base de datos compartida** y por último **libera las licencias utilizadas**.
- **Si no puede conseguir todas las licencias requeridas, se retira sin hacer nada.**

---

### Análisis de Restricciones del Sistema
1. **Demanda Variable y Atómica:** Cada hilo usuario solicita $k \\in \\{1, 2, 3\\}$ licencias de golpe. La adquisición debe ser **Todo o Nada (All-or-Nothing)**.
2. **Política No Bloqueante:** Si en el instante de la solicitud no hay al menos $k$ licencias disponibles, el usuario **no debe esperar ni tomar una parte**: debe retirarse inmediatamente sin hacer nada.
3. **Persistencia en Sección Crítica:** Al terminar el cómputo, el acceso a la base de datos compartida requiere exclusión mutua para evitar condiciones de carrera (*race conditions*) en disco o memoria.
4. **Secuencia Estricta:**
   $$\\text{Solicitar Licencias} \\longrightarrow \\text{Cómputo} \\longrightarrow \\text{Guardar en BD} \\longrightarrow \\text{Liberar Licencias}$$
5. **Invariante:** Al terminar todos los usuarios, las licencias disponibles deben retornar exactamente a 20.`,
      codeSnippet: null
    },
    {
      order: 2,
      instruction: 'Inciso a) Implementación Completa en C (POSIX Threads)',
      explanation: `### Código Fuente \`centro_computos.c\`
Implementación en lenguaje C estándar POSIX que cumple estrictamente todos los requisitos:
- **Hilos independientes** por cada usuario (\`pthread_create\`, \`pthread_join\`).
- **Mutex de licencias** (\`mutex_licencias\`) para la consulta y sustracción atómica de licencias.
- **Mutex de Base de Datos** (\`mutex_bd\`) para proteger la escritura de resultados en memoria y en el archivo \`resultados_bd.txt\`.
- **Métricas e Invariantes:** Verifica al finalizar que se restituyeron el 100% de las 20 licencias.

#### Compilación:
\`\`\`bash
gcc -Wall -Wextra -pthread -O2 -o centro_computos centro_computos.c
\`\`\`

#### Ejecución:
\`\`\`bash
./centro_computos 30
\`\`\``,
      codeSnippet: cCode
    },
    {
      order: 3,
      instruction: 'Inciso b) Justificación Teórica y Elección de Herramientas',
      explanation: `### ¿Por qué Mutex (\`pthread_mutex_t\`) y NO Semáforos Contadores (\`sem_t\`)?

| Aspecto | Semáforo Contador (\`sem_t\`) | Mutex + Variable Entera (\`pthread_mutex_t\`) [Elegido] |
| :--- | :--- | :--- |
| **Atomicidad en pedidos de $k > 1$ licencias** | POSIX no provee \`sem_wait_n(&sem, k)\`. Se requieren $k$ llamadas sucesivas a \`sem_wait()\`. | La evaluación \`licencias_disponibles >= k\` y la resta se realizan en una **única sección crítica atómica**. |
| **Riesgo de Interbloqueo (*Deadlock*)** | **Grave:** Si hay 2 licencias libres y un proceso pide 3, adquiere 2 y se bloquea en la 3ra (*Hold and Wait*), reteniendo recursos que otros podrían usar. | **Nulo:** Nunca se asignan licencias parciales. O se obtienen las $k$ o no se toma ninguna. |
| **Cumplimiento de "Se retira sin hacer nada"** | Requeriría evaluar con \`sem_trywait()\`. Si obtiene la 1ra pero falla la 2da, debe revertir con \`sem_post()\`, creando ventanas de inconsistencia. | Si no alcanza, el hilo libera el mutex sin tocar el contador y se retira inmediatamente sin interferir. |

---

### Granularidad Fina de Cerrojos (*Fine-Grained Locking*)
Se definieron dos cerrojos independientes:
1. **\`mutex_licencias\`:** Protege exclusivamente las operaciones de lectura/modificación del contador de licencias. Dura solo nanosegundos en memoria.
2. **\`mutex_bd\`:** Protege exclusivamente la inserción en memoria y la escritura en disco (\`fopen\`, \`fprintf\`, \`fclose\`).

**Ventaja de Rendimiento:** Un usuario que esté escribiendo en el disco rígido de la base de datos **no bloquea** a otros usuarios que deseen solicitar o devolver licencias. Se maximiza el paralelismo real en sistemas multinúcleo.`,
      codeSnippet: makefileContent
    },
    {
      order: 4,
      instruction: 'Prevención de Interbloqueos (Coffman) y Conclusiones',
      explanation: `### Análisis Formal de las Condiciones de Coffman

Para que exista interbloqueo (*deadlock*) deben cumplirse simultáneamente las 4 condiciones de Coffman:

1. **Exclusión Mutua:** Se cumple (las licencias y los mutexes son de acceso exclusivo).
2. **Retención y Espera (*Hold and Wait*): INVALIDADA ESTRUCTURALMENTE.**
   - A nivel de licencias: El usuario no retiene licencias si no consigue todas; se retira sin nada.
   - A nivel de mutexes: El usuario adquiere \`mutex_licencias\`, modifica el estado y **lo libera inmediatamente**. Jamás retiene \`mutex_licencias\` mientras intenta adquirir \`mutex_bd\`.
3. **No Expropiación (*No Preemption*):** Se cumple (el SO no confisca licencias a la fuerza).
4. **Espera Circular (*Circular Wait*): IMPOSIBLE.**
   - El orden de adquisición de recursos es estrictamente disjunto y acíclico:
     $$\\text{Lock}(M_{\\text{lic}}) \\to \\text{Unlock}(M_{\\text{lic}}) \\longrightarrow \\text{Lock}(M_{\\text{bd}}) \\to \\text{Unlock}(M_{\\text{bd}}) \\longrightarrow \\text{Lock}(M_{\\text{lic}}) \\to \\text{Unlock}(M_{\\text{lic}})$$

---

### Conclusiones Principales
1. **Solución Óptima:** El uso de mutexes de granularidad fina con evaluación de estado entera proporciona la solución más limpia, segura y de mayor rendimiento para problemas de asignación atómica multi-recurso.
2. **Invariante Verificado:** En todas las corridas experimentales, el número final de licencias disponibles coincide con las iniciales (20), demostrando ausencia de pérdidas o fugas de recursos.`,
      codeSnippet: null
    }
  ];

  for (const s of steps) {
    await prisma.step.create({
      data: {
        lessonId: lesson.id,
        order: s.order,
        instruction: s.instruction,
        explanation: s.explanation,
        codeSnippet: s.codeSnippet
      }
    });
  }
  console.log(`✓ Insertados ${steps.length} pasos para la lección de Laboratorio.`);

  // Exportar a seed-data.json
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
  console.log(`✓ Archivo seed-data.json actualizado con éxito.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
