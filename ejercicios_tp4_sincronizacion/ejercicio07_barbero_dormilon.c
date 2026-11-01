/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 7 (Problema 7): El Barbero Dormilón (Dijkstra 1971)
 * ============================================================================
 * Consigna:
 * Sala de espera con N sillas. Si no hay clientes, el barbero duerme.
 * Cuando llega un cliente:
 * - Si todas las sillas están ocupadas, el cliente se va.
 * - Si hay sillas libres pero el barbero está ocupado, se sienta a esperar.
 * - Si el barbero está dormido, el cliente lo despierta.
 *
 * Sincronización con semáforos POSIX.
 *
 * Compilación:
 *   gcc -pthread ejercicio07_barbero_dormilon.c -o ejercicio07
 * Ejecución:
 *   ./ejercicio07
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>
#include <time.h>

#define NUM_SILLAS 3
#define TOTAL_CLIENTES 8

int esperando = 0; // Clientes sentados en la sala de espera

// Semáforos de sincronización
sem_t mutex;     // Protege el acceso a la variable 'esperando'
sem_t clientes;  // Cuenta clientes en espera (despierta al barbero si duerme)
sem_t barbero;   // Indica que el barbero está listo para cortar el pelo

// Hilo del Barbero
void* barbero_func(void* arg) {
    while (1) {
        printf("[Barbero] Zzz... Durmiendo en su sillón.\n");

        // 1. Espera a que llegue al menos un cliente
        sem_wait(&clientes);

        // 2. Sección Crítica: decrementar clientes en espera
        sem_wait(&mutex);
        esperando--;

        // 3. Notifica al cliente que pase al sillón de corte
        sem_post(&barbero);
        sem_post(&mutex);

        // 4. Realizar corte de pelo
        printf("[Barbero] ✂️  Cortando el pelo a un cliente...\n");
        usleep(350000); // 350ms de corte
        printf("[Barbero] ✓ Corte finalizado.\n");
    }
    return NULL;
}

// Hilo de cada Cliente
void* cliente_func(void* arg) {
    int id = *((int*)arg);

    usleep((rand() % 400 + 50) * 1000); // Llegan en momentos escalonados

    sem_wait(&mutex);
    printf("  [Cliente %d] Entra a la barbería (Sillas ocupadas: %d/%d).\n", id, esperando, NUM_SILLAS);

    if (esperando < NUM_SILLAS) {
        esperando++;
        printf("  [Cliente %d] Toma asiento en la sala de espera (Total esperando: %d).\n", id, esperando);

        // Despierta al barbero si estaba durmiendo
        sem_post(&clientes);
        sem_post(&mutex);

        // Espera a que el barbero lo llame al sillón de corte
        sem_wait(&barbero);
        printf("  [Cliente %d] Sentado en el sillón de barbero, recibiendo corte...\n", id);
    } else {
        // La sala de espera está llena: el cliente se retira
        printf("  [Cliente %d] ❌ Sala llena. Se retira sin cortarse el pelo.\n", id);
        sem_post(&mutex);
    }

    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_barbero;
    pthread_t th_clientes[TOTAL_CLIENTES];
    int ids[TOTAL_CLIENTES];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 7: El Barbero Dormilón           \n");
    printf("   (Sillas de espera: %d | Total clientes: %d)      \n", NUM_SILLAS, TOTAL_CLIENTES);
    printf("====================================================\n\n");

    // Inicialización de semáforos
    sem_init(&mutex, 0, 1);
    sem_init(&clientes, 0, 0); // 0 clientes al inicio (barbero duerme)
    sem_init(&barbero, 0, 0);  // Barbero no listo hasta que atienda

    // Crear hilo barbero
    pthread_create(&th_barbero, NULL, barbero_func, NULL);

    // Crear hilos clientes
    for (int i = 0; i < TOTAL_CLIENTES; i++) {
        ids[i] = i + 1;
        pthread_create(&th_clientes[i], NULL, cliente_func, &ids[i]);
    }

    // Esperar a que todos los clientes pasen por la barbería
    for (int i = 0; i < TOTAL_CLIENTES; i++) {
        pthread_join(th_clientes[i], NULL);
    }

    // Pequeña espera para que el barbero termine el último corte si había alguno
    usleep(500000);
    pthread_cancel(th_barbero);

    // Destrucción de semáforos
    sem_destroy(&mutex);
    sem_destroy(&clientes);
    sem_destroy(&barbero);

    printf("\nJornada de la barbería finalizada.\n");
    return EXIT_SUCCESS;
}
