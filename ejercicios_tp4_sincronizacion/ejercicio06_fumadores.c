/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 6 (Problema 6): Fumadores de Cigarrillos (Patil 1971)
 * ============================================================================
 * Consigna:
 * Tres fumadores y un agente.
 * - Fumador 1: Posee Tabaco    -> Necesita Papel y Fósforos
 * - Fumador 2: Posee Papel     -> Necesita Tabaco y Fósforos
 * - Fumador 3: Posee Fósforos  -> Necesita Tabaco y Papel
 *
 * El agente coloca dos ingredientes al azar en la mesa. El fumador que tiene
 * el ingrediente restante arma el cigarrillo, fuma y le avisa al agente
 * cuando termina para iniciar una nueva ronda.
 *
 * Compilación:
 *   gcc -pthread ejercicio06_fumadores.c -o ejercicio06
 * Ejecución:
 *   ./ejercicio06
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>
#include <time.h>

#define TOTAL_RONDAS 6

// Semáforo para el agente (indica que la mesa está libre)
sem_t sem_agente;

// Semáforos que despiertan al fumador correspondiente según lo que falta
sem_t sem_fumador_tabaco;   // Mesa tiene: Papel + Fósforos
sem_t sem_fumador_papel;    // Mesa tiene: Tabaco + Fósforos
sem_t sem_fumador_fosforo;  // Mesa tiene: Tabaco + Papel

// Hilo del Agente
void* agente(void* arg) {
    for (int r = 1; r <= TOTAL_RONDAS; r++) {
        // Espera a que la mesa quede libre (el fumador anterior terminó)
        sem_wait(&sem_agente);

        int ingrediente_que_falta = rand() % 3;

        printf("\n================ [Ronda %d de %d] ================\n", r, TOTAL_RONDAS);
        if (ingrediente_que_falta == 0) {
            printf("[Agente] Coloca en la mesa: PAPEL y FÓSFOROS.\n");
            usleep(150000);
            sem_post(&sem_fumador_tabaco); // Despierta al fumador con Tabaco
        } else if (ingrediente_que_falta == 1) {
            printf("[Agente] Coloca en la mesa: TABACO y FÓSFOROS.\n");
            usleep(150000);
            sem_post(&sem_fumador_papel);  // Despierta al fumador con Papel
        } else {
            printf("[Agente] Coloca en la mesa: TABACO y PAPEL.\n");
            usleep(150000);
            sem_post(&sem_fumador_fosforo);// Despierta al fumador con Fósforos
        }
    }
    return NULL;
}

// Fumador 1: Posee Tabaco
void* fumador_tabaco(void* arg) {
    while (1) {
        sem_wait(&sem_fumador_tabaco);
        printf("  -> [Fumador TABACO] Toma Papel y Fósforos. Arma cigarrillo y FUMA 🚬...\n");
        usleep(300000);
        printf("  -> [Fumador TABACO] Terminó de fumar. Avisa al Agente.\n");
        sem_post(&sem_agente);
    }
    return NULL;
}

// Fumador 2: Posee Papel
void* fumador_papel(void* arg) {
    while (1) {
        sem_wait(&sem_fumador_papel);
        printf("  -> [Fumador PAPEL] Toma Tabaco y Fósforos. Arma cigarrillo y FUMA 🚬...\n");
        usleep(300000);
        printf("  -> [Fumador PAPEL] Terminó de fumar. Avisa al Agente.\n");
        sem_post(&sem_agente);
    }
    return NULL;
}

// Fumador 3: Posee Fósforos
void* fumador_fosforo(void* arg) {
    while (1) {
        sem_wait(&sem_fumador_fosforo);
        printf("  -> [Fumador FÓSFORO] Toma Tabaco y Papel. Arma cigarrillo y FUMA 🚬...\n");
        usleep(300000);
        printf("  -> [Fumador FÓSFORO] Terminó de fumar. Avisa al Agente.\n");
        sem_post(&sem_agente);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_agente, th_f1, th_f2, th_f3;

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 6: Fumadores de Cigarrillos      \n");
    printf("====================================================\n");

    // Inicialización de semáforos:
    // sem_agente inicia en 1 (mesa lista para colocar ingredientes)
    // fumadores inician en 0 (esperan sus ingredientes)
    sem_init(&sem_agente, 0, 1);
    sem_init(&sem_fumador_tabaco, 0, 0);
    sem_init(&sem_fumador_papel, 0, 0);
    sem_init(&sem_fumador_fosforo, 0, 0);

    // Creación de hilos fumadores
    pthread_create(&th_f1, NULL, fumador_tabaco, NULL);
    pthread_create(&th_f2, NULL, fumador_papel, NULL);
    pthread_create(&th_f3, NULL, fumador_fosforo, NULL);

    // Creación del hilo agente
    pthread_create(&th_agente, NULL, agente, NULL);

    // Esperar a que el agente complete las rondas
    pthread_join(th_agente, NULL);

    // Breve pausa para que el último fumador termine
    usleep(400000);

    // Cancelar hilos fumadores que quedan en loop infinito
    pthread_cancel(th_f1);
    pthread_cancel(th_f2);
    pthread_cancel(th_f3);

    // Destrucción de semáforos
    sem_destroy(&sem_agente);
    sem_destroy(&sem_fumador_tabaco);
    sem_destroy(&sem_fumador_papel);
    sem_destroy(&sem_fumador_fosforo);

    printf("\nSimulación de fumadores finalizada correctamente.\n");
    return EXIT_SUCCESS;
}
