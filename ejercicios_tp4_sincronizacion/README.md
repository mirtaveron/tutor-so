# Trabajo Práctico N° 4: Sincronización de Procesos (UNS) 🧵
## Colección de Ejercicios en C (Completos y Listos para Ejecutar)

Este directorio contiene la resolución completa y ejecutable de todos los problemas del **Trabajo Práctico N° 4 de Sistemas Operativos (UNS)**. Cada programa incluye:
- Librerías necesarias (`<pthread.h>`, `<semaphore.h>`, `<stdio.h>`, `<stdlib.h>`, `<unistd.h>`).
- Tipos de argumentos adecuados para hilos (`void* (*)(void*)`) y paso de estructuras o identificadores.
- Inicialización y destrucción limpia de semáforos (`sem_init`, `sem_destroy`) y mutexes (`pthread_mutex_init`, `pthread_mutex_destroy`).
- Función `main()` interactiva y con logs explicativos de la sincronización en tiempo real.

---

### 📋 Índice de Archivos

| Archivo | Problema | Mecanismos de Sincronización |
| :--- | :--- | :--- |
| `ejercicio01_tweedledum_tweedledee.c` | **Problema 1:** Tweedledum y Tweedledee | Semáforos binarios POSIX (`sem_t`) con estricta alternancia. |
| `ejercicio02_productor_consumidor.c` | **Problema 2:** Productor - Consumidor | Buffer acotado, corrección de Deadlock (`sem_wait(&vacio)` antes de `mutex`). |
| `ejercicio03_filosofos.c` | **Problema 3:** Cena de los Filósofos | Solución Tanenbaum/Dijkstra, corrección de macro circular y exclusión mutua. |
| `ejercicio04_secuencias_abcde.c` | **Problema 4:** Secuencias de hilos A..E | Modos a) ABCDE, b) ACDE/BCDE, c) (A o B)CDE con cantidad mínima de semáforos. |
| `ejercicio05_fabrica_bicicletas.c` | **Problema 5:** Fábrica de Bicicletas | OP1 (ruedas), OP2 (cuadro), OP3 (manillar), Montador. Capacidad y ensamble. |
| `ejercicio06_fumadores.c` | **Problema 6:** Fumadores de Cigarrillos | Problema de Patil: Agente aleatorio y 3 fumadores especializados. |
| `ejercicio07_barbero_dormilon.c` | **Problema 7:** El Barbero Dormilón | Sala de espera acotada ($N$ sillas), barbero que duerme y clientes que despiertan. |
| `ejercicio08_lectores_escritores_semaforos.c` | **Problema 8:** Lectores y Escritores | Concurrencia de múltiples lectores o exclusión total de un escritor. |
| `ejercicio09_lectores_escritores_monitores.c` | **Problema 9:** Lectores y Escritores (Monitor) | Implementación del monitor con `pthread_mutex_t` y `pthread_cond_t` (Prioridad escritores). |
| `ejercicio10_productor_consumidor_monitores.c` | **Problema 10:** Productor-Consumidor (Monitor) | Monitor con condiciones `no_lleno` y `no_vacio`. |
| `ejercicio11_oso_abejas.c` | **Problema 11:** El Oso y las Abejas | $N$ abejas llenando tarro de capacidad $M$, despiertan al oso y este lo vacía. |
| `ejercicio12_limite_conexiones.c` | **Problema 12:** Límite de Conexiones en Servidor | Semáforo contador para limitar a $N$ conexiones simultáneas. |
| `ejercicio13_impresoras_compartidas.c` | **Problema 13:** 2 Impresoras Compartidas | Parte a (semáforos simples) y Parte b (asignación por prioridad única). |
| `ejemplo_barreras_pthread.c` | **Concepto 4:** Barreras de sincronización | Demostración con `pthread_barrier_t`. |

---

### 🚀 Cómo Compilar y Ejecutar

#### En Linux o WSL (Ubuntu / Debian):
```bash
# Compilar un ejercicio individual:
gcc -pthread ejercicio01_tweedledum_tweedledee.c -o ejercicio01
./ejercicio01

# O compilar todos juntos usando el Makefile:
make
./ejercicio02
./ejercicio03
```

#### En Windows (MinGW-w64 o Git Bash):
```bash
gcc -pthread ejercicio01_tweedledum_tweedledee.c -o ejercicio01.exe
./ejercicio01.exe
```
