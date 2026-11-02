const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tp5CleanSteps = [
  {
    order: 1,
    instruction: 'Problema 1: Deadlock sin recursos del sistema',
    explanation: `**¿Se puede producir deadlock sin recursos del sistema?**
**SÍ, es totalmente posible.**

**Explicación y Ejemplo:**
Los interbloqueos pueden ocurrir puramente por **dependencias lógicas de sincronización o comunicación (Message Deadlocks)** entre procesos, sin que intervengan recursos de hardware (como cintas, impresoras o memoria):

*Ejemplo clásico:* Dos procesos P₁ y P₂ que se comunican mediante paso de mensajes bloqueante:
- **P₁ ejecuta:** \`receive(P2)\` (espera recibir un mensaje de P₂ antes de continuar o enviar nada).
- **P₂ ejecuta:** \`receive(P1)\` (espera recibir un mensaje de P₁ antes de continuar o enviar nada).

Ambos procesos quedan bloqueados esperando un evento que únicamente el otro proceso puede desencadenar. Ningún recurso físico está saturado, pero el sistema está en **deadlock** permanente.`
  },
  {
    order: 2,
    instruction: 'Problema 2: Estado Inseguro vs Interbloqueo',
    explanation: `**Un estado inseguro NO es necesariamente un estado de interbloqueo.**
Un estado es *inseguro* simplemente si el sistema no puede garantizar que todos los procesos terminarán si cada uno solicita su demanda máxima de recursos simultáneamente.

**Demostración de que pueden completar su ejecución:**
Supongamos 1 recurso con 10 instancias disponibles. El proceso P₁ tiene asignadas 4 y su máximo es 8. P₂ tiene asignadas 3 y su máximo es 7. Quedan 3 recursos libres:
- Si ambos solicitan su máximo de golpe (P₁ pide 4 más y P₂ pide 4 más), ninguno puede completarse y se produce deadlock (estado inseguro).
- **Sin embargo**, si en la ejecución real P₁ solo necesita solicitar 1 recurso más para terminar su tarea, P₁ toma 1 recurso (quedan 2 libres), finaliza su trabajo y **libera sus 5 recursos**. Ahora hay \`2 + 5 = 7\` recursos libres, con los cuales P₂ puede satisfacer cualquier demanda, terminar y liberar todo.
- Por lo tanto, los procesos completaron su ejecución con éxito sin entrar en deadlock.`
  },
  {
    order: 3,
    instruction: 'Problema 3: 6 Unidades de Cinta y n Procesos (Máx 2)',
    explanation: `**Planteo:**
- **Total de recursos de cinta:** \`R = 6\`
- **Demanda máxima por proceso:** \`Max = 2\` unidades de cinta.
- **¿Para qué valores de n el sistema está garantizado libre de interbloqueo?**

**Demostración matemática:**
El peor escenario para generar deadlock ocurre cuando cada uno de los \`n\` procesos adquiere \`(Max - 1)\` recursos y solicita el último. Aquí cada proceso retendría \`2 - 1 = 1\` cinta.

Para garantizar que al menos **un** proceso pueda obtener su última cinta y terminar, el número total de cintas debe ser estrictamente mayor a la suma de las retenciones en el peor caso:

\`\`\`text
R ≥ n · (Max - 1) + 1
6 ≥ n · (2 - 1) + 1
6 ≥ n + 1   ⟹   n ≤ 5
\`\`\`

**Respuesta:**
El sistema está garantizado **libre de bloqueo para todo n ≤ 5** (hasta 5 procesos concurrentes). Si \`n = 6\`, 6 procesos podrían tomar 1 cinta cada uno y bloquearse indefinidamente esperando la segunda.`
  },
  {
    order: 4,
    instruction: 'Problema 4: Situación entre Procesos P y Q',
    explanation: `**Código analizado:**
\`\`\`text
Proceso P:       Proceso Q:
Requerir A       Requerir B
Liberar A        Requerir A
Requerir B       Liberar B
Liberar B        Liberar A
\`\`\`

**¿Puede ocurrir deadlock?**
**NO, es imposible que ocurra deadlock.**

**Justificación formal:**
Para que exista interbloqueo deben cumplirse las condiciones de Coffman, en particular **Retención y Espera (Hold and Wait)** y **Espera Circular**:
- Para que ocurra un ciclo, P debería retener el recurso A mientras solicita el recurso B, y Q debería retener el recurso B mientras solicita el recurso A.
- Sin embargo, observemos el código de **P**: P **libera A antes de requerir B** (\`Liberar A\` precede a \`Requerir B\`).
- Por lo tanto, en ningún momento P retiene A mientras compite por B. Si Q tiene B y pide A, o bien A ya está libre (porque P ya lo liberó) o bien P lo tiene pero lo liberará inmediatamente sin bloquearse. No existe posibilidad de espera circular.`
  },
  {
    order: 5,
    instruction: 'Problema 5: Algoritmo de Detección de Deadlock',
    explanation: `**¿En qué momento se ejecutaría el algoritmo de detección?**
Existen dos políticas principales:
1. **En cada solicitud de recurso que no pueda satisfacerse de inmediato:** Detecta el interbloqueo tan pronto como ocurre y permite identificar con precisión qué proceso lo causó. *Desventaja:* Alto costo de CPU por ejecución constante.
2. **A intervalos regulares de tiempo (ej. cada 15 o 30 minutos) o cuando la utilización de la CPU cae por debajo de un umbral:** Si la CPU cae mientras hay procesos listos, sugiere que los procesos están bloqueados esperando recursos.

**¿Qué medidas tomaría el sistema operativo si detecta deadlock?**
El SO debe aplicar técnicas de recuperación:
- **Terminación de procesos:** Abortar todos los procesos interbloqueados (muy drástico), o abortar uno a uno (por orden de prioridad, tiempo transcurrido o recursos retenidos) hasta romper el ciclo.
- **Expropiación de recursos (Preemption):** Quitar recursos asignados a uno de los procesos y hacer un *Rollback* (reversión) de su estado a un punto de control seguro (checkpoint).`
  },
  {
    order: 6,
    instruction: 'Problema 6: Prevención vs Detección de Bloqueos',
    explanation: `**Algoritmos de Prevención:**
- Diseñan el sistema para invalidar estructuralmente al menos una de las cuatro condiciones necesarias de Coffman (Exclusión mutua, Retención y espera, No expropiación, Espera circular).
- *Utilidad y Limitación:* Son muy conservadores; garantizan que nunca habrá deadlock pero reducen significativamente el uso eficiente de los dispositivos y la concurrencia (ej. exigir que todos los recursos se soliciten de golpe al inicio o en estricto orden numérico global).

**Algoritmos de Detección:**
- Permiten que los procesos soliciten recursos libremente según sus necesidades reales. El SO monitorea periódicamente la asignación y las solicitudes buscando ciclos en el Grafo de Asignación de Recursos (RAG).
- *Utilidad y Limitación:* Permiten máxima flexibilidad y alta utilización de recursos, pero tienen costo computacional para la detección periódica y conllevan el costo de tener que abortar procesos o revertir cómputos realizados cuando se confirma un bloqueo.`
  },
  {
    order: 7,
    instruction: 'Problema 7: Análisis Costo-Beneficio de Evasión',
    explanation: `**Datos del problema:**
- 5.000 trabajos por mes.
- Deadlock ocurre 2 veces al mes; cancela 10 trabajos cada vez.
- Costo por trabajo cancelado: $1 USD (están a mitad de su costo total de $2).
- Costo mensual actual por deadlocks:
  \`2 eventos/mes × 10 trabajos × 1 USD = 20 USD/mes\`

**Impacto del Algoritmo de Evasión (Banquero):**
- Aumenta 10% el tiempo de ejecución de TODOS los trabajos (5.000 trabajos).
- Aumenta el tiempo de respuesta promedio en un 20%.

**a) Argumentos para instalar el algoritmo:**
- Previsibilidad y consistencia: Garantiza que ningún trabajo de cómputo crítico sea abortado intempestivamente a mitad de camino.
- La máquina cuenta con 30% de tiempo ocioso, por lo que absorbe el 10% de cálculo adicional sin saturar el procesador.

**b) Argumentos en contra de instalar el algoritmo (Decisión técnica):**
- **Inviabilidad económica flagrante:** El costo actual de los interbloqueos es de apenas **$20 USD al mes**. Pagar una penalidad del 10% de CPU en 5.000 trabajos equivale a desperdiciar 500 trabajos equivalentes en tiempo de CPU (aproximadamente $1.000 USD).
- Penaliza la experiencia de todos los usuarios con un 20% más de tiempo de espera para ahorrarse apenas $20 al mes.`
  },
  {
    order: 8,
    instruction: 'Problema 8: Tres Maneras de Eliminar un Bloqueo',
    explanation: `Una vez detectado un interbloqueo, las tres formas estándar de resolverlo son:

1. **Abortar todos los procesos interbloqueados:** Rompe el ciclo inmediatamente, pero es la opción más destructiva ya que se pierde todo el progreso de todos los trabajos involucrados.
2. **Abortar procesos uno a la vez:** Se selecciona un proceso víctima según un criterio de costo mínimo (prioridad más baja, menos tiempo computado, menos recursos retenidos), se lo aborta y se reejecuta el algoritmo de detección hasta que el ciclo desaparezca.
3. **Expropiación de recursos con Rollback (Puntos de control):** Se despoja a un proceso de sus recursos y se revierte (*rollback*) su estado a un *checkpoint* guardado previamente en almacenamiento estable, poniéndolo en espera hasta que los recursos se liberen.`
  },
  {
    order: 9,
    instruction: 'Problema 9: Definición de Estado Seguro',
    explanation: `**Definición Formal:**
Un estado es **seguro** si el sistema puede asignar recursos a cada proceso (hasta su máximo declarado) en algún orden específico, sin que se produzca un interbloqueo.

Más formalmente, un estado es seguro si existe al menos una **Secuencia Segura** de procesos:

\`\`\`text
⟨ P₁, P₂, P₃, ..., Pₙ ⟩
\`\`\`

tal que para cada proceso **Pᵢ**, la cantidad de recursos que aún puede solicitar (\`Needᵢ\`) puede ser satisfecha con los recursos actualmente disponibles en el sistema más los recursos retenidos por todos los procesos anteriores **Pⱼ** (con \`j < i\`).

Si existe dicha secuencia:
1. Cada proceso **Pᵢ** puede obtener sus recursos, completar su tarea y finalizar.
2. Al finalizar, libera todos sus recursos asignados (\`Allocationᵢ\`).
3. El proceso siguiente en la secuencia puede avanzar con los recursos acumulados.`
  },
  {
    order: 10,
    instruction: 'Problema 10: Diferencia entre Deadlock y Starvation',
    explanation: `**Deadlock (Interbloqueo):**
- Dos o más procesos están **permanentemente bloqueados** porque cada uno espera un evento que solo otro proceso del conjunto puede generar.
- Ningún proceso del conjunto puede avanzar; el estado no cambiará sin intervención externa (del SO o del operador).
- No hay consumo de ciclos de CPU por parte de los procesos bloqueados.

**Starvation (Inanición / Postergación Indefinida):**
- Un proceso está en estado **Listo (Ready)** o esperando un recurso, pero el planificador o el asignador de recursos **lo posterga indefinidamente** porque siempre le da preferencia a otros procesos (por ejemplo, por prioridades más altas o algoritmos desfavorables).
- A diferencia del deadlock, **el sistema sí está realizando trabajo útil** y otros procesos continúan avanzando.
- Se soluciona mediante técnicas de envejecimiento (*aging*).`
  },
  {
    order: 11,
    instruction: 'Problema 11: Algoritmo del Banquero (Figura 1)',
    explanation: `**Datos del problema:**
- **Recursos:** 4 tipos (A, B, C, D).
- **Disponible (Available):** \`[1, 5, 2, 0]\`

---

### a) Matriz de Necesidad (\`Need = Max - Allocation\`):

\`\`\`text
P₀: [0, 0, 1, 2] - [0, 0, 1, 2] = [0, 0, 0, 0]
P₁: [1, 7, 5, 0] - [1, 0, 0, 0] = [0, 7, 5, 0]
P₂: [2, 3, 5, 6] - [1, 3, 5, 4] = [1, 0, 0, 2]
P₃: [0, 6, 5, 2] - [0, 6, 3, 2] = [0, 0, 2, 0]
P₄: [0, 6, 5, 6] - [0, 0, 1, 4] = [0, 6, 4, 2]
\`\`\`

---

### b) ¿Se encuentra en estado seguro?
**SÍ, es seguro.** Existe la secuencia segura:
\`\`\`text
⟨ P₀, P₂, P₃, P₄, P₁ ⟩
\`\`\`

**Verificación paso a paso:**
1. **Disponible inicial = \`[1, 5, 2, 0]\`**
   - Para **P₀**: \`Need₀ = [0, 0, 0, 0] ≤ [1, 5, 2, 0]\`  ⟹  **P₀ termina**.
   - Nuevo Disponible = \`[1, 5, 2, 0] + [0, 0, 1, 2] = [1, 5, 3, 2]\`.

2. Para **P₂**: \`Need₂ = [1, 0, 0, 2] ≤ [1, 5, 3, 2]\`  ⟹  **P₂ termina**.
   - Nuevo Disponible = \`[1, 5, 3, 2] + [1, 3, 5, 4] = [2, 8, 8, 6]\`.

3. Para **P₃**: \`Need₃ = [0, 0, 2, 0] ≤ [2, 8, 8, 6]\`  ⟹  **P₃ termina**.
   - Nuevo Disponible = \`[2, 8, 8, 6] + [0, 6, 3, 2] = [2, 14, 11, 8]\`.

4. Para **P₄**: \`Need₄ = [0, 6, 4, 2] ≤ [2, 14, 11, 8]\`  ⟹  **P₄ termina**.
   - Nuevo Disponible = \`[2, 14, 11, 8] + [0, 0, 1, 4] = [2, 14, 12, 12]\`.

5. Para **P₁**: \`Need₁ = [0, 7, 5, 0] ≤ [2, 14, 12, 12]\`  ⟹  **P₁ termina**.

Todos los procesos pudieron terminar con éxito.

---

### c) Si P₁ solicita \`[0, 4, 2, 0]\`, ¿puede satisfacerse de inmediato?
**SÍ, se puede satisfacer de inmediato.**

1. \`Request ≤ Need₁\`  (\`[0, 4, 2, 0] ≤ [0, 7, 5, 0]\`)  → Válido.
2. \`Request ≤ Disponible\`  (\`[0, 4, 2, 0] ≤ [1, 5, 2, 0]\`)  → Hay recursos disponibles.
3. **Simulación del estado resultante:**
   - Disponible provisional = \`[1, 5, 2, 0] - [0, 4, 2, 0] = [1, 1, 0, 0]\`
   - Allocation(P₁) = \`[1, 4, 2, 0]\`
   - Need(P₁) = \`[0, 3, 3, 0]\`
4. **Verificación de seguridad:** Se encuentra la misma secuencia segura \`⟨ P₀, P₂, P₃, P₄, P₁ ⟩\`:
   - Con Disp \`[1, 1, 0, 0]\`, \`Need₀ = [0, 0, 0, 0] ≤ [1, 1, 0, 0]\`  ⟹ P₀ termina y libera \`[0, 0, 1, 2]\`, dejando Disp = \`[1, 1, 1, 2]\`.
   - Con Disp \`[1, 1, 1, 2]\`, \`Need₂ = [1, 0, 0, 2] ≤ [1, 1, 1, 2]\`  ⟹ P₂ termina y libera \`[1, 3, 5, 4]\`, dejando Disp = \`[2, 4, 6, 6]\`.
   - A partir de aquí, P₃, P₄ y P₁ pueden completarse sucesivamente.

Como el estado resultante sigue siendo seguro, la solicitud se concede inmediatamente.`
  },
  {
    order: 12,
    instruction: 'Problema 12: Dificultades y Ventajas del Rollback',
    explanation: `**Dificultades del Rollback:**
1. **Sobrecarga de almacenamiento y cómputo:** Requiere que el sistema guarde periódicamente puntos de control (*checkpoints*) en disco con el estado completo del proceso y sus archivos.
2. **Operaciones irreversibles:** Si el proceso realizó operaciones hacia el exterior (enviar un paquete de red a un servidor externo, dispensar dinero o imprimir una hoja), esas acciones no se pueden "deshacer" físicamente.
3. **Riesgo de inanición:** Si siempre se elige al mismo proceso como víctima para rollback, nunca terminará.

**Ventajas del Rollback:**
1. **Ahorro de cómputo:** Evita abortar el proceso completamente, conservando todo el trabajo realizado hasta el último checkpoint.
2. **Tolerancia a fallos:** Permite una recuperación elegante y automática del sistema operativo sin intervención manual del usuario ni caída del sistema.`
  },
  {
    order: 13,
    instruction: 'Problema 13: Modificaciones que Preservan la Seguridad en el Banquero',
    explanation: `**Análisis para cada caso:**

- **a) Incremento Disponible (nuevos recursos):** **SEGURO.** Disponer de más recursos libres nunca puede provocar que una secuencia previamente segura deje de serlo.
- **b) Decremento Disponible:** **PUEDE SER INSEGURO.** Al tener menos recursos libres, alguna necesidad de los procesos puede no ser satisfecha.
- **c) Incremento MAX:** **PUEDE SER INSEGURO.** Si un proceso declara que puede necesitar más recursos que antes, aumenta su matriz Need y puede romper secuencias seguras.
- **d) Decremento MAX:** **SEGURO.** El proceso se compromete a requerir menos recursos; su vector Need se reduce, facilitando la búsqueda de secuencias seguras.
- **e) Incremento del Número de Procesos:** **PUEDE SER INSEGURO.** Un nuevo competidor por los recursos existentes puede llevar al sistema a un estado inseguro.
- **f) Decremento del Número de Procesos:** **SEGURO.** Al finalizar o eliminarse un proceso, se liberan sus recursos asignados y disminuye la competencia.`
  }
];

function sanitizeMath(text) {
  if (!text) return text;
  let res = text;
  res = res.replace(/\\ge/g, '≥');
  res = res.replace(/\\le/g, '≤');
  res = res.replace(/\\implies/g, '⟹');
  res = res.replace(/\\cdot/g, '·');
  res = res.replace(/\\approx/g, '≈');
  res = res.replace(/\\times/g, '×');
  res = res.replace(/\\langle/g, '⟨');
  res = res.replace(/\\rangle/g, '⟩');
  res = res.replace(/\\text\{([^}]+)\}/g, '$1');
  res = res.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  res = res.replace(/\$N\$/g, 'N');
  res = res.replace(/\$t\$/g, 't');
  res = res.replace(/\$t\+1\$/g, 't + 1');
  return res;
}

async function cleanAll() {
  console.log('--- Iniciando limpieza de formato matemático para TP5 y base de datos ---');

  // 1. Buscar lección de TP5
  const tp5 = await prisma.lesson.findFirst({
    where: { title: { contains: 'Practico5' } }
  });

  if (tp5) {
    console.log(`Encontrado TP5: ID ${tp5.id} - ${tp5.title}`);
    for (const step of tp5CleanSteps) {
      const existing = await prisma.step.findFirst({
        where: { lessonId: tp5.id, order: step.order }
      });
      if (existing) {
        await prisma.step.update({
          where: { id: existing.id },
          data: {
            instruction: step.instruction,
            explanation: step.explanation
          }
        });
      } else {
        await prisma.step.create({
          data: {
            lessonId: tp5.id,
            order: step.order,
            instruction: step.instruction,
            explanation: step.explanation
          }
        });
      }
    }
    console.log('✓ TP5 actualizado con 13 pasos en formato limpio.');
  } else {
    console.warn('No se encontró lección de TP5');
  }

  // 2. Limpiar cualquier resto de fórmulas LaTeX en todos los pasos de la BD
  console.log('Sanitizando todos los pasos de la base de datos...');
  const allSteps = await prisma.step.findMany();
  let sanitizedCount = 0;
  for (const step of allSteps) {
    let changed = false;
    let newExp = sanitizeMath(step.explanation);
    let newInst = sanitizeMath(step.instruction);
    if (newExp !== step.explanation || newInst !== step.instruction) {
      await prisma.step.update({
        where: { id: step.id },
        data: {
          explanation: newExp,
          instruction: newInst
        }
      });
      sanitizedCount++;
    }
  }
  console.log(`✓ Se sanitizaron ${sanitizedCount} pasos adicionales con fórmulas residuales.`);

  // 3. Exportar todo a seed-data.json
  console.log('Exportando cambios a prisma/seed-data.json...');
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
  console.log(`✓ Archivo seed-data.json actualizado con éxito (${units.length} unidades).`);

  console.log('--- Proceso finalizado correctamente ---');
}

cleanAll()
  .catch((e) => {
    console.error('Error durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
