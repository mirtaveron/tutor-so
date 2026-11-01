const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIR_EJERCICIOS = path.resolve(__dirname, '../../../4- Sincronización/ejercicios_tp4');

function leerCodigo(nombreArchivo) {
  const ruta = path.join(DIR_EJERCICIOS, nombreArchivo);
  if (!fs.existsSync(ruta)) {
    console.error('No se encontró archivo:', ruta);
    return null;
  }
  return fs.readFileSync(ruta, 'utf-8');
}

async function main() {
  console.log('=== Actualizando TP4 con código C completo y listo para compilar ===\n');

  // Leer todos los códigos fuente de ejercicios_tp4
  const cEj1 = leerCodigo('ejercicio01_tweedledum_tweedledee.c');
  const cEj2 = leerCodigo('ejercicio02_productor_consumidor.c');
  const cEj3 = leerCodigo('ejercicio03_filosofos.c');
  const cEj4 = leerCodigo('ejercicio04_secuencias_abcde.c');
  const cEj5 = leerCodigo('ejercicio05_fabrica_bicicletas.c');
  const cEj6 = leerCodigo('ejercicio06_fumadores.c');
  const cEj7 = leerCodigo('ejercicio07_barbero_dormilon.c');
  const cEj8 = leerCodigo('ejercicio08_lectores_escritores_semaforos.c');
  const cEj9 = leerCodigo('ejercicio09_lectores_escritores_monitores.c');
  const cEj10 = leerCodigo('ejercicio10_productor_consumidor_monitores.c');
  const cEj11 = leerCodigo('ejercicio11_oso_abejas.c');
  const cEj12 = leerCodigo('ejercicio12_limite_conexiones.c');
  const cEj13 = leerCodigo('ejercicio13_impresoras_compartidas.c');
  const cBarreras = leerCodigo('ejemplo_barreras_pthread.c');

  const cSpinlock = `// Ejemplo conceptual en C: Espera ocupada (Spinlock) vs Bloqueo
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>
#include <unistd.h>

atomic_flag spinlock = ATOMIC_FLAG_INIT;

void* con_espera_ocupada(void* arg) {
    // Espera activa (consume CPU en un bucle continuo):
    while (atomic_flag_test_and_set(&spinlock)) {
        // Spin...
    }
    // Sección crítica
    printf("En sección crítica con spinlock\\n");
    atomic_flag_clear(&spinlock);
    return NULL;
}

// Bloqueo (el hilo cede CPU al SO vía llamadas al sistema):
// sem_wait(&sem); // Se duerme y libera la CPU
// ...
// sem_post(&sem); // Despierta al bloqueado`;

  const cAtomicidad = `// Demostración de condición de carrera si wait y signal NO fuesen atómicas:
#include <stdio.h>

int S = 1;

// Si esta función se interrumpiera entre la verificación y el decremento:
void wait_no_atomico(int *sem) {
    while (*sem <= 0); // Paso 1: evaluar condición
    // ---> INTERRUPCIÓN AQUÍ: El planificador conmuta a otro hilo
    (*sem)--;          // Paso 2: decrementar
}

// En hardware real, las arquitecturas ofrecen instrucciones indivisibles:
// - Test-and-Set (TAS)
// - Compare-and-Swap (CAS)
// - Load-Linked / Store-Conditional (LL/SC)`;

  const cDesactivarInt = `// Implementación conceptual de semáforos en Monoprocesador (Kernel):
typedef struct {
    int valor;
    struct cola_procesos *cola;
} semaforo_t;

void wait_kernel(semaforo_t *s) {
    disable_interrupts(); // Desactiva interrupciones en el CPU local
    s->valor--;
    if (s->valor < 0) {
        agregar_a_cola(s->cola, proceso_actual);
        bloquear_proceso(); // Cede CPU y reactiva interrupciones en context switch
    }
    enable_interrupts();
}

void signal_kernel(semaforo_t *s) {
    disable_interrupts();
    s->valor++;
    if (s->valor <= 0) {
        proceso_t *p = remover_de_cola(s->cola);
        despertar_proceso(p);
    }
    enable_interrupts();
}`;

  const cMutexVsSem = `// Comparación directa en C: Mutex (con ownership) vs Semáforo Binario
#include <pthread.h>
#include <semaphore.h>

pthread_mutex_t mtx = PTHREAD_MUTEX_INITIALIZER;
sem_t sem_bin;

void demo_mutex() {
    pthread_mutex_lock(&mtx);
    // Sección crítica: SOLO este hilo puede desbloquear
    pthread_mutex_unlock(&mtx);
}

void demo_semaforo_senal() {
    sem_init(&sem_bin, 0, 0);
    // Hilo 1 puede esperar una señal:
    // sem_wait(&sem_bin);
    // Y un Hilo 2 DIFERENTE (o una interrupción) emite la señal:
    // sem_post(&sem_bin);
}`;

  const cDiagrama = `// Rutinas de sistema operativo asociadas a los nuevos semáforos de canal y memoria:
// 1. Solicitud de E/S en canal de cinta:
void sys_iniciar_io_cinta() {
    sem_wait(&sem_canal_cinta); // Transición: Ejecutando -> Bloqueado en Cinta
    iniciar_transferencia_hardware();
}

// 2. Manejador de interrupción fin de E/S:
void isr_fin_io_cinta() {
    sem_post(&sem_canal_cinta); // Transición: Bloqueado en Cinta -> Listo
}

// 3. Manejo de memoria dinámica:
void* sys_malloc(size_t bytes) {
    if (!hay_marcos_libres(bytes)) {
        sem_wait(&sem_memoria); // Transición: Ejecutando -> Bloqueado Memoria (posible Swap)
    }
    return asignar_marcos(bytes);
}`;

  // Buscar TP4 en la base de datos
  const tp4 = await prisma.lesson.findFirst({ where: { title: { contains: 'Practico4' } } });
  if (!tp4) {
    console.error('Error: no se encontró la lección Practico4');
    return;
  }

  // Definición de los 20 pasos de TP4
  const tp4Steps = [
    {
      order: 1,
      instruction: 'Conceptos 1: Espera Ocupada vs Bloqueo',
      explanation: `**Espera Ocupada (Busy Waiting / Spinlock):**
El proceso continúa ejecutando un bucle en la CPU verificando continuamente una condición (por ejemplo, \`while (!flag);\`).
- *Ventaja:* No incurre en el costo de cambio de contexto (*context switch*) ni de planificación del SO.
- *Desventaja:* Desperdicia ciclos de CPU que otros procesos podrían aprovechar.

**Bloqueo (Sleep / Block):**
El proceso suspende su ejecución, cede la CPU voluntariamente, y el SO lo mueve a una cola de espera de eventos hasta que otro proceso lo despierte.
- *Ventaja:* Libera la CPU para que otros procesos trabajen.
- *Desventaja:* Incurre en la sobrecarga (*overhead*) de dos cambios de contexto (bloquear y luego despertar).

**¿Cuándo es preferible cada una?**
- La *espera ocupada* es preferible en **sistemas multiprocesador (SMP)** cuando el tiempo estimado de espera es **muy corto** (menor al tiempo que toma hacer dos context switches), como en la implementación interna de spinlocks en el kernel.
- El *bloqueo* es preferible en **monoprocesadores** (donde la espera ocupada bloquea al único hilo que podría liberar el recurso) o cuando la espera es larga o impredecible (como operaciones de E/S).`,
      codeSnippet: cSpinlock
    },
    {
      order: 2,
      instruction: 'Conceptos 2: Atomicidad de wait y signal',
      explanation: `Para que los semáforos garanticen exclusión mutua, las operaciones \`wait(S)\` y \`signal(S)\` deben ser **indivisibles (atómicas)**.

**Demostración de violación si no son atómicas:**
Supongamos un semáforo binario inicializado en \`S = 1\` y dos procesos P1 y P2 compitiendo por la sección crítica:

\`\`\`c
void wait(int &S) {
    while (S <= 0); // Paso 1: evaluar
    S--;            // Paso 2: decrementar
}
\`\`\`

1. P1 ejecuta el Paso 1: evalúa \`S <= 0\` (falso, porque \`S = 1\`).
2. En ese instante exacto ocurre una interrupción del reloj y el planificador cambia a P2 antes de que P1 decremente \`S\`.
3. P2 ejecuta el Paso 1: evalúa \`S <= 0\` (sigue siendo falso, \`S = 1\`).
4. P2 ejecuta el Paso 2: hace \`S--\` (\`S = 0\`) y entra a la Sección Crítica.
5. El planificador vuelve a dar la CPU a P1. P1 retoma en el Paso 2: hace \`S--\` (\`S = -1\`) y **también entra a la Sección Crítica**.

**Conclusión:** Ambos procesos están en la sección crítica simultáneamente, **violando la exclusión mutua**.`,
      codeSnippet: cAtomicidad
    },
    {
      order: 3,
      instruction: 'Conceptos 3: Implementación con desactivación de interrupciones',
      explanation: `**Implementación en Monoprocesador:**
El SO desactiva las interrupciones justo antes de inspeccionar/modificar el valor del semáforo y la lista de bloqueados, y las vuelve a activar inmediatamente después.

**¿Por qué NO es recomendable en Multiprocesador?**
1. Desactivar interrupciones solo afecta al procesador (núcleo) que ejecuta la instrucción. Los demás núcleos siguen corriendo y pueden acceder a las mismas variables compartidas en memoria al mismo tiempo.
2. Desactivar interrupciones en todos los procesadores requeriría enviar mensajes inter-procesador (IPI), lo cual es extremadamente lento, complejo y degrada el rendimiento de todo el sistema.
3. Por ello, en multiprocesadores se utilizan instrucciones atómicas de hardware como \`Test-and-Set\` o \`Compare-and-Swap\` combinadas con spinlocks.`,
      codeSnippet: cDesactivarInt
    },
    {
      order: 4,
      instruction: 'Conceptos 4: Barreras de Sincronización',
      explanation: `**Definición:**
Una **barrera** es un mecanismo de sincronización para un grupo de procesos o hilos. Ningún proceso puede avanzar más allá del punto de la barrera hasta que **todos** los procesos participantes del grupo hayan alcanzado dicha barrera. Una vez que el último proceso llega, todos son liberados para continuar.

**Ejemplo de uso beneficioso:**
En **computación científica paralela** (por ejemplo, simulación de dinámica de fluidos o predicción meteorológica por diferencias finitas):
- El espacio se divide en una cuadrícula distribuida entre $N$ hilos.
- En cada paso temporal $t$, cada hilo calcula el nuevo estado de su región.
- Para avanzar al paso $t+1$, cada hilo necesita los valores de frontera calculados por sus hilos vecinos en el paso $t$.
- Se coloca una **barrera**: ningún hilo puede comenzar el paso $t+1$ hasta que todos hayan concluido el paso $t$.`,
      codeSnippet: cBarreras
    },
    {
      order: 5,
      instruction: 'Conceptos 5: Sincronización con semáforo de kernel (KLT vs ULT)',
      explanation: `**1. Hilos a Nivel de Kernel (KLT - Kernel-Level Threads):**
- **Sí pueden sincronizarse.** El kernel conoce la existencia de cada hilo de forma individual.
- Cuando el hilo H1 hace \`wait()\` sobre un semáforo de kernel y el valor es $\\le 0$, el kernel bloquea únicamente al hilo H1 y puede planificar al hilo H2 del mismo proceso para que siga ejecutando y posteriormente haga \`signal()\`.

**2. Hilos a Nivel de Usuario (ULT - User-Level Threads):**
- **No es recomendable o puede fallar.** Para el kernel, todo el proceso es una única entidad de ejecución.
- Si el hilo de usuario H1 invoca una llamada al sistema para hacer \`wait()\` en un semáforo de kernel y debe bloquearse, el kernel **bloqueará al proceso completo (junto con todos sus hilos de usuario)**.
- Como H2 queda también bloqueado sin poder ejecutar, jamás podrá emitir el \`signal()\`, produciendo un interbloqueo.
- *Conclusión:* En ULT, la sincronización entre hilos del mismo proceso debe manejarse con primitivas internas de la biblioteca de hilos en espacio de usuario.`,
      codeSnippet: `// Comportamiento de Hilos a Nivel de Kernel vs Usuario:
// En KLT (POSIX pthread estándar en Linux NPTL):
// Cada hilo es una entidad de planificación en el kernel (task_struct).
// Si Hilo 1 se bloquea en sem_wait, Hilo 2 continúa ejecutando en otro core.

// En ULT puro (bibliotecas históricas como GNU Pth o corutinas):
// Si Hilo 1 hace una llamada al sistema bloqueante al kernel:
// sys_sem_wait(kernel_sem_id);
// -> El kernel bloquea TODO el proceso. Hilo 2 queda congelado.`
    },
    {
      order: 6,
      instruction: 'Conceptos 6: Semáforo Binario vs Mutex',
      explanation: `**1. Mutex (Mutual Exclusion Lock):**
- Posee el concepto de **propiedad (ownership)**: el hilo que adquiere el mutex (lock) es el **único** que puede y debe liberarlo (unlock).
- Su objetivo es pura y exclusivamente garantizar **Exclusión Mutua** en secciones críticas.
- Permite mecanismos de seguridad como evitar desbloqueos accidentales por terceros y soporte para protocolos de herencia de prioridad (para mitigar inversión de prioridades).

**2. Semáforo Binario:**
- Toma valores 0 o 1, pero **no tiene concepto de propiedad**.
- Un hilo puede ejecutar \`down()\` y un hilo completamente diferente (o incluso una rutina de interrupción de hardware) puede ejecutar \`up()\`.
- Su uso principal, además de exclusión mutua básica, es la **señalización y sincronización de eventos** entre procesos o manejadores de interrupciones.`,
      codeSnippet: cMutexVsSem
    },
    {
      order: 7,
      instruction: 'Conceptos 7: Modificación de diagrama de transiciones por Semáforos',
      explanation: `**a) Semáforos para canal de cintas y canal de disco:**
- *Nuevos estados:* En lugar de un estado genérico "Bloqueado", se agregan estados específicos: **"Bloqueado esperando canal de Cinta"** y **"Bloqueado esperando canal de Disco"** (o colas asociadas a cada semáforo).
- *Nuevas transiciones y rutinas:*
  - Al invocar \`wait(sem_cinta)\` o \`wait(sem_disco)\`, si el canal está ocupado, el proceso transiciona de *Ejecutando* a *Bloqueado en Semáforo*.
  - La rutina de interrupción de fin de transferencia de E/S del dispositivo invoca \`signal(sem_canal)\`, moviendo al proceso de la cabeza de la cola a la cola de **Listos**.

**b) Semáforo para obtención dinámica de memoria:**
- Si un proceso solicita memoria dinámica (\`malloc\`) y no hay marcos disponibles, se bloquea en el semáforo de memoria (*Bloqueado por Memoria*).
- Esto dispara la necesidad de planificadores de mediano plazo (*Swapping*): el proceso puede pasar a **Bloqueado/Suspendido** enviándose a disco para liberar memoria para otros.
- Cuando otro proceso libera memoria (\`free\`), la rutina hace \`signal()\`, permitiendo despertar o recargar al proceso en memoria.`,
      codeSnippet: cDiagrama
    },
    {
      order: 8,
      instruction: 'Problema 1: Tweedledum y Tweedledee (Wakeup Perdido)',
      explanation: `**a) Escenario de falla (Lost Wakeup con Sleep y Wakeup primitivos):**
1. Supongamos que Tweedledum ejecuta primero y llega a \`Sleep()\`. Queda bloqueado.
2. Tweedledee ejecuta \`x = Quarrel(x)\` y luego \`Wakeup(Tweedledum)\`, despertando a Tweedledum.
3. Tweedledee se prepara para llamar a \`Sleep()\`, pero antes de que se complete el cambio a dormido, la CPU conmuta a Tweedledum.
4. Tweedledum ejecuta \`x = Quarrel(x)\` y llama a \`Wakeup(Tweedledee)\`.
5. Como Tweedledee **aún no estaba en la cola de dormidos**, la señal de \`Wakeup\` **se pierde**.
6. Tweedledum ejecuta \`Sleep()\` y se duerme.
7. Tweedledee retoma y completa su llamada \`Sleep()\`, durmiéndose también.
8. **Resultado:** Ambos procesos quedan dormidos para siempre (Interbloqueo).

**b) Solución con Semáforos POSIX:**
Los semáforos tienen memoria (acumulan señales en su contador), evitando la pérdida de despertadores. A continuación se presenta el código completo en C listo para compilar y ejecutar con \`gcc -pthread\`.`,
      codeSnippet: cEj1
    },
    {
      order: 9,
      instruction: 'Problema 2: Productor y Consumidor (Deadlock por orden)',
      explanation: `**Código evaluado en la consigna:**
- Productor: \`down(&mutex); down(&vacio); entrar_msg(mensaje); up(&mutex); up(&lleno);\`
- Consumidor: \`down(&lleno); down(&mutex); remover_msg(mensaje); up(&mutex); up(&vacio);\`

**¿Es válida la solución?**
**NO es válida.** Presenta un riesgo inminente de **Interbloqueo (Deadlock)**.

**Explicación:**
1. Supongamos que el buffer está completamente lleno (\`vacio == 0\`, \`lleno == N\`).
2. El Productor intenta producir un nuevo elemento:
   - Ejecuta \`down(&mutex)\` con éxito (adquiere la exclusión mutua, \`mutex = 0\`).
   - Luego ejecuta \`down(&vacio)\`: como \`vacio == 0\`, el Productor se **bloquea** dentro del semáforo \`vacio\`... **¡pero sigue reteniendo el mutex!**
3. El Consumidor se planifica e intenta consumir:
   - Ejecuta \`down(&lleno)\` con éxito (hay elementos).
   - Luego intenta ejecutar \`down(&mutex)\`: como el Productor retiene el mutex, el Consumidor se **bloquea** esperando el mutex.
4. **Deadlock:** El Consumidor nunca podrá liberar un espacio (\`up(&vacio)\`) porque no puede obtener el mutex; y el Productor nunca liberará el mutex porque está esperando que haya espacio libre.

**Corrección implementada en el código:**
Invertir el orden de los \`down\` en el Productor:
\`\`\`c
sem_wait(&vacio);  // Primero asegurar que hay lugar
sem_wait(&mutex);  // Luego entrar a la sección crítica
\`\`\``,
      codeSnippet: cEj2
    },
    {
      order: 10,
      instruction: 'Problema 3: Cena de los Filósofos',
      explanation: `**Análisis y corrección de los 3 errores de la consigna:**

1. **Error aritmético de Macro en C (Índice Negativo):**
   La macro \`#define Izquierdo (i-1)%N\` produce un valor negativo en lenguaje C cuando \`i = 0\` (\`(0-1)%6 = -1\`). Al evaluar \`estado[Izquierdo]\`, accede a memoria fuera de los límites del arreglo (\`estado[-1]\`).
   *Corrección:* \`#define Izquierdo (i + N - 1) % N\`

2. **Condición de Carrera en \`dejar_tenedores\`:**
   En el código de la consigna original:
   \`\`\`c
   void dejar_tenedores(int i) {
       down(&mutex);
       estado[i] = Pensando;
       up(&mutex); // <-- ¡Libera el mutex prematuramente!
       test(Izquierdo);
       test(Derecho);
   }
   \`\`\`
   Las funciones \`test(Izquierdo)\` y \`test(Derecho)\` leen y modifican \`estado[i]\` de los vecinos sin estar protegidas por \`mutex\`. Si dos vecinos terminan a la vez, se produce una condición de carrera.
   *Corrección:* Mover \`up(&mutex)\` al final de la función para proteger el testeo de los vecinos.

3. **Inicialización de semáforos:**
   Los semáforos del arreglo \`s[N]\` deben inicializarse explícitamente en \`0\` para que el filósofo que no pueda comer se bloquee en \`sem_wait(&s[i])\`.`,
      codeSnippet: cEj3
    },
    {
      order: 11,
      instruction: 'Problema 4: Secuencias de Hilos (A, B, C, D, E)',
      explanation: `**Análisis de sincronización con cantidad mínima de semáforos:**

- **a) Secuencia ABCDE ABCDE ...**
  Se requiere encadenamiento circular estricto de 5 semáforos: A habilita B, B a C, C a D, D a E, y E vuelve a habilitar a A.
- **b) Secuencia ACDE BCDE ACDE BCDE ...**
  Alternancia de un ciclo que inicia en A y el siguiente en B. El hilo E utiliza una variable booleana de turno protegida para alternar el despertar entre A y B.
- **c) Secuencia (A o B)CDE (A o B)CDE ...**
  Sincronización no determinista eficiente: tanto el hilo A como el hilo B compiten por un semáforo común \`semAB\` (inicializado en 1). El ganador produce su letra y despierta a C. Al finalizar el ciclo, E ejecuta \`sem_post(&semAB)\`, habilitando al siguiente A o B disponible.
- **d) Secuencia (A o B)CE (A o B)(A o B)DE ...**
  Variante alternada mediante semáforos de control de rama.

A continuación se encuentra el programa completo en C con los hilos y semáforos para ejecutar y verificar las secuencias:`,
      codeSnippet: cEj4
    },
    {
      order: 12,
      instruction: 'Problema 5: Fábrica de Bicicletas (OP1, OP2, OP3, Montador)',
      explanation: `**Componentes y requerimientos:**
- **OP1:** Monta ruedas (produce de a 1, la bicicleta requiere 2 ruedas).
- **OP2:** Monta cuadros (la bicicleta requiere 1 cuadro).
- **OP3:** Monta manillares (la bicicleta requiere 1 manillar).
- **Montador:** Espera 2 ruedas, 1 cuadro y 1 manillar, y procede al ensamble.

**Casos resueltos:**
- **a) Sin almacenamiento intermedio:** Los semáforos de permiso inician en 1 (\`puedo_rueda=1, puedo_cuadro=1, puedo_manillar=1\`).
- **b) OP1 con espacio para fabricar 2 ruedas:** Basta inicializar el semáforo \`puedo_rueda = 2\`. De este modo, OP1 puede adelantarse y producir las dos ruedas necesarias antes de que el Montador las consuma.`,
      codeSnippet: cEj5
    },
    {
      order: 13,
      instruction: 'Problema 6: Fumadores de Cigarrillos (Patil)',
      explanation: `**El problema de los fumadores de cigarrillos (Patil 1971):**
Tres fumadores y un proceso Agente:
- Fumador 1 tiene Tabaco -> Espera Papel y Fósforos.
- Fumador 2 tiene Papel -> Espera Tabaco y Fósforos.
- Fumador 3 tiene Fósforos -> Espera Tabaco y Papel.

El agente coloca al azar 2 ingredientes sobre la mesa y despierta únicamente al fumador que posee el tercer ingrediente mediante un semáforo privado. Al finalizar de fumar, el fumador notifica al agente (\`sem_post(&sem_agente)\`) para dar inicio a la siguiente ronda.`,
      codeSnippet: cEj6
    },
    {
      order: 14,
      instruction: 'Problema 7: El Barbero Dormilón (Dijkstra)',
      explanation: `**Sincronización del Barbero Dormilón:**
- Si no hay clientes en la barbería, el barbero se bloquea en \`sem_wait(&clientes)\` (se pone a dormir).
- Cuando llega un cliente, inspecciona de forma segura (\`sem_wait(&mutex)\`) si hay sillas libres en la sala de espera (\`esperando < SILLAS\`).
  - Si hay lugar: incrementa \`esperando\`, despierta al barbero (\`sem_post(&clientes)\`), libera el mutex y espera en su turno (\`sem_wait(&barbero)\`).
  - Si la sala está llena: libera el mutex y se retira sin corte.
- El barbero toma a un cliente, habilita una silla de espera, realiza el corte y vuelve a inspeccionar la cola.`,
      codeSnippet: cEj7
    },
    {
      order: 15,
      instruction: 'Problema 8: Lectores y Escritores con Semáforos',
      explanation: `**Política: Preferencia a Lectores**
- Varios lectores pueden leer la base de datos o archivo simultáneamente sin interferirse.
- Los escritores requieren acceso exclusivo total (ningún otro lector ni escritor puede estar presente).
- El **primer lector** que llega adquiere el cerrojo del recurso (\`sem_wait(&db)\`), cerrando el paso a los escritores.
- Los lectores intermedios entran libremente incrementando el contador \`read_count\`.
- El **último lector** que sale libera el recurso (\`sem_post(&db)\`), permitiendo el ingreso de los escritores.`,
      codeSnippet: cEj8
    },
    {
      order: 16,
      instruction: 'Problema 9: Lectores y Escritores con Monitores',
      explanation: `**a) Políticas de prioridad utilizadas en el monitor:**
- Este diseño implementa **Prioridad para Escritores**.
- En \`inicio_leer\`: la condición \`if (escribiendo || !empty(ok_escribir))\` verifica si hay algún escritor activo o esperando en la cola \`ok_escribir\`. Si hay al menos un escritor esperando, los nuevos lectores se bloquean en \`ok_leer.wait\`. Esto previene que un flujo ininterrumpido de lectores bloquee eternamente a los escritores.
- En \`fin_escribir\`: si hay lectores esperando les da paso, de lo contrario da paso a otro escritor.

**b) ¿Existe la posibilidad de inanición?**
- **Sí, existe riesgo de inanición para los Lectores:** si constantemente siguen llegando solicitudes de procesos escritores (\`!empty(ok_escribir)\` se mantiene verdadero), los lectores nunca podrán ingresar a leer y sufrirán *starvation*.

A continuación se presenta la implementación completa en C usando la simulación estándar de monitores con \`pthread_mutex_t\` y \`pthread_cond_t\`:`,
      codeSnippet: cEj9
    },
    {
      order: 17,
      instruction: 'Problema 10: Productor-Consumidor con Monitores',
      explanation: `**Monitor Productor-Consumidor:**
Encapsula el buffer acotado circular y las operaciones de inserción y extracción dentro de una estructura monitor con exclusión mutua garantizada:
- Condición \`no_lleno\`: los productores se bloquean si el buffer está al máximo (\`count == BUFFER_SIZE\`).
- Condición \`no_vacio\`: los consumidores se bloquean si el buffer está vacío (\`count == 0\`).
- Al insertar, se señala \`no_vacio.signal()\`.
- Al remover, se señala \`no_lleno.signal()\`.`,
      codeSnippet: cEj10
    },
    {
      order: 18,
      instruction: 'Problema 11: El Oso y las Abejas',
      explanation: `**Reglas de sincronización:**
- Tarro con capacidad para $M$ porciones de miel.
- $N$ abejas producen porciones de a una y las depositan en el tarro de forma protegida por exclusión mutua.
- La abeja que coloca la porción $M$ es la responsable de despertar al oso (\`sem_post(&sem_oso)\`).
- El oso despierta, come todas las porciones ($porciones = 0$), vacía el tarro y habilita nuevamente a las abejas (\`sem_post(&sem_tarro_vacio)\`).`,
      codeSnippet: cEj11
    },
    {
      order: 19,
      instruction: 'Problema 12: Limitación de Conexiones en Servidor',
      explanation: `**Uso de semáforos para limitar $N$ conexiones simultáneas:**
1. Se inicializa un **semáforo contador** en $N$ (\`sem_init(&limite_conexiones, 0, N)\`).
2. El hilo principal despachador que acepta sockets ejecuta:
   \`\`\`c
   sem_wait(&limite_conexiones); // Si hay N activas, el despachador se bloquea
   pthread_create(&hilo_worker, NULL, atender_cliente, socket_fd);
   \`\`\`
3. Cuando el hilo trabajador termina de procesar y cierra la conexión:
   \`\`\`c
   close(socket_fd);
   sem_post(&limite_conexiones); // Habilita a una nueva conexión entrante
   \`\`\``,
      codeSnippet: cEj12
    },
    {
      order: 20,
      instruction: 'Problema 13: Usuarios Compartiendo 2 Impresoras',
      explanation: `**a) Sincronización con Semáforos:**
Se utiliza un semáforo contador inicializado en 2 (\`impresoras_disponibles\`) y un mutex para proteger el arreglo de estado de las impresoras (\`libre[2]\`). Al solicitar, el hilo espera en el semáforo y toma el ID libre (0 o 1).

**b) Asignación con Prioridad Única:**
Cada usuario tiene una prioridad numérica única. Si ambas impresoras están ocupadas, el usuario se suspende en un semáforo privado. Al liberarse una impresora, el hilo busca entre los usuarios en espera aquel con **mayor prioridad** y lo despacha directamente.`,
      codeSnippet: cEj13
    }
  ];

  // Limpiar y cargar pasos actualizados en la base de datos
  await prisma.step.deleteMany({ where: { lessonId: tp4.id } });
  console.log(`Insertando ${tp4Steps.length} pasos con código C en TP4...`);

  for (const step of tp4Steps) {
    await prisma.step.create({
      data: {
        lessonId: tp4.id,
        order: step.order,
        instruction: step.instruction,
        explanation: step.explanation,
        codeSnippet: step.codeSnippet
      }
    });
  }

  // Actualizar también seed-data.json para que los cambios queden persistidos
  const dataPath = path.resolve(__dirname, '../prisma/seed-data.json');
  if (fs.existsSync(dataPath)) {
    const units = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    for (const u of units) {
      for (const l of u.lessons) {
        if (l.title === 'Practico4-2026') {
          l.steps = tp4Steps.map(s => ({
            id: undefined,
            lessonId: l.id,
            order: s.order,
            instruction: s.instruction,
            explanation: s.explanation,
            codeSnippet: s.codeSnippet,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        }
      }
    }
    fs.writeFileSync(dataPath, JSON.stringify(units, null, 2), 'utf-8');
    console.log('✓ seed-data.json actualizado con éxito.');
  }

  console.log('\n¡Todos los ejercicios del TP4 han sido cargados con código C completo y listo para compilar!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
