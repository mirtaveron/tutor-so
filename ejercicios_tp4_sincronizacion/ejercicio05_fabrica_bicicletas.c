/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 5 (Problema 5): Fábrica de Bicicletas (MountanenBike)
 * ============================================================================
 * Componentes y operarios:
 * - OP1: Monta ruedas (produce de a 1, la bici requiere 2 ruedas).
 * - OP2: Monta cuadros (la bici requiere 1 cuadro).
 * - OP3: Monta manillares (la bici requiere 1 manillar).
 * - Montador: Espera 2 ruedas, 1 cuadro y 1 manillar, y ensambla la bicicleta.
 *
 * Inciso b contemplado: OP1 tiene capacidad de fabricar hasta 2 ruedas
 * (puedo_rueda inicializado en 2).
 *
 * Compilación:
 *   gcc -pthread ejercicio05_fabrica_bicicletas.c -o ejercicio05
 * Ejecución:
 *   ./ejercicio05
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define TOTAL_BICICLETAS 5

// Semáforos de permiso para fabricar (capacidad disponible)
sem_t puedo_rueda;    // Inicializado en 2 (puede adelantar hasta 2 ruedas)
sem_t puedo_cuadro;   // Inicializado en 1
sem_t puedo_manillar; // Inicializado en 1

// Semáforos que indican piezas listas para el montador
sem_t hay_rueda;      // Inicializado en 0 (acumula hasta 2 para el montador)
sem_t hay_cuadro;     // Inicializado en 0
sem_t hay_manillar;   // Inicializado en 0

// OP1: Fabrica ruedas (debe fabricar 2 ruedas por cada bicicleta)
void* operario1_ruedas(void* arg) {
    int total_ruedas = TOTAL_BICICLETAS * 2;
    for (int r = 1; r <= total_ruedas; r++) {
        sem_wait(&puedo_rueda);
        printf("[OP1 - Ruedas]    Fabricando rueda #%d...\n", r);
        usleep(100000); // 100ms
        printf("[OP1 - Ruedas]    ✓ Rueda #%d LISTA.\n", r);
        sem_post(&hay_rueda);
    }
    return NULL;
}

// OP2: Fabrica cuadros (1 por bicicleta)
void* operario2_cuadro(void* arg) {
    for (int c = 1; c <= TOTAL_BICICLETAS; c++) {
        sem_wait(&puedo_cuadro);
        printf("[OP2 - Cuadros]   Fabricando cuadro #%d...\n", c);
        usleep(180000); // 180ms
        printf("[OP2 - Cuadros]   ✓ Cuadro #%d LISTO.\n", c);
        sem_post(&hay_cuadro);
    }
    return NULL;
}

// OP3: Fabrica manillares (1 por bicicleta)
void* operario3_manillar(void* arg) {
    for (int m = 1; m <= TOTAL_BICICLETAS; m++) {
        sem_wait(&puedo_manillar);
        printf("[OP3 - Manillar]  Fabricando manillar #%d...\n", m);
        usleep(120000); // 120ms
        printf("[OP3 - Manillar]  ✓ Manillar #%d LISTO.\n", m);
        sem_post(&hay_manillar);
    }
    return NULL;
}

// Montador: Ensambla la bicicleta con 2 ruedas, 1 cuadro y 1 manillar
void* montador(void* arg) {
    for (int b = 1; b <= TOTAL_BICICLETAS; b++) {
        printf("\n>>> [Montador] Esperando piezas para Bicicleta #%d...\n", b);

        // Toma 2 ruedas
        sem_wait(&hay_rueda);
        sem_wait(&hay_rueda);

        // Toma 1 cuadro
        sem_wait(&hay_cuadro);

        // Toma 1 manillar
        sem_wait(&hay_manillar);

        printf(">>> [Montador] ¡Piezas recolectadas! Ensamblando Bicicleta #%d 🚲...\n", b);
        usleep(250000); // 250ms de ensamble
        printf(">>> [Montador] ⭐ ¡BICICLETA #%d TERMINADA CON ÉXITO!\n\n", b);

        // Habilita a los operarios a fabricar nuevas piezas
        sem_post(&puedo_rueda);
        sem_post(&puedo_rueda);
        sem_post(&puedo_cuadro);
        sem_post(&puedo_manillar);
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_op1, th_op2, th_op3, th_montador;

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 5: Fábrica MountanenBike         \n");
    printf("   Meta: Fabricar %d bicicletas completas           \n", TOTAL_BICICLETAS);
    printf("====================================================\n\n");

    // Inicialización de semáforos:
    // puedo_rueda = 2 (permite a OP1 adelantar las dos ruedas)
    // puedo_cuadro = 1, puedo_manillar = 1
    sem_init(&puedo_rueda, 0, 2);
    sem_init(&puedo_cuadro, 0, 1);
    sem_init(&puedo_manillar, 0, 1);

    // Piezas listas inicialmente = 0
    sem_init(&hay_rueda, 0, 0);
    sem_init(&hay_cuadro, 0, 0);
    sem_init(&hay_manillar, 0, 0);

    // Creación de hilos
    pthread_create(&th_op1, NULL, operario1_ruedas, NULL);
    pthread_create(&th_op2, NULL, operario2_cuadro, NULL);
    pthread_create(&th_op3, NULL, operario3_manillar, NULL);
    pthread_create(&th_montador, NULL, montador, NULL);

    // Esperar finalización
    pthread_join(th_op1, NULL);
    pthread_join(th_op2, NULL);
    pthread_join(th_op3, NULL);
    pthread_join(th_montador, NULL);

    // Destrucción de semáforos
    sem_destroy(&puedo_rueda);
    sem_destroy(&puedo_cuadro);
    sem_destroy(&puedo_manillar);
    sem_destroy(&hay_rueda);
    sem_destroy(&hay_cuadro);
    sem_destroy(&hay_manillar);

    printf("Lote de %d bicicletas fabricado exitosamente.\n", TOTAL_BICICLETAS);
    return EXIT_SUCCESS;
}
