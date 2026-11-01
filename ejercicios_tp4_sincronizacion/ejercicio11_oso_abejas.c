/**
 * ============================================================================
 * SISTEMAS OPERATIVOS - UNS (Trabajo Práctico N° 4: Sincronización)
 * Ejercicio 11 (Problema 11): El Oso y las Abejas
 * ============================================================================
 * Consigna:
 * Se tienen N abejas y un oso hambriento. Comparten un tarro de miel con
 * capacidad para M porciones.
 * - Inicialmente el tarro está vacío.
 * - Cada abeja produce 1 porción y la coloca en el tarro.
 * - La abeja que coloca la porción M despierta al oso.
 * - El oso despierta, se come toda la miel (porciones = 0) y vuelve a dormir.
 * - Las abejas no pueden agregar miel mientras el oso come.
 *
 * Sincronización implementada con semáforos POSIX.
 *
 * Compilación:
 *   gcc -pthread ejercicio11_oso_abejas.c -o ejercicio11
 * Ejecución:
 *   ./ejercicio11
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define M 5              // Capacidad del tarro de miel
#define NUM_ABEJAS 3     // Cantidad de abejas concurrentes
#define RONDAS_OSO 3     // El oso comerá 3 tarros completos para la prueba

int porciones_en_tarro = 0;

sem_t mutex_tarro;   // Exclusión mutua para acceder al tarro
sem_t sem_oso;       // Despierta al oso cuando el tarro se llena (inicia en 0)
sem_t sem_tarro_vacio;// Señal del oso a las abejas avisando que el tarro quedó vacío (inicia en 1)

// Hilo del Oso
void* oso_hilo(void* arg) {
    for (int r = 1; r <= RONDAS_OSO; r++) {
        printf("[Oso] Zzz... Durmiendo a la espera de miel.\n");

        // Espera a que una abeja lo despierte (cuando se llena el tarro)
        sem_wait(&sem_oso);

        printf("\n>>> [Oso] 🐻 ¡DESPERTÓ! El tarro tiene %d porciones de miel.\n", porciones_en_tarro);
        usleep(300000); // 300ms comiendo

        porciones_en_tarro = 0;
        printf(">>> [Oso] 🍯 Se comió toda la miel. El tarro vuelve a estar VACÍO (0/%d).\n\n", M);

        // Habilita nuevamente a las abejas para que puedan poner miel
        sem_post(&sem_tarro_vacio);
    }
    return NULL;
}

// Hilo de cada Abeja
void* abeja_hilo(void* arg) {
    int id = *((int*)arg);

    while (1) {
        // Simular tiempo produciendo miel
        usleep((rand() % 200 + 50) * 1000);

        // Asegurarse de que el tarro no esté en proceso de ser comido por el oso
        sem_wait(&mutex_tarro);

        porciones_en_tarro++;
        printf("  [Abeja %d] 🐝 Colocó 1 porción de miel. (Tarro: %d/%d)\n",
               id, porciones_en_tarro, M);

        if (porciones_en_tarro == M) {
            printf("  [Abeja %d] ⭐ ¡El tarro está LLENO! Despertando al oso...\n", id);
            // Despierta al oso
            sem_post(&sem_oso);
            // El mutex_tarro se retiene implícitamente o se espera a que el oso vacíe
            sem_wait(&sem_tarro_vacio); // Espera a que el oso termine de comer
            sem_post(&mutex_tarro);
        } else {
            sem_post(&mutex_tarro);
        }
    }
    return NULL;
}

int main(int argc, char* argv[]) {
    pthread_t th_oso;
    pthread_t th_abejas[NUM_ABEJAS];
    int ids[NUM_ABEJAS];

    srand(time(NULL));

    printf("====================================================\n");
    printf("   TP4 - Ejercicio 11: El Oso y las Abejas          \n");
    printf("   (Capacidad M: %d | Abejas: %d | Rondas Oso: %d)   \n", M, NUM_ABEJAS, RONDAS_OSO);
    printf("====================================================\n\n");

    // Inicialización de semáforos
    sem_init(&mutex_tarro, 0, 1);
    sem_init(&sem_oso, 0, 0);
    sem_init(&sem_tarro_vacio, 0, 0);

    // Crear hilo oso
    pthread_create(&th_oso, NULL, oso_hilo, NULL);

    // Crear hilos abejas
    for (int i = 0; i < NUM_ABEJAS; i++) {
        ids[i] = i + 1;
        pthread_create(&th_abejas[i], NULL, abeja_hilo, &ids[i]);
    }

    // Esperar a que el oso complete sus rondas de comida
    pthread_join(th_oso, NULL);

    // Cancelar hilos de abejas que corren en loop infinito
    for (int i = 0; i < NUM_ABEJAS; i++) {
        pthread_cancel(th_abejas[i]);
    }

    // Destrucción de semáforos
    sem_destroy(&mutex_tarro);
    sem_destroy(&sem_oso);
    sem_destroy(&sem_tarro_vacio);

    printf("Simulación del oso y las abejas completada exitosamente.\n");
    return EXIT_SUCCESS;
}
