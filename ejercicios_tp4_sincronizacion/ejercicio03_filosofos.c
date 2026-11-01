/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 3 (Problema 3): La Cena de los Filósofos (Tanenbaum/Dijkstra)
 * ============================================================================
 * Errores corregidos respecto a la consigna original:
 * 1. Macro de índice negativo:
 *    Original: #define Izquierdo (i - 1) % N  -> En C (0-1)%6 = -1 (error de puntero)
 *    Corregido: #define Izquierdo (i + N - 1) % N
 * 2. Condición de carrera en dejar_tenedores:
 *    Original: up(&mutex) ANTES de test(Izquierdo) y test(Derecho).
 *    Corregido: up(&mutex) AL FINAL, protegiendo las verificaciones de los vecinos.
 * 3. Inicialización de semáforos s[N] en 0 para cada filósofo.
 *
 * Compilación:
 *   gcc -pthread ejercicio03_filosofos.c -o ejercicio03
 * Ejecución:
 *   ./ejercicio03
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define N 5                  // Número de filósofos en la mesa circular
#define RONDAS_POR_FILOSOFO 3 // Cada filósofo piensa y come 3 veces para la prueba

// Macros seguras para vecinos circulares (sin índices negativos)
#define IZQUIERDO (i + N - 1) % N
#define DERECHO   (i + 1) % N

// Estados posibles de cada filósofo
#define PENSANDO     0
#define TIENE_HAMBRE 1
#define COMIENDO     2

int estado[N];
sem_t mutex;  // Exclusión mutua para inspeccionar y cambiar estados
sem_t s[N];   // Un semáforo privado por filósofo (inician en 0)

// Comprueba si el filósofo i tiene hambre y sus dos vecinos NO están comiendo
void test(int i) {
    if (estado[i] == TIENE_HAMBRE &&
        estado[IZQUIERDO] != COMIENDO &&
        estado[DERECHO] != COMIENDO) {
        
        estado[i] = COMIENDO;
        printf("  [Filósofo %d] -> Tomó ambos tenedores y empieza a COMER.\n", i);
        // Habilita al filósofo para comer (desbloquea su sem_wait si estaba esperando)
        sem_post(&s[i]);
    }
}

// Intenta tomar ambos tenedores
void tomar_tenedores(int i) {
    sem_wait(&mutex);

    estado[i] = TIENE_HAMBRE;
    printf("[Filósofo %d] TIENE HAMBRE e intenta tomar tenedores.\n", i);
    test(i); // Si los dos tenedores están libres, pasará a COMIENDO y hará post en s[i]

    sem_post(&mutex);

    // Si no pudo comer, se bloquea aquí esperando que sus vecinos lo habiliten
    sem_wait(&s[i]);
}

// Deja ambos tenedores y comprueba si los vecinos pueden comer ahora
void dejar_tenedores(int i) {
    sem_wait(&mutex);

    estado[i] = PENSANDO;
    printf("[Filósofo %d] Terminó de comer, suelta tenedores y vuelve a PENSAR.\n", i);

    // CORRECCIÓN CRÍTICA: Se evalúan los vecinos DENTRO del mutex
    test(IZQUIERDO);
    test(DERECHO);

    sem_post(&mutex);
}

void pensar(int i) {
    usleep((rand() % 300 + 100) * 1000); // 100ms a 400ms
}

void comer(int i) {
    usleep((rand() % 300 + 100) * 1000); // 100ms a 400ms
}

// Rutina de cada filósofo
void* filosofo(void* arg) {
    int id = *((int*)arg);

    for (int r = 1; r <= RONDAS_POR_FILOSOFO; r++) {
        pensar(id);
        tomar_tenedores(id);
        comer(id);
        dejar_tenedores(id);
    }

    printf(">>> Filósofo %d completó todas sus rondas.\n", id);
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t hilos[N];
    int ids[N];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 3: Cena de los Filósofos (%d)    \n", N);
    printf("====================================================\n");

    // Inicialización del mutex y los semáforos privados
    sem_init(&mutex, 0, 1);
    for (int i = 0; i < N; i++) {
        estado[i] = PENSANDO;
        sem_init(&s[i], 0, 0); // Todos inician en 0
        ids[i] = i;
    }

    // Creación de los hilos de los filósofos
    for (int i = 0; i < N; i++) {
        pthread_create(&hilos[i], NULL, filosofo, &ids[i]);
    }

    // Esperar finalización de todos los filósofos
    for (int i = 0; i < N; i++) {
        pthread_join(hilos[i], NULL);
    }

    // Limpieza
    sem_destroy(&mutex);
    for (int i = 0; i < N; i++) {
        sem_destroy(&s[i]);
    }

    printf("\nSimulación finalizada sin interbloqueos ni condiciones de carrera.\n");
    return EXIT_SUCCESS;
}
