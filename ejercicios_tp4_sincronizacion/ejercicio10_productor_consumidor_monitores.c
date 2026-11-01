/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 10 (Problema 10): Productor - Consumidor con Monitores
 * ============================================================================
 * Consigna:
 * Implementar el problema del Productor-Consumidor con buffer acotado
 * utilizando la abstracción de Monitores (simulado en C con pthread_mutex_t
 * y pthread_cond_t con las condiciones no_lleno y no_vacio).
 *
 * Compilación:
 *   gcc -pthread ejercicio10_productor_consumidor_monitores.c -o ejercicio10
 * Ejecución:
 *   ./ejercicio10
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define BUFFER_SIZE 5
#define ITEMS_POR_PRODUCTOR 6
#define NUM_PRODUCTORES 2
#define NUM_CONSUMIDORES 2

// Estructura que encapsula el Monitor Productor-Consumidor
typedef struct {
    int buffer[BUFFER_SIZE];
    int in;
    int out;
    int count;

    pthread_mutex_t lock;      // Exclusión mutua interna del monitor
    pthread_cond_t  no_lleno;  // Espera si el buffer está lleno (count == BUFFER_SIZE)
    pthread_cond_t  no_vacio;  // Espera si el buffer está vacío (count == 0)
} MonitorPC;

MonitorPC mon;

// Inicialización del Monitor
void monitor_pc_init(MonitorPC* m) {
    m->in = 0;
    m->out = 0;
    m->count = 0;
    pthread_mutex_init(&m->lock, NULL);
    pthread_cond_init(&m->no_lleno, NULL);
    pthread_cond_init(&m->no_vacio, NULL);
}

// Destrucción del Monitor
void monitor_pc_destroy(MonitorPC* m) {
    pthread_mutex_destroy(&m->lock);
    pthread_cond_destroy(&m->no_lleno);
    pthread_cond_destroy(&m->no_vacio);
}

// Método de entrada al Monitor: insertar elemento
void monitor_pc_insertar(MonitorPC* m, int item, int prod_id) {
    pthread_mutex_lock(&m->lock);

    // Mientras el buffer esté lleno, suspender en condición no_lleno
    while (m->count == BUFFER_SIZE) {
        printf("  [Productor %d] Buffer LLENO (%d/%d). Esperando en no_lleno...\n",
               prod_id, m->count, BUFFER_SIZE);
        pthread_cond_wait(&m->no_lleno, &m->lock);
    }

    // Inserción en el buffer
    m->buffer[m->in] = item;
    m->in = (m->in + 1) % BUFFER_SIZE;
    m->count++;
    printf("[Productor %d] -> Insertó %3d (Ocupación: %d/%d)\n", prod_id, item, m->count, BUFFER_SIZE);

    // Notificar a los consumidores que el buffer ya no está vacío
    pthread_cond_signal(&m->no_vacio);

    pthread_mutex_unlock(&m->lock);
}

// Método de entrada al Monitor: remover elemento
int monitor_pc_remover(MonitorPC* m, int cons_id) {
    pthread_mutex_lock(&m->lock);

    // Mientras el buffer esté vacío, suspender en condición no_vacio
    while (m->count == 0) {
        printf("    [Consumidor %d] Buffer VACÍO (0/%d). Esperando en no_vacio...\n",
               cons_id, BUFFER_SIZE);
        pthread_cond_wait(&m->no_vacio, &m->lock);
    }

    // Extracción del buffer
    int item = m->buffer[m->out];
    m->out = (m->out + 1) % BUFFER_SIZE;
    m->count--;
    printf("    [Consumidor %d] <- Extrajo %3d (Ocupación: %d/%d)\n", cons_id, item, m->count, BUFFER_SIZE);

    // Notificar a los productores que hay un nuevo espacio libre
    pthread_cond_signal(&m->no_lleno);

    pthread_mutex_unlock(&m->lock);
    return item;
}

// Hilo Productor
void* productor_hilo(void* arg) {
    int id = *((int*)arg);
    for (int i = 1; i <= ITEMS_POR_PRODUCTOR; i++) {
        int item = (id * 100) + i;
        monitor_pc_insertar(&mon, item, id);
        usleep((rand() % 150 + 50) * 1000);
    }
    return NULL;
}

// Hilo Consumidor
void* consumidor_hilo(void* arg) {
    int id = *((int*)arg);
    int total_a_consumir = (NUM_PRODUCTORES * ITEMS_POR_PRODUCTOR) / NUM_CONSUMIDORES;
    for (int i = 1; i <= total_a_consumir; i++) {
        int item = monitor_pc_remover(&mon, id);
        (void)item;
        usleep((rand() % 250 + 100) * 1000);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t prods[NUM_PRODUCTORES], cons[NUM_CONSUMIDORES];
    int id_p[NUM_PRODUCTORES], id_c[NUM_CONSUMIDORES];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 10: Productor-Consumidor (Monitor)\n");
    printf("   (Buffer: %d | Productores: %d | Consumidores: %d)\n",
           BUFFER_SIZE, NUM_PRODUCTORES, NUM_CONSUMIDORES);
    printf("====================================================\n\n");

    monitor_pc_init(&mon);

    for (int i = 0; i < NUM_PRODUCTORES; i++) {
        id_p[i] = i + 1;
        pthread_create(&prods[i], NULL, productor_hilo, &id_p[i]);
    }
    for (int i = 0; i < NUM_CONSUMIDORES; i++) {
        id_c[i] = i + 1;
        pthread_create(&cons[i], NULL, consumidor_hilo, &id_c[i]);
    }

    for (int i = 0; i < NUM_PRODUCTORES; i++) pthread_join(prods[i], NULL);
    for (int i = 0; i < NUM_CONSUMIDORES; i++) pthread_join(cons[i], NULL);

    monitor_pc_destroy(&mon);

    printf("\nTodos los elementos fueron producidos y consumidos a través del monitor.\n");
    return EXIT_SUCCESS;
}
