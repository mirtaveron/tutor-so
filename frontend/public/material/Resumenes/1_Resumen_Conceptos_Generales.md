# Tema 1: Conceptos Generales y Estructura del Sistema Operativo
> **Cátedra:** Sistemas Operativos — UNS (2026)  
> **Material cubierto:** `SO- Introducción- 2026.pdf`, `SO- Estrcuturas del SO - 2026.pdf`

---

## 1. ¿Qué es un Sistema Operativo y cuáles son sus roles?

Un **Sistema Operativo (SO)** es el software intermediario entre el usuario/aplicaciones y el hardware de la computadora. El programa que permanece ejecutándose todo el tiempo en la computadora es el **kernel (núcleo)**; todo lo demás son programas de sistema o programas de aplicación.

### Objetivos principales
- Ejecutar programas de usuario y facilitar la resolución de problemas.
- Hacer conveniente el uso de la computadora.
- Utilizar el hardware de manera **eficiente** y **segura**.

### Los 3 Roles del SO (Puntos de vista)
1. **Referí (Administrador / Alocador de Recursos):** Gestiona y reparte de manera equitativa y segura la CPU, memoria, almacenamiento y dispositivos de E/S frente a solicitudes conflictivas.
2. **Ilusionista (Máquina Extendida / Virtual):** Oculta la complejidad física del hardware ofreciendo abstracciones limpias (procesos, memoria virtual, archivos, sockets).
3. **Pegamento (Servicios comunes):** Provee funciones y bibliotecas estándar compartidas por todas las aplicaciones (E/S, comunicaciones, gestión de errores, protección).

---

## 2. Organización y Arquitectura del Sistema de Cómputo

### 2.1 Interrupciones, Traps y Manejo de E/S
Los SO modernos son **dirigidos por interrupciones (*interrupt-driven*)**. CPUs y controladores de dispositivos operan concurrentemente compitiendo por ciclos de memoria.

| Evento | Origen | Naturaleza | Ejemplos |
| :--- | :--- | :--- | :--- |
| **Interrupción de Hardware (IRQ)** | Dispositivo físico externo / timer | Asincrónica | Fin de lectura de disco, tecla presionada, interrupción de reloj |
| **Trap / Excepción** | CPU (error de instrucción) o software | Sincrónica | División por cero, fallo de página (*page fault*), violación de memoria |
| **Llamada al Sistema (System Call)** | Programa de usuario (instrucción `trap`/`syscall`) | Sincrónica voluntaria | `read()`, `write()`, `open()`, `fork()`, `exit()` |

#### Mecanismo de atención de interrupciones
1. El hardware suspende la instrucción actual, guarda el estado mínimo (PC y registros) y cambia a **Modo Kernel**.
2. Identifica el tipo de interrupción mediante **polling** (sondeo) o un **sistema vectoreado** (usando el **Vector de Interrupción / IDT**, que contiene las direcciones de cada Rutina de Servicio de Interrupción — **ISR**).
3. Se deshabilitan interrupciones entrantes (o de menor prioridad) mientras se atiende la actual para no perder señales.
4. Al finalizar la ISR, se restaura el contexto y se retorna a la ejecución normal.

#### Métodos de E/S y DMA
- **E/S Sincrónica:** El proceso solicita E/S y espera hasta que se complete.
- **E/S Asincrónica:** El control retorna inmediatamente al proceso usuario mientras la E/S avanza en paralelo.
- **DMA (*Direct Memory Access*):** Utilizado por dispositivos de alta velocidad (discos, placas de red). El controlador transfiere bloques completos directamente entre el buffer del dispositivo y la RAM **sin intervención de la CPU**, generando **una sola interrupción por bloque** (en lugar de una por byte).

### 2.2 Jerarquía de Almacenamiento y Caching
De mayor velocidad/costo y menor capacidad (volátil) hacia menor velocidad/costo y mayor capacidad (no volátil):

```text
Registros → Caché CPU → Memoria Principal (RAM) → Memoria No Volátil (NVM/SSD) → Disco Magnético → Disco Óptico → Cinta Magnética
```

- **Caching:** Copiar temporalmente información usada frecuentemente desde un almacenamiento lento a uno más rápido. Siempre se consulta primero la caché (*cache hit* = rápido; *cache miss* = se trae del nivel inferior).
- **Buffering:** Almacenar temporalmente datos mientras están siendo transferidos entre dispositivos de distinta velocidad.
- **Spooling:** Superponer la salida de un trabajo con el cómputo de otros (ej. cola de impresión).

### 2.3 Arquitecturas de Procesadores y Arranque
- **Monoprocesador:** Una única CPU principal.
- **Multiprocesador:**
  - **Asimétrico (AMP):** Un procesador maestro asigna tareas a los esclavos.
  - **Simétrico (SMP):** Todos los procesadores son pares, ejecutan el SO y comparten memoria.
  - **NUMA (*Non-Uniform Memory Access*):** Cada CPU accede más rápido a su memoria local que a la memoria de otro nodo.
- **Bootstrap y SYSGEN:**
  - **Bootstrap loader:** Pequeño programa en firmware (ROM/EEPROM/UEFI) que inicializa el hardware, localiza el kernel del SO en disco, lo carga en memoria y transfiere el control.
  - **SYSGEN:** Configura el SO para el hardware específico de una computadora.

---

## 3. Operaciones del SO: Multiprogramación, Tiempo Compartido y Modo Dual

### 3.1 Multiprogramación vs Tiempo Compartido (Multitarea)
- **Multiprogramación:** Mantiene varios trabajos en memoria simultáneamente. Cuando un proceso espera E/S, la CPU pasa a ejecutar otro, **reduciendo el tiempo ocioso de la CPU**.
- **Tiempo Compartido (*Time-Sharing*):** Extensión lógica donde la CPU conmuta entre procesos con tanta frecuencia que el usuario puede interactuar con cada programa en ejecución (**tiempo de respuesta < 1 s**). Utiliza planificación de CPU, memoria virtual y *swapping*.

### 3.2 Modo Dual de Operación (Protección por Hardware)
Para evitar que un programa erróneo o malicioso dañe al SO u otros procesos, el hardware provee un **bit de modo (*Mode Bit*)**:
- **Modo Usuario (`bit = 1`):** Ejecuta código de aplicación con acceso restringido.
- **Modo Kernel / Privilegiado (`bit = 0`):** Ejecuta código del SO con acceso irrestricto a todo el hardware.

- **Instrucciones Privilegiadas (solo ejecutables en Modo Kernel):**
  - Configurar o modificar el temporizador (*timer*).
  - Habilitar / deshabilitar interrupciones.
  - Modificar registros de protección de memoria (base/límite, tablas de páginas/MMU).
  - Ejecutar operaciones directas de E/S (`in`/`out`) y detener la CPU (`halt`).
  - Cambiar de modo usuario a modo kernel (solo ocurre mediante hardware al dispararse un *trap*, *syscall* o interrupción).

### 3.3 Flujo Completo de una Llamada `read()` (Clásico de Parcial)
#### Caso A: El archivo NO está cargado en memoria (*Page Cache Miss*)
1. Proceso en **Modo Usuario** invoca `read(fd, buf, n)` → ejecuta `syscall`/`trap`.
2. Hardware conmuta a **Modo Kernel**, salva contexto y salta al manejador del SO.
3. SO valida descriptor, permisos y puntero de buffer; consulta la caché de páginas y detecta fallo (*miss*).
4. El sistema de archivos traduce el archivo a bloques físicos y envía la solicitud al **driver del disco**.
5. El driver programa el **DMA** del controlador de disco.
6. El SO pasa el proceso de **Ejecutando → Bloqueado** y despacha otro proceso **Listo**.
7. Al terminar la transferencia DMA a RAM del kernel, la controladora lanza una **interrupción de hardware (IRQ)**.
8. La **ISR** marca la E/S como terminada y pasa el proceso de **Bloqueado → Listo**.
9. Cuando el planificador lo vuelve a elegir (**Listo → Ejecutando**), el SO copia los datos al buffer de usuario, retorna los bytes leídos y conmuta a **Modo Usuario**.

#### Caso B: El archivo YA está cargado en memoria (*Page Cache Hit*)
- **No hay E/S física al disco ni interrupción de hardware.**
- **El proceso NO se bloquea** ni sufre cambio de contexto a otro proceso.
- El SO copia directamente los bytes desde la caché del kernel en RAM hacia el buffer del usuario y regresa inmediatamente a Modo Usuario.

---

## 4. Servicios, Interfaces, Llamadas al Sistema y Estructuras del SO

### 4.1 Interfaces y Llamadas al Sistema (System Calls)
- **Interfaces de Usuario:** **CLI** (intérprete de comandos / *shell*) y **GUI** (interfaz gráfica).
- **Llamadas al Sistema:** Interfaz de programación a los servicios del SO, normalmente accedida vía **API** (POSIX en UNIX/Linux, Win32 en Windows).
- **Categorías:** Control de procesos (`fork`, `exit`, `wait` / `CreateProcess`), gestión de archivos (`open`, `read`, `write`, `close`), gestión de dispositivos, información de estado, comunicaciones (IPC) y protección.
- **3 Métodos para pasar parámetros al SO:**
  1. **En registros** (rápido, limitado por cantidad de registros).
  2. **En un bloque o tabla en memoria**, pasando la dirección de ese bloque en un registro (usado en Linux/Solaris).
  3. **En la pila (*stack*)**, apilados (*push*) por el programa y desapilados (*pop*) por el SO.

### 4.2 Principio de Diseño: Política vs Mecanismo
- **Política:** Define **¿QUÉ debe hacerse?** (ej. asignar más prioridad a tareas interactivas o limitar el uso de CPU por usuario).
- **Mecanismo:** Define **¿CÓMO hacerlo?** (ej. un temporizador para medir tiempo de CPU o una cola de prioridades).
- **Importancia:** Separarlos brinda máxima flexibilidad para cambiar políticas sin reescribir los mecanismos internos del kernel.

### 4.3 Estructuras de Sistemas Operativos

| Arquitectura | Características | Ventajas | Desventajas | Ejemplos |
| :--- | :--- | :--- | :--- | :--- |
| **Simple / Monolítica** | Todo corre en un único espacio de kernel sin estricta modularización (o monolítico con llamadas directas). | Máximo rendimiento (sin overhead de IPC). | Baja tolerancia a fallos (un bug en un driver tira todo el SO); difícil de mantener. | MS-DOS, UNIX original |
| **Por Capas** | Dividido en niveles `0..N`; cada capa solo usa servicios de capas inferiores. | Modularidad, facilidad de depuración y verificación. | Difícil definir el orden de capas; menor eficiencia por atravesar múltiples niveles. | THE, OS/2 |
| **Microkernel** | Mueve la mayor cantidad de servicios (FS, drivers, red) a procesos servidores en **espacio de usuario**; el kernel solo hace planificación mínima, memoria básica e IPC. | Muy confiable, seguro, fácil de extender y portar. | Menor rendimiento por alto overhead de **paso de mensajes (IPC)** y cambios de contexto. | Minix 3, Mach, QNX |
| **Modular (LKM)** | Núcleo base con componentes separados cargables dinámicamente bajo demanda con interfaces conocidas. | Flexible como capas/microkernel pero con velocidad monolítica. | Módulos defectuosos aún corren en modo kernel. | Linux moderno, Solaris |
| **Híbrida** | Combina monolítico + módulos + elementos de microkernel según conveniencia. | Balance práctico entre rendimiento, seguridad y usabilidad. | Mayor complejidad estructural. | Windows, macOS (Darwin), iOS, Android |

### 4.4 Máquinas Virtuales (Virtualización) y Protección vs Seguridad
- **Máquina Virtual:** Crea la ilusión de múltiples máquinas independientes exponiendo una interfaz idéntica al hardware subyacente. Gestionada por un **VMM / Hypervisor**:
  - **Tipo 0:** Basado en hardware/firmware.
  - **Tipo 1:** Hypervisor nativo ejecutando directamente sobre el hardware (ej. VMware ESXi, Xen).
  - **Tipo 2:** Ejecuta como aplicación sobre un SO anfitrión (ej. VirtualBox).
- **Protección:** Mecanismo interno del SO para controlar el acceso de procesos/usuarios a recursos.
- **Seguridad:** Defensa global del sistema contra ataques internos y externos (virus, worms, DoS, robo de identidad).

---

## 5. Claves del Trabajo Práctico 1 (TP1 — Conceptos Generales)

### 5.1 Tipos de Sistemas Operativos y Objetivos en Conflicto
- **Tipos clásicos:**
  - **Batch (por lotes):** Agrupa trabajos similares sin interacción directa del usuario; maximiza *throughput*.
  - **Interactivo:** Comunicación directa usuario–sistema con tiempos de respuesta cortos.
  - **Tiempo compartido (multitarea):** Comparte la CPU entre múltiples usuarios/procesos mediante conmutaciones frecuentes (extensión lógica de la multiprogramación orientada a interactividad; introduce desafíos de aislamiento y seguridad frente a una máquina dedicada).
  - **Tiempo real:** Impone restricciones temporales estrictas (*deadlines*) para garantizar resultados correctos en tiempo acotado.
- **Objetivos en conflicto:** Ej. **máxima utilización de CPU** vs **mínimo tiempo de respuesta**, o **máxima seguridad** vs **rendimiento/conveniencia**. En computadoras personales modernas se prioriza la **conveniencia e interfaz gráfica** aunque consuman más CPU/RAM.
- **SO en lenguaje de alto nivel (C/C++):**
  - *Ventajas:* Más rápido de escribir, más legible, fácil de mantener y **portable** entre arquitecturas.
  - *Desventajas:* Código ligeramente más grande y lento que ensamblador puro (por eso las rutinas críticas de arranque/context-switch siguen en ASM).

### 5.2 Protección por Hardware (E/S, Memoria y CPU)
1. **Protección de E/S:** Todas las instrucciones de E/S son **privilegiadas**; un programa de usuario solo puede acceder a dispositivos mediante *system calls*.
2. **Protección de Memoria:** El hardware valida cada dirección mediante **registros Base y Límite** (o MMU/tablas de páginas) para impedir que un proceso lea o escriba fuera de su espacio asignado o sobre el kernel.
3. **Protección de CPU:** Un **temporizador (*timer*)** interrumpe periódicamente a la CPU para devolver el control al SO y evitar que un proceso con un bucle infinito monopolice el procesador.
4. **Instrucciones privilegiadas vs no privilegiadas (Pregunta fija de TP1):**
   - **Privilegiadas (solo Modo Kernel):** Fijar (*set*) el timer, borrar/mapear memoria, deshabilitar interrupciones, cambiar a modo monitor/kernel, leer directamente sectores de disco, acceder a puertos de E/S, escribir en el área del monitor.
   - **NO privilegiadas:** Leer el reloj del sistema, ejecutar un `trap` (es justamente el mecanismo controlado para pedir servicios al SO), pasar de modo kernel a modo usuario.
   - *¿Sirve poner al SO en memoria de solo lectura?* **No**, porque el SO necesita modificar dinámicamente sus propias estructuras (PCBs, colas, buffers, tablas de memoria).
   - *¿Se puede construir un SO seguro sin modo dual?* **No** a nivel hardware tradicional, porque cualquier programa podría ejecutar instrucciones de E/S o sobrescribir el SO (salvo entornos estrictamente interpretados/verificados por software).

### 5.3 Intérprete de Comandos, Modular vs Capas y Máquinas Virtuales
- **Intérprete de comandos (*Shell*):** Suele estar **fuera del kernel** (como programa de usuario) para facilitar su reemplazo/personalización (`bash`, `zsh`, etc.) y reducir código privilegiado en el núcleo.
- **Kernel Modular vs Capas:** Ambos dividen el SO en componentes bien definidos con interfaces claras, pero en **capas** la comunicación es estrictamente jerárquica (capa `i` solo llama a `i-1`), mientras que en **modular** cualquier módulo cargado dinámicamente puede invocar directamente a cualquier otro módulo sin atravesar capas intermedias.
- **Ventajas de las Máquinas Virtuales:**
  - *Para el diseñador de SO:* Permite desarrollar, probar y depurar un kernel nuevo en paralelo sin detener la máquina física ni comprometer el SO anfitrión.
  - *Para el usuario:* Permite ejecutar múltiples SO y aplicaciones incompatibles en forma aislada sobre un mismo hardware.
