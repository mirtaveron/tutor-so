/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 12 (Problema 12): Limitación de Conexiones en Servidor
 * ============================================================================
 * Consigna:
 * Los servidores pueden diseñarse para limitar el número de conexiones abiertas.
 * Por ejemplo, autorizar sólo N conexiones simultáneas de tipo socket.
 * En cuanto se alcancen las N conexiones, el servidor no aceptará otra
 * entrante hasta que una existente se libere.
 *
 * Implementación con un semáforo contador POSIX (sem_t):
 * - sem_init(&limite_conexiones, 0, N);
 * - El despachador invoca sem_wait(&limite_conexiones) antes de atender.
 * - Cada worker thread atiende al cliente y al cerrar invoca sem_post.
 *
 * Compilación:
 *   gcc -pthread ejercicio12_limite_conexiones.c -o ejercicio12
 * Ejecución:
 *   ./ejercicio12
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define MAX_CONEXIONES_SIMULTANEAS 3
#define TOTAL_SOLICITUDES          10

sem_t limite_conexiones; // Semáforo contador inicializado en MAX_CONEXIONES_SIMULTANEAS
int conexiones_activas = 0;
pthread_mutex_t mutex_cont; // Solo para llevar estadística segura de conexiones activas

// Función que atiende a una conexión de cliente en un hilo separado
void* atender_cliente(void* arg) {
    int id = *((int*)arg);

    pthread_mutex_lock(&mutex_cont);
    conexiones_activas++;
    printf("  [Worker Conexión #%02d] -> Conectado. Conexiones activas: %d/%d\n",
           id, conexiones_activas, MAX_CONEXIONES_SIMULTANEAS);
    pthread_mutex_unlock(&mutex_cont);

    // Simula procesamiento de la petición del cliente (E/S o cálculo)
    usleep((rand() % 300 + 200) * 1000); // 200ms a 500ms

    pthread_mutex_lock(&mutex_cont);
    conexiones_activas--;
    printf("  [Worker Conexión #%02d] <- Cerrando socket. Conexiones activas: %d/%d\n",
           id, conexiones_activas, MAX_CONEXIONES_SIMULTANEAS);
    pthread_mutex_unlock(&mutex_cont);

    // CRÍTICO: Libera el slot de conexión para permitir que entre la siguiente
    sem_post(&limite_conexiones);

    free(arg);
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t hilos[TOTAL_SOLICITUDES];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 12: Limitación de Conexiones     \n");
    printf("   (Límite: %d simultáneas | Solicitudes: %d)       \n",
           MAX_CONEXIONES_SIMULTANEAS, TOTAL_SOLICITUDES);
    printf("====================================================\n\n");

    // Inicialización del semáforo contador con el límite N de conexiones
    sem_init(&limite_conexiones, 0, MAX_CONEXIONES_SIMULTANEAS);
    pthread_mutex_init(&mutex_cont, NULL);

    printf("[Servidor] Iniciando bucle despachador de conexiones...\n\n");

    for (int i = 1; i <= TOTAL_SOLICITUDES; i++) {
        printf("[Dispatcher] Recibida solicitud #%02d. Verificando disponibilidad...\n", i);

        // Si ya hay N conexiones activas, el semáforo está en 0 y el dispatcher se BLOQUEA aquí
        sem_wait(&limite_conexiones);

        printf("[Dispatcher] ✓ Slot disponible otorgado para conexión #%02d.\n", i);

        int* id = malloc(sizeof(int));
        *id = i;
        pthread_create(&hilos[i - 1], NULL, atender_cliente, id);

        usleep(80000); // Pequeña pausa entre llegadas de clientes
    }

    // Esperar a que todos los workers finalicen
    for (int i = 0; i < TOTAL_SOLICITUDES; i++) {
        pthread_join(hilos[i], NULL);
    }

    sem_destroy(&limite_conexiones);
    pthread_mutex_destroy(&mutex_cont);

    printf("\nTodas las solicitudes fueron atendidas respetando el límite estricto de %d conexiones.\n",
           MAX_CONEXIONES_SIMULTANEAS);
    return EXIT_SUCCESS;
}
