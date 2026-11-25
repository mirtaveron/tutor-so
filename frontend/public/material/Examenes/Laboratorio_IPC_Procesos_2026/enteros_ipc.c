/**
 * ============================================================================
 * UNIVERSIDAD NACIONAL DEL SUR (UNS) - SISTEMAS OPERATIVOS (2° Cuatrimestre 2026)
 * Laboratorio (labol2) - Ejercicio 1: ENTEROS (Procesos e IPC)
 * ============================================================================
 * Consigna:
 * - El usuario ingresa un entero n entre 1 y 1000.
 * - El proceso padre genera aleatoriamente n enteros entre 0 y 99 y los
 *   clasifica según la decena a la que pertenecen (0..9 -> decena 0, ..., 90..99 -> decena 9).
 * - Envía estos enteros a 10 procesos hijos (uno por decena) mediante pipes.
 * - Cada hijo cuenta cuántos enteros recibió y devuelve el resultado al padre
 *   junto con su PID.
 * - Al finalizar, el padre muestra los resultados de cada hijo.
 *
 * Compilación:
 *   gcc -Wall -Wextra -O2 -o enteros_ipc enteros_ipc.c
 * Ejecución:
 *   ./enteros_ipc
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>

#define NUM_DECENAS 10
#define MIN_N       1
#define MAX_N       1000

typedef struct {
    int decena;
    int cantidad;
    pid_t pid;
} ResultadoHijo;

int main(void) {
    int n = 0;

    /* 1. Solicitar y validar la cantidad n entre 1 y 1000 */
    do {
        printf("Ingrese la cantidad de enteros n (%d a %d): ", MIN_N, MAX_N);
        if (scanf("%d", &n) != 1) {
            fprintf(stderr, "Entrada inválida. Debe ingresar un número entero.\n");
            return EXIT_FAILURE;
        }
        if (n < MIN_N || n > MAX_N) {
            printf("Valor fuera de rango. Intente nuevamente.\n");
        }
    } while (n < MIN_N || n > MAX_N);

    /*
     * 2. Crear canales de comunicación IPC (Pipes anónimos):
     *    - pipe_p2h[d]: Padre -> Hijo de la decena d (envío de enteros)
     *    - pipe_h2p[d]: Hijo de la decena d -> Padre (envío de ResultadoHijo)
     */
    int pipe_p2h[NUM_DECENAS][2];
    int pipe_h2p[NUM_DECENAS][2];

    for (int d = 0; d < NUM_DECENAS; d++) {
        if (pipe(pipe_p2h[d]) == -1 || pipe(pipe_h2p[d]) == -1) {
            perror("Error creando pipes");
            return EXIT_FAILURE;
        }
    }

    /* 3. Crear los 10 procesos hijos (uno por cada decena 0..9) */
    pid_t hijos[NUM_DECENAS];

    for (int d = 0; d < NUM_DECENAS; d++) {
        pid_t pid = fork();

        if (pid < 0) {
            perror("Error en fork()");
            return EXIT_FAILURE;
        }

        if (pid == 0) {
            /* --- CÓDIGO DEL PROCESO HIJO (Decena d) --- */

            /* Cerrar todos los extremos de pipes que este hijo NO utiliza */
            for (int k = 0; k < NUM_DECENAS; k++) {
                close(pipe_p2h[k][1]); /* Ningún hijo escribe en p2h */
                close(pipe_h2p[k][0]); /* Ningún hijo lee de h2p */
                if (k != d) {
                    close(pipe_p2h[k][0]);
                    close(pipe_h2p[k][1]);
                }
            }

            /* Leer enteros desde el padre hasta recibir EOF (cuando el padre cierre escritura) */
            int valor;
            int contador = 0;
            while (read(pipe_p2h[d][0], &valor, sizeof(int)) == sizeof(int)) {
                contador++;
            }
            close(pipe_p2h[d][0]);

            /* Preparar y enviar resultado junto con el PID al padre */
            ResultadoHijo res;
            res.decena = d;
            res.cantidad = contador;
            res.pid = getpid();

            if (write(pipe_h2p[d][1], &res, sizeof(ResultadoHijo)) != sizeof(ResultadoHijo)) {
                perror("Hijo: error escribiendo resultado al padre");
                close(pipe_h2p[d][1]);
                _exit(EXIT_FAILURE);
            }

            close(pipe_h2p[d][1]);
            _exit(EXIT_SUCCESS); /* Fundamental: el hijo NO debe seguir iterando el for */
        }

        /* El padre guarda el PID del hijo creado */
        hijos[d] = pid;
    }

    /* --- CÓDIGO DEL PROCESO PADRE --- */

    /* Cerrar los extremos que el padre no utiliza */
    for (int d = 0; d < NUM_DECENAS; d++) {
        close(pipe_p2h[d][0]); /* El padre no lee de p2h */
        close(pipe_h2p[d][1]); /* El padre no escribe en h2p */
    }

    /* 4. Generar aleatoriamente n enteros entre 0 y 99, clasificar y enviar */
    srand((unsigned int)(time(NULL) ^ getpid()));

    printf("\n[Padre PID %d] Generando y clasificando %d enteros entre 0 y 99...\n", getpid(), n);
    for (int i = 0; i < n; i++) {
        int numero = rand() % 100; /* 0..99 */
        int decena = numero / 10;  /* 0..9  */

        if (write(pipe_p2h[decena][1], &numero, sizeof(int)) != sizeof(int)) {
            perror("Padre: error enviando entero al hijo");
            return EXIT_FAILURE;
        }
    }

    /*
     * 5. Cerrar los extremos de escritura p2h:
     *    Esto envía EOF a todos los hijos para que finalicen su bucle de lectura.
     */
    for (int d = 0; d < NUM_DECENAS; d++) {
        close(pipe_p2h[d][1]);
    }

    /* 6. Recibir los resultados de cada hijo y mostrarlos */
    printf("\n==============================================================\n");
    printf("   RESULTADOS POR DECENA (Proceso Padre PID %d)\n", getpid());
    printf("==============================================================\n");
    printf(" %-12s | %-10s | %-10s\n", "Decena", "PID Hijo", "Cantidad");
    printf("--------------+------------+------------\n");

    int suma_total = 0;
    for (int d = 0; d < NUM_DECENAS; d++) {
        ResultadoHijo res;
        if (read(pipe_h2p[d][0], &res, sizeof(ResultadoHijo)) == sizeof(ResultadoHijo)) {
            printf(" [%02d - %02d]    | %-10d | %-10d\n",
                   res.decena * 10, res.decena * 10 + 9, res.pid, res.cantidad);
            suma_total += res.cantidad;
        } else {
            fprintf(stderr, "Error leyendo resultado del hijo de decena %d\n", d);
        }
        close(pipe_h2p[d][0]);
    }

    /* 7. Esperar la finalización de todos los hijos para evitar procesos zombies */
    for (int d = 0; d < NUM_DECENAS; d++) {
        waitpid(hijos[d], NULL, 0);
    }

    printf("--------------+------------+------------\n");
    printf(" Total verificado: %d / %d enteros procesados.\n", suma_total, n);
    printf("==============================================================\n");

    return EXIT_SUCCESS;
}
