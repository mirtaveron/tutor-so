/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 9 (Problema 9): Lectores - Escritores con Monitores (C POSIX)
 * ============================================================================
 * Consigna:
 * Implementar el monitor de lectores y escritores propuesto en la cátedra
 * utilizando primitivas POSIX (pthread_mutex_t y pthread_cond_t).
 *
 * Características del Monitor:
 * - Prioridad a Escritores: Si un escritor está en cola, los nuevos lectores
 *   esperan para evitar que un flujo constante de lectores bloquee al escritor.
 * - Variables de condición: ok_leer y ok_escribir.
 * - Métodos de entrada: inicio_leer(), fin_leer(), inicio_escribir(), fin_escribir().
 *
 * Compilación:
 *   gcc -pthread ejercicio09_lectores_escritores_monitores.c -o ejercicio09
 * Ejecución:
 *   ./ejercicio09
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

// Estructura del Monitor Lector - Escritor
typedef struct {
    pthread_mutex_t lock;      // Exclusión mutua interna del monitor
    pthread_cond_t  ok_leer;    // Condición para esperar a leer
    pthread_cond_t  ok_escribir;// Condición para esperar a escribir

    int lecto_cant;             // Cantidad de lectores activos
    int escribiendo;            // 1 si hay un escritor activo, 0 si no
    int escritores_esperando;   // Cantidad de escritores en cola (equivale a !empty(ok_escribir))
} MonitorLectorEscritor;

MonitorLectorEscritor monitor;
int dato_compartido = 50;

// Inicialización del Monitor
void monitor_init(MonitorLectorEscritor* m) {
    pthread_mutex_init(&m->lock, NULL);
    pthread_cond_init(&m->ok_leer, NULL);
    pthread_cond_init(&m->ok_escribir, NULL);
    m->lecto_cant = 0;
    m->escribiendo = 0;
    m->escritores_esperando = 0;
}

// Destrucción del Monitor
void monitor_destroy(MonitorLectorEscritor* m) {
    pthread_mutex_destroy(&m->lock);
    pthread_cond_destroy(&m->ok_leer);
    pthread_cond_destroy(&m->ok_escribir);
}

// Método de entrada: inicio_leer
void inicio_leer(MonitorLectorEscritor* m) {
    pthread_mutex_lock(&m->lock);

    // Si alguien está escribiendo O hay escritores esperando (prioridad escritores), esperar
    while (m->escribiendo || m->escritores_esperando > 0) {
        pthread_cond_wait(&m->ok_leer, &m->lock);
    }

    m->lecto_cant++;
    // En cascada despierta a otros lectores que puedan estar esperando
    pthread_cond_signal(&m->ok_leer);

    pthread_mutex_unlock(&m->lock);
}

// Método de entrada: fin_leer
void fin_leer(MonitorLectorEscritor* m) {
    pthread_mutex_lock(&m->lock);

    m->lecto_cant--;
    // Si fue el último lector, le da paso a un escritor en espera
    if (m->lecto_cant == 0) {
        pthread_cond_signal(&m->ok_escribir);
    }

    pthread_mutex_unlock(&m->lock);
}

// Método de entrada: inicio_escribir
void inicio_escribir(MonitorLectorEscritor* m) {
    pthread_mutex_lock(&m->lock);

    m->escritores_esperando++;

    // Debe esperar si hay lectores activos O si otro escritor está escribiendo
    while (m->lecto_cant != 0 || m->escribiendo) {
        pthread_cond_wait(&m->ok_escribir, &m->lock);
    }

    m->escritores_esperando--;
    m->escribiendo = 1;

    pthread_mutex_unlock(&m->lock);
}

// Método de entrada: fin_escribir
void fin_escribir(MonitorLectorEscritor* m) {
    pthread_mutex_lock(&m->lock);

    m->escribiendo = 0;

    // Política del monitor: si hay escritores esperando, avisa a otro escritor; si no, a los lectores
    if (m->escritores_esperando > 0) {
        pthread_cond_signal(&m->ok_escribir);
    } else {
        pthread_cond_broadcast(&m->ok_leer);
    }

    pthread_mutex_unlock(&m->lock);
}

// Hilo Lector
void* lector_hilo(void* arg) {
    int id = *((int*)arg);
    for (int i = 0; i < 2; i++) {
        usleep((rand() % 250) * 1000);

        inicio_leer(&monitor);
        printf("  [Monitor Lector %d] Leyendo dato: %d (Lectores activos en monitor: %d)\n",
               id, dato_compartido, monitor.lecto_cant);
        usleep(150000);
        fin_leer(&monitor);
    }
    return NULL;
}

// Hilo Escritor
void* escritor_hilo(void* arg) {
    int id = *((int*)arg);
    for (int i = 0; i < 2; i++) {
        usleep((rand() % 350 + 50) * 1000);

        inicio_escribir(&monitor);
        dato_compartido += 5;
        printf(">>> [Monitor Escritor %d] Escribiendo nuevo dato: %d (Exclusivo)\n", id, dato_compartido);
        usleep(200000);
        fin_escribir(&monitor);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t l[4], e[2];
    int id_l[4], id_e[2];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 9: Lectores-Escritores (Monitor) \n");
    printf("   (Implementación POSIX mutex + condition vars)    \n");
    printf("====================================================\n\n");

    monitor_init(&monitor);

    for (int i = 0; i < 4; i++) {
        id_l[i] = i + 1;
        pthread_create(&l[i], NULL, lector_hilo, &id_l[i]);
    }
    for (int i = 0; i < 2; i++) {
        id_e[i] = i + 1;
        pthread_create(&e[i], NULL, escritor_hilo, &id_e[i]);
    }

    for (int i = 0; i < 4; i++) pthread_join(l[i], NULL);
    for (int i = 0; i < 2; i++) pthread_join(e[i], NULL);

    monitor_destroy(&monitor);

    printf("\nEjecución con monitor completada con éxito. Dato final: %d\n", dato_compartido);
    return EXIT_SUCCESS;
}
