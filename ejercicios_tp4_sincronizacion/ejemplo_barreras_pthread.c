/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Concepto 4: Barreras de Sincronización (pthread_barrier_t)
 * ============================================================================
 * Consigna:
 * Demostración práctica de una barrera de sincronización en C con POSIX threads.
 * Ningún hilo puede avanzar a la fase siguiente hasta que todos los hilos
 * hayan completado la fase actual y alcanzado la barrera.
 *
 * Compilación:
 *   gcc -pthread ejemplo_barreras_pthread.c -o ejemplo_barreras
 * Ejecución:
 *   ./ejemplo_barreras
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define NUM_HILOS 4

pthread_barrier_t barrera;

void* trabajador(void* arg) {
    int id = *((int*)arg);

    // --- FASE 1 ---
    int tiempo_fase1 = (rand() % 300 + 100) * 1000;
    printf("[Hilo %d] Ejecutando Fase 1 (tarda %d ms)...\n", id, tiempo_fase1 / 1000);
    usleep(tiempo_fase1);
    printf("[Hilo %d] -> Llegó a la BARRERA. Esperando a los demás...\n", id);

    // Esperar a que los 4 hilos alcancen este punto
    pthread_barrier_wait(&barrera);

    // --- FASE 2 ---
    printf(">>> [Hilo %d] ⭐ ¡Barrera superada! Iniciando Fase 2 sincronizada.\n", id);
    usleep(150000);

    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t hilos[NUM_HILOS];
    int ids[NUM_HILOS];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Concepto 4: Barreras de Sincronización     \n");
    printf("   (Grupo de %d hilos sincronizados)                \n", NUM_HILOS);
    printf("====================================================\n\n");

    // Inicializar barrera para NUM_HILOS
    pthread_barrier_init(&barrera, NULL, NUM_HILOS);

    for (int i = 0; i < NUM_HILOS; i++) {
        ids[i] = i + 1;
        pthread_create(&hilos[i], NULL, trabajador, &ids[i]);
    }

    for (int i = 0; i < NUM_HILOS; i++) {
        pthread_join(hilos[i], NULL);
    }

    pthread_barrier_destroy(&barrera);

    printf("\nTodos los hilos completaron ambas fases sincronizados.\n");
    return EXIT_SUCCESS;
}
