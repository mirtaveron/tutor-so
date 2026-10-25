#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <sys/time.h>

int buffer_compartido = 0;               /* contador global compartido */
pthread_t hprod, hcons;

void *productor(void *arg)
{
    int i, dato;
    for (i = 0; i < 100; i++) {
        dato = i;
        buffer_compartido = dato;
        printf("Productor dato %d \n", dato);
    }

    return NULL;
}
void *consumidor(void *arg)
{
    int i, dato;
    for (i = 0; i < 100; i++) {
        dato = buffer_compartido;
        printf("Consumidor dato %d \n", dato);
    }

    return NULL;
}
int main()
{
    int i = 1;
  
    pthread_create(&hcons, NULL, consumidor, NULL);
    pthread_create(&hprod, NULL, productor, NULL);

    pthread_join(hprod, NULL);
    printf("Finalizo el productor.\n");

    pthread_join(hcons, NULL);
    printf("Finalizo el consumidor.\n");

  
    return (EXIT_SUCCESS);
}

