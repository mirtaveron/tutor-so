/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 4 (Problema 4): Secuencias de Hilos (A, B, C, D, E)
 * ============================================================================
 * Consignas:
 * Se tienen 5 hilos independientes (A, B, C, D, E). Sincronizar usando
 * la cantidad mínima y más eficiente de semáforos POSIX para cada caso:
 *
 *   a) Secuencia: ABCDE ABCDE ABCDE ...
 *   b) Secuencia: ACDE BCDE ACDE BCDE ...
 *   c) Secuencia: (A o B)CDE (A o B)CDE ... (No determinista entre A y B)
 *   d) Secuencia: (A o B)CE (A o B)(A o B)DE ...
 *
 * Compilación:
 *   gcc -pthread ejercicio04_secuencias_abcde.c -o ejercicio04
 * Ejecución:
 *   ./ejercicio04
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define CICLOS 3

// ----------------------------------------------------------------------------
// CASO A: ABCDE ABCDE ...
// ----------------------------------------------------------------------------
static sem_t semA_a, semB_a, semC_a, semD_a, semE_a;

void* hiloA_a(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semA_a);
        printf("A"); fflush(stdout);
        sem_post(&semB_a);
    }
    return NULL;
}
void* hiloB_a(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semB_a);
        printf("B"); fflush(stdout);
        sem_post(&semC_a);
    }
    return NULL;
}
void* hiloC_a(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semC_a);
        printf("C"); fflush(stdout);
        sem_post(&semD_a);
    }
    return NULL;
}
void* hiloD_a(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semD_a);
        printf("D"); fflush(stdout);
        sem_post(&semE_a);
    }
    return NULL;
}
void* hiloE_a(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semE_a);
        printf("E "); fflush(stdout);
        sem_post(&semA_a);
    }
    return NULL;
}

void ejecutar_caso_a() {
    printf("1. Secuencia A (ABCDE ABCDE ...):\n   Resultado: ");
    sem_init(&semA_a, 0, 1); // A arranca
    sem_init(&semB_a, 0, 0);
    sem_init(&semC_a, 0, 0);
    sem_init(&semD_a, 0, 0);
    sem_init(&semE_a, 0, 0);

    pthread_t h[5];
    pthread_create(&h[0], NULL, hiloA_a, NULL);
    pthread_create(&h[1], NULL, hiloB_a, NULL);
    pthread_create(&h[2], NULL, hiloC_a, NULL);
    pthread_create(&h[3], NULL, hiloD_a, NULL);
    pthread_create(&h[4], NULL, hiloE_a, NULL);

    for (int i = 0; i < 5; i++) pthread_join(h[i], NULL);

    sem_destroy(&semA_a); sem_destroy(&semB_a); sem_destroy(&semC_a);
    sem_destroy(&semD_a); sem_destroy(&semE_a);
    printf("\n\n");
}

// ----------------------------------------------------------------------------
// CASO B: ACDE BCDE ACDE BCDE ...
// Alternancia entre A y B en cada ciclo hacia CDE
// ----------------------------------------------------------------------------
static sem_t semA_b, semB_b, semC_b, semD_b, semE_b;
static int turno_B = 0; // 0 = le toca a A, 1 = le toca a B

void* hiloA_b(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semA_b);
        printf("A"); fflush(stdout);
        sem_post(&semC_b);
    }
    return NULL;
}
void* hiloB_b(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semB_b);
        printf("B"); fflush(stdout);
        sem_post(&semC_b);
    }
    return NULL;
}
void* hiloC_b(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semC_b);
        printf("C"); fflush(stdout);
        sem_post(&semD_b);
    }
    return NULL;
}
void* hiloD_b(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semD_b);
        printf("D"); fflush(stdout);
        sem_post(&semE_b);
    }
    return NULL;
}
void* hiloE_b(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semE_b);
        printf("E "); fflush(stdout);
        // Al terminar E, alternamos entre despertar a A o a B
        if (!turno_B) {
            turno_B = 1;
            sem_post(&semB_b);
        } else {
            turno_B = 0;
            sem_post(&semA_b);
        }
    }
    return NULL;
}

void ejecutar_caso_b() {
    printf("2. Secuencia B (ACDE BCDE ACDE BCDE ...):\n   Resultado: ");
    sem_init(&semA_b, 0, 1); // Arranca A
    sem_init(&semB_b, 0, 0);
    sem_init(&semC_b, 0, 0);
    sem_init(&semD_b, 0, 0);
    sem_init(&semE_b, 0, 0);
    turno_B = 0;

    pthread_t h[5];
    pthread_create(&h[0], NULL, hiloA_b, NULL);
    pthread_create(&h[1], NULL, hiloB_b, NULL);
    pthread_create(&h[2], NULL, hiloC_b, NULL);
    pthread_create(&h[3], NULL, hiloD_b, NULL);
    pthread_create(&h[4], NULL, hiloE_b, NULL);

    for (int i = 0; i < 5; i++) pthread_join(h[i], NULL);

    sem_destroy(&semA_b); sem_destroy(&semB_b); sem_destroy(&semC_b);
    sem_destroy(&semD_b); sem_destroy(&semE_b);
    printf("\n\n");
}

// ----------------------------------------------------------------------------
// CASO C: (A o B)CDE (A o B)CDE ...
// Compiten A o B por un semáforo común semAB
// ----------------------------------------------------------------------------
static sem_t semAB_c, semC_c, semD_c, semE_c;

void* hiloA_c(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semAB_c);
        printf("A"); fflush(stdout);
        sem_post(&semC_c);
    }
    return NULL;
}
void* hiloB_c(void* arg) {
    for (int i = 0; i < CICLOS; i++) {
        sem_wait(&semAB_c);
        printf("B"); fflush(stdout);
        sem_post(&semC_c);
    }
    return NULL;
}
void* hiloC_c(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semC_c);
        printf("C"); fflush(stdout);
        sem_post(&semD_c);
    }
    return NULL;
}
void* hiloD_c(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semD_c);
        printf("D"); fflush(stdout);
        sem_post(&semE_c);
    }
    return NULL;
}
void* hiloE_c(void* arg) {
    for (int i = 0; i < CICLOS * 2; i++) {
        sem_wait(&semE_c);
        printf("E "); fflush(stdout);
        sem_post(&semAB_c); // Permite al próximo (A o B)
    }
    return NULL;
}

void ejecutar_caso_c() {
    printf("3. Secuencia C ((A o B)CDE ... no determinista):\n   Resultado: ");
    sem_init(&semAB_c, 0, 1);
    sem_init(&semC_c, 0, 0);
    sem_init(&semD_c, 0, 0);
    sem_init(&semE_c, 0, 0);

    pthread_t h[5];
    pthread_create(&h[0], NULL, hiloA_c, NULL);
    pthread_create(&h[1], NULL, hiloB_c, NULL);
    pthread_create(&h[2], NULL, hiloC_c, NULL);
    pthread_create(&h[3], NULL, hiloD_c, NULL);
    pthread_create(&h[4], NULL, hiloE_c, NULL);

    for (int i = 0; i < 5; i++) pthread_join(h[i], NULL);

    sem_destroy(&semAB_c); sem_destroy(&semC_c);
    sem_destroy(&semD_c); sem_destroy(&semE_c);
    printf("\n\n");
}

int main(int argc, char* argv[]) {
    printf("====================================================\n");
    printf("   TP4 - Ejercicio 4: Secuencias de Hilos (A..E)    \n");
    printf("====================================================\n\n");

    ejecutar_caso_a();
    ejecutar_caso_b();
    ejecutar_caso_c();

    printf("Demostración de secuencias completada con éxito.\n");
    return EXIT_SUCCESS;
}
