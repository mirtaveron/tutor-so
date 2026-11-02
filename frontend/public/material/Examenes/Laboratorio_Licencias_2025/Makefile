# ==============================================================================
# Makefile - UNS Sistemas Operativos
# Laboratorio de Sincronización: Control de Licencias Especializadas
# ==============================================================================

CC = gcc
CFLAGS = -Wall -Wextra -pthread -O2 -std=gnu11
TARGET = centro_computos
SRC = centro_computos.c
BD_FILE = resultados_bd.txt

.PHONY: all run run-heavy clean help

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC)
	@echo "Compilación exitosa: ./$(TARGET)"

run: $(TARGET)
	@echo "Ejecutando simulación estándar (30 usuarios)..."
	./$(TARGET) 30

run-heavy: $(TARGET)
	@echo "Ejecutando simulación de alta concurrencia (60 usuarios para saturar licencias)..."
	./$(TARGET) 60

clean:
	rm -f $(TARGET) $(BD_FILE)
	@echo "Limpieza completada."

help:
	@echo "Opciones disponibles:"
	@echo "  make            - Compila el programa ejecutable"
	@echo "  make run        - Compila y ejecuta con 30 usuarios"
	@echo "  make run-heavy  - Compila y ejecuta con 60 usuarios (alta carga)"
	@echo "  make clean      - Elimina binarios y archivos temporales de BD"
