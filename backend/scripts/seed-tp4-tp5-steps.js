const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTP4andTP5() {
  console.log('Insertando resoluciones completas para TP4 y TP5...\n');

  // Buscar TP4 y TP5
  const tp4 = await prisma.lesson.findFirst({ where: { title: { contains: 'Practico4' } } });
  const tp5 = await prisma.lesson.findFirst({ where: { title: { contains: 'Practico5' } } });

  if (!tp4 || !tp5) {
    console.error('No se encontraron las lecciones de TP4 o TP5');
    return;
  }

  // Limpiar pasos previos si existen
  await prisma.step.deleteMany({ where: { lessonId: tp4.id } });
  await prisma.step.deleteMany({ where: { lessonId: tp5.id } });

  // ----------------------------------------------------
  // PASOS DE TRABAJO PRÁCTICO 4 (SINCRONIZACIÓN)
  // ----------------------------------------------------
  const tp4Steps = [
    {
      order: 1,
      instruction: 'Conceptos 1: Espera Ocupada vs Bloqueo',
      explanation: '**Espera Ocupada (Busy Waiting / Spinlock):**\nEl proceso continúa ejecutando un bucle en la CPU verificando continuamente una condición (por ejemplo, `while (!flag);`).\n- *Ventaja:* No incurre en el costo de cambio de contexto (context switch) ni de planificación del SO.\n- *Desventaja:* Desperdicia ciclos de CPU que otros procesos podrían aprovechar.\n\n**Bloqueo (Sleep / Block):**\nEl proceso suspende su ejecución, cede la CPU voluntariamente, y el SO lo mueve a una cola de espera de eventos hasta que otro proceso lo despierte.\n- *Ventaja:* Libera la CPU para que otros procesos trabajen.\n- *Desventaja:* Incurre en la sobrecarga (overhead) de dos cambios de contexto (bloquear y luego despertar).\n\n**¿Cuándo es preferible cada una?**\n- La *espera ocupada* es preferible en **sistemas multiprocesador (SMP)** cuando el tiempo estimado de espera es **muy corto** (menor al tiempo que toma hacer dos context switches), como en la implementación interna de spinlocks en el kernel.\n- El *bloqueo* es preferible en **monoprocesadores** (donde la espera ocupada bloquea al único hilo que podría liberar el recurso) o cuando la espera es larga o impredecible (como operaciones de E/S).'
    },
    {
      order: 2,
      instruction: 'Conceptos 2: Atomicidad de wait y signal',
      explanation: 'Para que los semáforos garanticen exclusión mutua, las operaciones `wait(S)` y `signal(S)` deben ser **indivisibles (atómicas)**.\n\n**Demostración de violación si no son atómicas:**\nSupongamos un semáforo binario inicializado en `S = 1` y dos procesos P1 y P2 compitiendo por la sección crítica:\n\n```c\nvoid wait(int &S) {\n    while (S <= 0); // Paso 1: evaluar\n    S--;            // Paso 2: decrementar\n}\n```\n\n1. P1 ejecuta el Paso 1: evalúa `S <= 0` (falso, porque `S = 1`).\n2. En ese instante exacto ocurre una interrupción del reloj y el planificador cambia a P2 antes de que P1 decremente `S`.\n3. P2 ejecuta el Paso 1: evalúa `S <= 0` (sigue siendo falso, `S = 1`).\n4. P2 ejecuta el Paso 2: hace `S--` (`S = 0`) y entra a la Sección Crítica.\n5. El planificador vuelve a dar la CPU a P1. P1 retoma en el Paso 2: hace `S--` (`S = -1`) y **también entra a la Sección Crítica**.\n\n**Conclusión:** Ambos procesos están en la sección crítica simultáneamente, **violando la exclusión mutua**.'
    },
    {
      order: 3,
      instruction: 'Conceptos 3: Implementación con desactivación de interrupciones',
      explanation: '**Implementación en Monoprocesador:**\nEl SO desactiva las interrupciones justo antes de inspeccionar/modificar el valor del semáforo y la lista de bloqueados, y las vuelve a activar inmediatamente después:\n\n```c\nvoid wait(semaphore *s) {\n    disable_interrupts();\n    s->value--;\n    if (s->value < 0) {\n        add_to_queue(s->queue, current_process);\n        block(); // cede CPU reactivando interrupciones al cambiar de contexto\n    }\n    enable_interrupts();\n}\n```\n\n**¿Por qué NO es recomendable en Multiprocesador?**\n1. Desactivar interrupciones solo afecta al procesador (núcleo) que ejecuta la instrucción. Los demás núcleos siguen corriendo y pueden acceder a las mismas variables compartidas en memoria al mismo tiempo.\n2. Desactivar interrupciones en todos los procesadores requeriría enviar mensajes inter-procesador (IPI), lo cual es extremadamente lento, complejo y degrada el rendimiento de todo el sistema.\n3. Por ello, en multiprocesadores se utilizan instrucciones atómicas de hardware como `Test-and-Set` o `Compare-and-Swap` combinadas con spinlocks.'
    },
    {
      order: 4,
      instruction: 'Conceptos 4: Barreras de Sincronización',
      explanation: '**Definición:**\nUna **barrera** es un mecanismo de sincronización para un grupo de procesos o hilos. Ningún proceso puede avanzar más allá del punto de la barrera hasta que **todos** los procesos participantes del grupo hayan alcanzado dicha barrera. Una vez que el último proceso llega, todos son liberados para continuar.\n\n**Ejemplo de uso beneficioso:**\nEn **computación científica paralela** (por ejemplo, simulación de dinámica de fluidos o predicción meteorológica por diferencias finitas):\n- El espacio se divide en una cuadrícula distribuida entre $N$ hilos.\n- En cada paso temporal $t$, cada hilo calcula el nuevo estado de su región.\n- Para avanzar al paso $t+1$, cada hilo necesita los valores de frontera calculados por sus hilos vecinos en el paso $t$.\n- Se coloca una **barrera**: ningún hilo puede comenzar el paso $t+1$ hasta que todos hayan concluido el paso $t$.'
    },
    {
      order: 5,
      instruction: 'Conceptos 5: Sincronización con semáforo de kernel (KLT vs ULT)',
      explanation: '**1. Hilos a Nivel de Kernel (KLT - Kernel-Level Threads):**\n- **Sí pueden sincronizarse.** El kernel conoce la existencia de cada hilo de forma individual.\n- Cuando el hilo H1 hace `wait()` sobre un semáforo de kernel y el valor es $\\le 0$, el kernel bloquea únicamente al hilo H1 y puede planificar al hilo H2 del mismo proceso para que siga ejecutando y posteriormente haga `signal()`.\n\n**2. Hilos a Nivel de Usuario (ULT - User-Level Threads):**\n- **No es recomendable o puede fallar.** Para el kernel, todo el proceso es una única entidad de ejecución.\n- Si el hilo de usuario H1 invoca una llamada al sistema para hacer `wait()` en un semáforo de kernel y debe bloquearse, el kernel **bloqueará al proceso completo (junto con todos sus hilos de usuario)**.\n- Como H2 queda también bloqueado sin poder ejecutar, jamás podrá emitir el `signal()`, produciendo un interbloqueo.\n- *Conclusión:* En ULT, la sincronización entre hilos del mismo proceso debe manejarse con primitivas internas de la biblioteca de hilos en espacio de usuario.'
    },
    {
      order: 6,
      instruction: 'Conceptos 6: Semáforo Binario vs Mutex',
      explanation: '**1. Mutex (Mutual Exclusion Lock):**\n- Posee el concepto de **propiedad (ownership)**: el hilo que adquiere el mutex (lock) es el **único** que puede y debe liberarlo (unlock).\n- Su objetivo es pura y exclusivamente garantizar **Exclusión Mutua** en secciones críticas.\n- Permite mecanismos de seguridad como evitar desbloqueos accidentales por terceros y soporte para protocolos de herencia de prioridad (para mitigar inversión de prioridades).\n\n**2. Semáforo Binario:**\n- Toma valores 0 o 1, pero **no tiene concepto de propiedad**.\n- Un hilo puede ejecutar `down()` y un hilo completamente diferente (o incluso una rutina de interrupción de hardware) puede ejecutar `up()`.\n- Su uso principal, además de exclusión mutua básica, es la **señalización y sincronización de eventos** entre procesos o manejadores de interrupciones.'
    },
    {
      order: 7,
      instruction: 'Conceptos 7: Modificación de diagrama de transiciones por Semáforos',
      explanation: '**a) Semáforos para canal de cintas y canal de disco:**\n- *Nuevos estados:* En lugar de un estado genérico "Bloqueado", se agregan estados específicos: **"Bloqueado esperando canal de Cinta"** y **"Bloqueado esperando canal de Disco"** (o colas asociadas a cada semáforo).\n- *Nuevas transiciones y rutinas:* \n  - Al invocar `wait(sem_cinta)` o `wait(sem_disco)`, si el canal está ocupado, el proceso transiciona de *Ejecutando* a *Bloqueado en Semáforo*.\n  - La rutina de interrupción de fin de transferencia de E/S del dispositivo invoca `signal(sem_canal)`, moviendo al proceso de la cabeza de la cola a la cola de **Listos**.\n\n**b) Semáforo para obtención dinámica de memoria:**\n- Si un proceso solicita memoria dinámica (`malloc`) y no hay marcos disponibles, se bloquea en el semáforo de memoria (*Bloqueado por Memoria*).\n- Esto dispara la necesidad de planificadores de mediano plazo (*Swapping*): el proceso puede pasar a **Bloqueado/Suspendido** enviándose a disco para liberar memoria para otros.\n- Cuando otro proceso libera memoria (`free`), la rutina hace `signal()`, permitiendo despertar o recargar al proceso en memoria.'
    },
    {
      order: 8,
      instruction: 'Problema 1: Tweedledum y Tweedledee (Wakeup Perdido)',
      explanation: '**a) Escenario de falla (Lost Wakeup):**\n1. Supongamos que Tweedledum ejecuta primero y llega a `Sleep()`. Queda bloqueado.\n2. Tweedledee ejecuta `x = Quarrel(x)` y luego `Wakeup(Tweedledum)`, despertando a Tweedledum.\n3. Tweedledee se prepara para llamar a `Sleep()`, pero antes de que se complete el cambio a dormido, la CPU conmuta a Tweedledum.\n4. Tweedledum ejecuta `x = Quarrel(x)` y llama a `Wakeup(Tweedledee)`.\n5. Como Tweedledee **aún no estaba en la cola de dormidos**, la señal de `Wakeup` **se pierde**.\n6. Tweedledum ejecuta `Sleep()` y se duerme.\n7. Tweedledee retoma y completa su llamada `Sleep()`, durmiéndose también.\n8. **Resultado:** Ambos procesos quedan dormidos para siempre (Interbloqueo).\n\n**b) Solución con Semáforos:**\nLos semáforos tienen memoria (acumulan señales en su contador), evitando la pérdida de despertadores:\n\n```c\nsemaphore s_dum = 0; // Tweedledum espera primero\nsemaphore s_dee = 1; // Tweedledee empieza primero (o viceversa)\n\nvoid Tweedledum() {\n    while (1) {\n        wait(&s_dum);\n        x = Quarrel(x);\n        signal(&s_dee);\n    }\n}\n\nvoid Tweedledee() {\n    while (1) {\n        wait(&s_dee);\n        x = Quarrel(x);\n        signal(&s_dum);\n    }\n}\n```'
    },
    {
      order: 9,
      instruction: 'Problema 2: Productor y Consumidor (Deadlock por orden)',
      explanation: '**Código evaluado:**\n- Productor: `down(&mutex); down(&vacio); entrar_msg(mensaje); up(&mutex); up(&lleno);`\n- Consumidor: `down(&lleno); down(&mutex); remover_msg(mensaje); up(&mutex); up(&vacio);`\n\n**¿Es válida la solución?**\n**NO es válida.** Presenta un riesgo inminente de **Interbloqueo (Deadlock)**.\n\n**Explicación:**\n1. Supongamos que el buffer está completamente lleno (`vacio == 0`, `lleno == N`).\n2. El Productor intenta producir un nuevo elemento:\n   - Ejecuta `down(&mutex)` con éxito (adquiere la exclusión mutua, `mutex = 0`).\n   - Luego ejecuta `down(&vacio)`: como `vacio == 0`, el Productor se **bloquea** dentro del semáforo `vacio`... **¡pero sigue reteniendo el mutex!**\n3. El Consumidor se planifica e intenta consumir:\n   - Ejecuta `down(&lleno)` con éxito (hay elementos).\n   - Luego intenta ejecutar `down(&mutex)`: como el Productor retiene el mutex, el Consumidor se **bloquea** esperando el mutex.\n4. **Deadlock:** El Consumidor nunca podrá liberar un espacio (`up(&vacio)`) porque no puede obtener el mutex; y el Productor nunca liberará el mutex porque está esperando que haya espacio libre.\n\n**Corrección:**\nInvertir el orden de los `down` en el Productor:\n```c\ndown(&vacio);  // Primero asegurar que hay lugar\ndown(&mutex);  // Luego entrar a la sección crítica\n```'
    },
    {
      order: 10,
      instruction: 'Problema 3: Cena de los Filósofos',
      explanation: '**Análisis de los problemas en el código propuesto:**\n\n1. **Error aritmético de Macro en C (Índice Negativo):**\n   La macro `#define Izquierdo (i-1)%N` produce un valor negativo en lenguaje C cuando `i = 0` (`(0-1)%6 = -1`). Al evaluar `estado[Izquierdo]`, accede a memoria fuera de los límites del arreglo (`estado[-1]`).\n   *Solución:* `#define Izquierdo (i + N - 1) % N`\n\n2. **Condición de Carrera en `dejar_tenedores`:**\n   En el código de la consigna:\n   ```c\n   void dejar_tenedores(int i) {\n       down(&mutex);\n       estado[i] = Pensando;\n       up(&mutex); // <-- ¡Libera el mutex prematuramente!\n       test(Izquierdo);\n       test(Derecho);\n   }\n   ```\n   Las funciones `test(Izquierdo)` y `test(Derecho)` leen y modifican `estado[i]` de los vecinos sin estar protegidas por `mutex`. Si dos vecinos terminan a la vez, se produce una condición de carrera.\n   *Solución:* Mover `up(&mutex)` al final de la función:\n   ```c\n   void dejar_tenedores(int i) {\n       down(&mutex);\n       estado[i] = Pensando;\n       test(Izquierdo);\n       test(Derecho);\n       up(&mutex);\n   }\n   ```\n\n3. **Inicialización de semáforos:**\n   Los semáforos del arreglo `s[N]` deben inicializarse explícitamente en `0` para que el filósofo que no pueda comer se bloquee en `down(&s[i])`.'
    },
    {
      order: 11,
      instruction: 'Problema 4: Secuencias de Hilos (A, B, C, D, E)',
      explanation: '**a) Secuencia: ABCDE ABCDE ...**\n- Semáforos: `sA=1, sB=0, sC=0, sD=0, sE=0`\n- Hilo A: `wait(sA); print(A); signal(sB);`\n- Hilo B: `wait(sB); print(B); signal(sC);`\n- Hilo C: `wait(sC); print(C); signal(sD);`\n- Hilo D: `wait(sD); print(D); signal(sE);`\n- Hilo E: `wait(sE); print(E); signal(sA);`\n\n**b) Secuencia: ACDE BCDE ACDE BCDE ...**\n- Semáforos: `sA=1, sB=0, sC=0, sD=0, sE=0; int turno_B = 0;`\n- Hilo A: `wait(sA); print(A); signal(sC);`\n- Hilo B: `wait(sB); print(B); signal(sC);`\n- Hilo C: `wait(sC); print(C); signal(sD);`\n- Hilo D: `wait(sD); print(D); signal(sE);`\n- Hilo E: `wait(sE); print(E); if (turno_B) { turno_B=0; signal(sA); } else { turno_B=1; signal(sB); }`\n\n**c) Secuencia: (A o B)CDE (A o B)CDE ...**\n- Semáforos: `sAB=1, sC=0, sD=0, sE=0`\n- Hilo A: `wait(sAB); print(A); signal(sC);`\n- Hilo B: `wait(sAB); print(B); signal(sC);`\n- Hilos C, D, E encadenados: C despierta a D, D a E, y E ejecuta `signal(sAB)`.\n\n**d) Secuencia: (A o B)CE (A o B)(A o B)DE ...**\n- Se sincroniza mediante alternancia de banderas o semáforos entre la rama C-E y la rama D-E.'
    },
    {
      order: 12,
      instruction: 'Problema 5: Fábrica de Bicicletas (OP1, OP2, OP3, Montador)',
      explanation: '**Componentes:** OP1 (ruedas), OP2 (cuadro), OP3 (manillar), Montador (2 ruedas + 1 cuadro + 1 manillar).\n\n**a) Sin almacenamiento intermedio (capacidad 1 fabricando):**\n- Semáforos de permiso para fabricar: `puedo_rueda=1, puedo_cuadro=1, puedo_manillar=1`\n- Semáforos de piezas listas: `hay_rueda=0, hay_cuadro=0, hay_manillar=0`\n\n```c\n// OP1 (Ruedas - ejecuta dos veces por bici)\nwhile(1) {\n    wait(puedo_rueda);\n    fabricar_rueda();\n    signal(hay_rueda);\n}\n\n// OP2 (Cuadro)\nwhile(1) {\n    wait(puedo_cuadro);\n    fabricar_cuadro();\n    signal(hay_cuadro);\n}\n\n// OP3 (Manillar)\nwhile(1) {\n    wait(puedo_manillar);\n    fabricar_manillar();\n    signal(hay_manillar);\n}\n\n// Montador\nwhile(1) {\n    wait(hay_rueda); wait(hay_rueda); // Toma 2 ruedas\n    wait(hay_cuadro); wait(hay_manillar);\n    armar_bicicleta();\n    signal(puedo_rueda); signal(puedo_rueda);\n    signal(puedo_cuadro); signal(puedo_manillar);\n}\n```\n\n**b) OP1 con espacio para fabricar 2 ruedas:**\n- Basta inicializar `puedo_rueda = 2`.'
    },
    {
      order: 13,
      instruction: 'Problema 6: Fumadores de Cigarrillos (Patil)',
      explanation: '**Ingredientes:** Tabaco (0), Papel (1), Fósforos (2). El agente coloca dos en la mesa.\n\n```c\nsemaphore agente = 1;\nsemaphore tabaco_papel = 0, papel_fosforos = 0, tabaco_fosforos = 0;\n\n// Agente\nwhile(1) {\n    wait(agente);\n    int r = rand() % 3;\n    if (r == 0) signal(papel_fosforos);   // Falta tabaco -> fuma F1\n    else if (r == 1) signal(tabaco_fosforos); // Falta papel -> fuma F2\n    else signal(tabaco_papel);           // Faltan fósforos -> fuma F3\n}\n\n// Fumador con Tabaco (espera papel y fósforos)\nwhile(1) {\n    wait(papel_fosforos);\n    armar_y_fumar();\n    signal(agente);\n}\n\n// Fumador con Papel\nwhile(1) {\n    wait(tabaco_fosforos);\n    armar_y_fumar();\n    signal(agente);\n}\n\n// Fumador con Fósforos\nwhile(1) {\n    wait(tabaco_papel);\n    armar_y_fumar();\n    signal(agente);\n}\n```'
    },
    {
      order: 14,
      instruction: 'Problema 7: El Barbero Dormilón (Dijkstra)',
      explanation: '**Variables y Semáforos:**\n```c\n#define SILLAS n\nint esperando = 0;\nsemaphore mutex = 1;\nsemaphore clientes = 0; // Clientes listos esperando\nsemaphore barbero = 0;  // Barbero listo para cortar\n\nvoid Barbero() {\n    while(1) {\n        wait(clientes); // Duerme si no hay clientes\n        wait(mutex);\n        esperando--;\n        signal(barbero); // Invita al cliente a la silla\n        signal(mutex);\n        cortar_pelo();\n    }\n}\n\nvoid Cliente() {\n    wait(mutex);\n    if (esperando < SILLAS) {\n        esperando++;\n        signal(clientes); // Despierta al barbero si duerme\n        signal(mutex);\n        wait(barbero);    // Espera a que el barbero lo llame\n        obtener_corte();\n    } else {\n        signal(mutex);    // Sala llena, se va\n    }\n}\n```'
    },
    {
      order: 15,
      instruction: 'Problema 8: Lectores y Escritores con Semáforos',
      explanation: '**Política:** Varios lectores simultáneos, o un solo escritor exclusivo (Preferencia Lectores):\n\n```c\nint read_count = 0;\nsemaphore mutex = 1; // Protege read_count\nsemaphore db = 1;    // Acceso exclusivo a la base de datos\n\nvoid Lector() {\n    while(1) {\n        wait(mutex);\n        read_count++;\n        if (read_count == 1) wait(db); // El primer lector bloquea a los escritores\n        signal(mutex);\n\n        leer_datos();\n\n        wait(mutex);\n        read_count--;\n        if (read_count == 0) signal(db); // El último lector habilita a los escritores\n        signal(mutex);\n    }\n}\n\nvoid Escritor() {\n    while(1) {\n        wait(db); // Exclusión mutua total\n        escribir_datos();\n        signal(db);\n    }\n}\n```'
    },
    {
      order: 16,
      instruction: 'Problema 9: Lectores y Escritores con Monitores',
      explanation: '**a) Políticas de prioridad utilizadas en el código:**\n- Posee **prioridad para Escritores**.\n- En `inicio-leer`: la condición `if (escribiendo || !empty(ok_escribir)) ok_leer.wait;` verifica si hay algún escritor esperando en la cola `ok_escribir`. Si hay al menos un escritor esperando, los nuevos lectores se bloquean, permitiendo que el escritor tome el recurso apenas terminen los lectores actuales.\n- En `fin-escribir`: si hay lectores esperando les da paso (`ok_leer.signal`), de lo contrario pasa a otro escritor.\n\n**b) ¿Existe la posibilidad de inanición?**\n- **Sí, existe riesgo de inanición para los Lectores:** si constantemente siguen llegando solicitudes de procesos escritores (`!empty(ok_escribir)` se mantiene verdadero), los lectores nunca podrán ingresar a leer y sufrirán *starvation*.'
    },
    {
      order: 17,
      instruction: 'Problema 10: Productor-Consumidor con Monitores',
      explanation: '```c\nmonitor ProductorConsumidor {\n    condition no_lleno, no_vacio;\n    int buffer[N];\n    int in = 0, out = 0, count = 0;\n\n    public entry void insertar(int item) {\n        while (count == N)\n            no_lleno.wait();\n        buffer[in] = item;\n        in = (in + 1) % N;\n        count++;\n        no_vacio.signal();\n    }\n\n    public entry int remover() {\n        int item;\n        while (count == 0)\n            no_vacio.wait();\n        item = buffer[out];\n        out = (out + 1) % N;\n        count--;\n        no_lleno.signal();\n        return item;\n    }\n}\n```'
    },
    {
      order: 18,
      instruction: 'Problema 11: El Oso y las Abejas',
      explanation: '**Reglas:** Tarro con capacidad M. Las abejas colocan porciones de a una. La que pone la porción M despierta al oso. El oso se come todo y vuelve a dormir.\n\n```c\nint porciones = 0;\nsemaphore mutex = 1;     // Protege el tarro\nsemaphore oso = 0;       // Oso dormido\n\nvoid Abeja() {\n    while(1) {\n        producir_miel();\n        wait(mutex);\n        porciones++;\n        if (porciones == M) {\n            signal(oso); // Despierta al oso\n            // El mutex se mantiene o se cede al oso\n        } else {\n            signal(mutex);\n        }\n    }\n}\n\nvoid Oso() {\n    while(1) {\n        wait(oso);\n        comer_miel(); // Se come las M porciones\n        porciones = 0;\n        signal(mutex); // Libera el tarro vacío para las abejas\n    }\n}\n```'
    },
    {
      order: 19,
      instruction: 'Problema 12: Limitación de Conexiones en Servidor',
      explanation: '**Uso de semáforos para limitar $N$ conexiones simultáneas:**\n\n1. Se inicializa un **semáforo contador** en $N$ (`sem_init(&limite_conexiones, 0, N)`).\n2. El hilo principal o hilo despachador que escucha en el socket ejecuta:\n   ```c\n   while(1) {\n       int nuevo_socket = accept(server_fd, ...);\n       sem_wait(&limite_conexiones); // Si hay N abiertas, se bloquea aquí\n       crear_hilo_cliente(nuevo_socket);\n   }\n   ```\n3. Cuando el hilo trabajador termina de atender al cliente y cierra la conexión:\n   ```c\n   close(nuevo_socket);\n   sem_post(&limite_conexiones); // Incrementa el semáforo y permite una nueva conexión\n   ```\n- De esta forma, si hay $N$ conexiones activas, el valor del semáforo es 0 y cualquier intento de aceptar una nueva conexión esperará hasta que una existente se libere.'
    },
    {
      order: 20,
      instruction: 'Problema 13: Usuarios Compartiendo 2 Impresoras',
      explanation: '**a) Sincronización con Semáforos (Usuarios como Threads):**\n```c\nsemaphore impresoras_disponibles = 2;\nsemaphore mutex_impresoras = 1;\nint libre[2] = {1, 1}; // Estado de cada impresora\n\nint requerir_impresora() {\n    wait(impresoras_disponibles);\n    wait(mutex_impresoras);\n    int id = (libre[0]) ? 0 : 1;\n    libre[id] = 0;\n    signal(mutex_impresoras);\n    return id;\n}\n\nvoid liberar_impresora(int id) {\n    wait(mutex_impresoras);\n    libre[id] = 1;\n    signal(mutex_impresoras);\n    signal(impresoras_disponibles);\n}\n```\n\n**b) Con Prioridad Única:**\nSe utiliza una cola de prioridad protegida por mutex y semáforos privados por hilo. Al liberar una impresora, el hilo busca al usuario esperando con **mayor prioridad** y le hace `signal()` a su semáforo privado.'
    }
  ];

  // ----------------------------------------------------
  // PASOS DE TRABAJO PRÁCTICO 5 (INTERBLOQUEOS / DEADLOCK)
  // ----------------------------------------------------
  const tp5Steps = [
    {
      order: 1,
      instruction: 'Problema 1: Deadlock sin recursos del sistema',
      explanation: '**¿Se puede producir deadlock sin recursos del sistema?**\n**SÍ, es totalmente posible.**\n\n**Explicación y Ejemplo:**\nLos interbloqueos pueden ocurrir puramente por **dependencias lógicas de sincronización o comunicación (Message Deadlocks)** entre procesos, sin que intervengan recursos de hardware (como cintas, impresoras o memoria):\n\n*Ejemplo clásico:* Dos procesos P1 y P2 que se comunican mediante paso de mensajes bloqueante:\n- P1 ejecuta: `receive(P2)` (espera recibir un mensaje de P2 antes de continuar o enviar nada).\n- P2 ejecuta: `receive(P1)` (espera recibir un mensaje de P1 antes de continuar o enviar nada).\n\nAmbos procesos quedan bloqueados esperando un evento que únicamente el otro proceso puede desencadenar. Ningún recurso físico está saturado, pero el sistema está en **deadlock** permanente.'
    },
    {
      order: 2,
      instruction: 'Problema 2: Estado Inseguro vs Interbloqueo',
      explanation: '**Un estado inseguro NO es un estado de interbloqueo.**\nUn estado es *inseguro* simplemente si el sistema no puede garantizar que todos los procesos terminarán si cada uno solicita su demanda máxima de recursos simultáneamente.\n\n**Demostración de que pueden completar su ejecución:**\nSupongamos 1 recurso con 10 instancias disponibles. Proceso P1 tiene asignadas 4 y su máximo es 8. P2 tiene asignadas 3 y su máximo es 7. Quedan 3 recursos libres:\n- Si ambos solicitan su máximo (P1 pide 4 más y P2 pide 4 más), ninguno puede completarse y hay deadlock (estado inseguro).\n- **Sin embargo**, si en la ejecución real P1 solo necesita solicitar 1 recurso más para terminar su tarea, P1 toma 1 recurso (quedan 2 libres), finaliza su trabajo y **libera sus 5 recursos**. Ahora hay $2 + 5 = 7$ libres, con los cuales P2 puede satisfacer cualquier demanda, terminar y liberar todo.\n- Por lo tanto, los procesos completaron su ejecución sin entrar en deadlock.'
    },
    {
      order: 3,
      instruction: 'Problema 3: 6 Unidades de Cinta y n Procesos (Máx 2)',
      explanation: '**Planteo:**\n- Total de recursos de cinta: $R = 6$\n- Cada proceso necesita como máximo: $Max = 2$ unidades de cinta.\n- ¿Para qué valores de $n$ el sistema está garantizado **libre de interbloqueo**?\n\n**Demostración matemática:**\nEl peor escenario para generar deadlock ocurre cuando cada uno de los $n$ procesos adquiere $(Max - 1)$ recursos y solicita el último. Aquí cada proceso retendría $2 - 1 = 1$ cinta.\n\nPara garantizar que al menos **un** proceso pueda obtener su última cinta y terminar, el número total de cintas debe ser estrictamente mayor a la suma de las retenciones en el peor caso:\n\n$$R \\ge n \\cdot (Max - 1) + 1$$\n$$6 \\ge n \\cdot (2 - 1) + 1$$\n$$6 \\ge n + 1 \\implies n \\le 5$$\n\n**Respuesta:**\nEl sistema está garantizado **libre de bloqueo para todo $n \\le 5$** (hasta 5 procesos concurrentes). Si $n \\ge 6$, 6 procesos podrían tomar 1 cinta cada uno y bloquearse indefinidamente esperando la segunda.'
    },
    {
      order: 4,
      instruction: 'Problema 4: Situación entre Procesos P y Q',
      explanation: '**Código analizado:**\n```\nProceso P:       Proceso Q:\nRequerir A       Requerir B\nLiberar A        Requerir A\nRequerir B       Liberar B\nLiberar B        Liberar A\n```\n\n**¿Puede ocurrir deadlock?**\n**NO, es imposible que ocurra deadlock.**\n\n**Justificación formal:**\nPara que exista interbloqueo debe cumplirse la condición de **Espera Circular** y **Retención y Espera (Hold and Wait)**.\n- Para que ocurra un ciclo, P debería retener el recurso A mientras solicita el recurso B, y Q debería retener el recurso B mientras solicita el recurso A.\n- Sin embargo, observemos el código de **P**: P **libera A antes de requerir B** (`Liberar A` precede a `Requerir B`).\n- Por lo tanto, en ningún momento P retiene A mientras compite por B. Si Q tiene B y pide A, o bien A ya está libre (porque P ya lo liberó) o bien P lo tiene pero lo liberará inmediatamente sin bloquearse. No existe posibilidad de espera circular.'
    },
    {
      order: 5,
      instruction: 'Problema 5: Algoritmo de Detección de Deadlock',
      explanation: '**¿En qué momento se ejecutaría?**\nExisten dos políticas principales:\n1. **En cada solicitud de recurso que no pueda satisfacerse de inmediato:** Detecta el interbloqueo tan pronto como ocurre y permite saber qué proceso lo causó. *Desventaja:* Alto costo de CPU por ejecución constante.\n2. **A intervalos regulares de tiempo (ej. cada hora o 15 minutos) o cuando la utilización de la CPU caiga por debajo de un umbral:** Si la CPU cae mientras hay procesos listos, sugiere que los procesos están bloqueados esperando recursos.\n\n**¿Qué haría el algoritmo si detecta deadlock?**\nEl SO debe aplicar técnicas de recuperación:\n- **Terminación de procesos:** Abortar todos los procesos interbloqueados (muy drástico), o abortar uno a uno (por orden de prioridad, tiempo transcurrido o recursos retenidos) hasta romper el ciclo.\n- **Expropiación de recursos (Preemption):** Quitar recursos asignados a uno de los procesos y hacer un *Rollback* (reversión) de su estado a un punto de control seguro (checkpoint).'
    },
    {
      order: 6,
      instruction: 'Problema 6: Prevención vs Detección de Bloqueos',
      explanation: '**Algoritmos de Prevención:**\n- Diseñan el sistema para invalidar estructuralmente al menos una de las cuatro condiciones de Coffman (Exclusión mutua, Retención y espera, No expropiación, Espera circular).\n- *Utilidad y Limitación:* Son muy conservadores; garantizan que nunca habrá deadlock pero reducen significativamente el uso eficiente de los dispositivos y la concurrencia (ej. exigir que todos los recursos se soliciten de golpe al inicio o en estricto orden numérico).\n\n**Algoritmos de Detección:**\n- Permiten que los procesos soliciten recursos libremente según sus necesidades reales. El SO monitorea periódicamente la matriz de asignación y solicitudes buscando ciclos en el Grafo de Asignación de Recursos.\n- *Utilidad y Limitación:* Permiten máxima flexibilidad y alta utilización de recursos, pero tienen costo computacional para la detección y conllevan el costo de tener que abortar procesos o revertir cómputos realizados.'
    },
    {
      order: 7,
      instruction: 'Problema 7: Análisis Costo-Beneficio de Evasión',
      explanation: '**Datos del problema:**\n- 5.000 trabajos por mes.\n- Deadlock ocurre 2 veces al mes; cancela 10 trabajos cada vez.\n- Costo por trabajo cancelado: $1 dólar (están a mitad de su costo de $2).\n- Costo mensual actual por deadlocks: $2 \\times 10 \\times \\$1 = \\$20\\text{ USD/mes}$.\n\n**Impacto del Algoritmo de Evasión (Banquero):**\n- Aumenta 10% el tiempo de ejecución de TODOS los trabajos (5.000 trabajos).\n- Aumenta el tiempo de respuesta promedio en un 20%.\n\n**a) Argumentos para instalar el algoritmo:**\n- Previsibilidad y consistencia: Garantiza que ningún trabajo de cómputo crítico sea abortado intempestivamente a mitad de camino.\n- La máquina cuenta con 30% de tiempo ocioso, por lo que absorbe el 10% de cálculo adicional sin saturar el procesador.\n\n**b) Argumentos en contra de instalar el algoritmo (Decisión técnica):**\n- **Inviabilidad económica flagrante:** El costo actual de los interbloqueos es de apenas **$20 dólares al mes**. Pagar una penalidad del 10% de CPU en 5.000 trabajos equivale a desperdiciar 500 trabajos equivalentes en tiempo de CPU (aprox. $1.000 USD).\n- Penaliza la experiencia de todos los usuarios con un 20% más de tiempo de espera para ahorrarse $20 al mes.'
    },
    {
      order: 8,
      instruction: 'Problema 8: Tres Maneras de Eliminar un Bloqueo',
      explanation: 'Una vez detectado un interbloqueo, las tres formas estándar de resolverlo son:\n\n1. **Abortar todos los procesos interbloqueados:** Rompe el ciclo inmediatamente, pero es la opción más destructiva ya que se pierde todo el progreso de todos los trabajos involucrados.\n2. **Abortar procesos uno a la vez:** Se selecciona un proceso víctima según un criterio de costo mínimo (prioridad más baja, menos tiempo computado, menos recursos retenidos), se lo aborta y se reejecuta el algoritmo de detección hasta que el ciclo desaparezca.\n3. **Expropiación de recursos con Rollback (Puntos de control):** Se despoja a un proceso de sus recursos y se revierte (*rollback*) su estado a un *checkpoint* guardado previamente, poniéndolo en espera hasta que los recursos se liberen.'
    },
    {
      order: 9,
      instruction: 'Problema 9: Definición de Estado Seguro',
      explanation: '**Definición Formal:**\nUn estado es **seguro** si el sistema puede asignar recursos a cada proceso (hasta su máximo declarado) en algún orden específico, sin que se produzca un interbloqueo.\n\nMás formalmente, un estado es seguro si existe al menos una **Secuencia Segura** de procesos:\n\n$$\\langle P_1, P_2, P_3, \\dots, P_n \\rangle$$\n\ntal que para cada $P_i$, la cantidad de recursos que aún puede solicitar ($Need_i$) puede ser satisfecha con los recursos actualmente disponibles en el sistema más los recursos retenidos por todos los procesos anteriores $P_j$ con $j < i$.\n\nSi existe dicha secuencia, cada proceso $P_i$ puede terminar con certeza, liberar sus recursos y permitir que el siguiente proceso avance.'
    },
    {
      order: 10,
      instruction: 'Problema 10: Diferencia entre Deadlock y Starvation',
      explanation: '**Deadlock (Interbloqueo):**\n- Dos o más procesos están **permanentemente bloqueados** porque cada uno espera un evento que solo otro proceso del conjunto puede generar.\n- Ningún proceso del conjunto puede avanzar; el estado no cambiará sin intervención externa (del SO o del operador).\n- No hay consumo de ciclos de CPU por parte de los procesos bloqueados.\n\n**Starvation (Inanición / Postergación Indefinida):**\n- Un proceso está en estado **Listo (Ready)** o esperando un recurso, pero el planificador o el asignador de recursos **lo posterga indefinidamente** porque siempre le da preferencia a otros procesos (por ejemplo, por prioridades más altas o algoritmos FIFO desfavorables).\n- A diferencia del deadlock, **el sistema sí está realizando trabajo útil** y otros procesos continúan avanzando.\n- Se soluciona mediante técnicas de envejecimiento (*aging*).'
    },
    {
      order: 11,
      instruction: 'Problema 11: Algoritmo del Banquero (Figura 1)',
      explanation: '**Datos del problema:**\nRecursos: 4 tipos. Disponible = `[1, 5, 2, 0]`\n\n**a) Matriz de Necesidad ($Need = Max - Allocation$):**\n- $P_0 = [0, 0, 1, 2] - [0, 0, 1, 2] = [0, 0, 0, 0]$\n- $P_1 = [1, 7, 5, 0] - [1, 0, 0, 0] = [0, 7, 5, 0]$\n- $P_2 = [2, 3, 5, 6] - [1, 3, 5, 4] = [1, 0, 0, 2]$\n- $P_3 = [0, 6, 5, 2] - [0, 6, 3, 2] = [0, 0, 2, 0]$\n- $P_4 = [0, 6, 5, 6] - [0, 0, 1, 4] = [0, 6, 4, 2]$\n\n**b) ¿Se encuentra en estado seguro?**\n**SÍ, es seguro.** Existe secuencia segura $\\langle P_0, P_2, P_3, P_4, P_1 \\rangle$:\n1. Disponible = `[1, 5, 2, 0]`. $Need_0 = [0, 0, 0, 0] \\le Disp \\implies P_0$ termina. Disp pasa a `[1, 5, 3, 2]`.\n2. $Need_2 = [1, 0, 0, 2] \\le [1, 5, 3, 2] \\implies P_2$ termina. Disp pasa a `[2, 8, 8, 6]`.\n3. $Need_3 = [0, 0, 2, 0] \\le [2, 8, 8, 6] \\implies P_3$ termina. Disp pasa a `[2, 14, 11, 8]`.\n4. $Need_4 = [0, 6, 4, 2] \\le [2, 14, 11, 8] \\implies P_4$ termina. Disp pasa a `[2, 14, 12, 12]`.\n5. $Need_1 = [0, 7, 5, 0] \\le [2, 14, 12, 12] \\implies P_1$ termina.\n\n**c) Si $P_1$ solicita `[0, 4, 2, 0]`, ¿puede satisfacerse de inmediato?**\n**SÍ.** \n- `Request <= Need_1` (`[0, 4, 2, 0] <= [0, 7, 5, 0]`)\n- `Request <= Disponible` (`[0, 4, 2, 0] <= [1, 5, 2, 0]`)\n- Al simular la asignación, el nuevo Disponible queda en `[1, 1, 0, 0]`. Se puede hallar la secuencia segura $\\langle P_0, P_2, P_3, P_4, P_1 \\rangle$. Por lo tanto, la solicitud se concede inmediatamente.'
    },
    {
      order: 12,
      instruction: 'Problema 12: Dificultades y Ventajas del Rollback',
      explanation: '**Dificultades del Rollback:**\n1. **Sobrecarga de almacenamiento y cómputo:** Requiere que el sistema guarde periódicamente puntos de control (*checkpoints*) en disco con el estado completo del proceso y sus archivos.\n2. **Operaciones irreversibles:** Si el proceso realizó operaciones hacia el exterior (enviar un paquete de red a un servidor externo, dispensar dinero o imprimir una hoja), esas acciones no se pueden "deshacer" físicamente.\n3. **Riesgo de inanición:** Si siempre se elige al mismo proceso como víctima para rollback, nunca terminará.\n\n**Ventajas del Rollback:**\n1. **Ahorro de cómputo:** Evita abortar el proceso completamente, conservando todo el trabajo realizado hasta el último checkpoint.\n2. **Tolerancia a fallos:** Permite una recuperación elegante y automática del sistema operativo sin intervención manual del usuario ni caída del sistema.'
    },
    {
      order: 13,
      instruction: 'Problema 13: Modificaciones que Preservan la Seguridad en el Banquero',
      explanation: '**Análisis para cada caso:**\n\n- **a) Incremento Disponible (nuevos recursos):** **SEGURO.** Disponer de más recursos libres nunca puede provocar que una secuencia previamente segura deje de serlo.\n- **b) Decremento Disponible:** **PUEDE SER INSEGURO.** Al tener menos recursos libres, alguna necesidad de los procesos puede no ser satisfecha.\n- **c) Incremento MAX:** **PUEDE SER INSEGURO.** Si un proceso declara que puede necesitar más recursos que antes, aumenta su matriz Need y puede romper secuencias seguras.\n- **d) Decremento MAX:** **SEGURO.** El proceso se compromete a requerir menos recursos; su vector Need se reduce, facilitando la búsqueda de secuencias seguras.\n- **e) Incremento del Número de Procesos:** **PUEDE SER INSEGURO.** Un nuevo competidor por los recursos existentes puede llevar al sistema a un estado inseguro.\n- **f) Decremento del Número de Procesos:** **SEGURO.** Al finalizar o eliminarse un proceso, se liberan sus recursos asignados y disminuye la competencia.'
    }
  ];

  // Insertar pasos para TP4
  console.log(`Insertando ${tp4Steps.length} pasos en TP4...`);
  for (const step of tp4Steps) {
    await prisma.step.create({
      data: {
        lessonId: tp4.id,
        order: step.order,
        instruction: step.instruction,
        explanation: step.explanation,
        codeSnippet: null
      }
    });
  }

  // Insertar pasos para TP5
  console.log(`Insertando ${tp5Steps.length} pasos en TP5...`);
  for (const step of tp5Steps) {
    await prisma.step.create({
      data: {
        lessonId: tp5.id,
        order: step.order,
        instruction: step.instruction,
        explanation: step.explanation,
        codeSnippet: null
      }
    });
  }

  console.log('\n¡Todos los pasos de TP4 y TP5 han sido insertados con éxito!');
}

seedTP4andTP5()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
