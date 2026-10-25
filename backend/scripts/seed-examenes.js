const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SOURCE_DIR = 'e:/_UNS/Sistemas Operativos 2026/Examenes';
const DEST_DIR = path.join(__dirname, '../../frontend/public/material/Examenes');

async function seedExamenes() {
  console.log('Iniciando sincronización de Exámenes...\n');

  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  // 1. Obtener o crear la Unidad de Exámenes
  let unitExamenes = await prisma.unit.findFirst({
    where: { title: { contains: 'Exámenes' } }
  });

  if (!unitExamenes) {
    unitExamenes = await prisma.unit.create({
      data: {
        title: 'Exámenes y Evaluaciones',
        description: 'Parciales y recuperatorios oficiales de la cátedra con resolución explicada paso a paso.',
        order: 100
      }
    });
    console.log('+ Creada Unidad "Exámenes y Evaluaciones"');
  }

  // Copiar archivos
  const files = fs.readdirSync(SOURCE_DIR);
  for (const f of files) {
    if (f.startsWith('~$') || f.endsWith('.txt')) continue;
    const src = path.join(SOURCE_DIR, f);
    const dst = path.join(DEST_DIR, f);
    fs.copyFileSync(src, dst);
    console.log(`- Copiado ${f} a public/material/Examenes`);
  }

  // Helper para crear lección de examen
  async function createExamLesson(title, content, steps, order) {
    let lesson = await prisma.lesson.findFirst({
      where: { unitId: unitExamenes.id, title: title }
    });

    if (!lesson) {
      lesson = await prisma.lesson.create({
        data: {
          unitId: unitExamenes.id,
          title: title,
          type: 'PRACTICAL_WORK',
          content: content,
          order: order
        }
      });
      console.log(`+ Creada lección de examen: ${title}`);
    } else {
      lesson = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { content: content, order: order }
      });
      console.log(`= Actualizada lección de examen: ${title}`);
    }

    // Limpiar pasos previos e insertar nuevos
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
    console.log(`  -> Insertados ${steps.length} pasos en ${title}`);
  }

  // ==========================================
  // PARCIAL 2022
  // ==========================================
  const content2022 = `### Examen Parcial 2022\n\n<iframe src="/material/Examenes/Parcial%202022.pdf" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Parcial 2022 (PDF)](/material/Examenes/Parcial%202022.pdf)`;
  const steps2022 = [
    {
      order: 1,
      instruction: 'Ejercicio 1: Modos de Operación y Relación de Algoritmos',
      explanation: '**a) Transición de Modo Usuario a Modo Kernel:**\nLos eventos que provocan la transición son:\n1. **Llamadas al Sistema (System Calls):** Solicitud voluntaria de software (ej. `read()`, `fork()`).\n2. **Interrupciones de Hardware:** Señales asincrónicas de dispositivos externos (ej. timer, teclado, disco).\n3. **Excepciones / Traps:** Eventos sincrónicos de error o condición especial (ej. división por cero, fallo de página).\n\n*Explicación detallada de una System Call:* El proceso carga los parámetros y el número de llamada en registros y ejecuta una instrucción trampa (como `syscall` o `int 0x80`). El procesador cambia el bit de modo a 0 (modo kernel), guarda el Program Counter y Stack Pointer de usuario en la pila del kernel, indexa la tabla de vectores de interrupción (IDT) y salta a la rutina del despachador del SO. Al terminar la operación, se ejecuta `sysret` / `iret` restaurando el bit de modo a 1 y reanudando el proceso.\n\n**b) Relación entre algoritmos:**\n- **Prioridad y SJF:** SJF es un caso particular de planificación por prioridad, donde la prioridad $p_i$ es inversamente proporcional a la duración de la próxima ráfaga de CPU ($p_i = 1 / \\tau_i$).\n- **Prioridad y FCFS:** FCFS es un caso particular de prioridad donde la prioridad es el orden de llegada a la cola de listos (o tiempo de espera acumulado).\n- **RR y SJF:** No tienen relación de inclusión directa. RR busca interactividad equitativa con quantums de tiempo sin conocer la duración de las ráfagas, mientras que SJF busca minimizar el tiempo medio de espera basándose estrictamente en predicciones de ráfaga.'
    },
    {
      order: 2,
      instruction: 'Ejercicio 2: Políticas de Interbloqueo y Cálculo de Estado Seguro',
      explanation: '**a) Políticas para tratamiento de interbloqueos:**\n1. *Algoritmo del Avestruz:* Ignorar el problema asumiendo que ocurre rara vez (utilizado en la mayoría de SO de propósito general).\n2. *Detección y Recuperación:* Monitorear periódicamente el estado y recuperar abortando procesos o expropiando recursos.\n3. *Evasión Dinámica (Banquero):* Asignar recursos únicamente si el estado resultante es seguro.\n4. *Prevención:* Diseñar el sistema para invalidar estructuralmente al menos una de las 4 condiciones de Coffman.\n\n**b) Cálculo del valor más pequeño de $x$ para Estado Seguro:**\n- Recursos disponibles = `[0, 0, x, 1, 1]`\n- Calculamos la matriz de Necesidad ($Need = Max - Alloc$):\n  - $Need_A = [1, 1, 2, 1, 2] - [1, 0, 2, 1, 1] = [0, 1, 0, 0, 1]$ (Requiere $R_2=1$; disponible tiene 0. No puede ejecutar primero).\n  - $Need_B = [2, 2, 2, 1, 0] - [2, 0, 1, 1, 0] = [0, 2, 1, 0, 0]$ (Requiere $R_2=2$; no puede ejecutar primero).\n  - $Need_C = [2, 1, 3, 1, 0] - [1, 1, 0, 1, 0] = [1, 0, 3, 0, 0]$ (Requiere $R_1=1$; disponible tiene 0. No puede ejecutar primero).\n  - $Need_D = [1, 1, 2, 2, 1] - [1, 1, 1, 1, 0] = [0, 0, 1, 1, 1]$\n- Para que **D** pueda ejecutar primero, debe cumplirse $Need_D \\le Disp$.\n  Observando $R_3$: $Need_D(R_3) = 1 \\le x \\implies x \\ge 1$.\n\n*Verificación con $x = 1$:*\n- $Disp = [0, 0, 1, 1, 1]$. $D$ ejecuta, termina y libera `Alloc_D [1, 1, 1, 1, 0]` $\\implies$ Nuevo Disp = `[1, 1, 2, 2, 1]`.\n- Ahora $Need_A = [0, 1, 0, 0, 1] \\le Disp \\implies A$ ejecuta y termina $\\implies$ Disp = `[2, 1, 4, 3, 2]`.\n- Ahora $Need_C = [1, 0, 3, 0, 0] \\le Disp \\implies C$ ejecuta y termina $\\implies$ Disp = `[3, 2, 4, 4, 2]`.\n- Finalmente $Need_B = [0, 2, 1, 0, 0] \\le Disp \\implies B$ termina.\n\n**Respuesta:** El valor más pequeño es **$x = 1$** (Secuencia segura: $\\langle D, A, C, B \\rangle$).'
    },
    {
      order: 3,
      instruction: 'Ejercicio 3: Diagrama de Estados e Inversión de Prioridades',
      explanation: '**a) Diagrama de Estados:**\n- *Estados:* Nuevo, Listo, Ejecución, Bloqueado, Terminado.\n- *Transiciones:* Admitir (Nuevo $\\to$ Listo), Despachar (Listo $\\to$ Ejecución), Interrupción/Quantum (Ejecución $\\to$ Listo), Espera de E/S o evento (Ejecución $\\to$ Bloqueado), Fin de E/S o evento (Bloqueado $\\to$ Listo), Salida (Ejecución $\\to$ Terminado).\n\n**b) Inversión de prioridades (p0 < p1 < p2 < p3):**\n- p0 llega en $t=0$, adquiere el semáforo $s$ en $t=1$.\n- p1 llega en $t=2$ y expulsa a p0 por tener mayor prioridad.\n- p2 llega en $t=4$ y expulsa a p1.\n- p3 (máxima prioridad) llega en $t=7$, intenta hacer $P(s)$ y se **bloquea** porque p0 retiene $s$.\n\n**1) Sin herencia de prioridades:** Ocurre la inversión de prioridades. Como p0 tiene menor prioridad que p2 y p1, p2 y p1 continúan ejecutando mientras p3 (el más prioritario del sistema) queda bloqueado esperando a que los procesos de prioridad media terminen para que recién p0 pueda ejecutar y liberar $s$.\n\n**2) Con herencia de prioridades:** En $t=7$, al bloquearse p3 sobre $s$, p0 **hereda temporalmente la prioridad máxima de p3**. Esto le permite a p0 expulsar a p2 de la CPU, ejecutar sus 2 unidades de tiempo restantes, invocar $V(s)$ en $t=9$, recuperar su prioridad baja original y ceder inmediatamente la CPU a p3, eliminando el retraso indebido provocado por p1 y p2.'
    },
    {
      order: 4,
      instruction: 'Ejercicio 4: Grafo de Precedencia Cíclico con Mínimos Semáforos',
      explanation: '**Grafo:** $I \\to p1 \\to \\{p2, p3, p4 \\to p5\\} \\to p6 \\to I$\n\nSe requiere sincronizar para que cicle indefinidamente con la menor cantidad de semáforos:\n\n```c\nsemaphore s_I = 1;  // Permite iniciar la primera iteración\nsemaphore s_p1 = 0, s_p5 = 0, s_fin = 0;\nint contador = 0;\nsemaphore mutex = 1;\n\n// Proceso I\nwhile(1) {\n    wait(s_I);\n    ejecutar_I();\n    signal(s_p1);\n}\n\n// Proceso p1\nwhile(1) {\n    wait(s_p1);\n    ejecutar_p1();\n    signal(s_p2); signal(s_p3); signal(s_p4);\n}\n\n// Procesos concurrentes p2, p3 y rama p4->p5 que convergen en p6\n// Al terminar p6, hace signal(s_I) cerrando el ciclo.\n```'
    }
  ];
  await createExamLesson('Parcial 2022', content2022, steps2022, 1);

  // ==========================================
  // PARCIAL 2023
  // ==========================================
  const content2023 = `### Examen Parcial 2023\n\n<iframe src="/material/Examenes/Parcial%202023.pdf" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Parcial 2023 (PDF)](/material/Examenes/Parcial%202023.pdf)`;
  const steps2023 = [
    {
      order: 1,
      instruction: 'Ejercicio 1: Problema Lector-Escritor',
      explanation: '**a) Rol de cada semáforo:**\n- `m1` y `m2`: Semáforos de exclusión mutua para proteger los contadores de lectores (`nr`) y escritores (`nw`) respectivamente.\n- `m3`: Semáforo torniquete (*turnstile*) para forzar el paso ordenado de lectores y evitar que los lectores monopolicen la entrada cuando hay escritores esperando.\n- `read`: Semáforo que utilizan los escritores para indicar que hay escritores activos o en cola, bloqueando la llegada de nuevos lectores.\n- `write`: Semáforo que garantiza la exclusión mutua directa para la escritura del recurso compartido.\n\n**b) Valor de cada semáforo en las secciones críticas:**\n- Cuando hay **Lectores leyendo:** `write = 0` (bloquea a cualquier escritor), `read = 1`, `m1 = 1`, `m2 = 1`, `m3 = 1`.\n- Cuando hay un **Escritor escribiendo:** `write = 0`, `read = 0` (los lectores no pueden avanzar de `wait(read)`), `m1 = 1`, `m2 = 1`, `m3 = 1`.\n\n**c) ¿A quién favorece la solución?**\nFavorece a los **Escritores**. Apenas un escritor entra a competir (`wait(read)`), impide que nuevos lectores adquieran el semáforo `read`, drenando a los lectores actuales y otorgando el paso prioritario al escritor.'
    },
    {
      order: 2,
      instruction: 'Ejercicio 2: Hilos a Nivel Usuario (ULT) vs Kernel (KLT)',
      explanation: '**a) Dos diferencias principales:**\n1. *Gestión y Estructuras:* Los ULT son gestionados íntegramente por una biblioteca en espacio de usuario (mediante un hilo/proceso kernel). Los KLT son creados, planificados y gestionados directamente por el kernel del SO.\n2. *Bloqueo por E/S:* En ULT, si un hilo hace una llamada bloqueante al sistema, el kernel bloquea al proceso completo. En KLT, el kernel solo bloquea al hilo específico y puede seguir ejecutando los demás hilos.\n\n**b) Concurrencia en Monoprocesador vs Multiprocesador:**\n- *Monoprocesador:* Ambos ofrecen concurrencia lógica. Sin embargo, ULT tiene ventaja de velocidad en cambios de contexto ya que no requiere conmutar a modo kernel.\n- *Multiprocesador:* Los ULT **no pueden aprovechar múltiples núcleos físicos** simultáneamente (todos corren sobre el mismo proceso kernel asignado). Los KLT **sí alcanzan verdadero paralelismo físico**, distribuyendo los hilos entre los distintos núcleos de la CPU.\n\n**c) Acciones para cambio de contexto entre KLT:**\n1. Salvar registros del procesador (PC, SP, registros generales) en el TCB (Thread Control Block) del hilo actual en el kernel.\n2. Actualizar el estado del hilo a Listo o Bloqueado.\n3. Ejecutar el planificador del kernel para elegir el próximo hilo a ejecutar.\n4. Conmutar a la pila de kernel del nuevo hilo y restaurar sus registros desde su TCB.\n*(Nota: A diferencia de un cambio de proceso, NO es necesario conmutar las tablas de páginas ni vaciar la TLB, ya que los hilos del mismo proceso comparten el mismo espacio de direcciones virtuales).*'
    },
    {
      order: 3,
      instruction: 'Ejercicio 3: Algoritmo de Detección de Deadlock',
      explanation: '**Datos:** $E = [2, 4, 1, 4, 4]$.\n- Suma Alocada = $[0, 1, 1, 1, 2] + [0, 1, 0, 1, 0] + [0, 0, 0, 0, 1] + [2, 1, 0, 0, 0] = [2, 3, 1, 2, 3]$.\n- Vector Disponible = $E - \\text{Alloc} = [2, 4, 1, 4, 4] - [2, 3, 1, 2, 3] = [0, 1, 0, 2, 1]$.\n\n**a) Ejecución del Algoritmo de Detección:**\n1. Evaluamos procesos no marcados cuya solicitud $\\le Disp$:\n   - $Req_2 = [0, 1, 0, 2, 1] \\le [0, 1, 0, 2, 1] \\implies \\mathbf{P_2}$ **puede terminar.**\n   - Al terminar $P_2$, libera $Alloc_2 [0, 1, 0, 1, 0] \\implies Disp = [0, 2, 0, 3, 1]$.\n2. Con nuevo $Disp = [0, 2, 0, 3, 1]$:\n   - $Req_3 = [0, 2, 0, 3, 1] \\le [0, 2, 0, 3, 1] \\implies \\mathbf{P_3}$ **puede terminar.**\n   - Al terminar $P_3$, libera $Alloc_3 [0, 0, 0, 0, 1] \\implies Disp = [0, 2, 0, 3, 2]$.\n3. Verificamos los procesos restantes ($P_1$ y $P_4$):\n   - $Req_1 = [1, 1, 0, 2, 1]$ (Requiere $R_1=1$, pero $Disp(R_1) = 0$). No puede terminar.\n   - $Req_4 = [0, 2, 1, 1, 0]$ (Requiere $R_3=1$, pero $Disp(R_3) = 0$). No puede terminar.\n\n**Conclusión:** Se detecta un **Interbloqueo (Deadlock)**. Los procesos interbloqueados son **$\\{P_1, P_4\\}$**.\n\n**b) Estrategias de recuperación:**\n1. *Abortar procesos:* Abortar $P_1$ o $P_4$ para liberar sus recursos y permitir que el otro termine.\n2. *Expropiación de recursos con Rollback:* Quitar recursos a $P_1$ o $P_4$ y revertir su ejecución a un punto de control previo.'
    },
    {
      order: 4,
      instruction: 'Ejercicio 4: Planificación Monoprocesador y Tiempo Real (RM y EDF)',
      explanation: '**a) Eventos y funciones en RR y Prioridades:**\n- *Round Robin:* Evento principal es la interrupción periódica del reloj (timer). La rutina atiende la expiración del quantum, pasa el proceso al final de la cola FIFO y despacha al siguiente.\n- *Prioridades:* Eventos de llegada de procesos o cambio de estado. Si es apropiativo, compara la prioridad del nuevo proceso con el actual y ejecuta un cambio de contexto inmediato si la del nuevo es superior.\n\n**b) Sistema de Tiempo Real:**\n- 2 tareas de voz: $C_1 = 1$ ms, $T_1 = 5$ ms. $C_2 = 1$ ms, $T_2 = 5$ ms.\n- 1 tarea de video: $C_3 = 11$ ms, $T_3 = 33$ ms.\n\n*1. Cálculo de Utilización de CPU ($U$):*\n$$U = \\frac{1}{5} + \\frac{1}{5} + \\frac{11}{33} = 0.20 + 0.20 + 0.3333 = 0.7333 \\quad (73.33\\%)$$\n\n- **Con EDF:** La condición necesaria y suficiente es $U \\le 1$. Como $0.7333 \\le 1$, **SÍ es planificable con EDF**.\n- **Con RM:** Cota de Liu & Layland para $n=3$:\n  $$U_{bound} = 3 \\cdot (2^{1/3} - 1) \\approx 0.7798$$\n  Como $U = 0.7333 \\le 0.7798$, se cumple la cota suficiente: **SÍ es planificable con RM**.\n\n*2. ¿Puede incorporar otra secuencia de voz ($C_4 = 1$ ms, $T_4 = 5$ ms)?*\n$$U_{nuevo} = 0.7333 + \\frac{1}{5} = 0.9333$$\n- **Con EDF:** $0.9333 \\le 1$, por lo que **SÍ se puede incorporar** y seguirá cumpliendo todos los deadlines.\n- **Con RM:** La cota para $n=4$ es $4 \\cdot (2^{1/4} - 1) \\approx 0.7568$. Como $0.9333 > 0.7568$, no se asegura por cota y mediante análisis de tiempo de respuesta (RTA) se verifica si el video de 11 ms logra terminar dentro de sus 33 ms.'
    }
  ];
  await createExamLesson('Parcial 2023', content2023, steps2023, 2);

  // ==========================================
  // PARCIAL 2024
  // ==========================================
  const content2024 = `### Examen Parcial 2024\n\n<iframe src="/material/Examenes/Parcial%202024.pdf" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Parcial 2024 (PDF)](/material/Examenes/Parcial%202024.pdf)`;
  const steps2024 = [
    {
      order: 1,
      instruction: 'Ejercicio 1: Diagrama de 5 Estados e Inversión de Prioridades',
      explanation: '**a) Diagrama de 5 Estados:**\n- Estados: *Nuevo (New), Listo (Ready), Ejecución (Running), Bloqueado (Waiting/Blocked), Terminado (Terminated)*.\n- Transiciones: Admisor (Nuevo $\\to$ Listo), Scheduler Dispatch (Listo $\\to$ Ejecución), Expiración de Timer o apropiación (Ejecución $\\to$ Listo), Solicitud de E/S o evento (Ejecución $\\to$ Bloqueado), Ocurrencia del evento/E/S (Bloqueado $\\to$ Listo), Exit (Ejecución $\\to$ Terminado).\n\n**b) El Problema de Inversión de Prioridades:**\nOcurre cuando un proceso de prioridad alta ($P_{alta}$) se ve indirectamente demorado por procesos de prioridad intermedia ($P_{media}$), debido a que un proceso de prioridad baja ($P_{baja}$) retiene un recurso exclusivo que $P_{alta}$ necesita.\n\n*Ejemplo clásico:* \n1. $P_{baja}$ está en Ejecución y adquiere un cerrojo mutex $M$.\n2. $P_{alta}$ pasa a Listo y expulsa a $P_{baja}$.\n3. $P_{alta}$ intenta adquirir $M$; como está ocupado, pasa a **Bloqueado**.\n4. $P_{baja}$ retoma la CPU para liberar $M$, pero antes de lograrlo, llega un proceso $P_{media}$ que no usa el recurso $M$.\n5. Como $Prioridad(P_{media}) > Prioridad(P_{baja})$, $P_{media}$ expulsa a $P_{baja}$ y se queda con la CPU.\n6. **Inversión:** $P_{media}$ ejecuta libremente mientras $P_{alta}$ está atrapado esperando a $P_{baja}$.\n*Solución:* Protocolo de Herencia de Prioridad (Priority Inheritance Protocol).'
    },
    {
      order: 2,
      instruction: 'Ejercicio 2: Condiciones de Coffman, Estrategias e Inanición',
      explanation: '**a) Condiciones necesarias para Interbloqueo (Condiciones de Coffman):**\n1. **Exclusión Mutua:** Al menos un recurso se comparte de forma no distribuible (solo un proceso a la vez).\n2. **Retención y Espera (Hold and Wait):** Un proceso retiene recursos mientras espera obtener otros adicionales.\n3. **No Expropiación (No Preemption):** Los recursos no pueden ser quitados por la fuerza; solo el proceso que los tiene los puede liberar voluntariamente.\n4. **Espera Circular:** Existe una cadena cerrada de procesos $\\{P_0, P_1, \\dots, P_n\\}$ donde cada uno espera un recurso retenido por el siguiente.\n\n**b) Estrategias para tratar interbloqueos:**\n- *Avestruz:* No hacer nada.\n- *Detección y Recuperación:* Dejar que ocurra, detectarlo y resolverlo (abortar o expropiar).\n- *Evasión:* Usar información previa de máximos requerimientos y el Algoritmo del Banquero.\n- *Prevención:* Negar a priori alguna de las 4 condiciones de Coffman.\n\n**c) Deadlock vs Inanición en los Filósofos:**\n- *Deadlock:* Todos los filósofos toman su tenedor izquierdo simultáneamente. Todos quedan bloqueados esperando el derecho. Ninguno come jamás ni el sistema avanza.\n- *Inanición:* La solución evita el deadlock, pero dos filósofos rápidos comen de forma alternada impidiendo que el filósofo del medio pueda conseguir ambos tenedores a la vez.'
    },
    {
      order: 3,
      instruction: 'Ejercicio 3: Planificación de Tiempo Real (P1, P2, P3)',
      explanation: '**Procesos independientes:**\n- $P_1$: Período $T_1 = 10$ ms, Servicio $C_1 = 3$ ms.\n- $P_2$: Período $T_2 = 15$ ms, Servicio $C_2 = 5$ ms.\n- $P_3$: Período $T_3 = 30$ ms, Servicio $C_3 = 9$ ms.\n\n*1. Factor de Utilización ($U$):*\n$$U = \\frac{3}{10} + \\frac{5}{15} + \\frac{9}{30} = 0.30 + 0.3333 + 0.30 = 0.9333 \\quad (93.33\\%)$$\n\n*2. Evaluación con EDF (Earliest Deadline First):*\n- En tareas periódicas con deadline igual al período ($D_i = T_i$), la condición necesaria y suficiente es $U \\le 1$.\n- Como $0.9333 \\le 1.0$, **SÍ es planificable con EDF**.\n\n*3. Evaluación con RM (Rate Monotonic):*\n- Cota de Liu & Layland ($n=3$): $3 \\cdot (2^{1/3}-1) \\approx 0.7798$.\n- Como $U = 0.9333 > 0.7798$, la cota no garantiza planificabilidad directa. Debemos aplicar el **Análisis de Tiempo de Respuesta (RTA)** asignando prioridades por período (Prioridad: $P_1 > P_2 > P_3$):\n  - $R_1 = C_1 = 3 \\le 10$ (Cumple plazo).\n  - $R_2 = 5 + \\lceil 5/10 \\rceil \\cdot 3 = 8 \\implies 5 + \\lceil 8/10 \\rceil \\cdot 3 = 8 \\le 15$ (Cumple plazo).\n  - $R_3^{(0)} = 9$\n  - $R_3^{(1)} = 9 + \\lceil 9/10 \\rceil \\cdot 3 + \\lceil 9/15 \\rceil \\cdot 5 = 9 + 3 + 5 = 17$\n  - $R_3^{(2)} = 9 + \\lceil 17/10 \\rceil \\cdot 3 + \\lceil 17/15 \\rceil \\cdot 5 = 9 + 6 + 10 = 25$\n  - $R_3^{(3)} = 9 + \\lceil 25/10 \\rceil \\cdot 3 + \\lceil 25/15 \\rceil \\cdot 5 = 9 + 9 + 10 = 28$\n  - $R_3^{(4)} = 9 + \\lceil 28/10 \\rceil \\cdot 3 + \\lceil 28/15 \\rceil \\cdot 5 = 9 + 9 + 10 = 28 \\le 30$ (Cumple plazo).\n\n**Conclusión:** Todos los procesos completan antes de su plazo. **También SÍ es planificable con RM**.'
    },
    {
      order: 4,
      instruction: 'Ejercicio 4: Condición de Carrera en Alocación de Procesos',
      explanation: '**a) Identificación de la Condición de Carrera:**\nLa variable compartida `numprocesses` es leída y modificada concurrentemente por `allocate_process()` y `release_process()`. Las operaciones `++numprocesses` y `--numprocesses` constan de 3 instrucciones máquina (Lectura, Modificación, Escritura). Si dos procesos ejecutan estas funciones a la vez, se produce una condición de carrera: una actualización puede sobreescribir a la otra o superar el límite `MAX_PROCESSES`.\n\n**b) Solución con Mutex:**\n```c\nmutex_t m;\n\nint allocate_process() {\n    int new_pid = -1;\n    mutex_lock(&m);\n    if (numprocesses < MAX_PROCESSES) {\n        /* alocar recursos */\n        ++numprocesses;\n        new_pid = obtener_pid();\n    }\n    mutex_unlock(&m);\n    return new_pid;\n}\n\nvoid release_process() {\n    mutex_lock(&m);\n    /* liberar recursos */\n    --numprocesses;\n    mutex_unlock(&m);\n}\n```\n\n**c) Metodología para evitar la variable entera compartida:**\nSe puede utilizar un **Semáforo Contador** inicializado en `MAX_PROCESSES` (`sem_t sem_procesos`).\n- En `allocate_process()`: se invoca `sem_trywait(&sem_procesos)`. Si retorna éxito, hay cupo disponible.\n- En `release_process()`: se invoca `sem_post(&sem_procesos)`.'
    }
  ];
  await createExamLesson('Parcial 2024', content2024, steps2024, 3);

  // ==========================================
  // PARCIAL 2025
  // ==========================================
  const content2025 = `### Examen Parcial 2025\n\n> [!NOTE]\n> Examen recuperado del archivo oficial \`Parcial 2025.docx\` de la cátedra.\n\n#### Enunciados de la Evaluación:\n\n* **Ejercicio 1:**\n  * a) Comparación entre hilos de usuario (ULT) e hilos de kernel (KLT) respecto a planificación, sincronización y cambio de contexto.\n  * b) Modos de operación (Usuario y Kernel) y acciones del SO al ejecutar \`read()\` sobre disco.\n* **Ejercicio 2:**\n  * Diagrama de tiempos con planificación por prioridades apropiativas con y sin herencia de prioridades (Procesos A, B y C compartiendo recurso).\n  * Problema de espera ocupada con spinlocks en prioridades.\n* **Ejercicio 3:**\n  * Sistemas de tiempo real: definición y criterios de aceptación para RM y EDF.\n* **Ejercicio 4:**\n  * Algoritmo del Banquero con existencias (7, 7, 10), matrices de asignación y máximos, y evaluación de solicitudes de P1, P2 y P3.\n\n<br/>[📥 Descargar Archivo Original (Parcial 2025.docx)](/material/Examenes/Parcial%202025.docx)`;

  const steps2025 = [
    {
      order: 1,
      instruction: 'Ejercicio 1: ULT vs KLT y Operación read() en Disco',
      explanation: '**a) Comparación ULT vs KLT:**\n- **Planificación:** Los ULT son planificados por una biblioteca en espacio de usuario sin conocimiento del SO; los KLT son planificados directamente por el Scheduler del kernel en los núcleos disponibles.\n- **Sincronización:** En ULT la sincronización es interna de la biblioteca (no causa cambio a modo kernel). En KLT se usan primitivas del sistema, permitiendo sincronizar hilos de diferentes procesos o hilos de kernel.\n- **Cambio de contexto:** En ULT es ultrarrápido (solo guarda registros de CPU en espacio de usuario). En KLT requiere una trampa a modo kernel, guardado del TCB y cambio de pila de kernel.\n\n**b) Modos de operación y llamada `read()`:**\n- **Modos:** Modo Usuario (bit de modo en 1, instrucciones privilegiadas deshabilitadas) y Modo Kernel (bit de modo en 0, acceso total al hardware). Soportados por hardware en el procesador.\n- **Acciones del SO al ejecutar `read()`:**\n  1. La biblioteca ejecuta la instrucción trampa (`syscall`) pasando el file descriptor y buffer.\n  2. El CPU pasa a modo kernel, valida los parámetros y verifica permisos.\n  3. El subsistema de archivos determina los bloques físicos de disco necesarios.\n  4. El SO solicita al driver del disco la lectura mediante DMA.\n  5. Como la E/S es lenta, el SO cambia el estado del proceso de **Ejecución a Bloqueado** y despacha a otro proceso.\n  6. Al finalizar la lectura física, el controlador de disco emite una interrupción de hardware.\n  7. La rutina de interrupción copia los datos al buffer del proceso, mueve el proceso a la cola de **Listos** y eventualmente reanuda su ejecución en modo usuario.'
    },
    {
      order: 2,
      instruction: 'Ejercicio 2: Inversión de Prioridades y Spinlocks',
      explanation: '**Datos del problema:**\n- Proceso A: CPU 8 ms, Recurso compartido (Baja, 1). Llega en $t=0$, usa recurso entre $t=1$ y $t=6$.\n- Proceso B: CPU 6 ms, Independiente (Media, 2). Llega en $t=2$.\n- Proceso C: CPU 6 ms, Recurso compartido (Alta, 3). Llega en $t=3$, usa recurso entre $t=1$ y $t=4$.\n\n**1) Planificación por prioridades apropiativas SIN herencia:**\n- En $t=0$: Ejecuta A. En $t=1$ toma el recurso compartido.\n- En $t=2$: Llega B (prioridad 2 > 1) y **expulsa a A**.\n- En $t=3$: Llega C (prioridad 3 > 2) y expulsa a B.\n- En $t=4$: C solicita el recurso compartido, pero lo tiene A $\\implies$ **C se bloquea**.\n- ¿Quién toma la CPU? Como A tiene prioridad 1 y B prioridad 2, **¡toma la CPU el proceso B!**\n- B ejecuta hasta $t=9$ y termina. Recién ahí ejecuta A para liberar el recurso en $t=14$, y recién entonces C puede ejecutar.\n- **Inconveniente:** Inversión de prioridades no acotada (el proceso de prioridad media B demoró al proceso de prioridad alta C).\n\n**2) Con Herencia de Prioridades:**\n- En $t=4$, cuando C se bloquea, A hereda temporalmente la prioridad Alta (3).\n- Esto evita que B tome la CPU. A continúa ejecutando con prioridad 3 hasta liberar el recurso, momento en el cual C se desbloquea y toma la CPU inmediatamente.\n\n**3) ¿Qué ocurre si la espera se implementa con spinlocks?**\n- Ocurre un **bloqueo mutuo catastrófico**: Si C hace espera ocupada (bucle `while`), como su prioridad (3) es mayor que la de A (1), C nunca suelta la CPU y A jamás podrá ejecutar para liberar el recurso. El sistema se congela.'
    },
    {
      order: 3,
      instruction: 'Ejercicio 3: Sistemas de Tiempo Real (RM y EDF)',
      explanation: '**Definición:**\nUn sistema de tiempo real es aquel cuya corrección lógica depende no solo de la exactitud de los resultados computacionales, sino también del **instante de tiempo** en el cual se entregan dichos resultados (cumplimiento estricto de *Deadlines*).\n- *Hard Real-Time:* La violación de un plazo se considera un fallo catastrófico del sistema.\n- *Soft Real-Time:* Tolera pérdidas ocasionales de plazo con degradación de calidad.\n\n**Criterios de Aceptación y Planificación:**\n\n1. **Rate Monotonic (RM):**\n- *Algoritmo estático:* Asigna prioridades fijas inversamente proporcionales al período ($T_i$). Tareas con períodos más cortos tienen mayor prioridad.\n- *Criterio de aceptación (Cota de Liu & Layland):*\n  $$U = \\sum_{i=1}^n \\frac{C_i}{T_i} \\le n(2^{1/n} - 1)$$\n  Para $n \\to \\infty$, la cota tiende a $\\approx 0.693$.\n\n2. **Earliest Deadline First (EDF):**\n- *Algoritmo dinámico:* Asigna prioridades dinámicamente; la tarea cuyo plazo más próximo venza tiene la máxima prioridad en cada instante.\n- *Criterio de aceptación:* Es un algoritmo óptimo. Un conjunto de tareas periódicas es planificable si y solo si:\n  $$U = \\sum_{i=1}^n \\frac{C_i}{T_i} \\le 1.0 \\quad (100\\%\\text{ de la CPU})$$'
    },
    {
      order: 4,
      instruction: 'Ejercicio 4: Algoritmo del Banquero con Existencias (7, 7, 10)',
      explanation: '**Datos:** Existencias $E = [7, 7, 10]$.\n- Asignación actual: $P_1 = [2, 2, 3]$, $P_2 = [2, 0, 3]$, $P_3 = [1, 2, 3]$.\n- Suma asignada = $[5, 4, 9] \\implies$ **Disponible = $[2, 3, 1]$**.\n- Máximos: $P_1 = [3, 6, 8]$, $P_2 = [4, 3, 3]$, $P_3 = [3, 4, 4]$.\n- **Matriz Need ($Max - Alloc$):**\n  - $Need_1 = [1, 4, 5]$\n  - $Need_2 = [2, 3, 0]$\n  - $Need_3 = [2, 2, 1]$\n\n**1. ¿Es el estado actual seguro?**\n**SÍ.** Con $Disp = [2, 3, 1]$:\n- $Need_2 = [2, 3, 0] \\le [2, 3, 1] \\implies P_2$ termina y libera $[2, 0, 3] \\implies Disp = [4, 3, 4]$.\n- $Need_3 = [2, 2, 1] \\le [4, 3, 4] \\implies P_3$ termina y libera $[1, 2, 3] \\implies Disp = [5, 5, 7]$.\n- $Need_1 = [1, 4, 5] \\le [5, 5, 7] \\implies P_1$ termina.\n*Secuencia segura:* $\\langle P_2, P_3, P_1 \\rangle$.\n\n**2. Evaluación de las solicitudes:**\n- **$P_1$ solicita `(1, 1, 0)`:** Si se asigna, el nuevo Disponible sería $[2, 3, 1] - [1, 1, 0] = [1, 2, 1]$. \n  Verificamos necesidades: $Need_1=[0, 3, 5]$, $Need_2=[2, 3, 0]$, $Need_3=[2, 2, 1]$. ¡Ningún proceso puede satisfacer su necesidad con $[1, 2, 1]$! El estado es **inseguro**. $\\implies$ **NO puede concederse**.\n- **$P_3$ solicita `(0, 1, 0)`:** Si se asigna, nuevo Disponible = $[2, 2, 1]$ y $Need_3 = [2, 1, 1] \\le [2, 2, 1] \\implies P_3$ termina primero, luego $P_2$, luego $P_1$. El estado es **seguro**. $\\implies$ **SÍ puede concederse**.\n- **$P_2$ solicita `(0, 1, 0)`:** Si se asigna, nuevo Disponible = $[2, 2, 1]$ y $Need_2 = [2, 2, 0] \\le [2, 2, 1] \\implies P_2$ termina primero, luego $P_3$, luego $P_1$. El estado es **seguro**. $\\implies$ **SÍ puede concederse**.'
    }
  ];
  await createExamLesson('Parcial 2025', content2025, steps2025, 4);

  // ==========================================
  // RECUPERATORIO 2025
  // ==========================================
  const contentRecup2025 = `### Examen Recuperatorio 2025\n\n<iframe src="/material/Examenes/Recuperatorio%202025.pdf" width="100%" height="700px" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;"></iframe>\n\n<br/>[📥 Descargar Recuperatorio 2025 (PDF)](/material/Examenes/Recuperatorio%202025.pdf)`;
  const stepsRecup2025 = [
    {
      order: 1,
      instruction: 'Ejercicio 1: IPC, Microkernel e Interacción FS/TD',
      explanation: '**a) Modelos de comunicación entre procesos (IPC):**\n1. *Memoria Compartida:* Los procesos mapean una misma región de memoria física. **Ventajas:** Máxima velocidad (la comunicación ocurre a velocidad de memoria sin intervención del kernel). **Desventajas:** La sincronización (evitar colisiones y condiciones de carrera) recae enteramente en el programador.\n2. *Paso de Mensajes (Message Passing):* Se comunican mediante primitivas `send()` y `receive()`. **Ventajas:** Muy seguro y estructurado; funciona en sistemas distribuidos y multicore sin memoria compartida. **Desventajas:** Menor rendimiento por el overhead de copias de memoria y llamadas al kernel.\n\n**b) Definición de Microkernel:**\nArquitectura que minimiza el código en modo kernel al mínimo indispensable (gestión básica de memoria virtual, planificación elemental de hilos y comunicación IPC). Todos los demás servicios (sistemas de archivos, drivers, red) corren como procesos servidores en espacio de usuario.\n- *Comparación:* Frente a kernels monolíticos, ofrece mayor robustez (si un driver falla, solo se reinicia ese proceso y el kernel sigue vivo), pero tiene menor rendimiento por los continuos cambios de contexto para IPC.\n\n**c) Interacción Aplicación - SO - FS - TD para abrir/leer un archivo:**\n1. La Aplicación envía un mensaje IPC al servidor **FS** solicitando `read()`.\n2. El Microkernel (**SO**) realiza el cambio de contexto y entrega el mensaje al proceso **FS**.\n3. El proceso **FS** procesa la solicitud lógica, traduce el archivo a bloques físicos de disco y envía un mensaje IPC al proceso **TD** (Tarea de Disco).\n4. El proceso **TD** programa el hardware del disco (o interactúa con el puerto I/O autorizado) para transferir los sectores.\n5. Al concluir la lectura, **TD** envía un mensaje de respuesta a **FS**, y **FS** envía el resultado a la **Aplicación** a través del Microkernel.'
    },
    {
      order: 2,
      instruction: 'Ejercicio 2: Tratamiento de Interbloqueos y Filósofos',
      explanation: '**a) Métodos para el tratamiento de interbloqueos:**\n1. *Prevención:* Negar a priori una de las 4 condiciones de Coffman.\n2. *Evasión:* Algoritmo del Banquero en cada solicitud dinámica.\n3. *Detección y Recuperación:* Dejar operar libremente y resolver con abortos o rollback si se detecta un ciclo.\n4. *Avestruz:* Ignorar el problema.\n\n**b) Condiciones de interbloqueo en los Filósofos y cómo evitar cada una:**\n- **1. Exclusión Mutua:** Un tenedor solo puede ser usado por un filósofo a la vez. *Evitarla:* Físicamente imposible en este problema (dos personas no pueden sostener el mismo tenedor a la vez).\n- **2. Retención y Espera (Hold and Wait):** Un filósofo toma un tenedor y espera por el otro. *Evitarla:* Exigir que el filósofo tome **ambos tenedores a la vez en una sección crítica atómica**; si alguno no está disponible, no toma ninguno.\n- **3. No Expropiación:** Nadie le quita el tenedor a un filósofo comiendo. *Evitarla:* Si un filósofo retiene un tenedor y el otro está ocupado por más de $T$ tiempo, debe soltar su tenedor y volver a pensar.\n- **4. Espera Circular:** Filósofo $i$ espera el tenedor de $i+1$, formando un anillo cerrado. *Evitarla:* **Romper la asimetría:** hacer que los filósofos pares tomen primero el izquierdo y los impares primero el derecho, o permitir un máximo de $N-1$ filósofos sentados simultáneamente en la mesa.'
    },
    {
      order: 3,
      instruction: 'Ejercicio 3: Sección Crítica y Comparativa de Estrategias',
      explanation: '**a) Sección Crítica:**\nEs la porción de código de un proceso donde se accede y manipula un recurso compartido (variables, archivos, estructuras de datos). Debe protegerse para garantizar la **consistencia de los datos** y evitar condiciones de carrera (Race Conditions).\n\n**b) Comparativa de Estrategias (Monoprocesador vs Multiprocesador):**\n\n1. **Deshabilitar Interrupciones:**\n- *Monoprocesador:* Muy eficiente y simple para el kernel; garantiza que ningún otro proceso pueda ser planificado.\n- *Multiprocesador:* Inútil y desaconsejado; solo deshabilita las interrupciones del núcleo local, los demás núcleos siguen corriendo y accediendo a memoria.\n\n2. **Spinlocks (Espera Ocupada con instrucciones atómicas):**\n- *Monoprocesador:* Ineficiente y riesgoso; el proceso en bucle consume el 100% de la única CPU impidiendo que el proceso que tiene el recurso pueda ejecutar para liberarlo.\n- *Multiprocesador:* Altamente eficiente cuando la sección crítica es muy corta, ya que evita la sobrecarga de poner a dormir al hilo y despertar al procesador.\n\n3. **Monitores:**\n- *Monoprocesador y Multiprocesador:* Es el mecanismo de más alto nivel y más estructurado. El compilador se encarga de inyectar la exclusión mutua automáticamente y proporciona variables de condición para suspender procesos sin desperdiciar CPU.'
    },
    {
      order: 4,
      instruction: 'Ejercicio 4: Planificación de Tiempo Real (T1, T2, T3)',
      explanation: '**Datos de las tareas:**\n- Tarea 1: $t_1 = 20$, $p_1 = 100$\n- Tarea 2: $t_2 = 30$, $p_2 = 145$\n\n**a) ¿Pueden ser planificadas con RM?**\n- Factor de utilización: \n  $$U = \\frac{20}{100} + \\frac{30}{145} = 0.20 + 0.2069 = 0.4069 \\quad (40.69\\%)$$\n- Cota de Liu & Layland para $n=2$:\n  $$U_{bound} = 2 \\cdot (2^{1/2} - 1) \\approx 0.8284$$\n- Como $U = 0.4069 \\le 0.8284$, se cumple holgadamente la cota suficiente: **SÍ, pueden ser planificadas con RM**.\n\n**b) Si se agrega Tarea 3 ($t_3 = 68, p_3 = 150$):**\n- Nuevo factor de utilización:\n  $$U_{nuevo} = 0.4069 + \\frac{68}{150} = 0.4069 + 0.4533 = 0.8602 \\quad (86.02\\%)$$\n- Cota para $n=3$:\n  $$U_{bound} = 3 \\cdot (2^{1/3} - 1) \\approx 0.7798$$\n- Como $U = 0.8602 > 0.7798$, la condición de cota no es suficiente, por lo que pasamos a verificar los plazos por RTA.\n\n**c) Verificación de plazos ($D_1=100, D_2=145, D_3=150$):**\n- Prioridades en RM ($p_1 < p_2 < p_3 \\implies \\text{Prio}(T_1) > \\text{Prio}(T_2) > \\text{Prio}(T_3)$):\n  - $R_1 = 20 \\le 100$ (**Cumple $D_1$**)\n  - $R_2 = 30 + \\lceil 30/100 \\rceil \\cdot 20 = 50 \\implies 30 + \\lceil 50/100 \\rceil \\cdot 20 = 50 \\le 145$ (**Cumple $D_2$**)\n  - Para $T_3$:\n    - $R_3^{(0)} = 68$\n    - $R_3^{(1)} = 68 + \\lceil 68/100 \\rceil \\cdot 20 + \\lceil 68/145 \\rceil \\cdot 30 = 68 + 20 + 30 = 118$\n    - $R_3^{(2)} = 68 + \\lceil 118/100 \\rceil \\cdot 20 + \\lceil 118/145 \\rceil \\cdot 30 = 68 + 40 + 30 = 138$\n    - $R_3^{(3)} = 68 + \\lceil 138/100 \\rceil \\cdot 20 + \\lceil 138/145 \\rceil \\cdot 30 = 68 + 40 + 30 = 138 \\le 150$\n\n**Respuesta:** ¡El tiempo de respuesta del peor caso para la Tarea 3 es 138 ms, el cual es menor que su deadline de 150 ms! Por lo tanto, **SÍ se cumplen los tres plazos estrictamente**.'
    }
  ];
  await createExamLesson('Recuperatorio 2025', contentRecup2025, stepsRecup2025, 5);

  console.log('\n¡Todos los exámenes y recuperatorios han sido sincronizados con éxito!');
}

seedExamenes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
