/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 8 (Problema 8): Lectores y Escritores con Semáforos
 * ============================================================================
 * Consigna:
 * Controlar el acceso a un archivo/recurso compartido permitiendo:
 * - Múltiples lectores leyendo simultáneamente.
 * - Un único escritor en forma totalmente exclusiva (ningún otro lector ni
 *   escritor puede estar activo a la vez).
 *
 * Implementación clásica con semáforos POSIX (Preferencia Lectores).
 *
 * Compilación:
 *   gcc -pthread ejercicio08_lectores_escritores_semaforos.c -o ejercicio08
 * Ejecución:
 *   ./ejercicio08
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define NUM_LECTORES   4
#define NUM_ESCRITORES 2
#define ITERACIONES    2

int dato_compartido = 100; // Recurso compartido
int read_count = 0;        // Contador de lectores activos en la base de datos

sem_t mutex; // Protege la variable compartida 'read_count'
sem_t db;    // Exclusión mutua para el acceso al recurso 'dato_compartido'

// Hilo Lector
void* lector(void* arg) {
    int id = *((int*)arg);

    for (int i = 1; i <= ITERACIONES; i++) {
        usleep((rand() % 300) * 1000);

        // --- ENTRADA AL RECURSO ---
        sem_wait(&mutex);
        read_count++;
        // El primer lector bloquea a los escritores
        if (read_count == 1) {
            sem_wait(&db);
        }
        sem_post(&mutex);

        // --- SECCIÓN DE LECTURA (concurrente entre lectores) ---
        printf("  [Lector %d] Leyendo dato: %d (Lectores concurrentes activos: %d)\n",
               id, dato_compartido, read_count);
        usleep(200000); // Simula tiempo de lectura

        // --- SALIDA DEL RECURSO ---
        sem_wait(&mutex);
        read_count--;
        // El último lector libera el recurso para que los escritores puedan entrar
        if (read_count == 0) {
            sem_post(&db);
        }
        sem_post(&mutex);
    }
    return NULL;
}

// Hilo Escritor
void* escritor(void* arg) {
    int id = *((int*)arg);

    for (int i = 1; i <= ITERACIONES; i++) {
        usleep((rand() % 400 + 100) * 1000);

        // El escritor requiere exclusión mutua total
        sem_wait(&db);

        // --- SECCIÓN DE ESCRITURA EXCLUSIVA ---
        dato_compartido += 10;
        printf(">>> [Escritor %d] Modificando dato compartido a: %d (Exclusión total activa)\n",
               id, dato_compartido);
        usleep(300000); // Simula tiempo de escritura
        printf(">>> [Escritor %d] Escritura finalizada.\n", id);

        sem_post(&db);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_lectores[NUM_LECTORES];
    pthread_t th_escritores[NUM_ESCRITORES];
    int id_l[NUM_LECTORES], id_e[NUM_ESCRITORES];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 8: Lectores y Escritores (Sem)   \n");
    printf("   (%d Lectores | %d Escritores)                     \n", NUM_LECTORES, NUM_ESCRITORES);
    printf("====================================================\n\n");

    // Inicialización de semáforos
    sem_init(&mutex, 0, 1);
    sem_init(&db, 0, 1);

    // Crear hilos lectores
    for (int i = 0; i < NUM_LECTORES; i++) {
        id_l[i] = i + 1;
        pthread_create(&th_lectores[i], NULL, lector, &id_l[i]);
    }

    // Crear hilos escritores
    for (int i = 0; i < NUM_ESCRITORES; i++) {
        id_e[i] = i + 1;
        pthread_create(&th_escritores[i], NULL, escritor, &id_e[i]);
    }

    // Esperar finalización
    for (int i = 0; i < NUM_LECTORES; i++) pthread_join(th_lectores[i], NULL);
    for (int i = 0; i < NUM_ESCRITORES; i++) pthread_join(th_escritores[i], NULL);

    // Limpieza
    sem_destroy(&mutex);
    sem_destroy(&db);

    printf("\nValor final del dato compartido = %d\n", dato_compartido);
    printf("Ejecución finalizada sin condiciones de carrera.\n");
    return EXIT_SUCCESS;
}
