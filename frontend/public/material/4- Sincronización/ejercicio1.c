#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/time.h>

int contador;               /* contador global compartido */

typedef struct threadArgs {
    pthread_t thr_ID;
    int num_of_repeticion;
    int id;
} THREADARGS;


void *add(void *arg)
{

    int i;
    struct timeval tinicio, tfinal;
    THREADARGS *a = (THREADARGS *) arg;

    gettimeofday(&tinicio, NULL);
    for (i = 0; i < a->num_of_repeticion; i++) {
        contador++;
    }

    gettimeofday(&tfinal, NULL);
    printf("Inicio en  %d seg %d micro \n", tinicio.tv_sec, tinicio.tv_usec);
    printf("Finaliza en  %d seg %d micro \n", tfinal.tv_sec, tfinal.tv_usec);
    return NULL;
}

int main()
{
    int i = 1;
    pthread_attr_t thrAttr;
    THREADARGS threadargs_array[2];

    pthread_attr_init(&thrAttr);
    pthread_attr_setdetachstate(&thrAttr, PTHREAD_CREATE_JOINABLE);

    /* creacion del primer hilo */

    threadargs_array[0].id = 0;
    threadargs_array[0].num_of_repeticion = 1000000;
    
    pthread_create(&threadargs_array[0].thr_ID, &thrAttr, add,
                   &threadargs_array[0]);

    /* creacion del segundo hilo */

    threadargs_array[1].id = 1;
    threadargs_array[1].num_of_repeticion = 2000000;

    pthread_create(&threadargs_array[1].thr_ID, &thrAttr, add,
                   &threadargs_array[1]);

     pthread_attr_destroy(&thrAttr);

    /* espera finalizacion primer hilo */
    pthread_join(threadargs_array[0].thr_ID, NULL);
    printf("Primer hilo termina.\n");

    /* espera finalizacion segundo hilo */
    pthread_join(threadargs_array[1].thr_ID, NULL);
    printf("Segundo hilo termina.\n");


    printf("Valor Contador es: %d \n", contador);
    return (EXIT_SUCCESS);
}

