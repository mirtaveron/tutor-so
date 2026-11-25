/**
 * ============================================================================
 * UNIVERSIDAD NACIONAL DEL SUR (UNS) - SISTEMAS OPERATIVOS (2° Cuatrimestre 2026)
 * Actividades 5 - Sincronización (sincro-t2)
 * Problema: Empresa de Viajes (Auto de 4 pasajeros y Combi de 15 con 1 chofer)
 * ============================================================================
 * Reglas:
 * - Dos tipos de salidas: viaje corto en auto (4 pasajeros) o viaje largo en
 *   combi (15 pasajeros).
 * - Existe un solo chofer que realiza uno u otro viaje.
 * - Los clientes llegan de a uno y reservan lugar en auto o combi.
 * - El cliente que completa el vehículo a utilizar debe avisar al chofer
 *   para comenzar el viaje.
 *
 * Compilación:
 *   gcc -Wall -Wextra -pthread -O2 -o empresa_viajes empresa_viajes.c
 * Ejecución:
 *   ./empresa_viajes [cant_clientes]
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include <time.h>

#define CAP_AUTO            4
#define CAP_COMBI           15
#define TIPO_AUTO           1
#define TIPO_COMBI          2
#define TIPO_FIN            0
#define CLIENTES_DEFAULT    38   /* Permite completar varios autos y combis */

/* --- Variables compartidas --- */
static int cont_auto  = 0;
static int cont_combi = 0;

/* Cola FIFO circular de vehículos listos para salir (máximo 2 simultáneos + señal fin) */
#define TAM_COLA 4
static int cola_viajes[TAM_COLA];
static int cola_in  = 0;
static int cola_out = 0;

/* --- Semáforos POSIX --- */
static sem_t cupos_auto;            /* Inicializado en 4: asientos libres en el auto actual */
static sem_t cupos_combi;           /* Inicializado en 15: asientos libres en la combi actual */

static sem_t mutex_auto;            /* Inicializado en 1: exclusión mutua para cont_auto */
static sem_t mutex_combi;           /* Inicializado en 1: exclusión mutua para cont_combi */
static sem_t mutex_cola;            /* Inicializado en 1: exclusión mutua para cola_viajes */

static sem_t viajes_pendientes;     /* Inicializado en 0: el último cliente avisa al chofer */

static sem_t fin_viaje_auto;        /* Inicializado en 0: chofer avisa llegada del auto */
static sem_t fin_viaje_combi;       /* Inicializado en 0: chofer avisa llegada de la combi */
static sem_t pasajero_bajo_auto;    /* Inicializado en 0: confirma descenso antes de reponer cupos */
static sem_t pasajero_bajo_combi;   /* Inicializado en 0: confirma descenso antes de reponer cupos */

static sem_t mutex_stdout;          /* Inicializado en 1: salida ordenada por consola */

/* Encola un vehículo listo y despierta al chofer */
static void avisar_chofer(int tipo_vehiculo) {
    sem_wait(&mutex_cola);
    cola_viajes[cola_in] = tipo_vehiculo;
    cola_in = (cola_in + 1) % TAM_COLA;
    sem_post(&mutex_cola);

    sem_post(&viajes_pendientes);
}

/* --- Hilo Chofer (único) --- */
void *hilo_chofer(void *arg) {
    (void)arg;
    int viajes_auto = 0;
    int viajes_combi = 0;

    while (1) {
        /* Espera a que el último cliente de algún vehículo avise que está completo */
        sem_wait(&viajes_pendientes);

        sem_wait(&mutex_cola);
        int tipo = cola_viajes[cola_out];
        cola_out = (cola_out + 1) % TAM_COLA;
        sem_post(&mutex_cola);

        if (tipo == TIPO_FIN) {
            break;
        }

        if (tipo == TIPO_AUTO) {
            viajes_auto++;
            sem_wait(&mutex_stdout);
            printf("\n[CHOFER] >>> Iniciando VIAJE CORTO #%d en AUTO (%d pasajeros)...\n",
                   viajes_auto, CAP_AUTO);
            sem_post(&mutex_stdout);

            usleep(250000); /* Simula viaje corto (250 ms) */

            sem_wait(&mutex_stdout);
            printf("[CHOFER] <<< Finalizó VIAJE CORTO #%d en AUTO. Descendiendo pasajeros.\n",
                   viajes_auto);
            sem_post(&mutex_stdout);

            /* Avisar a los 4 pasajeros que el viaje terminó */
            for (int i = 0; i < CAP_AUTO; i++) {
                sem_post(&fin_viaje_auto);
            }
            /* Esperar a que bajen todos antes de habilitar el próximo auto */
            for (int i = 0; i < CAP_AUTO; i++) {
                sem_wait(&pasajero_bajo_auto);
            }
            /* Habilitar nuevamente 4 lugares en el auto */
            for (int i = 0; i < CAP_AUTO; i++) {
                sem_post(&cupos_auto);
            }
        } else if (tipo == TIPO_COMBI) {
            viajes_combi++;
            sem_wait(&mutex_stdout);
            printf("\n[CHOFER] >>> Iniciando VIAJE LARGO #%d en COMBI (%d pasajeros)...\n",
                   viajes_combi, CAP_COMBI);
            sem_post(&mutex_stdout);

            usleep(500000); /* Simula viaje largo (500 ms) */

            sem_wait(&mutex_stdout);
            printf("[CHOFER] <<< Finalizó VIAJE LARGO #%d en COMBI. Descendiendo pasajeros.\n",
                   viajes_combi);
            sem_post(&mutex_stdout);

            /* Avisar a los 15 pasajeros que el viaje terminó */
            for (int i = 0; i < CAP_COMBI; i++) {
                sem_post(&fin_viaje_combi);
            }
            /* Esperar a que bajen todos antes de habilitar la próxima combi */
            for (int i = 0; i < CAP_COMBI; i++) {
                sem_wait(&pasajero_bajo_combi);
            }
            /* Habilitar nuevamente 15 lugares en la combi */
            for (int i = 0; i < CAP_COMBI; i++) {
                sem_post(&cupos_combi);
            }
        }
    }

    sem_wait(&mutex_stdout);
    printf("\n[CHOFER] Jornada finalizada. Viajes realizados -> Auto: %d | Combi: %d\n",
           viajes_auto, viajes_combi);
    sem_post(&mutex_stdout);

    return NULL;
}

typedef struct {
    int id;
    int tipo; /* TIPO_AUTO o TIPO_COMBI */
} DatosCliente;

/* --- Hilo Cliente --- */
void *hilo_cliente(void *arg) {
    DatosCliente *c = (DatosCliente *)arg;
    int id = c->id;
    int tipo = c->tipo;
    free(c);

    if (tipo == TIPO_AUTO) {
        /* 1. Reservar un lugar en el auto (bloquea si ya hay 4 esperando/viajando) */
        sem_wait(&cupos_auto);

        /* 2. Registrar ingreso en exclusión mutua */
        sem_wait(&mutex_auto);
        cont_auto++;
        int nro = cont_auto;

        sem_wait(&mutex_stdout);
        printf("[Cliente %02d] Reservó lugar en AUTO (%d/%d).\n", id, nro, CAP_AUTO);
        sem_post(&mutex_stdout);

        if (cont_auto == CAP_AUTO) {
            cont_auto = 0;
            sem_wait(&mutex_stdout);
            printf("[Cliente %02d] Completó el AUTO! Avisa al chofer.\n", id);
            sem_post(&mutex_stdout);
            avisar_chofer(TIPO_AUTO);
        }
        sem_post(&mutex_auto);

        /* 3. Esperar a que el chofer complete el viaje */
        sem_wait(&fin_viaje_auto);

        sem_wait(&mutex_stdout);
        printf("[Cliente %02d] Completó su viaje corto en AUTO y descendió.\n", id);
        sem_post(&mutex_stdout);

        sem_post(&pasajero_bajo_auto);
    } else {
        /* 1. Reservar un lugar en la combi */
        sem_wait(&cupos_combi);

        /* 2. Registrar ingreso en exclusión mutua */
        sem_wait(&mutex_combi);
        cont_combi++;
        int nro = cont_combi;

        sem_wait(&mutex_stdout);
        printf("[Cliente %02d] Reservó lugar en COMBI (%d/%d).\n", id, nro, CAP_COMBI);
        sem_post(&mutex_stdout);

        if (cont_combi == CAP_COMBI) {
            cont_combi = 0;
            sem_wait(&mutex_stdout);
            printf("[Cliente %02d] Completó la COMBI! Avisa al chofer.\n", id);
            sem_post(&mutex_stdout);
            avisar_chofer(TIPO_COMBI);
        }
        sem_post(&mutex_combi);

        /* 3. Esperar a que el chofer complete el viaje */
        sem_wait(&fin_viaje_combi);

        sem_wait(&mutex_stdout);
        printf("[Cliente %02d] Completó su viaje largo en COMBI y descendió.\n", id);
        sem_post(&mutex_stdout);

        sem_post(&pasajero_bajo_combi);
    }

    return NULL;
}

int main(void) {
    /*
     * Generamos múltiplos exactos para que todos los clientes creados completen
     * vehículos en la simulación (ej: 2 autos = 8 clientes + 2 combis = 30 clientes => 38 clientes)
     */
    const int total_auto  = CAP_AUTO * 2;   /* 8 clientes para auto (2 viajes) */
    const int total_combi = CAP_COMBI * 2;  /* 30 clientes para combi (2 viajes) */
    const int total_clientes = total_auto + total_combi;

    srand((unsigned int)time(NULL));

    /* Inicializar semáforos (pshared = 0 -> compartidos entre hilos del mismo proceso) */
    sem_init(&cupos_auto,          0, CAP_AUTO);
    sem_init(&cupos_combi,         0, CAP_COMBI);
    sem_init(&mutex_auto,          0, 1);
    sem_init(&mutex_combi,         0, 1);
    sem_init(&mutex_cola,          0, 1);
    sem_init(&viajes_pendientes,   0, 0);
    sem_init(&fin_viaje_auto,      0, 0);
    sem_init(&fin_viaje_combi,     0, 0);
    sem_init(&pasajero_bajo_auto,  0, 0);
    sem_init(&pasajero_bajo_combi, 0, 0);
    sem_init(&mutex_stdout,        0, 1);

    /* Armar orden mezclado de llegadas */
    int tipos[CLIENTES_DEFAULT];
    for (int i = 0; i < total_auto; i++) tipos[i] = TIPO_AUTO;
    for (int i = 0; i < total_combi; i++) tipos[total_auto + i] = TIPO_COMBI;
    for (int i = total_clientes - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        int tmp = tipos[i];
        tipos[i] = tipos[j];
        tipos[j] = tmp;
    }

    pthread_t th_chofer;
    pthread_t th_clientes[CLIENTES_DEFAULT];

    printf("===================================================================\n");
    printf("   EMPRESA DE VIAJES - SIMULACIÓN CON HILOS Y SEMÁFOROS POSIX      \n");
    printf("   Auto: %d pasajeros | Combi: %d pasajeros | 1 Chofer             \n",
           CAP_AUTO, CAP_COMBI);
    printf("===================================================================\n\n");

    pthread_create(&th_chofer, NULL, hilo_chofer, NULL);

    /* Los clientes llegan de a uno */
    for (int i = 0; i < total_clientes; i++) {
        DatosCliente *c = malloc(sizeof(DatosCliente));
        c->id = i + 1;
        c->tipo = tipos[i];
        pthread_create(&th_clientes[i], NULL, hilo_cliente, c);
        usleep(25000); /* Llegada secuencial espaciada (25 ms) */
    }

    for (int i = 0; i < total_clientes; i++) {
        pthread_join(th_clientes[i], NULL);
    }

    /* Indicar al chofer que terminó la jornada */
    avisar_chofer(TIPO_FIN);
    pthread_join(th_chofer, NULL);

    /* Destrucción limpia de semáforos */
    sem_destroy(&cupos_auto);
    sem_destroy(&cupos_combi);
    sem_destroy(&mutex_auto);
    sem_destroy(&mutex_combi);
    sem_destroy(&mutex_cola);
    sem_destroy(&viajes_pendientes);
    sem_destroy(&fin_viaje_auto);
    sem_destroy(&fin_viaje_combi);
    sem_destroy(&pasajero_bajo_auto);
    sem_destroy(&pasajero_bajo_combi);
    sem_destroy(&mutex_stdout);

    return EXIT_SUCCESS;
}
