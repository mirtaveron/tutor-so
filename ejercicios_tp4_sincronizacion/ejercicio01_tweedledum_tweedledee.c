/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 1 (Problema 1): Tweedledum y Tweedledee
 * ============================================================================
 * Consigna:
 * Tweedledum y Tweedledee intercambian opiniones a través de la variable
 * compartida X en estricta alternancia. Las primitivas primitivas Sleep y Wakeup
 * fallaban por "Lost Wakeup". Se implementa la solución correcta utilizando
 * semáforos POSIX para garantizar alternancia estricta sin pérdida de señales.
 *
 * Compilación:
 *   gcc -pthread ejercicio01_tweedledum_tweedledee.c -o ejercicio01
 * Ejecución:
 *   ./ejercicio01
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define MAX_RONDAS 6

// Semáforos para forzar alternancia estricta
sem_t sem_dum;
sem_t sem_dee;

// Variable global compartida
int x = 0;

// Función que simula la discusión e intercambio de opiniones
int Quarrel(int val, const char* nombre, int ronda) {
    int nuevo_val = val + 1;
    printf("[%s | Ronda %d] Opina sobre X: valor anterior = %d, nuevo valor = %d\n",
           nombre, ronda, val, nuevo_val);
    usleep(250000); // Pausa de 250ms para visualizar la alternancia
    return nuevo_val;
}

// Hilo Tweedledum
void* tweedledum_func(void* arg) {
    for (int i = 1; i <= MAX_RONDAS; i++) {
        // Espera su turno
        sem_wait(&sem_dum);

        // Sección Crítica: modificar variable compartida
        x = Quarrel(x, "Tweedledum", i);

        // Despierta a Tweedledee
        sem_post(&sem_dee);
    }
    return NULL;
}

// Hilo Tweedledee
void* tweedledee_func(void* arg) {
    for (int i = 1; i <= MAX_RONDAS; i++) {
        // Espera su turno
        sem_wait(&sem_dee);

        // Sección Crítica: modificar variable compartida
        x = Quarrel(x, "Tweedledee", i);

        // Despierta a Tweedledum
        sem_post(&sem_dum);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_dum, th_dee;

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 1: Tweedledum y Tweedledee       \n");
    printf("====================================================\n");

    // Inicialización de semáforos:
    // sem_dum inicia en 0 (espera)
    // sem_dee inicia en 1 (Tweedledee comienza primero)
    if (sem_init(&sem_dum, 0, 0) != 0 || sem_init(&sem_dee, 0, 1) != 0) {
        perror("Error al inicializar los semáforos");
        exit(EXIT_FAILURE);
    }

    printf("Iniciando hilos con alternancia estricta...\n\n");

    // Creación de los hilos
    if (pthread_create(&th_dum, NULL, tweedledum_func, NULL) != 0) {
        perror("Error al crear hilo Tweedledum");
        exit(EXIT_FAILURE);
    }
    if (pthread_create(&th_dee, NULL, tweedledee_func, NULL) != 0) {
        perror("Error al crear hilo Tweedledee");
        exit(EXIT_FAILURE);
    }

    // Esperar a que ambos hilos finalicen sus rondas
    pthread_join(th_dum, NULL);
    pthread_join(th_dee, NULL);

    // Destrucción de semáforos
    sem_destroy(&sem_dum);
    sem_destroy(&sem_dee);

    printf("\nEjecución finalizada con éxito. Valor final de X = %d (esperado %d).\n",
           x, MAX_RONDAS * 2);
    return EXIT_SUCCESS;
}
