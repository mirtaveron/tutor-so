/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 2 (Problema 2): Productor - Consumidor (Buffer Acotado)
 * ============================================================================
 * Consigna:
 * El código de la consigna contenía un Deadlock: el productor hacía down(&mutex)
 * ANTES de down(&vacio). Si el buffer se llenaba, el productor se bloqueaba en
 * 'vacio' reteniendo el 'mutex', impidiendo que el consumidor pudiera consumir.
 *
 * Corrección implementada:
 * Se invierte el orden en el Productor:
 *   1° sem_wait(&vacio)  -> Esperar que haya espacio libre
 *   2° sem_wait(&mutex)  -> Obtener acceso exclusivo al buffer
 *
 * Compilación:
 *   gcc -pthread ejercicio02_productor_consumidor.c -o ejercicio02
 * Ejecución:
 *   ./ejercicio02
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define N 5               // Capacidad del buffer circular
#define TOTAL_ITEMS 15    // Total de elementos a producir y consumir

// Buffer compartido
int buffer[N];
int in = 0;   // Índice de inserción
int out = 0;  // Índice de extracción

// Semáforos de sincronización
sem_t mutex;  // Exclusión mutua para modificar el buffer
sem_t vacio;  // Cuenta lugares libres disponibles (inicia en N)
sem_t lleno;  // Cuenta elementos disponibles para consumir (inicia en 0)

// Hilo Productor
void* productor(void* arg) {
    int id = *((int*)arg);
    for (int i = 1; i <= TOTAL_ITEMS; i++) {
        int dato = i * 10; // Dato producido

        // 1. Esperar que haya al menos un espacio libre
        sem_wait(&vacio);

        // 2. Entrar a la sección crítica (exclusión mutua)
        sem_wait(&mutex);

        // --- SECCIÓN CRÍTICA ---
        buffer[in] = dato;
        printf("[Productor %d] Insertó dato: %3d en posición [%d]\n", id, dato, in);
        in = (in + 1) % N;
        // -----------------------

        // 3. Salir de la sección crítica
        sem_post(&mutex);

        // 4. Notificar que hay un nuevo elemento disponible
        sem_post(&lleno);

        usleep(150000); // Simula tiempo de producción (150ms)
    }
    return NULL;
}

// Hilo Consumidor
void* consumidor(void* arg) {
    int id = *((int*)arg);
    for (int i = 1; i <= TOTAL_ITEMS; i++) {
        // 1. Esperar que haya al menos un elemento disponible
        sem_wait(&lleno);

        // 2. Entrar a la sección crítica (exclusión mutua)
        sem_wait(&mutex);

        // --- SECCIÓN CRÍTICA ---
        int dato = buffer[out];
        printf("    [Consumidor %d] Extrajo dato: %3d de posición [%d]\n", id, dato, out);
        out = (out + 1) % N;
        // -----------------------

        // 3. Salir de la sección crítica
        sem_post(&mutex);

        // 4. Notificar que se liberó un espacio en el buffer
        sem_post(&vacio);

        usleep(250000); // Simula tiempo de consumo (250ms)
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_prod, th_cons;
    int id_prod = 1, id_cons = 1;

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 2: Productor - Consumidor       \n");
    printf("   (Buffer Circular Acotado de %d elementos)        \n", N);
    printf("====================================================\n");

    // Inicialización de semáforos
    sem_init(&mutex, 0, 1); // Mutex binario (inicia en 1)
    sem_init(&vacio, 0, N); // N espacios vacíos al inicio
    sem_init(&lleno, 0, 0); // 0 elementos llenos al inicio

    // Creación de hilos
    pthread_create(&th_prod, NULL, productor, &id_prod);
    pthread_create(&th_cons, NULL, consumidor, &id_cons);

    // Esperar finalización
    pthread_join(th_prod, NULL);
    pthread_join(th_cons, NULL);

    // Destrucción de semáforos
    sem_destroy(&mutex);
    sem_destroy(&vacio);
    sem_destroy(&lleno);

    printf("\nTodos los elementos (%d) fueron producidos y consumidos sin deadlock.\n", TOTAL_ITEMS);
    return EXIT_SUCCESS;
}
