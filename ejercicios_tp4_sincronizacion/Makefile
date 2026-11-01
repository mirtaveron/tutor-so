# Makefile para compilar todos los ejercicios del TP4 de Sincronización - Sistemas Operativos UNS
CC = gcc
CFLAGS = -Wall -Wextra -pthread -O2

SRCS = $(wildcard *.c)
BINS = $(SRCS:.c=)

all: $(BINS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(BINS) *.o
