/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 13 (Problema 13): Usuarios Compartiendo 2 Impresoras
 * ============================================================================
 * Consigna:
 * N usuarios (hilos) comparten 2 impresoras.
 * - requerir_impresora(): Espera hasta que haya una libre y retorna su ID (0 o 1).
 * - liberar_impresora(id): Libera la impresora y despierta al siguiente usuario.
 *
 * Inciso a: Sincronización con semáforos POSIX para asignar impresoras libres.
 * Inciso b: Asignación por PRIORIDAD ÚNICA al usuario de mayor prioridad en espera.
 *
 * Compilación:
 *   gcc -pthread ejercicio13_impresoras_compartidas.c -o ejercicio13
 * Ejecución:
 *   ./ejercicio13
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define NUM_IMPRESORAS 2
#define NUM_USUARIOS   6

// ----------------------------------------------------------------------------
// PARTE A: ASIGNACIÓN SIMPLE CON SEMÁFOROS
// ----------------------------------------------------------------------------
typedef struct {
    sem_t impresoras_disponibles; // Contador: inicia en 2
    sem_t mutex_estado;           // Mutex binario para consultar/marcar libre[]
    int libre[NUM_IMPRESORAS];    // 1 si está libre, 0 si ocupada
} ServidorImpresionA;

ServidorImpresionA servA;

void servidor_a_init(ServidorImpresionA* s) {
    sem_init(&s->impresoras_disponibles, 0, NUM_IMPRESORAS);
    sem_init(&s->mutex_estado, 0, 1);
    for (int i = 0; i < NUM_IMPRESORAS; i++) s->libre[i] = 1;
}

int requerir_impresora_a(ServidorImpresionA* s, int usuario_id) {
    // 1. Espera a que haya al menos una impresora libre en total
    sem_wait(&s->impresoras_disponibles);

    // 2. Sección Crítica: identificar cuál de las dos impresoras está libre
    sem_wait(&s->mutex_estado);
    int id_impresora = -1;
    for (int i = 0; i < NUM_IMPRESORAS; i++) {
        if (s->libre[i]) {
            s->libre[i] = 0;
            id_impresora = i;
            break;
        }
    }
    sem_post(&s->mutex_estado);

    printf("  [Usuario %d] -> Obtuvo Impresora #%d libre.\n", usuario_id, id_impresora);
    return id_impresora;
}

void liberar_impresora_a(ServidorImpresionA* s, int id_impresora, int usuario_id) {
    sem_wait(&s->mutex_estado);
    s->libre[id_impresora] = 1;
    printf("  [Usuario %d] <- Liberó Impresora #%d.\n", usuario_id, id_impresora);
    sem_post(&s->mutex_estado);

    // Incrementa la disponibilidad para despertar al siguiente usuario
    sem_post(&s->impresoras_disponibles);
}

// ----------------------------------------------------------------------------
// PARTE B: ASIGNACIÓN POR PRIORIDAD ÚNICA
// ----------------------------------------------------------------------------
typedef struct {
    int usuario_id;
    int prioridad;          // Mayor valor = Mayor prioridad
    int id_impresora_asignada;
    sem_t sem_privado;      // Bloquea al hilo hasta que se le asigne impresora
    int esperando;
} Solicitante;

typedef struct {
    pthread_mutex_t lock;
    int libre[NUM_IMPRESORAS];
    Solicitante solicitantes[NUM_USUARIOS];
} ServidorPrioridadB;

ServidorPrioridadB servB;

void servidor_b_init(ServidorPrioridadB* s) {
    pthread_mutex_init(&s->lock, NULL);
    for (int i = 0; i < NUM_IMPRESORAS; i++) s->libre[i] = 1;
    for (int i = 0; i < NUM_USUARIOS; i++) {
        s->solicitantes[i].usuario_id = i;
        s->solicitantes[i].prioridad = (i + 1) * 10; // Prioridades únicas: 10, 20, 30, 40, 50, 60
        s->solicitantes[i].esperando = 0;
        s->solicitantes[i].id_impresora_asignada = -1;
        sem_init(&s->solicitantes[i].sem_privado, 0, 0);
    }
}

int requerir_impresora_b(ServidorPrioridadB* s, int usuario_id) {
    pthread_mutex_lock(&s->lock);

    // Si hay una impresora libre de inmediato, la toma
    for (int i = 0; i < NUM_IMPRESORAS; i++) {
        if (s->libre[i]) {
            s->libre[i] = 0;
            printf("  [Usuario %d | Prioridad %d] -> Impresora #%d libre directa.\n",
                   usuario_id, s->solicitantes[usuario_id].prioridad, i);
            pthread_mutex_unlock(&s->lock);
            return i;
        }
    }

    // Ambas impresoras ocupadas: se registra en espera
    s->solicitantes[usuario_id].esperando = 1;
    printf("  [Usuario %d | Prioridad %d] En espera. Ambas impresoras ocupadas.\n",
           usuario_id, s->solicitantes[usuario_id].prioridad);
    pthread_mutex_unlock(&s->lock);

    // Espera en su semáforo privado
    sem_wait(&s->solicitantes[usuario_id].sem_privado);

    return s->solicitantes[usuario_id].id_impresora_asignada;
}

void liberar_impresora_b(ServidorPrioridadB* s, int id_impresora, int usuario_id) {
    pthread_mutex_lock(&s->lock);

    printf("  [Usuario %d | Prioridad %d] <- Liberó Impresora #%d.\n",
           usuario_id, s->solicitantes[usuario_id].prioridad, id_impresora);

    // Buscar entre los usuarios en espera aquel con MAYOR PRIORIDAD
    int mejor_candidato = -1;
    int max_prioridad = -1;

    for (int i = 0; i < NUM_USUARIOS; i++) {
        if (s->solicitantes[i].esperando) {
            if (s->solicitantes[i].prioridad > max_prioridad) {
                max_prioridad = s->solicitantes[i].prioridad;
                mejor_candidato = i;
            }
        }
    }

    if (mejor_candidato != -1) {
        // Se le asigna la impresora directamente al usuario más prioritario
        s->solicitantes[mejor_candidato].esperando = 0;
        s->solicitantes[mejor_candidato].id_impresora_asignada = id_impresora;
        printf("  >>> Servidor asigna Impresora #%d al Usuario %d por MAYOR PRIORIDAD (%d)\n",
               id_impresora, mejor_candidato, max_prioridad);
        sem_post(&s->solicitantes[mejor_candidato].sem_privado);
    } else {
        // No hay nadie esperando, la impresora queda libre
        s->libre[id_impresora] = 1;
    }

    pthread_mutex_unlock(&s->lock);
}

// Rutina de usuario para Parte A
void* usuario_hilo_a(void* arg) {
    int id = *((int*)arg);
    usleep((rand() % 200) * 1000);

    int id_imp = requerir_impresora_a(&servA, id);
    usleep(200000); // Imprimiendo...
    liberar_impresora_a(&servA, id_imp, id);

    return NULL;
}

// Rutina de usuario para Parte B
void* usuario_hilo_b(void* arg) {
    int id = *((int*)arg);
    usleep((rand() % 150) * 1000);

    int id_imp = requerir_impresora_b(&servB, id);
    usleep(250000); // Imprimiendo...
    liberar_impresora_b(&servB, id_imp, id);

    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th[NUM_USUARIOS];
    int ids[NUM_USUARIOS];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 13: 2 Impresoras Compartidas     \n");
    printf("====================================================\n\n");

    // Ejecución Parte A
    printf("--- PARTE A: Asignación estándar con semáforos ---\n");
    servidor_a_init(&servA);
    for (int i = 0; i < NUM_USUARIOS; i++) {
        ids[i] = i + 1;
        pthread_create(&th[i], NULL, usuario_hilo_a, &ids[i]);
    }
    for (int i = 0; i < NUM_USUARIOS; i++) pthread_join(th[i], NULL);
    sem_destroy(&servA.impresoras_disponibles);
    sem_destroy(&servA.mutex_estado);

    // Ejecución Parte B
    printf("\n--- PARTE B: Asignación por PRIORIDAD ÚNICA ---\n");
    servidor_b_init(&servB);
    for (int i = 0; i < NUM_USUARIOS; i++) {
        ids[i] = i;
        pthread_create(&th[i], NULL, usuario_hilo_b, &ids[i]);
    }
    for (int i = 0; i < NUM_USUARIOS; i++) pthread_join(th[i], NULL);
    pthread_mutex_destroy(&servB.lock);
    for (int i = 0; i < NUM_USUARIOS; i++) {
        sem_destroy(&servB.solicitantes[i].sem_privado);
    }

    printf("\nTodos los usuarios completaron sus impresiones.\n");
    return EXIT_SUCCESS;
}
