# Tema 3: Planificación de Procesos, Multiprocesadores y Tiempo Real
> **Cátedra:** Sistemas Operativos — UNS (2026)  
> **Material cubierto:** `SO- Planificacion de Procesos - Conceptos Grales - 2026.pdf`, `SO- Planificacion de Procesos - Multiprocesadores y Tpo Real - 2026.pdf`, `SO - Ejemplos Procesos y Planificación - 2026.pdf`

---

## 1. Fundamentos y Criterios de Planificación

La ejecución de un proceso alterna ciclos de **ráfagas de CPU** y **esperas de E/S**. La multiprogramación aprovecha las esperas de E/S para mantener ocupada la CPU.

### 1.1 Decisiones del Planificador: Apropiativo vs No Apropiativo
Las decisiones de planificación ocurren cuando un proceso:
1. Pasa de **Ejecutando → Bloqueado** (ej. solicitud de E/S o `wait()`).
2. Pasa de **Ejecutando → Listo** (ej. vence el quantum o llega otro proceso prioritario).
3. Pasa de **Bloqueado → Listo** (ej. finalización de E/S).
4. **Termina** (`exit`).

- **Planificación No Apropiativa (Cooperativa):** Solo planifica en **1 y 4**; el proceso conserva la CPU hasta terminar o bloquearse voluntariamente.
- **Planificación Apropiativa (Preemptive):** También planifica en **2 y 3**; el SO puede desalojar un proceso en ejecución. Exige cuidado con datos compartidos en el kernel.

### 1.2 Despachador (*Dispatcher*)
Módulo que entrega efectivamente la CPU al proceso elegido: realiza el cambio de contexto, conmuta a modo usuario y salta a la dirección de reanudación. El tiempo que tarda se llama **Latencia de Despacho** (debe ser mínima).

### 1.3 Criterios de Evaluación
| Métrica | Definición | Meta |
| :--- | :--- | :---: |
| **Utilización de CPU** | Porcentaje de tiempo en que la CPU realiza trabajo útil. | Maximizar |
| **Throughput (Rendimiento)** | Cantidad de procesos finalizados por unidad de tiempo. | Maximizar |
| **Tiempo de Retorno (*Turnaround*)** | Desde que llega el proceso hasta que termina: `T_retorno = T_fin - T_llegada`. | Minimizar |
| **Tiempo de Espera (*Waiting*)** | Suma de tiempos que el proceso pasa en la cola de **Listos**. | Minimizar |
| **Tiempo de Respuesta (*Response*)** | Desde que llega la solicitud hasta la **primera** respuesta (clave en interactivos). | Minimizar |

---

## 2. Algoritmos Clásicos de Planificación

### 2.1 FCFS (First-Come, First-Served)
- Cola FIFO, **no apropiativo**.
- Simple, sin inanición, pero con mal tiempo medio de espera.
- **Efecto Convoy:** Procesos cortos (I/O-bound) quedan atascados detrás de un proceso largo (CPU-bound).

### 2.2 SJF (Shortest Job First) y SRTF (Apropiativo)
- Selecciona el proceso con la **próxima ráfaga de CPU más corta**.
- **Teóricamente óptimo:** Minimiza el tiempo de espera promedio.
- **Versión apropiativa (SRTF — *Shortest Remaining Time First*):** Si llega un proceso con ráfaga menor al tiempo restante del actual, lo expropia.
- **Limitación práctica:** No se conoce la duración exacta futura; se predice con promedio exponencial:
  ```text
  τ_(n+1) = α · t_n + (1 - α) · τ_n     (0 ≤ α ≤ 1)
  ```
- Puede provocar **inanición** de procesos largos.

### 2.3 Round Robin (RR)
- Diseñado para sistemas de **tiempo compartido**. Cola circular con un **quantum de tiempo `q`**.
- Con `n` procesos listos, cada uno recibe `1/n` de la CPU en ráfagas de a lo sumo `q`, y espera a lo sumo `(n - 1) · q`. Sin inanición.
- **Relación entre Quantum (`q`) y Tiempo de Cambio de Contexto (`c`):**
  ```text
  Overhead = c / (q + c)
  ```
  - Si `q` es **muy pequeño** (cercano a `c`): excesivos cambios de contexto → la CPU pierde enorme porcentaje de tiempo en administración (si `q = c`, se desperdicia el 50%).
  - Si `q` es **muy grande** (`q >> c`): RR degenera en **FCFS**, empeorando el tiempo de respuesta.
  - **Regla práctica:** `q` debe ser mucho mayor que `c` (típico 10–100 ms vs microsegundos) y tal que **≈ 80% de las ráfagas de CPU** sean menores a `q`.

### 2.4 Planificación por Prioridades
- A cada proceso se le asigna un nivel de prioridad (apropiativo o no apropiativo). SJF es un caso particular donde la prioridad es `1 / ráfaga`.
- **Problema principal:** **Inanición (*Starvation*)** de procesos de baja prioridad.
- **Solución:** **Envejecimiento (*Aging*)**, incrementando progresivamente la prioridad de los procesos que llevan mucho tiempo esperando.

### 2.5 Colas Multinivel y Colas Multinivel Realimentadas (MLFQ)
- **Colas Multinivel:** Particiona la cola de listos en colas separadas por tipo (sistema, interactivos, batch, etc.), cada una con su algoritmo interno y prioridad fija o tajada de tiempo entre colas.
- **Colas Multinivel Realimentadas (MLFQ):** Permite que los procesos **migren dinámicamente entre colas** según su comportamiento (ej.: `Q₀` con `q = 8 ms` → si consume todo el quantum baja a `Q₁` con `q = 16 ms` → si vuelve a agotar baja a `Q₂` con FCFS). Favorece tareas interactivas/cortas y evita inanición promoviendo procesos que esperan mucho.

---

## 3. Planificación de Hilos y Multiprocesadores

### 3.1 Planificación de Hilos: PCS vs SCS
- **PCS (*Process-Contention Scope* — Local):** Competencia entre hilos de usuario dentro del mismo proceso para ser mapeados a un LWP (en modelos M:1 y M:N).
- **SCS (*System-Contention Scope* — Global):** Competencia entre todos los hilos de kernel del sistema para obtener CPU (en modelo 1:1 como Linux y Windows).

### 3.2 Planificación en Sistemas Multiprocesador y Multicore
- **AMP (Asimétrico):** Un solo procesador gestiona estructuras y planificación.
- **SMP (Simétrico):** Cada procesador se auto-planifica (con una **cola compartida global** o **colas privadas por núcleo**).
- **Multicore (SMT / Hyper-Threading):** Dos niveles de planificación: el SO asigna hilos software a procesadores lógicos (hilos hardware) y el hardware intercala hilos en el núcleo físico.
- **Balance de Carga (*Load Balancing*):** Necesario cuando cada núcleo tiene su propia cola:
  - **Migración Push:** Una tarea periódica verifica desequilibrios y empuja procesos de núcleos sobrecargados a ociosos.
  - **Migración Pull:** Un procesador ocioso toma una tarea de la cola de un procesador ocupado.
- **Afinidad de Procesador (*Processor Affinity*):** Conveniencia de mantener un proceso en el mismo núcleo para no invalidar su caché caliente:
  - **Soft Affinity:** El SO intenta mantenerlo en el mismo núcleo pero puede migrarlo.
  - **Hard Affinity:** El proceso exige ejecutarse solo en un subconjunto específico de núcleos.
  - En arquitecturas **NUMA**, la afinidad también optimiza el acceso a la memoria local.

---

## 4. Planificación en Sistemas de Tiempo Real

- **Hard Real-Time (Tiempo Real Duro):** Garantía estricta de cumplir los plazos (*deadlines*); fallar equivale a fallo total del sistema.
- **Soft Real-Time (Tiempo Real Blando):** Procesos críticos tienen prioridad sobre los no críticos, pero sin garantía absoluta de plazo.
- **Características de un SO Tiempo Real:** Determinismo, capacidad de respuesta, control de usuario y fiabilidad.
- **Latencias críticas:**
  1. **Latencia de Interrupción:** Desde que llega la interrupción hasta que comienza la ISR.
  2. **Latencia de Despacho:** Tiempo para desalojar un proceso actual (fase de conflicto: apropiar modo kernel y liberar recursos retenidos por procesos de baja prioridad) y lanzar el proceso de tiempo real.

### 4.1 Modelo de Tareas Periódicas: RM vs EDF
Cada tarea periódica `τᵢ` se caracteriza por: tiempo de procesamiento `tᵢ` (o `Cᵢ`), plazo `dᵢ` y período `pᵢ` (o `Tᵢ`), con `0 ≤ tᵢ ≤ dᵢ ≤ pᵢ` (habitualmente `dᵢ = pᵢ`).

- **Utilización total de CPU:**
  ```text
  U = Σ (tᵢ / pᵢ)
  ```

#### Rate Monotonic (RM) — Prioridades Estáticas Apropiativas
- **Regla:** Prioridad inversamente proporcional al período (**menor período ⇒ mayor prioridad**).
- **Cota de Liu & Layland (Condición Suficiente, NO necesaria):**
  ```text
  U ≤ n · (2^(1/n) - 1)
  ```
  - `n = 1`: `100%` | `n = 2`: `82.8%` | `n = 3`: `78.0%` | `n → ∞`: `ln(2) ≈ 69.3%`.
- Si `U > cota` pero `U ≤ 1.0`, la tarea puede o no ser planificable (ej. de clase: `P₁(p=50, t=25)` y `P₂(p=80, t=35)` tienen `U = 0.94`, **RM falla el deadline de `P₂`**). Se verifica con diagrama de Gantt o Análisis de Tiempo de Respuesta (RTA).

#### Earliest Deadline First (EDF) — Prioridades Dinámicas Apropiativas
- **Regla:** En cada instante ejecuta la tarea cuyo **deadline absoluto esté más cercano**.
- **Criterio Óptimo (Necesario y Suficiente si `dᵢ = pᵢ`):** Planificable si y solo si:
  ```text
  U ≤ 1.0  (100% de utilización)
  ```
  *(En el ejemplo `P₁(50,25)` y `P₂(80,35)` con `U = 0.94 ≤ 1`, EDF sí cumple todos los deadlines).*

### 4.2 Inversión de Prioridades y Herencia de Prioridades
- **Problema:** Una tarea de alta prioridad `T₁` espera un recurso exclusivo retenido por una tarea de baja prioridad `T₃`. Mientras tanto, llega una tarea de prioridad media `T₂` (independiente del recurso) y expropia a `T₃`, retrasando indefinidamente a `T₁` (`T₁` termina esperando a `T₃` y a `T₂`).
- **Solución — Protocolo de Herencia de Prioridades:** Mientras `T₁` está bloqueada esperando el recurso de `T₃`, **`T₃` hereda temporalmente la alta prioridad de `T₁`**, evitando que `T₂` la expropie. Al liberar el recurso, `T₃` vuelve a su prioridad original y `T₁` toma la CPU.
- **Trampa con Spinlocks:** Si `T₁` espera con espera ocupada (spinlock) en monoprocesador, nunca cede la CPU y `T₃` jamás puede liberar el recurso → **bloqueo permanente**.

### 4.3 Planificación Proporcional (*Fair-Share*)
Se reparten `T` cuotas totales; una aplicación con `N` cuotas (`N < T`) tiene garantizada una fracción `N / T` del tiempo de CPU.

---

## 5. Casos de Estudio en SO Reales (Diapositivas UNS)

| Sistema Operativo | Algoritmo y Características Clave |
| :--- | :--- |
| **UNIX Tradicional** | Colas multinivel por bandas de prioridad con **Round Robin** dentro de cada banda. Prioridad dinámica que decae con el uso reciente de CPU (`CPUⱼ(i)`) y aplica **envejecimiento** al esperar (valores bajos = mayor prioridad). |
| **Linux (2.5)** | Planificador **`O(1)`** apropiativo por prioridades: rango Tiempo Real `0–99` y Tiempo Compartido (*nice*) `100–140`. Prioridades altas reciben mayor quantum. |
| **Linux (2.6.23+)** | **CFS (*Completely Fair Scheduler*):** Planifica por clases y proporción de CPU manteniendo el tiempo de ejecución virtual **`vruntime`** de cada tarea (ajustado por un factor de decaimiento según prioridad). Siempre selecciona la tarea con **menor `vruntime`** (árbol rojo-negro). |
| **Solaris** | Mapea ULT → **LWP** → Kernel Threads. **6 clases** de planificación: `TS` (Tiempo Compartido, defecto), `IA` (Interactivo), `RT` (Tiempo Real), `SYS` (Sistema), `FSS` (Fair-Share) y `FP` (Prioridad Fija). Convierte a prioridad global y usa RR ante empates. |
| **Windows** | Apropiativo basado en prioridades de **32 niveles**: prioridad `0` (gestión de memoria), **Variable Class `1–15`**, **Real-Time Class `16–31`**. Los hilos de tiempo real pueden apropiar a los variables; ante empate usa RR. |

---

## 6. Claves del Trabajo Práctico 3 (TP3 — Planificación y Tiempo Real)

### 6.1 Conflictos entre Criterios y Decisiones de Diseño (TP3 ej. 4, 7, 8, 9)
- **Pares de criterios en conflicto:**
  1. **Utilización de CPU vs Tiempo de respuesta:** Quantums grandes minimizan el overhead y maximizan CPU, pero empeoran el tiempo de respuesta interactivo.
  2. **Tiempo de retorno promedio vs Tiempo de espera máximo:** SJF minimiza el promedio, pero puede provocar tiempos de espera máximos muy altos o inanición en procesos largos.
  3. **Utilización de dispositivos de E/S vs Utilización de CPU:** Priorizar procesos I/O-bound mantiene ocupados discos y cintas, pero aumenta los cambios de contexto; priorizar CPU-bound maximiza CPU pero deja los dispositivos de E/S ociosos.
- **Apropiación de hilos por reloj:** Con **KLT**, la interrupción del timer permite al kernel apropiar directamente un hilo. Con **ULT**, la interrupción de reloj apropia al **proceso entero** (la librería de usuario necesitaría señales de temporizador para expropiar entre sus ULT).
- **¿Por qué NO usar planificación sin apropiación en centros de cómputos / tiempo compartido?** Porque un proceso largo o con un bucle infinito acapara la CPU e impide dar tiempos de respuesta aceptables a los demás usuarios.
- **Cola global única vs Cola por núcleo en multiprocesadores:**
  - *Cola única compartida:* Balance de carga natural y automático, pero genera **cuello de botella/contención** por el lock de la cola y rompe la **afinidad de caché**.
  - *Cola privada por núcleo:* Sin contención y alta afinidad de caché, pero puede desequilibrar la carga (requiere migración *push/pull*).

### 6.2 Diagramas de Gantt con Rutinas del SO, Puntos de Apropiación y Microkernel
- En ejercicios prácticos de trazas (TP3 Prob. 3, 4, 5 y 6):
  - **Tiempo de rutinas del SO:** Cada cambio de estado/transición (dispatch, atención de E/S, fin de quantum) consume tiempo de CPU (ej. `5 ms` o `10 ms`) que debe graficarse antes de darle la CPU al proceso.
  - **Puntos de apropiación:** En kernels parcialmente apropiativos, un proceso de mayor prioridad recién puede desalojar en el próximo punto de apropiación (ej. cada `5 ms` o `10 ms`).
  - **Modelo Cliente–Servidor (Microkernel):** Una E/S a disco de un proceso usuario activa en cascada al servidor **FS** (*File System*) y luego a **TD** (*Tarea de Disco*, mayor prioridad que FS y usuario), intercalándose en el diagrama de tiempos.

### 6.3 Algoritmo LLF (*Least-Laxity-First*) y Cálculo de Video/Voz (TP3 Tiempo Real)
- **Laxitud (tiempo de holgura):**
  ```text
  Laxitud = Deadline - Tiempo_Actual - Tiempo_Procesamiento_Restante
  ```
  - **Laxitud = `t` (> 0):** El planificador puede retrasar el inicio de la tarea a lo sumo `t` unidades de tiempo y aún cumplir su deadline.
  - **Laxitud = `0`:** La tarea **debe comenzar inmediatamente**; cualquier demora hace fallar el deadline.
  - **Laxitud < `0`:** Ya es **imposible** cumplir el deadline aunque ejecute sin interrupciones.
  - **LLF** selecciona la tarea con menor laxitud (prioridad dinámica, empates por FCFS). Es óptimo en monoprocesador al igual que EDF (`U ≤ 1.0`), pero produce **muchos más cambios de contexto** si dos tareas compiten empatando en laxitud.
- **Conversión de frecuencia a período (TP3 RT ej. 2):**
  - Un video a `25 cuadros/segundo` tiene período `p = 1000 ms / 25 = 40 ms`. Si cada cuadro usa `20 ms`, consume `20/40 = 0.50` de CPU; sumado a 2 llamadas de voz (`1/5 = 0.20` c/u), resulta `U = 0.20 + 0.20 + 0.50 = 0.90 ≤ 1.0` → planificable con **EDF** (y en RM requiere verificar por Gantt/RTA porque `0.90 > 0.78`).
