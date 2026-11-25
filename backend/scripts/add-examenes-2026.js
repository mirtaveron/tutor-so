const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXAM_ROOT = path.resolve(__dirname, '../../../Examenes');
const PUBLIC_EXAM_DIR = path.resolve(__dirname, '../../frontend/public/material/Examenes');

function readFileSafe(relPath) {
  const full = path.join(EXAM_ROOT, relPath);
  return fs.readFileSync(full, 'utf-8');
}

async function upsertExamLesson(unitId, title, content, order, steps) {
  let lesson = await prisma.lesson.findFirst({
    where: { unitId, title }
  });

  if (!lesson) {
    lesson = await prisma.lesson.create({
      data: {
        unitId,
        title,
        type: 'PRACTICAL_WORK',
        content,
        order
      }
    });
    console.log(`+ Creada lección: ${title}`);
  } else {
    lesson = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content, order, type: 'PRACTICAL_WORK' }
    });
    console.log(`✓ Actualizada lección: ${title}`);
  }

  await prisma.step.deleteMany({ where: { lessonId: lesson.id } });

  for (const s of steps) {
    await prisma.step.create({
      data: {
        lessonId: lesson.id,
        order: s.order,
        instruction: s.instruction,
        explanation: s.explanation,
        codeSnippet: s.codeSnippet || null
      }
    });
  }
  console.log(`  ↳ ${steps.length} pasos cargados.`);
}

async function main() {
  console.log('=== Cargando nuevos exámenes 2026 y limpiando formato ===\n');

  const unit = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } }
  });

  if (!unit) {
    throw new Error('No se encontró la unidad Exámenes y Evaluaciones');
  }

  // Copiar archivos C nuevos a frontend/public/material/Examenes
  const copies = [
    ['Laboratorio_IPC_Procesos_2026/enteros_ipc.c', 'Laboratorio_IPC_Procesos_2026/enteros_ipc.c'],
    ['Actividades5_Sincronizacion_2026/empresa_viajes.c', 'Actividades5_Sincronizacion_2026/empresa_viajes.c']
  ];
  for (const [srcRel, dstRel] of copies) {
    const src = path.join(EXAM_ROOT, srcRel);
    const dst = path.join(PUBLIC_EXAM_DIR, dstRel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }

  const enterosCode = readFileSafe('Laboratorio_IPC_Procesos_2026/enteros_ipc.c');
  const viajesCode = readFileSafe('Actividades5_Sincronizacion_2026/empresa_viajes.c');

  // ---------------------------------------------------------------------------
  // 0. Limpiar LaTeX residual en "Parcial de Laboratorio 2025 - Sincronización de Licencias"
  // ---------------------------------------------------------------------------
  const lab2025 = await prisma.lesson.findFirst({
    where: { unitId: unit.id, title: { contains: 'Laboratorio 2025' } },
    include: { steps: { orderBy: { order: 'asc' } } }
  });

  if (lab2025) {
    const replacements = [
      [/\$k \\in \\\{1, 2, 3\\\}\$/g, '`k ∈ {1, 2, 3}`'],
      [/\$k > 1\$/g, '`k > 1`'],
      [/\$k\$/g, '`k`'],
      [/\$\$\\text\{Solicitar Licencias\} \\longrightarrow \\text\{Cómputo\} \\longrightarrow \\text\{Guardar en BD\} \\longrightarrow \\text\{Liberar Licencias\}\$\$/g,
        '```text\nSolicitar Licencias  ⟶  Cómputo  ⟶  Guardar en BD  ⟶  Liberar Licencias\n```'],
      [/\$\$\\text\{Lock\}\(M_\{\\text\{lic\}\}\) \\to \\text\{Unlock\}\(M_\{\\text\{lic\}\}\) \\longrightarrow \\text\{Lock\}\(M_\{\\text\{bd\}\}\) \\to \\text\{Unlock\}\(M_\{\\text\{bd\}\}\) \\longrightarrow \\text\{Lock\}\(M_\{\\text\{lic\}\}\) \\to \\text\{Unlock\}\(M_\{\\text\{lic\}\}\)\$\$/g,
        '```text\nLock(M_lic) → Unlock(M_lic)  ⟶  Lock(M_bd) → Unlock(M_bd)  ⟶  Lock(M_lic) → Unlock(M_lic)\n```']
    ];

    for (const s of lab2025.steps) {
      let cleanExp = s.explanation || '';
      for (const [regex, rep] of replacements) {
        cleanExp = cleanExp.replace(regex, rep);
      }
      if (cleanExp !== s.explanation) {
        await prisma.step.update({
          where: { id: s.id },
          data: { explanation: cleanExp }
        });
      }
    }
    console.log('✓ Limpiado formato Unicode en Parcial de Laboratorio 2025.');
  }

  // ---------------------------------------------------------------------------
  // 1. EXAMEN PARCIAL 2026 (2º Cuatrimestre - 2 páginas combinadas)
  // ---------------------------------------------------------------------------
  await upsertExamLesson(
    unit.id,
    'Parcial 2026',
    `# Examen Parcial — Segundo Cuatrimestre de 2026
**Universidad Nacional del Sur (UNS)** — Sistemas Operativos

Evaluación teórico-práctica compuesta por **4 ejercicios**:
1. Mecanismos de sincronización del SO y escenarios de un proceso prioritario requiriendo un semáforo.
2. Diagrama de estados de un proceso (Round Robin y Prioridades) y relación entre quantum y cambio de contexto.
3. Operación \`read()\` sobre un archivo no cargado en memoria vs previamente cargado en memoria.
4. Condiciones necesarias de interbloqueo (Coffman) y análisis de 3 filósofos comensales (\`p₁\`, \`p₂\`, \`p₃\`).`,
    7,
    [
      {
        order: 1,
        instruction: 'Ejercicio 1: Mecanismos de Sincronización y Proceso Prioritario con Semáforo',
        explanation: `### Consigna
**a)** Identifique y describa los distintos mecanismos de sincronización que provee un sistema operativo:
- Indique qué uso se le da a cada uno.
- Describa las operaciones primitivas que se utilizan para cada caso.
- Explique brevemente qué alternativas existen para implementar estos mecanismos a nivel de sistemas operativos.

**b)** Suponga que un proceso prioritario que se encuentra en ejecución requiere un semáforo. Indique todos los posibles escenarios, teniendo en cuenta la disponibilidad y las distintas implementaciones mencionadas anteriormente.

---

### Resolución a) Mecanismos de Sincronización del SO

| Mecanismo | Uso Principal | Operaciones Primitivas |
| :--- | :--- | :--- |
| **Mutex (Cerrojo de Exclusión Mutua)** | Garantizar exclusión mutua estricta sobre secciones críticas. Posee concepto de **propiedad (*ownership*)**: solo el hilo/proceso que lo adquiere puede liberarlo. | \`lock()\` / \`acquire()\` y \`unlock()\` / \`release()\` (en POSIX: \`pthread_mutex_lock\`, \`pthread_mutex_unlock\`). |
| **Semáforo (Binario y Contador)** | Exclusión mutua, señalización de eventos entre procesos/hilos y control de acceso a \`N\` instancias de recursos compartidos. No tiene noción de propiedad. | \`wait()\` (o \`P()\`, \`down()\`) y \`signal()\` (o \`V()\`, \`up()\`) — operaciones atómicas indivisibles. |
| **Monitor y Variables de Condición** | Abstracción de alto nivel que encapsula datos compartidos y procedimientos, asegurando exclusión mutua automática y coordinación de esperas condicionales sin espera activa. | Procedimientos del monitor + \`wait(cond)\`, \`signal(cond)\` y \`broadcast(cond)\`. |
| **Spinlock** | Exclusión mutua de duración extremadamente breve en sistemas multiprocesador (SMP), especialmente en código interno del kernel. | \`spin_lock()\` (bucle de espera activa) y \`spin_unlock()\`. |
| **Locks Lectores-Escritores (\`rwlock\`) y Barreras** | Permitir múltiples lectores concurrentes o un escritor exclusivo (\`rwlock\`); sincronizar un grupo de hilos por fases (\`barrier\`). | \`rdlock()\`, \`wrlock()\`, \`unlock()\` / \`barrier_wait()\`. |

#### Alternativas de implementación a nivel de SO:
1. **Inhabilitación de interrupciones:** El kernel desactiva las interrupciones antes de manipular el semáforo/variable y las reactiva después. Solo sirve en **monoprocesadores** y en modo kernel; en multiprocesadores otro núcleo podría acceder simultáneamente.
2. **Instrucciones atómicas de hardware con espera ocupada (*Busy Waiting / Spinlocks*):** Se emplean instrucciones indivisibles del procesador como \`Test-and-Set\`, \`Compare-and-Swap (CAS)\` o \`Swap/Exchange\`. Si el recurso está ocupado, el proceso permanece girando en un bucle consumiendo CPU.
3. **Bloqueo con cola de espera del SO (*Sleep / Block*):** Cada semáforo posee un valor entero y una **cola de procesos bloqueados**. Si el recurso no está disponible, el kernel (mediante llamada al sistema) suspende al proceso (estado **Bloqueado**), lo encola y cede la CPU a otro proceso listo. Al ejecutarse \`signal()\`, el SO extrae un proceso de la cola y lo pasa a **Listo**.

---

### Resolución b) Escenarios para un Proceso Prioritario en Ejecución que Requiere un Semáforo

#### Escenario 1: El semáforo está DISPONIBLE (\`S > 0\`)
- **En cualquier implementación (bloqueo o espera ocupada):** El proceso prioritario decrementa atómicamente el semáforo (\`S--\`), adquiere el acceso sin bloquearse, **permanece en estado Ejecutando** y entra directamente a su sección crítica.

#### Escenario 2: El semáforo NO está disponible (\`S ≤ 0\`) — Implementación con BLOQUEO (cola de espera)
1. El proceso prioritario realiza la llamada al sistema \`wait(S)\`. Al comprobar que no está disponible, el SO lo transiciona de **Ejecutando → Bloqueado** y lo inserta en la cola de espera del semáforo.
2. El planificador asigna la CPU a otro proceso listo (de menor prioridad).
3. **Problema de Inversión de Prioridades:** Si el proceso de baja prioridad que retiene el semáforo es expropiado por un proceso de prioridad intermedia (que no usa el semáforo), el proceso prioritario queda retrasado indefinidamente por uno de menor prioridad. *(Se mitiga mediante el protocolo de **Herencia de Prioridad**).*
4. Cuando el poseedor ejecuta \`signal(S)\`, el proceso prioritario pasa de **Bloqueado → Listo**. En planificación por prioridades apropiativa, el SO **expropia inmediatamente** al proceso actual y le devuelve la CPU al proceso prioritario.

#### Escenario 3: El semáforo NO está disponible (\`S ≤ 0\`) — Implementación con ESPERA OCUPADA (Spinlock)
- **En sistema Monoprocesador (con planificación por prioridades estricta):** Se produce un **interbloqueo / livelock (bloqueo infinito)**. El proceso prioritario NO cede la CPU porque permanece en estado **Ejecutando** girando en el bucle del spinlock; como tiene mayor prioridad que el proceso poseedor del semáforo, el planificador nunca vuelve a ejecutar al poseedor, que jamás podrá hacer \`signal()\`.
- **En sistema Multiprocesador (SMP):** El proceso prioritario permanece ejecutando activamente en su núcleo (consumiendo 100% de CPU) hasta que el proceso poseedor, corriendo en otro núcleo, ejecute \`signal()\`. Si el poseedor fuera desalojado en el resto de los núcleos por procesos de prioridad intermedia, se desperdician ciclos de CPU hasta que logre liberar el semáforo.`
      },
      {
        order: 2,
        instruction: 'Ejercicio 2: Diagrama de Estados (RR y Prioridades) y Quantum vs Cambio de Contexto',
        explanation: `### Consigna
**a)** Muestre el diagrama de estados de un proceso e indique los eventos que generan cada transición en sistemas con planificación Round Robin y por prioridades.

**b)** Defina y explique cómo se relacionan el valor del quantum de tiempo y el tiempo de cambio de contexto en un algoritmo de planificación Round Robin.

---

### Resolución a) Diagrama de Estados y Transiciones

\`\`\`text
                          (1) Admitido
  [ NUEVO ] ────────────────────────────────────┐
                                                ▼
                    (2) Despachado         ┌─────────┐         (5) Finalización
                ┌──────────────────────────┤  LISTO  │            (exit)
                ▼                          └─────────┘               │
         ┌─────────────┐                        ▲                    ▼
         │ EJECUTANDO  │─── (3) Expropiación ───┘              [ TERMINADO ]
         └─────────────┘                                             ▲
                │                                                    │
                │ (4) Espera E/S o evento                            │
                ▼                                                    │
         ┌─────────────┐   (6) Fin E/S / evento                      │
         │  BLOQUEADO  │─────────────────────────────────────────────┘ (si es abortado)
         └─────────────┘  ───────► vuelve a [ LISTO ]
\`\`\`

#### Eventos que generan cada transición:
1. **Nuevo → Listo:** El SO crea el proceso, le asigna memoria y su PCB (*Process Control Block*), y lo admite en la cola de listos.
2. **Listo → Ejecutando (Dispatch):** El planificador de corto plazo selecciona al proceso para darle la CPU:
   - *En Round Robin:* El proceso llega al frente de la cola FIFO de listos.
   - *En Prioridades:* El proceso es el de mayor prioridad entre todos los procesos en estado Listo.
3. **Ejecutando → Listo (Expropiación / Preemption):**
   - *En Round Robin:* **Vencimiento del quantum** (interrupción del temporizador/reloj del sistema); el proceso vuelve al final de la cola de listos.
   - *En Prioridades Apropiativo:* Llega o se desbloquea un proceso con **prioridad estrictamente mayor** que la del proceso en ejecución. *(En Prioridades No Apropiativo esta transición no ocurre por llegada de otro proceso).*
4. **Ejecutando → Bloqueado:** El proceso invoca una operación bloqueante (lectura/escritura de E/S en disco, espera de un mensaje IPC o \`wait()\` sobre un semáforo no disponible). Ocurre igual en ambos algoritmos.
5. **Bloqueado → Listo:** Finaliza la operación de E/S (interrupción de dispositivo) o se produce el evento esperado (\`signal()\` de otro proceso). En Prioridades Apropiativo, si el proceso despertado tiene mayor prioridad que el actual, dispara inmediatamente la expropiación (transición 3).
6. **Ejecutando → Terminado:** El proceso finaliza su ejecución normal (\`exit()\`) o es terminado por un error fatal o señal del SO.

---

### Resolución b) Relación entre Quantum (\`q\`) y Cambio de Contexto (\`c\`) en Round Robin

- **Quantum de tiempo (\`q\`):** Es la fracción máxima de tiempo continuo de CPU que el planificador asigna a un proceso en cada turno antes de expropiarlo y pasarlo al final de la cola de listos.
- **Tiempo de cambio de contexto (\`c\`):** Es el tiempo administrativo que consume el SO para guardar el estado completo del proceso saliente (registros, PC, puntero de pila en su PCB), actualizar estructuras de planificación y cargar el estado del proceso entrante. Durante \`c\` no se ejecuta trabajo útil de usuario.

#### Relación y compromiso de diseño (Trade-off):
La fracción de CPU perdida en sobrecarga (*overhead*) por cada turno es:

\`\`\`text
Overhead = c / (q + c)
\`\`\`

- **Si \`q\` es demasiado pequeño (comparable o menor a \`c\`):** El procesador realiza constantes cambios de contexto y desperdicia gran parte de su tiempo en tareas administrativas del kernel. Por ejemplo, si \`q = c\`, el **50% de la CPU se desperdicia** en cambios de contexto.
- **Si \`q\` es demasiado grande (\`q >> c\`):** El overhead se vuelve despreciable, pero los procesos tardan mucho en obtener su turno y **Round Robin degenera en FCFS (FIFO)**, perjudicando el tiempo de respuesta interactivo.
- **Criterio óptimo de diseño:** El quantum \`q\` debe ser **significativamente mayor que \`c\`** (típico: \`q\` entre 10 ms y 100 ms frente a \`c\` del orden de decenas de microsegundos, para mantener el overhead por debajo del 1–5%), y suficientemente amplio como para que alrededor del **80% de las ráfagas de CPU** terminen dentro de un solo quantum.`
      },
      {
        order: 3,
        instruction: 'Ejercicio 3: Operación read() sobre Archivo No Cargado vs Cargado en Memoria',
        explanation: `### Consigna
**a)** Un proceso que se encuentra en ejecución realiza una operación \`read\` sobre un archivo que aún no fue cargado en memoria. Mencione los pasos que realiza el SO e indique qué sucede con el proceso desde el momento en que solicita la lectura del archivo hasta que ésta se cumple.

**b)** ¿Cuál es la diferencia principal si el archivo está previamente cargado en memoria?

---

### Resolución a) Pasos del SO y Estado del Proceso (Archivo NO cargado en memoria)

1. **Llamada al sistema (Trap):** El proceso (en **Modo Usuario**, estado **Ejecutando**) invoca \`read(fd, buf, count)\`. La biblioteca estándar genera una instrucción de interrupción por software (*trap* / \`syscall\`).
2. **Cambio a Modo Kernel y Validación:** El hardware conmuta a **Modo Kernel**, guarda el contexto mínimo de usuario y transfiere control al manejador de llamadas al sistema del SO. El SO valida que el descriptor \`fd\` esté abierto con permiso de lectura y que el puntero \`buf\` sea válido en el espacio del proceso.
3. **Fallo en Caché de Páginas (*Cache Miss*):** El sistema de archivos verifica la *page cache* / *buffer cache* en RAM y comprueba que los bloques solicitados del archivo **no están cargados en memoria**.
4. **Resolución de bloques y solicitud al Driver:** A partir del i-nodo del archivo y el offset actual, el sistema de archivos traduce la lectura a bloques físicos del disco y envía la petición al **manejador (driver) del dispositivo de disco**.
5. **Programación de E/S (DMA):** El driver programa los registros de la controladora de disco (indicando bloque físico, cantidad y dirección destino en memoria del kernel) para iniciar la transferencia mediante **DMA (Acceso Directo a Memoria)**.
6. **Bloqueo del Proceso y Cambio de Contexto:** Como el acceso a disco es órdenes de magnitud más lento que la CPU, el SO cambia el estado del proceso solicitante de **Ejecutando → Bloqueado** (esperando finalización de E/S), guarda su contexto en su PCB y el planificador despacha otro proceso **Listo** para aprovechar la CPU.
7. **Transferencia en paralelo e Interrupción de Hardware (IRQ):** Mientras otro proceso usa la CPU, el disco transfiere los bloques directamente hacia el buffer del kernel en RAM vía DMA. Al terminar, la controladora dispara una **interrupción de hardware**.
8. **Rutina de Servicio de Interrupción (ISR) y Desbloqueo:** El SO suspende temporalmente al proceso actual, ejecuta la ISR del disco, marca la E/S como completada, deja los datos en el buffer del kernel (*page cache*) y cambia el estado del proceso original de **Bloqueado → Listo**, colocándolo en la cola de listos.
9. **Reanudación y Retorno a Modo Usuario:** Cuando el planificador vuelve a seleccionar al proceso, este pasa de **Listo → Ejecutando**, el SO copia los bytes desde el buffer del kernel al buffer \`buf\` en espacio de usuario, actualiza el puntero de posición del archivo, devuelve la cantidad de bytes leídos y retorna a **Modo Usuario**.

---

### Resolución b) Diferencia Principal si el Archivo YA está Cargado en Memoria

Si el archivo ya se encuentra en la caché de páginas del SO (*Page Cache / Buffer Cache Hit*):
- **No se realiza ninguna operación de E/S física al disco** ni se involucra al driver de disco ni a interrupciones de hardware.
- **El proceso NO pasa al estado Bloqueado** (no pierde la CPU ni se produce un cambio de contexto hacia otro proceso).
- El SO permanece en la misma llamada al sistema, realiza directamente una **copia rápida en memoria RAM** desde la caché del kernel hacia el buffer del espacio de usuario del proceso, y retorna inmediatamente a **Modo Usuario** en el orden de microsegundos.`
      },
      {
        order: 4,
        instruction: 'Ejercicio 4: Condiciones de Coffman y Problema de los 3 Filósofos (p1, p2, p3)',
        explanation: `### Consigna
**a)** Enumere y explique las condiciones necesarias para que exista interbloqueo.

**b)** Consideremos el problema de los filósofos comensales con tres filósofos \`p₁\`, \`p₂\` y \`p₃\` que utilizan tres tenedores \`f₁\`, \`f₂\` y \`f₃\`:

\`\`\`c
// Filósofo p1            // Filósofo p2            // Filósofo p3
p1() {                    p2() {                    p3() {
  while (1) {               while (1) {               while (1) {
    wait(f1);                 wait(f1);                 wait(f3);
    wait(f3);                 wait(f2);                 wait(f2);
    comer();                  comer();                  comer();
    signal(f3);               signal(f2);               signal(f2);
    signal(f1);               signal(f1);               signal(f3);
  }                         }                         }
}                         }                         }
\`\`\`

- **(a)** ¿Es posible que se produzca un interbloqueo en este sistema?
- **(b)** ¿Podría producirse un interbloqueo si se invirtiera el orden de las operaciones \`wait\` en el proceso \`p₁\`, \`p₂\` o \`p₃\`?
- **(c)** ¿Podría producirse un interbloqueo si se invirtiera el orden de las operaciones \`signal\` en el proceso \`p₁\`, \`p₂\` o \`p₃\`?

---

### Resolución a) Las 4 Condiciones Necesarias de Coffman
Para que ocurra un interbloqueo deben cumplirse **simultáneamente**:
1. **Exclusión Mutua:** Al menos un recurso debe ser no compartible (solo puede ser usado por un proceso a la vez).
2. **Retención y Espera (*Hold and Wait*):** Un proceso retiene al menos un recurso asignado mientras espera adquirir otros recursos retenidos por otros procesos.
3. **No Expropiación (*No Preemption*):** Los recursos no pueden ser arrebatados por la fuerza; solo pueden ser liberados voluntariamente por el proceso que los posee.
4. **Espera Circular (*Circular Wait*):** Existe un conjunto circular de procesos \`{P₀, P₁, ..., Pₙ}\` tal que \`P₀\` espera un recurso retenido por \`P₁\`, \`P₁\` espera uno de \`P₂\`, ..., y \`Pₙ\` espera uno retenido por \`P₀\`.

---

### Resolución b) Análisis de los 3 Filósofos

Construyamos el **Grafo de Orden de Adquisición de Recursos** (una arista \`fᵢ → fⱼ\` indica que un filósofo pide \`fᵢ\` y luego, reteniéndolo, pide \`fⱼ\`):
- \`p₁\`: \`f₁ → f₃\`
- \`p₂\`: \`f₁ → f₂\`
- \`p₃\`: \`f₃ → f₂\`

#### (a) ¿Es posible que se produzca un interbloqueo en este sistema?
**NO es posible.**
Observemos el orden de las aristas: \`f₁ → f₃ → f₂\` y \`f₁ → f₂\`. El grafo es un **DAG (Grafo Dirigido Acíclico)** porque todos los procesos solicitan sus tenedores respetando estrictamente el orden total:

\`\`\`text
f₁  <  f₃  <  f₂
\`\`\`

Al existir un ordenamiento lineal global de recursos, se invalida estructuralmente la condición de **Espera Circular**. Incluso en el peor caso, \`p₁\` y \`p₂\` compiten por \`f₁\` (solo uno lo obtiene); si \`p₃\` toma \`f₃\`, \`p₃\` pedirá \`f₂\` que está libre (porque \`p₂\` no pudo tomar \`f₁\` o ya tiene \`f₁\` y compite por \`f₂\` sin que nadie espere \`f₂\` para soltar \`f₁\`). Siempre al menos un filósofo puede comer y liberar sus tenedores.

---

#### (b) ¿Podría producirse un interbloqueo si se invirtiera el orden de los \`wait\` en \`p₁\`, \`p₂\` o \`p₃\`?
Analicemos cada caso por separado:

1. **Si se invierte SOLO en \`p₁\`** (\`wait(f3); wait(f1);\`):
   - Aristas: \`p₁: f₃ → f₁\`, \`p₂: f₁ → f₂\`, \`p₃: f₃ → f₂\`.
   - Orden topológico válido: \`f₃ < f₁ < f₂\` (acíclico).
   - **Resultado:** **NO** produce interbloqueo.

2. **Si se invierte SOLO en \`p₂\`** (\`wait(f2); wait(f1);\`):
   - Aristas: \`p₁: f₁ → f₃\`, \`p₃: f₃ → f₂\`, \`p₂: f₂ → f₁\`.
   - **¡SE FORMA UN CICLO!** \`f₁ → f₃ → f₂ → f₁\`.
   - **Traza de deadlock:** \`p₁\` ejecuta \`wait(f1)\` (toma \`f₁\`), \`p₂\` ejecuta \`wait(f2)\` (toma \`f₂\`), \`p₃\` ejecuta \`wait(f3)\` (toma \`f₃\`). Luego \`p₁\` se bloquea en \`wait(f3)\`, \`p₂\` se bloquea en \`wait(f1)\` y \`p₃\` se bloquea en \`wait(f2)\`.
   - **Resultado:** **SÍ se produce interbloqueo.**

3. **Si se invierte SOLO en \`p₃\`** (\`wait(f2); wait(f3);\`):
   - Aristas: \`p₁: f₁ → f₃\`, \`p₂: f₁ → f₂\`, \`p₃: f₂ → f₃\`.
   - Orden topológico válido: \`f₁ < f₂ < f₃\` (acíclico).
   - **Resultado:** **NO** produce interbloqueo.

*(Nota complementaria: si se invirtiera simultáneamente en \`p₁\` y \`p₃\` dejando \`p₂\` sin cambios, también se formaría el ciclo \`f₃ → f₁ → f₂ → f₃\`, provocando interbloqueo).*

---

#### (c) ¿Podría producirse un interbloqueo si se invirtiera el orden de los \`signal\` en \`p₁\`, \`p₂\` o \`p₃\`?
**NO.**
Las operaciones \`signal()\` son **no bloqueantes** y su único efecto es liberar recursos ya adquiridos. Invertir el orden en el que un filósofo suelta sus tenedores no altera el orden en que se solicitan (\`wait\`) ni puede introducir ninguna nueva arista de espera en el grafo de asignación de recursos. Como los \`wait\` mantienen el orden acíclico \`f₁ < f₃ < f₂\`, el sistema sigue garantizado **libre de interbloqueo**.`
      }
    ]
  );

  // ---------------------------------------------------------------------------
  // 2. LABORATORIO 2026 - IPC Y PROCESOS (labol2)
  // ---------------------------------------------------------------------------
  await upsertExamLesson(
    unit.id,
    'Laboratorio 2026 - IPC y Procesos (labol2)',
    `# Laboratorio — Segundo Cuatrimestre de 2026 (\`labol2\`)
**Universidad Nacional del Sur (UNS)** — Sistemas Operativos

Evaluación práctica de laboratorio enfocada en:
1. **Ejercicio 1 (ENTEROS):** Distribución del conteo por decenas de \`n\` números aleatorios (\`1 ≤ n ≤ 1000\`) entre procesos hijos mediante comunicación IPC.
2. **Ejercicio 2:** Análisis de jerarquía de procesos y salida por pantalla en un código C con bucles \`for\`, \`fork()\` y \`execlp()\`.`,
    8,
    [
      {
        order: 1,
        instruction: 'Ejercicio 1a: Elección de Herramienta IPC y Diseño de Procesos',
        explanation: `### Consigna (ENTEROS)
Un proceso padre recibe del usuario un entero \`n\` (\`1 ≤ n ≤ 1000\`), genera aleatoriamente \`n\` enteros entre \`0\` y \`99\`, los clasifica según la decena a la que pertenecen (\`0–9\`, \`10–19\`, ..., \`90–99\`) y los envía a procesos hijos para que cada uno cuente cuántos enteros de su decena fueron generados y devuelva el resultado junto con su PID al padre.

---

### 1) ¿Cuál de las herramientas de comunicación IPC considera más adecuada?

#### Herramienta elegida: **Pipes Anónimos (\`pipe()\`)**
Se utilizan **10 pipes Padre → Hijo** (uno dedicado por cada decena \`0..9\`) y **10 pipes Hijo → Padre** para retornar la estructura \`{ decena, cantidad, pid }\`.

**Justificación técnica:**
- **Relación directa padre-hijos:** Los pipes anónimos están diseñados específicamente para procesos emparentados creados con \`fork()\`, heredando los descriptores de forma natural sin crear archivos ni claves externas (\`ftok\`).
- **Sincronización y señalización de fin de datos implícita (\`EOF\`):** Cuando el padre termina de enviar los \`n\` enteros, simplemente cierra sus extremos de escritura (\`close(pipe_p2h[d][1])\`). Cada hijo detecta automáticamente el fin de flujo cuando \`read()\` devuelve \`0\` (\`EOF\`), sin necesitar mensajes centinela artificiales.
- **Limpieza automática por el SO:** Al finalizar los procesos, el kernel libera los buffers de los pipes automáticamente (sin riesgo de dejar recursos IPC huérfanos en el sistema como ocurre con colas System V si hay una terminación anormal).
- **Alternativa válida (Colas de Mensajes System V — \`msgget/msgsnd/msgrcv\`):** También resuelve el problema con una única cola usando \`mtype = decena + 1\` para filtrar por decena, pero exige enviar un mensaje centinela explícito (\`-1\`) a cada hijo y destruir manualmente la cola con \`msgctl(msqid, IPC_RMID, NULL)\`.

---

### 2) Consideraciones de diseño para la creación de procesos
1. **Cantidad exacta de hijos (10 procesos):** Al haber exactamente 10 decenas posibles para enteros en \`[0, 99]\`, se crea **1 hijo especializado por decena** (\`d = 0..9\`), logrando paralelismo limpio y responsabilidad única.
2. **Prevención de explosión exponencial de procesos (Fork Bomb):** Dentro del bucle \`for (int d = 0; d < 10; d++)\`, cada hijo (\`pid == 0\`) realiza su tarea y termina obligatoriamente con \`_exit(0)\` para no continuar iterando el bucle ni invocar nuevos \`fork()\`.
3. **Cierre estricto de descriptores no usados:** Cada hijo cierra todos los extremos de los otros 9 pares de pipes y los extremos inversos del suyo. Esto es crítico: si un solo hijo dejara abierto un extremo de escritura \`pipe_p2h[k][1]\`, el hijo \`k\` nunca recibiría \`EOF\` y el sistema quedaría en **deadlock**.
4. **Prevención de procesos Zombies:** El padre recolecta el estado de salida de los 10 hijos mediante \`waitpid(hijos[d], NULL, 0)\` antes de finalizar.
5. **Validación y semilla aleatoria:** Se valida \`1 ≤ n ≤ 1000\` y se inicializa \`srand(time(NULL) ^ getpid())\` en el padre antes de generar los enteros.`
      },
      {
        order: 2,
        instruction: 'Ejercicio 1b: Implementación Completa en C (enteros_ipc.c)',
        explanation: `### Implementación Completa Lista para Compilar y Ejecutar
El código implementa la solución con 10 procesos hijos y pipes bidireccionales dedicados, verificación de suma total y prevención de zombies y fugas de descriptores.

#### Compilación:
\`\`\`bash
gcc -Wall -Wextra -O2 -o enteros_ipc enteros_ipc.c
\`\`\`

#### Ejecución:
\`\`\`bash
./enteros_ipc
\`\`\``,
        codeSnippet: enterosCode
      },
      {
        order: 3,
        instruction: 'Ejercicio 2: Análisis de Código con fork() y execlp() (Trampa del break)',
        explanation: `### Código Analizado

\`\`\`c
int main (int argc, char *argv[]) {
    int i, j;
    pid_t pid, nuevo, nuevo1;
    for (i = 0; i < 2; i++) {
        pid = getpid();
        for (j = 0; j < i + 2; j++) {
            nuevo = fork();
            if (nuevo == 0) {
                break;
                nuevo1 = fork();
                if (nuevo1 == 0)
                    execlp("date", "date", NULL);
            }
        }
        if (pid != getpid()) {
            execlp("uptime", "uptime", "-p", NULL);
        }
    }
    return 0;
}
\`\`\`

---

### Detalle Clave (Trampa del Código): Código Inalcanzable tras \`break;\`
Dentro de \`if (nuevo == 0)\`, la **primera sentencia es \`break;\`**.
Por lo tanto, las líneas:
\`\`\`c
nuevo1 = fork();
if (nuevo1 == 0)
    execlp("date", "date", NULL);
\`\`\`
son **código muerto / inalcanzable (*dead code*)** y **NUNCA se ejecutan**.

---

### Traza Paso a Paso
Sea \`P₀\` el proceso original:

1. **Iteración \`i = 0\`:**
   - \`P₀\` guarda \`pid = PID(P₀)\`.
   - Bucle interno \`j = 0; j < 2; j++\` (**2 iteraciones**: \`j = 0, 1\`):
     - \`j = 0\`: \`P₀\` crea al hijo **\`H₁\`**. \`H₁\` entra a \`if (nuevo == 0)\`, ejecuta \`break;\`, sale del bucle \`j\`, evalúa \`if (pid != getpid())\` (**VERDADERO**, porque \`pid\` es \`PID(P₀)\` y \`getpid()\` es \`PID(H₁)\`) y ejecuta \`execlp("uptime", "uptime", "-p", NULL)\`. Al reemplazarse su imagen de proceso, **\`H₁\` termina ahí y nunca vuelve al bucle \`i\`**.
     - \`j = 1\`: \`P₀\` crea al hijo **\`H₂\`**. Ocurre exactamente lo mismo: \`H₂\` sale con \`break;\` y ejecuta \`execlp("uptime", "uptime", "-p", NULL)\`.
   - \`P₀\` termina el bucle \`j\`, evalúa \`if (pid != getpid())\` (**FALSO**) y continúa a la siguiente iteración de \`i\`.

2. **Iteración \`i = 1\`:**
   - \`P₀\` guarda \`pid = PID(P₀)\`.
   - Bucle interno \`j = 0; j < 3; j++\` (**3 iteraciones**: \`j = 0, 1, 2\`):
     - \`j = 0\`: \`P₀\` crea al hijo **\`H₃\`** → ejecuta \`uptime -p\`.
     - \`j = 1\`: \`P₀\` crea al hijo **\`H₄\`** → ejecuta \`uptime -p\`.
     - \`j = 2\`: \`P₀\` crea al hijo **\`H₅\`** → ejecuta \`uptime -p\`.
   - \`P₀\` termina el bucle \`j\`, evalúa \`if (pid != getpid())\` (**FALSO**) y sale del bucle \`i\`, finalizando con \`return 0;\`.

---

### Respuestas Finales

#### a) Número y jerarquía de procesos creados
- **Cantidad de procesos creados (nuevos):** **5 procesos** (\`H₁, H₂, H₃, H₄, H₅\`).
- **Total de procesos en el sistema (incluyendo al padre):** **6 procesos**.
- **Jerarquía:** Árbol plano de un solo nivel (todos son hijos directos de \`P₀\`; no existe ningún proceso nieto):

\`\`\`text
                    P₀ (Proceso Padre Original)
       ┌────────┬──────────┼──────────┬────────┐
       ▼        ▼          ▼          ▼        ▼
      H₁       H₂         H₃         H₄       H₅
   (i=0,j=0) (i=0,j=1) (i=1,j=0) (i=1,j=1) (i=1,j=2)
\`\`\`

#### b) Quién y qué imprime en pantalla
- **Los 5 hijos (\`H₁, H₂, H₃, H₄, H₅\`):** Cada uno reemplaza su imagen mediante \`execlp("uptime", "uptime", "-p", NULL)\` e imprime **1 línea** con el tiempo que el sistema lleva encendido en formato legible (por ejemplo: \`up 2 hours, 14 minutes\`). En total se imprimen **5 líneas** de \`uptime -p\`.
- **El proceso padre \`P₀\`:** No imprime nada.
- **Comando \`date\`:** **Nadie lo ejecuta ni lo imprime**, debido a que el \`break;\` previo vuelve inalcanzables a \`nuevo1 = fork()\` y \`execlp("date", ...)\`.`
      }
    ]
  );

  // ---------------------------------------------------------------------------
  // 3. ACTIVIDADES 5 - SINCRONIZACIÓN 2026 (sincro-t2)
  // ---------------------------------------------------------------------------
  await upsertExamLesson(
    unit.id,
    'Actividades 5 - Sincronización 2026 (sincro-t2)',
    `# Actividades 5 — Sincronización (\`sincro-t2\`)
**Universidad Nacional del Sur (UNS)** — Sistemas Operativos (Segundo Cuatrimestre de 2026)

Simulación concurrente de una empresa de viajes con dos tipos de vehículos (**auto de 4 pasajeros** y **combi de 15 pasajeros**) atendidos por **un único chofer**, utilizando hilos y semáforos POSIX, más análisis de migración a procesos.`,
    9,
    [
      {
        order: 1,
        instruction: 'Ejercicio 1: Empresa de Viajes (Auto de 4 y Combi de 15) con Hilos y Semáforos',
        explanation: `### Consigna
Una empresa de viajes ofrece dos tipos de salidas: viaje corto en **auto de 4 pasajeros**, o viaje largo en **combi de 15 pasajeros**. Implemente un código en C utilizando **hilos y semáforos** respetando:
- Existe **un solo chofer** que realiza uno u otro viaje.
- Los clientes llegan de a uno y reservan lugar en auto o combi.
- El cliente que completa el vehículo a utilizar debe avisar al chofer para comenzar el viaje.

---

### Diseño de Sincronización con Semáforos POSIX
Para garantizar ausencia total de condiciones de carrera, deadlocks y evitar que se mezcle una tanda de pasajeros con la siguiente:

| Semáforo | Valor Inicial | Función |
| :--- | :---: | :--- |
| \`cupos_auto\` / \`cupos_combi\` | \`4\` / \`15\` | Limitan la cantidad exacta de pasajeros que pueden reservar en el vehículo actual hasta que finalice su viaje. |
| \`mutex_auto\` / \`mutex_combi\` | \`1\` / \`1\` | Protegen en exclusión mutua los contadores \`cont_auto\` y \`cont_combi\`. |
| \`mutex_cola\` | \`1\` | Protege la cola FIFO \`cola_viajes\` donde el último cliente registra qué vehículo quedó listo (\`AUTO\` o \`COMBI\`). Evita sobrescritura si ambos vehículos se completan casi al mismo tiempo. |
| \`viajes_pendientes\` | \`0\` | Señalización hacia el chofer: el 4º pasajero del auto o el 15º de la combi hacen \`sem_post()\` para despertarlo. |
| \`fin_viaje_auto\` / \`fin_viaje_combi\` | \`0\` / \`0\` | Barrera de descenso: los pasajeros esperan a que el chofer concluya el recorrido. |
| \`pasajero_bajo_auto\` / \`pasajero_bajo_combi\` | \`0\` / \`0\` | Confirmación de descenso completo antes de que el chofer reponga los 4 o 15 cupos para la siguiente salida. |

#### Compilación y Ejecución:
\`\`\`bash
gcc -Wall -Wextra -pthread -O2 -o empresa_viajes empresa_viajes.c
./empresa_viajes
\`\`\``,
        codeSnippet: viajesCode
      },
      {
        order: 2,
        instruction: 'Ejercicio 2: Cambios Necesarios para Resolverlo con Procesos en Lugar de Hilos',
        explanation: `### Consigna
¿Qué cambios debería realizar para poder resolver el problema anterior utilizando **procesos** en lugar de **hilos**?

---

### Cambios Requeridos (De Hilos a Procesos)

A diferencia de los hilos (que comparten automáticamente el espacio de direcciones del proceso: variables globales, heap y semáforos), cada proceso creado con \`fork()\` posee su **propio espacio de memoria privado** (*Copy-on-Write*). Por lo tanto, se deben realizar los siguientes 5 cambios estructurales:

#### 1. Creación y recolección de entidades de ejecución
- Reemplazar \`pthread_create()\` por **\`fork()\`** (creando 1 proceso hijo para el chofer y procesos hijos para los clientes, asegurándose de terminar cada hijo con \`_exit(0)\` para no duplicar bucles).
- Reemplazar \`pthread_join()\` por **\`wait()\` / \`waitpid()\`** en el proceso padre para recolectar a todos los hijos y evitar procesos zombies.

#### 2. Ubicar el estado compartido en Memoria Compartida (IPC)
Todas las variables compartidas (\`cont_auto\`, \`cont_combi\`, \`cola_viajes[]\`, \`cola_in\`, \`cola_out\`) ya no sirven como variables globales ordinarias. Deben alojarse dentro de una estructura en un segmento de **Memoria Compartida**:
- **API POSIX:** \`shm_open()\` + \`ftruncate()\` + \`mmap(..., PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0)\`.
- *(Alternativa System V: \`shmget()\` + \`shmat()\`).*

#### 3. Semáforos compartidos entre procesos (*Inter-Process Semaphores*)
Los semáforos inicializados con \`sem_init(&s, 0, val)\` solo funcionan entre hilos del mismo proceso. Para procesos existen dos opciones POSIX:
- **Opción A — Semáforos POSIX sin nombre en memoria compartida:** Incluir los \`sem_t\` dentro de la misma \`struct\` mapeada en \`mmap(MAP_SHARED)\` e inicializarlos con el segundo argumento **\`pshared = 1\`**:
  \`\`\`c
  sem_init(&shm->cupos_auto, 1, CAP_AUTO);
  \`\`\`
- **Opción B — Semáforos POSIX con nombre:** Crearlos mediante \`sem_open("/cupos_auto", O_CREAT, 0666, CAP_AUTO)\` y liberarlos al final con \`sem_close()\` y \`sem_unlink()\`.
- *(Alternativa System V: conjuntos de semáforos con \`semget()\`, \`semop()\` y \`semctl()\`).*

#### 4. Limpieza explícita de recursos persistentes del Kernel
Los objetos IPC de procesos pueden sobrevivir al proceso si no se eliminan explícitamente. Al terminar el padre (tras los \`waitpid\`), debe invocar:
- \`sem_destroy()\` para cada semáforo en memoria compartida (o \`sem_unlink()\` si son con nombre).
- \`munmap()\` y \`shm_unlink()\` para destruir el segmento de memoria compartida.

#### 5. Compilación y enlazado
En sistemas Linux/POSIX, además de \`-pthread\`, en versiones antiguas de glibc es necesario enlazar la biblioteca de tiempo real \`-lrt\` para \`shm_open\`/\`shm_unlink\`:
\`\`\`bash
gcc -Wall -Wextra -pthread -o empresa_viajes_proc empresa_viajes_proc.c -lrt
\`\`\``,
        codeSnippet: `/* Ejemplo del cambio clave: datos y semáforos en Memoria Compartida POSIX */
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <semaphore.h>

typedef struct {
    int cont_auto;
    int cont_combi;
    int cola_viajes[4];
    int cola_in, cola_out;

    /* Semáforos dentro de la memoria compartida (se inicializan con pshared = 1) */
    sem_t cupos_auto, cupos_combi;
    sem_t mutex_auto, mutex_combi, mutex_cola;
    sem_t viajes_pendientes;
    sem_t fin_viaje_auto, fin_viaje_combi;
    sem_t pasajero_bajo_auto, pasajero_bajo_combi;
    sem_t mutex_stdout;
} EstadoCompartido;

/* En main() antes de llamar a fork(): */
int shm_fd = shm_open("/shm_empresa_viajes", O_CREAT | O_RDWR, 0666);
ftruncate(shm_fd, sizeof(EstadoCompartido));
EstadoCompartido *shm = mmap(NULL, sizeof(EstadoCompartido),
                             PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);

/* pshared = 1 permite compartir el semáforo entre procesos padre e hijos */
sem_init(&shm->cupos_auto, 1, 4);
sem_init(&shm->cupos_combi, 1, 15);
sem_init(&shm->mutex_auto, 1, 1);
/* ... resto de sem_init(&shm->..., 1, ...) ... */

/* Al finalizar (después de waitpid de chofer y clientes): */
munmap(shm, sizeof(EstadoCompartido));
close(shm_fd);
shm_unlink("/shm_empresa_viajes");`
      }
    ]
  );

  // Exportar base de datos actualizada a seed-data.json
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
  console.log(`\n✓ Archivo prisma/seed-data.json actualizado con éxito (${units.length} unidades).`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
