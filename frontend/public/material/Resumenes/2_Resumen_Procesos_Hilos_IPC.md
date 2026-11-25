# Tema 2: Procesos, Hilos (Threads) y Comunicación entre Procesos (IPC)
> **Cátedra:** Sistemas Operativos — UNS (2026)  
> **Material cubierto:** `SO- Procesos - 2026.pdf`, `SO- Hilos - 2026.pdf`, `Procesos - Hilos Operaciones SC y Fcs.- 2026.pdf`, `SO-Comunicación Mem-Mensa-2026.pdf`, `ipc_2026.pdf`, `procesos_hilos_2026.pdf`

---

## 1. Concepto de Proceso, Estados y PCB

- **Programa:** Entidad **pasiva** almacenada en disco (ejecutable).
- **Proceso:** Entidad **activa** — un programa en ejecución junto con su estado actual.
- **Disposición en memoria de un proceso:**
  - **Sección de texto (código):** Instrucciones del programa.
  - **Sección de datos:** Variables globales y estáticas.
  - **Heap:** Memoria asignada dinámicamente en tiempo de ejecución (`malloc`).
  - **Stack (pila):** Variables locales, parámetros de funciones y direcciones de retorno.

### 1.1 Diagrama de Estados (Modelo de 5 Estados)

```text
                (Admitir)                (Dispatch)
  [ NUEVO ] ──────────────► [ LISTO ] ──────────────► [ EJECUTANDO ] ──(exit)──► [ TERMINADO ]
                               ▲                           │
                               │   (Fin quantum /          │
                               │    Expropiación)          │
                               ├───────────────────────────┤
                               │                           │
                               │  (Fin E/S o evento)       │ (Espera E/S o evento)
                               │                           ▼
                               └──────────────────── [ BLOQUEADO ]
```

> **Regla de oro de examen:** Un proceso **NUNCA** pasa directamente de *Bloqueado* a *Ejecutando*; siempre pasa primero a *Listo*.

### 1.2 PCB (Process Control Block) y Cambio de Contexto
El **PCB** es la estructura del kernel que representa a cada proceso y almacena:
- Estado del proceso y PID.
- Contador de Programa (PC) y registros de la CPU.
- Información de planificación (prioridad, punteros a colas).
- Información de memoria (tablas de páginas, base/límite).
- Información contable (uso de CPU, límites de tiempo) y estado de E/S (archivos abiertos).

**Cambio de Contexto (*Context Switch*):** Guardar el estado del proceso saliente en su PCB y cargar el estado del entrante desde su PCB. Es **sobrecarga pura (*overhead*)**: la CPU no realiza trabajo útil mientras conmuta.

### 1.3 Colas y Tipos de Planificadores
- **Colas:** Cola de trabajos (*Job queue*), Cola de listos (*Ready queue*, residentes en RAM), Colas de dispositivos (*Device queues*).
- **Planificador de Largo Término (Jobs):** Selecciona qué programas entran a memoria/cola de listos. Controla el **grado de multiprogramación** y busca un buen equilibrio entre procesos **CPU-bound** (mucho cómputo) e **I/O-bound** (mucha E/S). Se invoca con poca frecuencia.
- **Planificador de Mediano Término (*Swapping*):** Saca procesos temporalmente de RAM hacia disco (suspendidos) y luego los reingresa para aliviar la memoria o mejorar la mezcla de procesos.
- **Planificador de Corto Término (CPU):** Selecciona el próximo proceso de la cola de listos y le asigna la CPU. Se ejecuta con altísima frecuencia (milisegundos) y debe ser muy rápido.

---

## 2. Operaciones sobre Procesos en UNIX/POSIX

Los procesos forman un **árbol de procesos** (en UNIX la raíz es `init`/`systemd`, PID 1).

| Operación | Función / Syscall | Comportamiento Clave |
| :--- | :--- | :--- |
| **Creación** | `pid_t fork(void);` | Duplica al proceso padre (Copy-on-Write). Retorna **`0` en el hijo**, **`PID del hijo (> 0)` en el padre**, y `-1` si falla. |
| **Reemplazo de imagen** | `execve()`, `execlp()`, `execv()` | Reemplaza completamente el código, datos, heap y stack del proceso actual por un nuevo ejecutable (conserva el PID). **Solo retorna si hay error.** |
| **Espera** | `wait(&status)` / `waitpid(pid, &st, opt)` | Bloquea al padre hasta que un hijo termine y recolecta su código de salida. |
| **Terminación** | `exit(code)` / `_exit(code)` | Libera los recursos del proceso y notifica al padre. |

- **Proceso Zombie:** Un hijo terminó (`exit`), pero su padre aún no ejecutó `wait()`, por lo que su entrada en la tabla de procesos (PCB) permanece ocupada esperando ser recolectada.
- **Proceso Huérfano:** El padre terminó antes que el hijo; el SO reasigna al hijo como descendiente de `init`/`systemd` (PID 1), que eventualmente hará `wait()`.
- **En Windows:** `CreateProcess()` crea un proceso nuevo cargando directamente el programa indicado (equivale a `fork()` + `exec()`).

---

## 3. Hilos (Threads / Procesos Livianos)

Un **hilo** es la unidad básica de utilización de la CPU dentro de un proceso.

### ¿Qué comparten y qué es privado entre hilos del mismo proceso?
- **Comparten:** Código, sección de datos (variables globales), heap y archivos abiertos / señales.
- **Privado de cada hilo:** Identificador de hilo (**TID**), **Contador de Programa (PC)**, **conjunto de registros** y **pila (*stack*) propia**.

### Beneficios principales
1. **Capacidad de respuesta:** Un hilo puede atender al usuario mientras otro está bloqueado en E/S.
2. **Compartición de recursos:** Comunicación directa por memoria del proceso sin invocar IPC del kernel.
3. **Economía:** Crear, terminar y conmutar entre hilos del mismo proceso es mucho más rápido y liviano que entre procesos.
4. **Escalabilidad:** Aprovechamiento real de arquitecturas **multicore**.

### Programación Multicore: Concurrencia vs Paralelismo
- **Concurrencia:** Múltiples tareas progresando intercaladas (posible en 1 solo núcleo).
- **Paralelismo:** Múltiples tareas ejecutando **simultáneamente** en distintos núcleos físicos.
  - **Paralelismo de Datos:** Distribuye subconjuntos de los mismos datos entre núcleos aplicando la misma operación.
  - **Paralelismo de Tareas:** Distribuye distintos hilos que realizan operaciones diferentes sobre los mismos o distintos datos.

### Hilos de Usuario (ULT) vs Hilos de Kernel (KLT)

| Criterio | ULT (Nivel de Usuario) | KLT (Nivel de Kernel) |
| :--- | :--- | :--- |
| **Administración** | Biblioteca en espacio de usuario; el kernel no conoce los hilos individuales. | Soportados y planificados directamente por el kernel del SO. |
| **Cambio de contexto** | **Muy rápido** (sin transición a modo kernel). | Más costoso (requiere modo kernel y cambio de estructuras del SO). |
| **Syscall bloqueante** | **Bloquea a TODO el proceso** (y todos sus ULT). | Solo bloquea al hilo invocante; otros KLT del proceso siguen corriendo. |
| **Multicore (SMP)** | **No aprovecha múltiples núcleos** (el kernel agenda 1 entidad). | **Paralelismo real** en múltiples núcleos. |
| **Sincronización con semáforo de kernel** | Peligroso: si un ULT se bloquea en un semáforo de kernel, congela al resto y puede causar **deadlock**. | Totalmente funcional y seguro. |

### Modelos Multihilados
1. **Muchos a Uno (N:1):** Varios ULT sobre 1 KLT (sin paralelismo real, bloqueo global).
2. **Uno a Uno (1:1):** Cada ULT mapea a 1 KLT. Máxima concurrencia; usado por **Linux** (vía syscall `clone()`) y **Windows**.
3. **Muchos a Muchos (M:N):** Multiplexa `M` ULT sobre `N ≤ M` KLT.
4. **Modelo de Dos Niveles:** Combina M:N permitiendo además atar (*bind*) hilos críticos a un KLT exclusivo (1:1).

### Conceptos adicionales de Hilos
- **Thread Pools (Pools de hilos):** Conjunto pre-creado de hilos esperando trabajo; reduce el costo de creación y acota el máximo de hilos concurrentes.
- **Cancelación de hilos:** **Asincrónica** (termina inmediatamente, puede dejar recursos sin liberar) vs **Diferida** (el hilo chequea periódicamente puntos seguros de cancelación).
- **API POSIX Pthreads:**
  - `pthread_create(&tid, attr, funcion, arg)`
  - `pthread_exit(retval)`
  - `pthread_join(tid, &retval)`

---

## 4. Comunicación entre Procesos (IPC)

Los procesos **cooperativos** (que se afectan entre sí para compartir información, acelerar cómputo o modularizar) requieren mecanismos **IPC** (*Inter-Process Communication*).

### 4.1 Comparativa de los 2 Modelos Fundamentales

| Aspecto | Memoria Compartida | Paso de Mensajes |
| :--- | :--- | :--- |
| **Mecanismo** | Múltiples procesos mapean la misma región de memoria física en su espacio de direcciones. | El SO intermedia las primitivas `send()` y `receive()`. |
| **Velocidad** | **Máxima** (velocidad de RAM; el kernel solo interviene al crear/mapear). | Menor (cada mensaje requiere syscalls y copia al/desde el kernel). |
| **Sincronización** | **Responsabilidad del programador** (semáforos, mutexes). | **Implícita** en las primitivas bloqueantes. |
| **Alcance** | Misma máquina. | Misma máquina o **sistemas distribuidos** en red. |

### 4.2 Variantes de Paso de Mensajes
- **Comunicación Directa:** Los procesos se nombran explícitamente (`send(P, msg)`, `receive(Q, msg)`). Exactamente un vínculo por par.
- **Comunicación Indirecta:** Mediante **buzones (*mailboxes*) / puertos**. Permite comunicación N a M y múltiples vínculos.
- **Sincronización:**
  - **Bloqueante (Sincrónica):** `send` bloqueante espera recepción; `receive` bloqueante espera llegada. Ambos bloqueantes = **Rendezvous**.
  - **No Bloqueante (Asincrónica):** `send` retorna de inmediato; `receive` devuelve mensaje válido o nulo.
- **Buffering:** Capacidad **0** (rendezvous), **limitada (`n`)** (emisor espera si está llena) o **ilimitada** (emisor nunca espera).

### 4.3 Herramientas IPC en UNIX/Linux (C)

#### 1. Pipes Anónimos (`pipe()`)
- Conducto **unidireccional** (estilo Productor-Consumidor) entre procesos **emparentados** (padre-hijo tras `fork()`).
- `int pfd[2]; pipe(pfd);` → `pfd[0]` lectura (`read`), `pfd[1]` escritura (`write`).
- **Regla crítica:** Cerrar siempre los extremos no utilizados en padre e hijo para tener un único punto de entrada/salida y garantizar la detección de **`EOF`** (`read()` retorna `0` cuando todos los descriptores de escritura se cierran).

#### 2. Segmentos de Memoria Compartida (System V y POSIX)
- **System V (visto en diapositivas UNS):**
  1. `id = shmget(KEY, size, IPC_CREAT | 0666)` — crea u obtiene el segmento.
  2. `ptr = shmat(id, NULL, 0)` — mapea el segmento al espacio de direcciones del proceso.
  3. `shmdt(ptr)` — desvincula el segmento.
  4. `shmctl(id, IPC_RMID, NULL)` — marca el segmento para eliminación.
- **POSIX:** `shm_open()` + `ftruncate()` + `mmap(..., MAP_SHARED, ...)` + `munmap()` + `shm_unlink()`.

#### 3. Colas de Mensajes (System V)
- Permiten enviar mensajes tipados a procesos **no necesariamente emparentados**.
- Estructura obligatoria (primer campo siempre `long`):
  ```c
  struct mensaje {
      long tipo;   // Debe ser > 0
      int dato;
  };
  ```
- **Primitivas:**
  - `id = msgget(key, IPC_CREAT | 0666)` — crea/asocia la cola.
  - `msgsnd(id, &msg, sizeof(struct mensaje) - sizeof(long), 0)` — envía (¡la longitud excluye `long tipo`!).
  - `msgrcv(id, &msg, longitud, msgtyp, 0)` — recibe según `msgtyp`:
    - `msgtyp == 0`: primer mensaje de la cola (FIFO).
    - `msgtyp > 0`: primer mensaje cuyo tipo sea exactamente `msgtyp`.
    - `msgtyp < 0`: primer mensaje con tipo menor o igual a `|msgtyp|` (el de menor valor).
  - `msgctl(id, IPC_RMID, NULL)` — elimina la cola del kernel.

---

## 5. Claves del Trabajo Práctico 2 (TP2 — Procesos, Hilos e IPC)

### 5.1 Modelo de 7 Estados (Stallings) y Estados Suspendidos
Además de los 5 estados clásicos, cuando se incorpora *swapping* (planificador de mediano término) aparecen dos estados en memoria secundaria:
- **Listo/Suspendido:** El proceso está listo para ejecutar apenas se cargue en RAM, pero fue enviado a disco.
- **Bloqueado/Suspendido:** El proceso está en disco esperando un evento/E/S; al ocurrir el evento pasa a **Listo/Suspendido**.
- **Bloqueado vs Suspendido:** En el uso estándar moderno, *Bloqueado* = esperando recurso/E/S en RAM, mientras *Suspendido* = desalojado a memoria secundaria (*swapped out*).
- **Política intermedia Listo vs Listo/Suspendido (TP2 ej. 9):** Si hay un proceso en *Listo/Suspendido* con mayor prioridad que todos los de *Listo*, elegir siempre *Listo* ignora prioridades y elegir siempre el más prioritario puede causar excesivo *swapping*. Una **política intermedia** aplica *swapping* solo si la diferencia de prioridad supera un umbral o el proceso lleva esperando cierto tiempo mínimo (envejecimiento).

### 5.2 Trazas Entrelazadas con el Dispatcher y Espera de Eventos
- **Trazas de CPU (TP2 ej. 7):** El procesador ejecuta instrucciones del proceso actual hasta agotar su ráfaga/quantum (ej. 5 instrucciones) o encontrar una operación `<I/O>`. En ese punto ejecuta el **dispatcher** (ej. 4 instrucciones del SO) para salvar contexto y cargar el siguiente proceso listo.
- **Esperar múltiples eventos (TP2 ej. 8 y 12):**
  - Un proceso **sí puede** esperar simultáneamente varios eventos usando primitivas multiplexadas (`select`, `poll`, `epoll`), `receive` no bloqueante o múltiples hilos.
  - **Con Mailboxes (A y B):**
    - Esperar un mensaje de **A Y uno de B:** Basta hacer dos `receive` bloqueantes consecutivos (`receive(A, m1); receive(B, m2);`).
    - Esperar un mensaje de **A O de B (el que llegue primero):** No sirven dos `receive` bloqueantes (si A no llega, nunca leería B); se debe usar **`receive` no bloqueante** (sondeo/`select`) o **un hilo por mailbox**.

### 5.3 Rendimiento de Multithreading y Modelo Muchos-a-Muchos (TP2 ej. 15–18)
- **¿Cuándo multithreading NO mejora el rendimiento?**
  1. Tareas estrictamente secuenciales con fuertes dependencias de datos entre pasos.
  2. Tareas muy cortas donde el *overhead* de crear, sincronizar y conmutar hilos supera al tiempo de cómputo real (o alta contención sobre un único lock).
- **ULT en multiprocesador:** Una solución con hilos puramente a nivel de usuario **NO mejora** en un multiprocesador respecto a un monoprocesador porque el kernel planifica al proceso como un único flujo en 1 solo núcleo.
- **Rendimiento del modelo Muchos-a-Muchos (`ULT > P` núcleos) según cantidad de KLT (`k`):**
  - **`k < P`:** Subutilización del hardware — quedan procesadores ociosos aunque haya ULT listos.
  - **`k == P`:** Permite usar todos los núcleos si ningún hilo se bloquea, pero apenas 1 KLT ejecuta una syscall bloqueante de E/S, un núcleo queda ocioso.
  - **`P < k < ULT`:** **Escenario óptimo** — si algún KLT se bloquea en E/S, otro KLT disponible puede ocupar inmediatamente el procesador libre sin crear un KLT por cada ULT.
