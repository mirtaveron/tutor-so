# 🎓 Resumen Integral de Examen Parcial: Sistemas Operativos (UNS)
> **Cátedra:** Sistemas Operativos — Departamento de Ciencias e Ingeniería de la Computación (UNS)  
> **Bibliografía base:** Silberschatz, Galvin & Gagne (*Operating System Concepts*), Tanenbaum & Bos (*Modern Operating Systems*), Stallings (*Operating Systems: Internals and Design Principles*).  
> **Formato:** Guía de estudio y resolución de exámenes parciales lista para imprimir.

---

## ÍNDICE RÁPIDO
1. [Conceptos Generales, Modos de Operación y Arquitectura](#1-conceptos-generales-modos-de-operación-y-arquitectura)
2. [Procesos, Hilos (Threads) y Comunicación (IPC)](#2-procesos-hilos-threads-y-comunicación-ipc)
3. [Planificación de CPU y Sistemas de Tiempo Real](#3-planificación-de-cpu-y-sistemas-de-tiempo-real)
4. [Sincronización, Sección Crítica y Problemas Clásicos](#4-sincronización-sección-crítica-y-problemas-clásicos)
5. [Interbloqueos (Deadlocks) y Algoritmo del Banquero](#5-interbloqueos-deadlocks-y-algoritmo-del-banquero)
6. [Formulario Mnemotécnico y Trucos de Parcial](#6-formulario-mnemotécnico-y-trucos-de-parcial)

---

## 1. CONCEPTOS GENERALES, MODOS DE OPERACIÓN Y ARQUITECTURA

### 1.1 Funciones Principales de un Sistema Operativo
1. **Administrador de Recursos (Resource Manager):** Asigna de forma eficiente, equitativa y segura los recursos físicos y lógicos (CPU, memoria, disco, red, periféricos de E/S) entre múltiples programas y usuarios en competencia.
2. **Máquina Extendida / Abstracción (Virtual Machine):** Oculta las complejidades del hardware subyacente (registros de controladores, temporizadores, interrupciones) ofreciendo una interfaz limpia, uniforme y amigable (archivos, procesos, sockets) a través de llamadas al sistema (*System Calls*).

### 1.2 Modo Dual de Operación (Modo Usuario vs Modo Kernel)
* **¿Por qué es indispensable?** Para garantizar la **protección del sistema**. Impide que un programa de usuario con errores o malicioso tome el control total del procesador, lea memoria de otros procesos o destruya el sistema de archivos.
* **Soporte de Hardware:** El procesador posee un registro de estado con un **bit de modo** (*Mode Bit*):
  * `Bit = 1` → **Modo Usuario:** Las instrucciones privilegiadas están inhabilitadas.
  * `Bit = 0` → **Modo Kernel / Monitor / Privilegiado:** La CPU tiene acceso irrestricto a todas las instrucciones de máquina, registros de control y al espacio completo de memoria.
* **Instrucciones Privilegiadas (Solo Modo Kernel):**
  * Modificar el temporizador de la CPU (*Timer*).
  * Deshabilitar/habilitar interrupciones de hardware.
  * Modificar registros de la tabla de páginas / registros base y límite de la MMU.
  * Acceder directamente a puertos de E/S de hardware (`in`, `out`).
  * Cambiar de modo usuario a modo kernel manualmente (solo el hardware conmuta a kernel ante eventos protegidos).
* *Instrucciones NO Privilegiadas:* Leer el reloj del sistema, ejecutar operaciones aritméticas, invocar una llamada al sistema mediante trap, cambiar voluntariamente de modo kernel a modo usuario.

### 1.3 Eventos que provocan la Transición de Modo Usuario a Modo Kernel
Existen 3 eventos fundamentales:
1. **Llamadas al Sistema (System Calls):** Solicitud voluntaria y sincrónica de software para pedir un servicio protegido (ej. `read()`, `write()`, `fork()`).
2. **Interrupciones de Hardware:** Señales eléctricas asincrónicas originadas por dispositivos físicos externos (ej. fin de lectura de disco, pulsación de teclado, interrupción del timer de la CPU).
3. **Excepciones o Traps:** Eventos sincrónicos generados por la propia CPU ante un error o condición anormal de la instrucción en ejecución (ej. división por cero, fallo de página / *page fault*, violación de segmento).

> [!IMPORTANT]
> **Pregunta de Parcial Típica: "Describa cronológicamente las acciones del SO cuando un proceso ejecuta `read()` sobre un archivo de disco"**
> 1. El proceso en modo usuario coloca los argumentos (descriptor de archivo, buffer, tamaño) en registros o pila y ejecuta la instrucción trampa (`syscall` o `int 0x80`).
> 2. El hardware cambia automáticamente el **bit de modo a 0 (Modo Kernel)**, salva el Program Counter (PC) y Stack Pointer (SP) del usuario en la pila del kernel, indexa la **Tabla de Vectores de Interrupción (IDT)** y salta al despachador de llamadas del SO.
> 3. El SO valida los parámetros y permisos; el subsistema de archivos determina los bloques lógicos y solicita al controlador de disco la transferencia mediante **DMA** (*Direct Memory Access*).
> 4. Como la E/S de disco es lenta, el planificador cambia el estado del proceso de **Ejecución a Bloqueado (Waiting)** y ejecuta un cambio de contexto despachando a otro proceso listo.
> 5. Cuando el disco finaliza la transferencia física a la memoria RAM, el controlador emite una **Interrupción de Hardware**.
> 6. La rutina de atención de la interrupción marca al proceso solicitante como **Listo (Ready)**.
> 7. Cuando el planificador vuelve a otorgarle la CPU, el SO ejecuta `sysret` / `iret`: se restaura el contexto del proceso, el bit de modo vuelve a **1 (Modo Usuario)** y el proceso retoma inmediatamente después de la instrucción `read()`.

### 1.4 Estructuras de Kernel: Monolítico vs Microkernel vs Modular
| Criterio | Kernel Monolítico | Arquitectura Microkernel | Kernel Modular (Moderno) |
| :--- | :--- | :--- | :--- |
| **Componentes en Kernel** | Todo: Scheduler, Memoria, File System, Drivers de dispositivos, Red. | Mínimo indispensable: Scheduler básico, memoria virtual elemental e IPC. | Núcleo base con capacidad de cargar dinámicamente módulos (LKM). |
| **Servicios del SO** | Ejecutan en el mismo espacio de direcciones del kernel. | Ejecutan como **procesos servidores en espacio de usuario** (FS, Drivers, Network). | Módulos cargados en espacio de kernel según necesidad (ej. Linux). |
| **Comunicación** | Llamadas a funciones internas directas en memoria (muy rápido). | **Paso de Mensajes (IPC)** continuo a través del microkernel. | Enlace dinámico de símbolos y llamadas a funciones directas. |
| **Robustez / Seguridad** | Baja: si un driver tiene un bug, corrompe la memoria del kernel y cuelga el SO. | **Alta:** si un driver o FS falla, solo se cae ese proceso servidor y se reinicia; el kernel sobrevive. | Intermedia: módulos no probados pueden causar *Kernel Panic*. |
| **Rendimiento** | **Máximo** (sin overhead de IPC ni conmutación de contexto continua). | Menor: alto overhead por múltiples cambios de contexto y copias de mensajes. | Óptimo: flexibilidad sin el costo de IPC del microkernel. |

---

## 2. PROCESOS, HILOS (THREADS) Y COMUNICACIÓN (IPC)

### 2.1 Concepto de Proceso vs Hilo
* **Proceso:** Programa en ejecución. Unidad de asignación de recursos y protección (posee su propio espacio de direcciones virtuales, tablas de descriptores de archivos, variables globales y PCB).
* **Hilo (Thread):** Unidad básica de utilización de la CPU. Un proceso puede contener múltiples hilos que **comparten**: código, variables globales (sección de datos), archivos abiertos y memoria dinámica (heap); pero cada hilo posee de forma **privada**:
  * Identificador de hilo (TID).
  * Contador de programa (PC).
  * Conjunto de registros de CPU.
  * Pila de ejecución propia (*Call Stack* para variables locales y llamadas a funciones).

### 2.2 Diagrama de Estados de un Proceso
```
      [Admitir]               [Dispatch]
(NUEVO) ------> [LISTO (Ready)] --------> [EJECUCIÓN (Running)] ------> (TERMINADO)
                      ^                         |                [Exit]
                      |    [Timer / Preemption] |
                      +-------------------------+
                      |                         |
                      |   [Fin de Evento / E/S] | [Espera de Evento / E/S]
                      +----------------- [BLOQUEADO (Waiting)]
```

* **Transiciones Clave:**
  * **Listo → Ejecución:** El planificador (*Dispatcher*) elige al proceso y le asigna la CPU.
  * **Ejecución → Listo:** Expiración del quantum de tiempo (Round Robin) o arribo de un proceso de mayor prioridad (Apropiación).
  * **Ejecución → Bloqueado:** El proceso invoca una operación bloqueante (solicitud de E/S, `wait` de un semáforo en 0, `Sleep()`).
  * **Bloqueado → Listo:** Ocurre el evento esperado (interrupción de fin de E/S, señal `signal` de semáforo). **¡NUNCA pasa directamente de Bloqueado a Ejecución!**

### 2.3 Hilos de Usuario (ULT) vs Hilos de Kernel (KLT)
| Característica | Hilos a Nivel de Usuario (ULT) | Hilos a Nivel de Kernel (KLT) |
| :--- | :--- | :--- |
| **Gestión** | Íntegramente por una librería en espacio de usuario (`pthreads` modo usuario). El kernel desconoce su existencia. | Directamente por las llamadas al sistema del kernel del SO. |
| **Cambio de Contexto** | **Extremadamente rápido:** No requiere conmutar a modo kernel ni cambiar estructuras privilegiadas. | Más lento: Requiere trampa a modo kernel, salvar registros en el TCB y conmutar pilas de kernel. |
| **Llamadas Bloqueantes** | **Crítico:** Si un ULT ejecuta una syscall bloqueante, el kernel **bloquea a todo el proceso** y a todos los demás hilos de usuario. | Ventajoso: El kernel solo bloquea al hilo específico y planifica otro hilo del mismo proceso. |
| **Multiprocesamiento (SMP)** | **No aprovecha múltiples núcleos:** El kernel ve al proceso como un único hilo y solo lo ejecuta en 1 núcleo a la vez. | **Verdadero paralelismo:** El kernel puede despachar distintos hilos del mismo proceso en núcleos físicos distintos. |

### 2.4 Modelos de Comunicación entre Procesos (IPC)
* **Memoria Compartida (Shared Memory):**
  * *Mecanismo:* Dos procesos mapean la misma región de memoria física en sus tablas de páginas.
  * *Ventaja:* **Máxima velocidad**; los intercambios ocurren a velocidad de bus de memoria sin intervención del SO.
  * *Desventaja:* La sincronización para evitar condiciones de carrera recae enteramente en el programador.
* **Paso de Mensajes (Message Passing):**
  * *Mecanismo:* Primitivas `send()` y `receive()` gestionadas por el SO.
  * *Ventaja:* Muy estructurado, sin problemas de memoria compartida; extensible a sistemas distribuidos en red.
  * *Desventaja:* Menor velocidad debido al overhead de copiar mensajes al buffer del kernel y ejecutar llamadas al sistema.

---

## 3. PLANIFICACIÓN DE CPU Y SISTEMAS DE TIEMPO REAL

### 3.1 Criterios de Planificación
* **Utilización de CPU:** Porcentaje de tiempo que la CPU está ocupada realizando trabajo útil (meta: maximizar, 40% a 90%).
* **Throughput (Rendimiento):** Número de procesos completados por unidad de tiempo.
* **Turnaround Time (Tiempo de Retorno):** Intervalo desde que un proceso llega hasta que finaliza (T_{retorno} = T_{fin} - T_{llegada}).
* **Waiting Time (Tiempo de Espera):** Tiempo total que el proceso pasó esperando en la cola de Listos.
* **Response Time (Tiempo de Respuesta):** Tiempo desde la solicitud hasta la **primera** respuesta visible (crítico en interactivos).

### 3.2 Algoritmos Clásicos
* **FCFS (First-Come, First-Served):** No apropiativo. Sufre del *Efecto Convoy* (procesos cortos esperando detrás de uno largo con alta ráfaga de CPU).
* **SJF (Shortest Job First):** Minimiza el tiempo de espera promedio. En su versión apropiativa se denomina **SRTF** (*Shortest Remaining Time First*). Problema: Imposible conocer la duración exacta de la próxima ráfaga (se aproxima por media exponencial τ_(n+1) = α · t_n + (1 - α) · τ_n).
* **Round Robin (RR):** Orientado a tiempo compartido. Utiliza una cola FIFO circular y un **Quantum de tiempo (q)**:
  * Si q → ∞, RR degenera en **FCFS**.
  * Si q es muy pequeño, el overhead por continuos cambios de contexto destruye el rendimiento. (Regla empírica: el 80% de las ráfagas de CPU deben ser más cortas que q).
* **Planificación por Prioridades:** Puede ser apropiativa o no. Problema principal: **Inanición (Starvation)** de procesos de baja prioridad. Solución: **Envejecimiento (Aging)**, aumentando la prioridad con el paso del tiempo.

### 3.3 Inversión de Prioridades y Protocolo de Herencia (PIP)
> [!WARNING]
> **Tema Clave de Examen:**
> Ocurre cuando un proceso de alta prioridad (P3) requiere un recurso exclusivo que está en poder de un proceso de baja prioridad (P1). Un proceso de prioridad intermedia (P2) que no necesita el recurso expulsa a P1 de la CPU porque P_2 > P_1. En consecuencia, P2 se ejecuta libremente demorando a P1, lo que indirectamente mantiene bloqueado a P3 (¡un proceso de prioridad media posterga al de máxima prioridad!).

* **Solución: Protocolo de Herencia de Prioridad (Priority Inheritance Protocol):**
  * Cuando P3 se bloquea esperando el recurso retenido por P1, **P1 hereda temporalmente la prioridad de P3**.
  * Ahora P1 tiene mayor prioridad que P2, impidiendo que P2 lo desaloje. P1 termina su sección crítica rápidamente, libera el recurso con `signal()`, recupera su prioridad baja original y P3 toma inmediatamente la CPU.
* **¿Qué ocurre si la espera se implementa con Spinlocks (Espera Ocupada)?**
  * Si P3 usa spinlock (`while(recurso_ocupado);`), al ser de mayor prioridad que P1, P3 **nunca cede la CPU**. Por lo tanto, P1 jamás puede ejecutar para liberar el recurso → **Bloqueo mutuo catastrófico e inanición permanente**.

### 3.4 Sistemas de Tiempo Real: Rate Monotonic (RM) y Earliest Deadline First (EDF)
* **Parámetros:** Para cada tarea periódica τ_i: Tiempo de cómputo (C_i o t_i), Período (T_i o p_i), Plazo (D_i). Si no se especifica lo contrario, D_i = T_i.
* **Factor de Utilización Total:**
  **U = Σ (Ci / Ti)**

#### Algoritmo RM (Rate Monotonic) — Prioridades Estáticas
* **Regla:** A menor período (T_i), **mayor prioridad** (tareas de mayor frecuencia tienen preferencia).
* **Cota de Liu & Layland (Condición Suficiente):**
  **U ≤ n · (2^(1/n) - 1)**
  * Para n = 1 ⇒ U ≤ 1.0 (100%)
  * Para n = 2 ⇒ U ≤ 2 · (√2 - 1) ≈ 0.8284 (82.8%)
  * Para n = 3 ⇒ U ≤ 3 · (³√2 - 1) ≈ 0.7798 (78.0%)
  * Para n → ∞ ⇒ U ≤ ln(2) ≈ 0.693 (69.3%)
* **¿Qué pasa si U > Cota de Liu & Layland pero U ≤ 1.0?**
  La cota es **suficiente pero no necesaria**. No se puede descartar la tarea; se debe realizar el **Análisis de Tiempo de Respuesta en el Peor Caso (RTA - Response Time Analysis)** de forma iterativa:
  **R_i^(0) = C_i**
  **R_i^(k+1) = C_i + Σ ( ⌈ R_i^(k) / T_j ⌉ · C_j )**
  *(Donde hp(i) son las tareas de mayor prioridad que i). La iteración termina cuando R_i^{(k+1)} = R_i^{(k)}. Si R_i ≤ D_i, la tarea cumple su plazo.*

#### Algoritmo EDF (Earliest Deadline First) — Prioridades Dinámicas
* **Regla:** La tarea con el plazo absoluto más cercano (d_i) recibe la máxima prioridad en cada instante.
* **Criterio Óptimo:** Un conjunto de tareas periódicas con D_i = T_i es planificable con EDF si y solo si:
  **U ≤ 1.0 (100% de la CPU)**

---

## 4. SINCRONIZACIÓN, SECCIÓN CRÍTICA Y PROBLEMAS CLÁSICOS

### 4.1 Requisitos de la Sección Crítica
1. **Exclusión Mutua:** Si un proceso está ejecutando en su sección crítica, ningún otro proceso puede estar en ella.
2. **Progreso:** Si ningún proceso está en su sección crítica y varios desean entrar, solo aquellos que no están en su sección restante pueden participar en la decisión de quién entra, y esta decisión no puede postergarse indefinidamente.
3. **Espera Acotada (Bounded Waiting):** Existe un límite en el número de veces que otros procesos pueden entrar a la sección crítica después de que un proceso solicitó entrar y antes de que se le conceda (evita la inanición).

### 4.2 Espera Ocupada (Spinlock) vs Bloqueo (Sleep/Wakeup)
* **Espera Ocupada:** El proceso ejecuta un bucle continuo (`while`). 
  * *Preferible:* En sistemas **multiprocesador (SMP)** si el tiempo estimado de espera es **muy corto** (menor al costo de dos cambios de contexto), porque evita el costo de dormir y despertar al hilo.
* **Bloqueo:** El proceso se desplanifica y entra a una cola de espera.
  * *Preferible:* En sistemas **monoprocesador** o cuando el tiempo de espera es largo o indefinido (ej. operaciones de E/S).

### 4.3 Primitivas de Sincronización
* **Semáforos (Dijkstra):** Variable entera protegida con dos operaciones atómicas:
  * `wait(S)` / `down(S)` / `P(S)`: Decrementa `S`. Si `S < 0`, el proceso se bloquea.
  * `signal(S)` / `up(S)` / `V(S)`: Incrementa `S`. Si `S <= 0`, despierta a un proceso bloqueado.
* **Semáforo Binario vs Mutex:**
  * El **Mutex** posee **propiedad (ownership)**: solo el hilo que adquirió el cerrojo puede liberarlo.
  * El **Semáforo Binario** no tiene dueño: un hilo puede hacer `down()` y otro hilo distinto o una interrupción puede hacer `up()`.
* **Monitores:** Mecanismo estructurado de alto nivel soportado por el lenguaje/compilador. Garantiza **exclusión mutua automática** (solo un proceso activo dentro del monitor). Utiliza variables de tipo `condition` con operaciones:
  * `c.wait()`: El proceso se bloquea y libera el cerrojo del monitor.
  * `c.signal()`: Reanuda a un proceso suspendido en `c` (si no hay ninguno, la señal no tiene efecto; a diferencia del semáforo, **no tiene memoria**).

### 4.4 Problemas Clásicos Resueltos

#### A. Productor - Consumidor (Buffer Limitado)
```c
semaphore mutex = 1;      // Protege el acceso al buffer
semaphore vacio = N;      // Cuenta lugares libres disponibles
semaphore lleno = 0;      // Cuenta elementos producidos disponibles

void Productor() {
    while(1) {
        item = producir();
        wait(vacio);      // 1° Asegurar espacio (¡NUNCA INVERTIR CON EL MUTEX!)
        wait(mutex);      // 2° Exclusión mutua
        insertar(item);
        signal(mutex);
        signal(lleno);    // Avisa que hay un nuevo elemento
    }
}

void Consumidor() {
    while(1) {
        wait(lleno);      // 1° Asegurar que haya elementos
        wait(mutex);      // 2° Exclusión mutua
        item = remover();
        signal(mutex);
        signal(vacio);    // Avisa que se liberó un lugar
        consumir(item);
    }
}
```
> [!CAUTION]
> **Error típico de Parcial:** Si en el Productor se invierte el orden a `wait(mutex); wait(vacio);` y el buffer está lleno (`vacio = 0`), el productor toma el mutex y se duerme en `vacio`. Cuando el consumidor quiere vaciar un lugar, ejecuta `wait(lleno)` y luego `wait(mutex)`, pero se bloquea porque el productor retiene el mutex → **Deadlock permanente**.

#### B. Lectores y Escritores (Preferencia Escritores con Monitores)
* *Regla:* Múltiples lectores pueden leer a la vez. Si llega un escritor, los nuevos lectores se bloquean para evitar que los lectores monopolicen el archivo indefinidamente (*inanición de escritores*).

#### C. Filósofos Comensales (Evitar Deadlock)
* El deadlock ocurre si todos toman a la vez el tenedor izquierdo (espera circular).
* **Soluciones para examen:**
  1. **Ruptura de asimetría:** Filósofos pares toman primero izquierdo y luego derecho; filósofos impares toman primero derecho y luego izquierdo.
  2. **Toma atómica:** Usar un mutex y un array `estado[N]` (Pensando, Hambriento, Comiendo) tomando ambos tenedores juntos mediante una función `test(i)`.
  3. **Límite de comensales:** Permitir como máximo N-1 filósofos en la mesa usando un semáforo contador inicializado en N-1.

---

## 5. INTERBLOQUEOS (DEADLOCKS) Y ALGORITMO DEL BANQUERO

### 5.1 Condiciones Necesarias de Coffman (Deben darse las 4 simultáneamente)
1. **Exclusión Mutua:** Al menos un recurso no compartible.
2. **Retención y Espera (Hold and Wait):** Un proceso retiene recursos mientras solicita otros adicionales.
3. **No Expropiación (No Preemption):** Los recursos no pueden ser confiscados por la fuerza; solo se liberan voluntariamente.
4. **Espera Circular:** Cadena cerrada {P0, P1, ..., Pn} tal que P0 espera por un recurso retenido por P1, y P_n espera por un recurso retenido por P0.

### 5.2 Estrategias de Tratamiento
* **Avestruz:** Ignorar el problema (Windows y Linux lo adoptan para no penalizar el rendimiento del sistema).
* **Prevención:** Diseñar protocolos para invalidar a priori alguna de las 4 condiciones (ej. ordenar los recursos globalmente y obligar a pedirlos en orden estrictamente creciente para romper la espera circular).
* **Evasión:** Algoritmo del Banquero de Dijkstra (requiere conocer la demanda máxima Max de antemano).
* **Detección y Recuperación:** Se ejecuta periódicamente un algoritmo que busca ciclos en el grafo de recursos. Si hay deadlock, se recupera mediante:
  1. Abortar todos los procesos del ciclo (muy destructivo).
  2. Abortar procesos de a uno por costo hasta romper el ciclo.
  3. Expropiar recursos y hacer **Rollback** a un *Checkpoint* seguro.

### 5.3 Deadlock vs Inanición (Starvation)
| Aspecto | Interbloqueo (Deadlock) | Inanición (Starvation) |
| :--- | :--- | :--- |
| **Definición** | Dos o más procesos están permanentemente bloqueados esperando eventos que solo los otros del conjunto pueden generar. | Un proceso listo es postergado indefinidamente porque el sistema siempre otorga preferencia a otros. |
| **Actividad de la CPU** | Cero avance; ningún proceso del grupo progresa. | El sistema avanza y realiza trabajo útil continuo, pero ese proceso particular no. |
| **Resolución** | Requiere intervención externa (abortar o expropiar). | Se corrige mediante envejecimiento (*aging*) o colas equitativas (FIFO). |

### 5.4 Algoritmo del Banquero (Guía Práctica Paso a Paso)
> [!IMPORTANT]
> **Paso 1: Calcular la Matriz de Necesidad (Need)**
> **Need[i, j] = Max[i, j] - Allocation[i, j]**

> **Paso 2: Calcular el Vector Disponible (Available)**
> **Available = Existencias_Totales - Σ Allocation**

> **Paso 3: Algoritmo de Seguridad**
> 1. Inicializar Work = Available y Finish[i] = false para todos los procesos.
> 2. Buscar un proceso Pi tal que:
>    **Finish[i] == false  y  Need_i ≤ Work**
>    * Si no existe ninguno y todos tienen Finish == true, el sistema es **SEGURO**.
>    * Si no existe ninguno y quedan procesos con Finish == false, el sistema es **INSEGURO**.
> 3. Si se encuentra dicho Pi:
>    **Work = Work + Allocation_i**
>    **Finish[i] = true**
>    Volver al paso 2.

> **Paso 4: Evaluación de una Solicitud (Request_i)**
> 1. Si Request_i ≤ Need_i (no pide más de lo declarado).
> 2. Si Request_i ≤ Available (hay recursos libres suficientes).
> 3. Simular la asignación:
>    * Available' = Available - Request_i
>    * Allocation_i' = Allocation_i + Request_i
>    * Need_i' = Need_i - Request_i
> 4. Aplicar el Algoritmo de Seguridad al estado simulado:
>    * Si es **Seguro** → **Se concede la solicitud de inmediato**.
>    * Si es **Inseguro** → **El proceso debe esperar** (la solicitud no se concede).

---

## 6. FORMULARIO MNEMOTÉCNICO Y TRUCOS DE PARCIAL

### 📌 Fórmula de Cintas / Recursos Libres de Bloqueo
Si hay m recursos idénticos y n procesos, donde cada proceso necesita a lo sumo K recursos:
**Garantizado Libre de Deadlock si y solo si:  m ≥ n · (K - 1) + 1**
*Ejemplo clásico de la UNS:* Si m = 6 unidades de cinta y cada proceso necesita K = 2:
**6 ≥ n · (2 - 1) + 1  ⇒  6 ≥ n + 1  ⇒  n ≤ 5**
*(Hasta 5 procesos concurrentes nunca se bloquearán; con 6 procesos puede haber deadlock).*

### 📌 Modificaciones al Banquero que NUNCA provocan Estado Inseguro
* ✅ **Incrementar Disponible:** Nuevos recursos físicos libres siempre aumentan o mantienen las secuencias seguras.
* ✅ **Decrementar MAX:** Un proceso declara que necesitará menos recursos (reduce Need).
* ✅ **Decrementar Número de Procesos:** Menos competencia y se liberan recursos al terminar.
* ❌ *Decrementar Disponible, Incrementar MAX o Añadir Procesos PUEDEN pasar el sistema a Inseguro.*

### 📌 Resumen de Sincronización y Flags
* Si un código hace `up(&mutex)` **antes** de `test()` de los vecinos en los filósofos → **Condición de carrera**.
* Si un productor hace `down(&mutex)` **antes** de `down(&vacio)` → **Riesgo de deadlock**.
* Si la espera en herencia de prioridad se hace con **spinlocks** en monoprocesador → **Bloqueo mutuo permanente**.
* Si un proceso libera un recurso A **antes** de solicitar el recurso B → **No hay espera circular con otro que pida B y luego A (No hay deadlock)**.
