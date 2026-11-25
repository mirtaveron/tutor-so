# Tema 4: Sincronización de Procesos e Interbloqueos (Deadlocks)
> **Cátedra:** Sistemas Operativos — UNS (2026)  
> **Material cubierto:** `SO- Sincronización de Procesos - Introducción 2026.pdf`, `Soluciones Software y Problemas Generales 2026.pdf`, `Ejemplos SO - 2026.pdf`, `SO-Interbloqueos - 2026.pdf`

---

## 1. Condiciones de Carrera y el Problema de la Sección Crítica

- **Condición de Carrera (*Race Condition*):** Situación donde múltiples procesos/hilos acceden y modifican datos compartidos concurrentemente y el resultado final depende del orden particular en que se intercalaron sus instrucciones.
- **Ejemplos vistos en clase:**
  - Incremento/decremento de `contador` en Productor-Consumidor (`contador++` se descompone en 3 instrucciones máquina: cargar registro, sumar 1, guardar → si se intercala, el resultado es erróneo).
  - Conjunto de sentencias que deben mantener una invariante (`a = b`).
  - Actualización concurrente de punteros en una **lista enlazada**.
  - **En el Kernel:** Dos procesos invocando `fork()` concurrentemente accediendo a `next_available_pid` podrían asignar el mismo PID a dos procesos distintos.

### 1.1 Requisitos Obligatorios para una Solución a la Sección Crítica
Cada proceso tiene: `Sección de Entrada → Sección Crítica (SC) → Sección de Salida → Sección Resto`. Toda solución válida debe cumplir **las 3 condiciones**:
1. **Exclusión Mutua:** A lo sumo un proceso puede estar ejecutando en su sección crítica al mismo tiempo.
2. **Progreso:** Si nadie está en la SC y varios desean entrar, solo los procesos que no están en su sección resto participan en la decisión, y la selección no puede postergarse indefinidamente.
3. **Espera Limitada (Acotada):** Existe un límite finito en la cantidad de veces que otros procesos pueden entrar a la SC después de que un proceso solicitó entrar (evita inanición).

---

## 2. Soluciones por Software y Hardware

### 2.1 Soluciones Software (con Espera Ocupada)
- **Algoritmo de Peterson (para 2 procesos `Pᵢ` y `Pⱼ`):**
  ```c
  flag[i] = true;
  turno = j;
  while (flag[j] && turno == j) ; // Espera ocupada
  /* --- Sección Crítica --- */
  flag[i] = false;
  ```
  Cumple las 3 condiciones (en arquitecturas sin reordenamiento de memoria).
- **Algoritmo del Panadero de Lamport (para `n` procesos):**
  - Arreglos compartidos: `eligiendo[0..n-1]` (bool, `false`) y `numero[0..n-1]` (int, `0`).
  - Cada proceso saca el turno `max(numero[]) + 1`. Entra quien tiene el par `(numero[i], i)` menor en **orden lexicográfico** (`(a, b) < (c, d)` si `a < c` o (`a == c` y `b < d`)).

### 2.2 Soluciones Hardware
- **Deshabilitar interrupciones:** Solo viable en **monoprocesadores** y código de kernel (en multiprocesadores los demás núcleos siguen ejecutando y accediendo a memoria).
- **Instrucciones Atómicas (no interrumpibles):**
  - **`Test-and-Set(&lock)`:** Lee el valor actual de `lock`, lo pone en `true` y devuelve el valor anterior atómicamente (`while (TestAndSet(&lock));`).
  - **`Swap(&lock, &key)`:** Intercambia atómicamente el contenido de dos variables (`key = true; while (key) Swap(&lock, &key);`).
  - **Evaluación crítica (pregunta de diapositiva):** Estas versiones básicas cumplen **Exclusión Mutua** y **Progreso**, pero **NO garantizan Espera Limitada** (un proceso puede quedar esperando indefinidamente) y desperdician CPU por **espera ocupada**.

---

## 3. Mecanismos de Sincronización del SO

### 3.1 Mutex Locks vs Semáforos vs Monitores

| Herramienta | Propiedades y Primitivas | Uso Principal y Notas Clave |
| :--- | :--- | :--- |
| **Mutex Lock** | `acquire()` / `release()` (`pthread_mutex_lock`, `unlock`, `trylock`). Posee **propiedad (*ownership*)**: solo quien adquiere puede liberar. | Exclusión mutua estricta en secciones críticas. Permite herencia de prioridad. |
| **Semáforo (Dijkstra)** | Variable entera modificada solo por operaciones atómicas **`wait(S)`** (`P`/`down`) y **`signal(S)`** (`V`/`up`). Tipos: **Binario** (`0..1`) y **Contador** (`0..N`). **Sin propiedad.** | Exclusión mutua, señalización de orden de ejecución (`A` antes que `B` con semáforo en `0`) y control de `N` recursos. Extensión no bloqueante: `sem_trywait()`. |
| **Monitor** | Constructor de alto nivel que encapsula datos y procedimientos garantizando **exclusión mutua automática**. Usa **variables de condición** (`x.wait()`, `x.signal()`). | Sincronización estructurada y menos propensa a errores. Diferencia clave: **`x.signal()` no tiene memoria** (si nadie espera en `x`, la señal se pierde). |

### 3.2 Implementación de Semáforos sin Espera Ocupada (Cola de Bloqueo)
Cada semáforo mantiene un entero `S.value` y una cola `S.L` de procesos bloqueados:
```c
wait(S):                         signal(S):
  S.value--;                       S.value++;
  if (S.value < 0) {               if (S.value <= 0) {
    agregar proceso a S.L;           quitar un proceso P de S.L;
    block();  // Pasa a Bloqueado    wakeup(P); // Pasa a Listo
  }                                }
```
- **Espera Ocupada vs Bloqueo:** La espera ocupada (*spinlock*) solo conviene en **multiprocesadores (SMP)** cuando la espera es **más corta que dos cambios de contexto** (ej. proteger las propias instrucciones internas de `wait`/`signal`). En monoprocesador o esperas largas siempre conviene **bloqueo**.
- **Errores típicos con semáforos:** Invertir `signal(mutex) ... wait(mutex)` (rompe exclusión mutua), repetir `wait(mutex) ... wait(mutex)` (auto-deadlock), omitir `wait` o `signal`.

### 3.3 Problemas Clásicos de Sincronización
1. **Productor – Consumidor (Buffer Limitado de tamaño `N`):**
   - Semáforos: `mutex = 1`, `vacio = N`, `lleno = 0`.
   - Productor: `wait(vacio); wait(mutex); insertar(); signal(mutex); signal(lleno);`
   - Consumidor: `wait(lleno); wait(mutex); extraer(); signal(mutex); signal(vacio);`
   - **¡NUNCA invertir `wait(vacio)` y `wait(mutex)`!** Si el buffer está lleno, el productor retendría el `mutex` y se bloquearía en `vacio`, impidiendo al consumidor entrar a liberar lugar → **Deadlock**.
2. **Lectores y Escritores:**
   - Múltiples lectores concurrentes permitidos; escritor requiere acceso exclusivo (`db = 1`).
   - Preferencia lectores puede causar inanición de escritores; preferencia escritores puede causar inanición de lectores.
3. **Filósofos Comensales:**
   - Si todos toman primero su tenedor izquierdo a la vez → **Deadlock** por espera circular.
   - Soluciones: (a) **Asimetría / Orden total de recursos**, (b) **Máximo `N - 1` filósofos** simultáneos, (c) **Toma atómica** de ambos tenedores con `mutex` y arreglo `estado[N]`.
4. **Secuencias de procesos (ej. `ABCABC...`):** Semáforos binarios encadenados (`sA = 1`, `sB = 0`, `sC = 0`).

### 3.4 Ejemplos en SO Reales y APIs POSIX
- **Windows:** En kernel usa **máscaras de interrupción** (monoprocesador) y **spinlocks** (multiprocesador). Para hilos provee ***dispatcher objects*** (mutexes, semáforos, eventos, timers).
- **Linux:** Totalmente apropiativo desde kernel 2.6; deshabilita interrupciones en secciones críticas cortas y provee mutex-locks, semáforos y spinlocks.
- **POSIX APIs (`<pthread.h>` y `<semaphore.h>`):**
  - Mutex: `pthread_mutex_lock`, `pthread_mutex_unlock`, `pthread_mutex_trylock`.
  - Condición: `pthread_cond_wait(&cond, &mutex)`, `pthread_cond_signal(&cond)`.
  - Semáforos: `sem_init(&sem, pshared, val)` (`pshared = 0` entre hilos, `pshared = 1` entre procesos en memoria compartida), `sem_wait`, `sem_trywait`, `sem_post`.

---

## 4. Interbloqueos (Deadlocks)

Un conjunto de procesos está en **interbloqueo** cuando cada proceso posee al menos un recurso y espera adquirir otro recurso retenido por otro proceso del mismo conjunto.

### 4.1 Las 4 Condiciones Necesarias de Coffman (simultáneas)
1. **Exclusión Mutua:** Al menos un recurso no compartible.
2. **Retención y Espera (*Hold and Wait*):** Un proceso retiene recursos mientras espera otros.
3. **No Apropiación (*No Preemption*):** Los recursos solo se liberan voluntariamente.
4. **Espera Circular:** Ciclo cerrado `P₀ → P₁ → ... → Pₙ → P₀`.

### 4.2 Grafo de Alocación de Recursos (RAG)
- Arista de requerimiento: `Pᵢ → Rⱼ` | Arista de asignación: `Rⱼ → Pᵢ`.
- **Sin ciclos ⇒ NO hay interbloqueo.**
- **Con ciclo + 1 sola instancia por tipo de recurso ⇒ HAY interbloqueo (condición necesaria y suficiente).**
- **Con ciclo + varias instancias por tipo de recurso ⇒ POSIBILIDAD de interbloqueo (no certeza).**

### 4.3 Estrategias de Tratamiento
1. **Ignorar el problema (Algoritmo del Avestruz):** Usado por **Linux, UNIX y Windows** porque los deadlocks son infrecuentes y prevenirlos/evitarlos es demasiado costoso.
2. **Prevención (antes de que ocurra):** Invalidar estructuralmente una condición de Coffman:
   - *Retener y esperar:* Pedir todos los recursos juntos o no retener ninguno al solicitar.
   - *No apropiación:* Si un pedido falla, liberar todos los recursos retenidos.
   - *Espera circular:* Imponer un **orden total numérico** de recursos y exigir pedirlos en orden estrictamente creciente (ej. 3 filósofos con `f₁ < f₃ < f₂`).
3. **Evasión (dinámicamente al correr):** El SO verifica antes de conceder cada recurso si el sistema queda en un **Estado Seguro** (existe una **secuencia segura** `⟨P₁, P₂, ..., Pₙ⟩`).
   - *1 instancia por recurso:* Grafo de alocación con aristas de reclamo.
   - *Múltiples instancias:* **Algoritmo del Banquero de Dijkstra**:
     - `Need = Max - Allocation` | `Available = Total - Σ Allocation`.
     - **Seguridad:** `Work = Available`, `Finish[i] = false`; buscar `i` con `Finish[i] == false` y `Needᵢ ≤ Work` → `Work += Allocationᵢ`, `Finish[i] = true`. Si todos terminan → **SEGURO** (garantizado sin deadlock; estado inseguro = posibilidad de deadlock, no deadlock inmediato).
     - **Solicitud `Requestᵢ`:** Verificar `Requestᵢ ≤ Needᵢ` y `Requestᵢ ≤ Available`, simular la asignación y ejecutar el algoritmo de seguridad.
   - **Fórmula clásica de recursos libres de bloqueo:** Con `R` recursos idénticos y `n` procesos con demanda máxima `Max`:
     ```text
     R ≥ n · (Max - 1) + 1
     ```
4. **Detección y Recuperación (hechos consumados):**
   - *Instancia única:* Grafo **Wait-for** (`Pᵢ → Pⱼ` si `Pᵢ` espera a `Pⱼ`), detección de ciclos en `O(n²)`.
   - *Múltiples instancias:* Algoritmo similar al Banquero usando la matriz `Request` actual.
   - *Recuperación:* (a) **Abortar todos** los procesos del ciclo, (b) **Abortar de a uno** según costo (prioridad, tiempo computado, recursos retenidos), o (c) **Apropiación + Rollback** a un *checkpoint* seguro (cuidando evitar **inanición** incluyendo la cantidad de rollbacks en el costo de selección de víctima).

### 4.4 Deadlock vs Inanición (*Starvation*)
- **Deadlock:** Ningún proceso del conjunto avanza; bloqueo mutuo permanente que requiere intervención externa.
- **Inanición:** Un proceso listo es postergado indefinidamente mientras otros procesos sí avanzan y la CPU realiza trabajo útil; se soluciona con **envejecimiento (*aging*)**.

---

## 5. Claves de los Trabajos Prácticos 4 y 5 (TP4 Sincronización y TP5 Interbloqueos)

### 5.1 Claves Conceptuales y Problemas de TP4
- **Atomicidad de `wait()` y `signal()` (TP4 ej. 2):** Si `while (S <= 0);` y `S--` no son atómicos, dos procesos pueden evaluar `S == 1` simultáneamente antes de decrementar y entrar ambos a la sección crítica, violando la exclusión mutua.
- **Barreras de sincronización (TP4 ej. 4):** Ningún hilo/proceso del grupo puede cruzar la barrera hasta que **todos** los participantes la alcancen (ideal en simulaciones científicas paralelas por pasos temporales `t → t+1`).
- **Hilos del mismo proceso con semáforo de kernel (TP4 ej. 5):** Con **KLT** funciona perfectamente (el kernel bloquea solo al hilo que espera); con **ULT** es peligroso porque al bloquearse el hilo en la syscall del semáforo, el kernel bloquea a **todo el proceso** e impide que otro ULT haga `signal()` → **deadlock**.
- **Semáforos en el diagrama de transición de procesos (TP4 ej. 7):** Se agregan colas/estados específicos (*Bloqueado en semáforo de cinta/disco/memoria*). El `wait()` transiciona de *Ejecutando → Bloqueado en Semáforo* y la rutina de interrupción de fin de E/S (o `free`) invoca `signal()`, pasando al proceso a *Listo*.
- **Wakeup Perdido (*Lost Wakeup* — Tweedledum y Tweedledee, TP4 Prob. 1):** Con `Sleep()`/`Wakeup()`, si un hilo llama `Wakeup` justo antes de que el otro complete su `Sleep()`, la señal se pierde y ambos quedan dormidos para siempre. Los **semáforos lo resuelven** porque tienen memoria (acumulan `signal` en su contador).
- **Errores clásicos de código evaluados en TP4:**
  - *Filósofos en C (TP4 Prob. 3):* `#define Izquierdo (i - 1) % N` da `-1` cuando `i = 0` → corregir a `(i + N - 1) % N`; y **nunca** liberar `up(&mutex)` antes de llamar a `test(Izquierdo)` y `test(Derecho)` (genera condición de carrera).
  - *Monitores Lectores-Escritores (TP4 Prob. 9):* Chequear `!empty(ok_escribir)` en `inicio-leer` otorga **prioridad a escritores**, lo que puede generar **inanición de lectores**.
- **Catálogo de problemas clásicos resueltos en TP4:** Secuencias de hilos (`ABCDE`, `ACDE/BCDE`, `(A|B)CDE`), **Fábrica de Bicicletas** (2 ruedas + cuadro + manillar), **Fumadores de Cigarrillos (Patil)**, **Barbero Dormilón (Dijkstra)**, **Oso y Abejas** (tarro de capacidad `M`), **Límite de `N` conexiones en servidor** (semáforo contador inicializado en `N`), y **2 Impresoras compartidas** (con y sin prioridades).

### 5.2 Claves Conceptuales y Casos de TP5 (Interbloqueos)
- **Deadlock SIN recursos físicos (TP5 ej. 1):** Sí es posible por dependencias lógicas de comunicación (*Message Deadlock*: `P₁` ejecuta `receive(P₂)` y `P₂` ejecuta `receive(P₁)` bloqueantes).
- **Estado Inseguro ≠ Deadlock (TP5 ej. 2):** Un estado inseguro solo indica que *podría* ocurrir deadlock si todos pidieran su máximo; si en la ejecución real un proceso termina sin pedir todo su máximo y libera sus recursos, los demás pueden completar sin interbloqueo.
- **Liberar antes de pedir (TP5 ej. 4):** Si `P` hace `Requerir A; Liberar A; Requerir B; Liberar B` y `Q` hace `Requerir B; Requerir A; ...`, **NO puede haber deadlock**, porque `P` nunca retiene `A` mientras solicita `B` (rompe *Retención y Espera* y *Espera Circular*).
- **Costo–Beneficio de Evasión vs Avestruz (TP5 ej. 7):** El algoritmo del Banquero impone overhead permanente a *todos* los trabajos y empeora tiempos de respuesta; cuando los deadlocks son muy poco frecuentes, suele ser económicamente mucho más barato detectarlos/reiniciar que ejecutar evasión constante.
- **Modificaciones al Banquero que SIEMPRE preservan un estado seguro (TP5 ej. 13):**
  - ✅ **Seguras:** Incrementar `Disponible`, decrementar `Max`, decrementar el número de procesos.
  - ⚠️ **Pueden volverse inseguras:** Decrementar `Disponible`, incrementar `Max`, añadir procesos nuevos.
- **Dificultades y ventajas del Rollback (TP5 ej. 12):** *Ventajas:* ahorra cómputo respecto a abortar todo el proceso. *Dificultades:* costo de guardar *checkpoints*, imposibilidad de deshacer operaciones externas irreversibles (paquetes de red, impresión, dispensar dinero) y riesgo de inanición si siempre se elige a la misma víctima.
