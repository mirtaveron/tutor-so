const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTP2Full() {
  console.log('Agregando resoluciones completas para TP2 (Procesos y Threads)...');

  const tp2 = await prisma.lesson.findFirst({
    where: { title: { contains: 'Practico2' } }
  });

  if (!tp2) {
    console.log('TP2 no encontrado.');
    return;
  }

  // Eliminar todos los pasos previos para limpiar
  await prisma.step.deleteMany({
    where: { lessonId: tp2.id }
  });

  const steps = [
    {
      order: 1,
      instruction: 'Pregunta 1: Intervención del SO en el diagrama de estados',
      explanation: 'El Sistema Operativo interviene en **todas las transiciones (flechas)** del diagrama. El SO es quien decide pasar un proceso de "Listo" a "Corriendo" (Dispatcher), o de "Corriendo" a "Bloqueado" ante una llamada al sistema. Para ver al SO en el diagrama, deberíamos representarlo como un proceso de control superior (modo kernel) al que se salta temporalmente cada vez que ocurre una transición.'
    },
    {
      order: 2,
      instruction: 'Pregunta 2: Sucesos para la creación de un proceso',
      explanation: '**Sucesos:** Arranque del sistema (init), el usuario ejecuta un programa (doble clic), o un proceso pide explícitamente crear otro proceso (syscall `fork` en UNIX).\n\n**Pasos del SO:** 1. Asigna un identificador (PID). 2. Crea y ubica su Bloque de Control de Proceso (PCB). 3. Asigna espacio en memoria para su código, datos y pila. 4. Lo inserta en la cola de procesos Listos (Ready).'
    },
    {
      order: 3,
      instruction: 'Pregunta 3: Estados "Bloqueado" y "Suspendido"',
      explanation: '**Bloqueado:** El proceso espera un evento (ej. lectura de disco) pero sigue alojado en la RAM principal.\n**Suspendido:** El proceso espera un evento, pero el SO lo movió a la memoria secundaria (Disco/Swap) para liberar RAM.\n\n**Ventaja de separarlos:** Permite al SO gestionar eficientemente la RAM. Si la RAM se llena, el SO puede mover a "Suspendido" a aquellos procesos que de todas formas no pueden ejecutar (están bloqueados), haciendo lugar para procesos Listos.'
    },
    {
      order: 4,
      instruction: 'Pregunta 4: Planificadores de corto, mediano y largo plazo',
      explanation: '- **Corto plazo (CPU Scheduler):** Muy rápido (milisegundos). Elige qué proceso de la RAM toma la CPU.\n- **Mediano plazo (Swapper):** Retira procesos de la RAM al disco (Swap) para controlar el nivel de multiprogramación y liberar memoria.\n- **Largo plazo (Job/Admission):** Controla qué programas nuevos ingresan al sistema para competir por recursos. (Poco usado en SO interactivos modernos como Windows/Linux).'
    },
    {
      order: 5,
      instruction: 'Pregunta 5: Acciones del kernel al cambiar de contexto',
      explanation: 'Un "Context Switch" requiere que el kernel:\n1. Salve el estado del proceso actual (registros, Program Counter, Stack Pointer) en su PCB.\n2. Actualice el estado de ese PCB a Listo o Bloqueado.\n3. Seleccione el próximo proceso a ejecutar usando el Planificador (Scheduler).\n4. Restaure el estado guardado del PCB del nuevo proceso en el hardware de la CPU.'
    },
    {
      order: 6,
      instruction: 'Pregunta 6: Diagrama de transición (1, 2, 3 y 4)',
      explanation: 'Considerando un diagrama típico (Listo ↔ Corriendo ↔ Bloqueado):\n- **Transición 1 (Listo → Corriendo):** El Dispatcher selecciona al proceso para ejecutarlo.\n- **Transición 2 (Corriendo → Listo):** Fin de Quantum de tiempo (Interrupción del reloj) o proceso de mayor prioridad se vuelve Listo (Preemption).\n- **Transición 3 (Corriendo → Bloqueado):** El proceso realiza una llamada E/S o espera un semáforo.\n- **Transición 4 (Bloqueado → Listo):** Finaliza la operación de E/S (interrupción del disco) y el evento esperado se cumple.'
    },
    {
      order: 7,
      instruction: 'Pregunta 7: Traza de entrelazado de ejecución (Traza)',
      explanation: 'El propósito de este ejercicio de escritorio es evidenciar el "Overhead". La CPU no pasa del Proceso 1 al 2 mágicamente. Se ejecutan instrucciones del P1, luego ocurre una interrupción. El CPU ejecuta 4 instrucciones del *Dispatcher* (SO) para hacer el cambio de contexto, y luego recién comienza a ejecutar instrucciones del P2. Esto muestra que el SO también consume ciclos de CPU.'
    },
    {
      order: 8,
      instruction: 'Pregunta 8: ¿Esperar simultáneamente a más de un suceso?',
      explanation: '**Sí, es posible.** Los sistemas operativos modernos proveen llamadas al sistema (como `select()` o `poll()` en UNIX/Linux) que permiten a un proceso bloquearse observando múltiples descriptores de archivo. El proceso despierta si *al menos uno* de los eventos ocurre (por ejemplo, llega un dato por red O el usuario presiona una tecla).'
    },
    {
      order: 9,
      instruction: 'Pregunta 9: Política para equilibrar prioridad y rendimiento',
      explanation: 'Si siempre elegimos prioridad alta, los procesos bajos mueren de inanición (Starvation). Una política intermedia clásica es el **Envejecimiento (Aging)**. Consiste en aumentar gradualmente la prioridad de los procesos a medida que pasan más tiempo esperando en la cola de Listos. Así, un proceso de prioridad baja eventualmente alcanzará una prioridad altísima y logrará ejecutarse.'
    },
    {
      order: 10,
      instruction: 'Pregunta 10: Comunicación entre procesos (IPC)',
      explanation: 'Se comunican mediante herramientas del SO: Memoria Compartida, Paso de Mensajes, Tuberías (Pipes) o Sockets.\n**Ejemplo:** Un servidor web (como Apache). Un proceso principal (Padre) recibe conexiones de red y se comunica con sus procesos "trabajadores" (Hijos) pasándoles la información de la conexión para que procesen las respuestas en paralelo.'
    },
    {
      order: 11,
      instruction: 'Pregunta 11: Comunicación sincrónica y asincrónica',
      explanation: '**Sincrónica (Bloqueante):** El que envía (Send) se bloquea hasta que el receptor recibe el mensaje. Ventaja: Asegura una sincronización estricta. Desventaja: Desperdicia CPU si el receptor tarda.\n**Asincrónica (No bloqueante):** El emisor manda el mensaje y sigue su ejecución. Ventaja: Mayor nivel de concurrencia. Desventaja: Requiere búferes grandes del lado del SO y la lógica de programación es más compleja.'
    },
    {
      order: 12,
      instruction: 'Pregunta 12: Esquema basado en mailboxes',
      explanation: 'a) Esperar ambos: Se hacen llamadas secuenciales (ej. `receive(A); receive(B);`). Si B llega antes que A, el proceso igual se queda bloqueado en A (ineficiente).\nb) Esperar uno u otro: Se requiere una primitiva no estándar del tipo `receive(cualquiera, A, B)` o usar chequeos asincrónicos (polling) para no quedarse trabado indefinidamente en el buzón vacío.'
    },
    {
      order: 13,
      instruction: 'Pregunta 13: Características de los Threads',
      explanation: 'Los hilos (threads) son "procesos ligeros". Comparten el código, datos globales y archivos abiertos del proceso, pero tienen su propia Pila (Stack) y registros.\n**Diferencia:** \n- *Kernel Threads:* Los gestiona el SO; pueden correr en verdaderos cores paralelos.\n- *User Threads:* Los gestiona una librería; el SO solo ve un proceso normal. Si un User Thread se bloquea por I/O, el SO bloquea todo el proceso.'
    },
    {
      order: 14,
      instruction: 'Pregunta 14: Recursos utilizados (Thread vs Proceso)',
      explanation: 'Al crear un **Proceso**, se requiere mucho tiempo y memoria: se crea el PCB, nuevas Tablas de Páginas para memoria virtual separada, y se copian estructuras.\nAl crear un **Thread**, es ligerísimo: solo se necesita crear un pequeño TCB (Thread Control Block) para guardar su Program Counter, Registros y un espacio para su Pila de ejecución local.'
    },
    {
      order: 15,
      instruction: 'Pregunta 15: Cuando multithread NO rinde',
      explanation: '1. **Algoritmos estrictamente secuenciales:** Calcular la serie de Fibonacci, donde el paso N depende críticamente del cálculo del paso N-1. Dividirlo no ayuda.\n2. **Exceso de granularidad fina:** Si las tareas son microscópicas, el tiempo gastado por el procesador en crear el thread, destruirlo y sincronizar candados (Locks/Mutex) será mayor que el tiempo de ejecución útil.'
    },
    {
      order: 16,
      instruction: 'Pregunta 16: User Threads en Multiprocesador',
      explanation: '**No presenta mejor rendimiento.** Como los Threads a nivel Usuario son invisibles para el Kernel del Sistema Operativo, el SO planifica al Proceso completo en UN SOLO procesador físico. Aunque el programa tenga 100 User Threads, la librería las intercalará dentro del único core asignado al proceso.'
    },
    {
      order: 17,
      instruction: 'Pregunta 17: Concurrencia pero no paralelismo',
      explanation: '**Totalmente posible.** De hecho, es lo que ocurre en un sistema con un procesador de 1 solo núcleo (Single-core). Existe concurrencia porque el SO intercala rápidamente las tareas (Context Switch) dando la ilusión de avance simultáneo a ojos del usuario. Sin embargo, matemáticamente hablando, en un instante (T) exacto, solo 1 instrucción física se está ejecutando (No hay paralelismo de hardware).'
    },
    {
      order: 18,
      instruction: 'Pregunta 18: Modelo de Threads Muchos-a-Muchos',
      explanation: 'a) **Kernel T. < Cores:** Desperdicio de hardware. Habrá cores físicos inactivos porque el SO no tiene suficientes unidades de hilo para despachar.\nb) **Kernel T. == Cores:** Balance adecuado solo si no hay llamadas de E/S. Si un thread se bloquea leyendo disco, un core quedará inactivo.\nc) **Kernel T. > Cores (pero < User T.):** El modelo óptimo. Si un kernel thread se bloquea, el SO puede mapear otro a un core libre, maximizando la eficiencia.'
    }
  ];

  for (const step of steps) {
    await prisma.step.create({
      data: {
        lessonId: tp2.id,
        order: step.order,
        instruction: step.instruction,
        explanation: step.explanation,
        codeSnippet: step.codeSnippet
      }
    });
  }

  console.log('Resoluciones completas de TP2 insertadas con éxito.');
}

seedTP2Full()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
