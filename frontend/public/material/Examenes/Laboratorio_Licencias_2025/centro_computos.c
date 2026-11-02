/**
 * ============================================================================
 * UNIVERSIDAD NACIONAL DEL SUR (UNS)
 * Departamento de Ciencias e Ingeniería de la Computación
 * Sistemas Operativos - Laboratorio de Sincronización
 *
 * Problema: Centro de Cómputos y Control de Licencias Especializadas
 * ============================================================================
 * Consigna:
 * - Se disponen un total de 20 licencias.
 * - Cada usuario puede requerir entre 1 y 3 licencias.
 * - Si consigue las licencias requeridas, realiza su trabajo.
 * - Al terminar guarda sus resultados en una base de datos compartida y
 *   por último libera las licencias utilizadas.
 * - Si no puede conseguir todas las licencias requeridas, se retira sin hacer nada.
 *
 * Compilación:
 *   gcc -Wall -Wextra -pthread -o centro_computos centro_computos.c
 * Ejecución:
 *   ./centro_computos [num_usuarios]
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <time.h>
#include <string.h>

/* --- Parámetros de configuración del sistema --- */
#define TOTAL_LICENCIAS         20
#define MIN_LICENCIAS_REQ       1
#define MAX_LICENCIAS_REQ       3
#define NUM_USUARIOS_DEFAULT    30
#define ARCHIVO_BD              "resultados_bd.txt"

/* --- Estructura para registrar los datos en la Base de Datos Compartida --- */
typedef struct {
    int id_registro;
    int id_usuario;
    int licencias_utilizadas;
    int tiempo_computo_ms;
    char resultado[64];
    char timestamp[32];
} RegistroBD;

#define MAX_REGISTROS 1000
static RegistroBD base_de_datos[MAX_REGISTROS];
static int total_registros_bd = 0;

/* --- Variables de estado del Centro de Cómputos --- */
static int licencias_disponibles = TOTAL_LICENCIAS;

/* --- Herramientas de sincronización (Mutexes POSIX) --- */
/*
 * 1. mutex_licencias:
 *    Protege el contador de licencias disponibles y asegura que la consulta
 *    y asignación de licencias sea una operación atómica indivisible (Todo o Nada).
 */
static pthread_mutex_t mutex_licencias = PTHREAD_MUTEX_INITIALIZER;

/*
 * 2. mutex_bd:
 *    Garantiza exclusión mutua estricta al acceder a la base de datos compartida
 *    (tanto en memoria como en el archivo en disco), evitando condiciones de carrera.
 */
static pthread_mutex_t mutex_bd = PTHREAD_MUTEX_INITIALIZER;

/*
 * 3. mutex_pantalla:
 *    Evita que los mensajes por consola (stdout) de múltiples hilos se intercalen
 *    o rompan líneas visualmente durante la ejecución concurrente.
 */
static pthread_mutex_t mutex_pantalla = PTHREAD_MUTEX_INITIALIZER;

/* --- Métricas estadísticas globales --- */
static int total_solicitudes = 0;
static int usuarios_atendidos_exitosos = 0;
static int usuarios_rechazados = 0;

/* --- Función auxiliar para obtener timestamp formateado --- */
void obtener_tiempo_actual(char *buffer, size_t max_len) {
    time_t rawtime;
    struct tm *info_tiempo;
    time(&rawtime);
    info_tiempo = localtime(&rawtime);
    strftime(buffer, max_len, "%H:%M:%S", info_tiempo);
}

/* --- Función auxiliar para imprimir mensajes protegidos por mutex --- */
void log_evento(const char *color, const char *formato, int id, int val1, int val2) {
    char tiempo[32];
    obtener_tiempo_actual(tiempo, sizeof(tiempo));

    pthread_mutex_lock(&mutex_pantalla);
    printf("[%s] %s", tiempo, color);
    if (val1 == -1 && val2 == -1) {
        printf(formato, id);
    } else if (val2 == -1) {
        printf(formato, id, val1);
    } else {
        printf(formato, id, val1, val2);
    }
    printf("\033[0m\n");
    fflush(stdout);
    pthread_mutex_unlock(&mutex_pantalla);
}

/*
 * ----------------------------------------------------------------------------
 * Operación: Solicitar Licencias (No bloqueante, atómica / Todo o Nada)
 * Retorna:
 *   1 si consiguió TODAS las licencias solicitadas.
 *   0 si NO había suficientes licencias (se retira sin hacer nada).
 * ----------------------------------------------------------------------------
 */
int solicitar_licencias(int id_usuario, int cant_requerida) {
    int exito = 0;

    pthread_mutex_lock(&mutex_licencias);

    if (licencias_disponibles >= cant_requerida) {
        // Asignación atómica completa
        licencias_disponibles -= cant_requerida;
        exito = 1;
        log_evento("\033[1;32m", "USUARIO %02d | ADQUIRIÓ %d licencias. (Restan: %d libres)",
                   id_usuario, cant_requerida, licencias_disponibles);
    } else {
        // No hay suficientes licencias disponibles: RECHAZO INMEDIATO
        exito = 0;
        log_evento("\033[1;31m", "USUARIO %02d | RECHAZADO: Solicitó %d licencias pero solo hay %d. Se retira sin hacer nada.",
                   id_usuario, cant_requerida, licencias_disponibles);
    }

    pthread_mutex_unlock(&mutex_licencias);
    return exito;
}

/*
 * ----------------------------------------------------------------------------
 * Operación: Liberar Licencias
 * Devuelve las licencias utilizadas al pool del centro de cómputos.
 * ----------------------------------------------------------------------------
 */
void liberar_licencias(int id_usuario, int cant_liberar) {
    pthread_mutex_lock(&mutex_licencias);

    licencias_disponibles += cant_liberar;
    log_evento("\033[1;34m", "USUARIO %02d | LIBERÓ %d licencias. (Ahora hay: %d libres)",
               id_usuario, cant_liberar, licencias_disponibles);

    pthread_mutex_unlock(&mutex_licencias);
}

/*
 * ----------------------------------------------------------------------------
 * Operación: Guardar Resultados en la Base de Datos Compartida
 * Sección crítica protegida por mutex_bd.
 * ----------------------------------------------------------------------------
 */
void guardar_en_base_de_datos(int id_usuario, int licencias_usadas, int tiempo_ms, const char *resultado_calculo) {
    pthread_mutex_lock(&mutex_bd);

    // 1. Guardar en estructura de datos en memoria
    if (total_registros_bd < MAX_REGISTROS) {
        RegistroBD *reg = &base_de_datos[total_registros_bd];
        reg->id_registro = total_registros_bd + 1;
        reg->id_usuario = id_usuario;
        reg->licencias_utilizadas = licencias_usadas;
        reg->tiempo_computo_ms = tiempo_ms;
        strncpy(reg->resultado, resultado_calculo, sizeof(reg->resultado) - 1);
        obtener_tiempo_actual(reg->timestamp, sizeof(reg->timestamp));
        total_registros_bd++;
    }

    // 2. Persistir en archivo compartido en disco
    FILE *archivo = fopen(ARCHIVO_BD, "a");
    if (archivo != NULL) {
        char tiempo[32];
        obtener_tiempo_actual(tiempo, sizeof(tiempo));
        fprintf(archivo, "[%s] Registro #%d | Usuario: %02d | Licencias: %d | Duración: %d ms | Resultado: %s\n",
                tiempo, total_registros_bd, id_usuario, licencias_usadas, tiempo_ms, resultado_calculo);
        fclose(archivo);
    }

    log_evento("\033[1;35m", "USUARIO %02d | GUARDÓ resultados en BD compartida (Registro #%d)",
               id_usuario, total_registros_bd, -1);

    pthread_mutex_unlock(&mutex_bd);
}

/*
 * ----------------------------------------------------------------------------
 * Función del Hilo Usuario:
 * Modela el ciclo de vida completo de cada usuario del centro de cómputos.
 * ----------------------------------------------------------------------------
 */
void* hilo_usuario(void *arg) {
    int id_usuario = *((int*)arg);
    free(arg);

    // Cada usuario requiere entre 1 y 3 licencias
    int licencias_requeridas = (rand() % (MAX_LICENCIAS_REQ - MIN_LICENCIAS_REQ + 1)) + MIN_LICENCIAS_REQ;

    log_evento("\033[0;37m", "USUARIO %02d | Llega al centro de cómputos. Requiere %d licencias.",
               id_usuario, licencias_requeridas, -1);

    // Intento atómico de adquisición
    int conseguidas = solicitar_licencias(id_usuario, licencias_requeridas);

    if (!conseguidas) {
        // "Si no puede conseguir todas las licencias requeridas, se retira sin hacer nada."
        pthread_mutex_lock(&mutex_licencias);
        usuarios_rechazados++;
        pthread_mutex_unlock(&mutex_licencias);
        return NULL;
    }

    // "Si consigue las licencias requeridas, realiza su trabajo."
    pthread_mutex_lock(&mutex_licencias);
    usuarios_atendidos_exitosos++;
    pthread_mutex_unlock(&mutex_licencias);

    // Simulación del cómputo con las licencias adquiridas (entre 100 ms y 400 ms)
    int tiempo_computo_ms = 100 + (rand() % 301);
    log_evento("\033[0;33m", "USUARIO %02d | Procesando trabajo científico (%d ms)...",
               id_usuario, tiempo_computo_ms, -1);
    usleep(tiempo_computo_ms * 1000);

    // Generar resultado ficticio
    char resultado[64];
    snprintf(resultado, sizeof(resultado), "SIM_OK_VAL_%.2f", (rand() % 10000) / 100.0);

    // "Al terminar guarda sus resultados en una base de datos compartida..."
    guardar_en_base_de_datos(id_usuario, licencias_requeridas, tiempo_computo_ms, resultado);

    // "... y por último libera las licencias utilizadas."
    liberar_licencias(id_usuario, licencias_requeridas);

    return NULL;
}

/*
 * ----------------------------------------------------------------------------
 * Programa Principal (Main)
 * Inicializa recursos, crea hilos de usuarios y presenta estadísticas finales.
 * ----------------------------------------------------------------------------
 */
int main(int argc, char *argv[]) {
    int num_usuarios = NUM_USUARIOS_DEFAULT;

    if (argc > 1) {
        int n = atoi(argv[1]);
        if (n > 0) num_usuarios = n;
    }

    srand(time(NULL) ^ getpid());

    // Limpiar o inicializar el archivo de base de datos para esta corrida
    FILE *f_init = fopen(ARCHIVO_BD, "w");
    if (f_init) {
        char fecha_hora[64];
        time_t t_now = time(NULL);
        struct tm *tm_info = localtime(&t_now);
        strftime(fecha_hora, sizeof(fecha_hora), "%Y-%m-%d %H:%M:%S", tm_info);
        fprintf(f_init, "=== BASE DE DATOS COMPARTIDA - CENTRO DE CÓMPUTOS ===\n");
        fprintf(f_init, "Sesión iniciada el: %s\n", fecha_hora);
        fprintf(f_init, "Licencias totales del sistema: %d\n", TOTAL_LICENCIAS);
        fprintf(f_init, "--------------------------------------------------------\n");
        fclose(f_init);
    }

    printf("\n===================================================================\n");
    printf("   UNS - SISTEMAS OPERATIVOS | LABORATORIO DE SINCRONIZACIÓN        \n");
    printf("   Control de Licencias Especializadas en Centro de Cómputos       \n");
    printf("===================================================================\n");
    printf(" * Licencias totales en el sistema:  %d\n", TOTAL_LICENCIAS);
    printf(" * Rango de demanda por usuario:     %d a %d licencias\n", MIN_LICENCIAS_REQ, MAX_LICENCIAS_REQ);
    printf(" * Cantidad de hilos de usuarios:    %d\n", num_usuarios);
    printf(" * Archivo de Base de Datos:         %s\n", ARCHIVO_BD);
    printf("===================================================================\n\n");

    pthread_t *hilos = (pthread_t*) malloc(num_usuarios * sizeof(pthread_t));
    if (!hilos) {
        perror("Error asignando memoria para los hilos");
        exit(EXIT_FAILURE);
    }

    // Creación de los hilos de usuarios con pequeños intervalos aleatorios
    total_solicitudes = num_usuarios;
    for (int i = 0; i < num_usuarios; i++) {
        int *id = (int*) malloc(sizeof(int));
        *id = i + 1;

        if (pthread_create(&hilos[i], NULL, hilo_usuario, id) != 0) {
            perror("Error creando hilo de usuario");
            free(id);
            exit(EXIT_FAILURE);
        }

        // Espaciado aleatorio entre llegadas de usuarios (0 a 40 ms)
        usleep((rand() % 40) * 1000);
    }

    // Esperar a que todos los hilos de usuarios terminen su ciclo
    for (int i = 0; i < num_usuarios; i++) {
        pthread_join(hilos[i], NULL);
    }

    free(hilos);

    // Destrucción limpia de primitivas de sincronización
    pthread_mutex_destroy(&mutex_licencias);
    pthread_mutex_destroy(&mutex_bd);
    pthread_mutex_destroy(&mutex_pantalla);

    // Verificación final del invariante del sistema
    printf("\n===================================================================\n");
    printf("                     RESUMEN Y MÉTRICAS FINALES                    \n");
    printf("===================================================================\n");
    printf(" Total de usuarios que arribaron:              %d\n", total_solicitudes);
    printf(" Usuarios que consiguieron licencias (éxito):  %d\n", usuarios_atendidos_exitosos);
    printf(" Usuarios rechazados (se retiraron sin nada):  %d\n", usuarios_rechazados);
    printf(" Registros guardados en la Base de Datos:      %d\n", total_registros_bd);
    printf("-------------------------------------------------------------------\n");
    printf(" Licencias disponibles iniciales:              %d\n", TOTAL_LICENCIAS);
    printf(" Licencias disponibles finales:                %d\n", licencias_disponibles);

    if (licencias_disponibles == TOTAL_LICENCIAS) {
        printf(" \033[1;32m[INVARIANTE OK]\033[0m Todas las licencias fueron restituidas con éxito.\n");
    } else {
        printf(" \033[1;31m[ERROR]\033[0m Fuga de licencias detectada (%d != %d).\n",
               licencias_disponibles, TOTAL_LICENCIAS);
    }
    printf("===================================================================\n\n");

    return 0;
}
