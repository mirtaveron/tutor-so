# Laboratorio de Sistemas Operativos - Control de Licencias Especializadas

Este directorio contiene la resolución completa y lista para entregar del examen de Laboratorio de Sistemas Operativos (UNS).

## Contenido del Directorio

1. **`centro_computos.c`**: Código fuente en C con la implementación completa basada en hilos POSIX (`pthread`) y exclusión mutua de granularidad fina (`mutex`).
2. **`Makefile`**: Script de compilación y ejecución automatizada (`make`, `make run`, `make run-heavy`, `make clean`).
3. **`INFORME_LABORATORIO_SO.md`**: Informe técnico completo y exhaustivo con respuestas a los incisos a y b, justificación teórica, diagramas de estado, análisis de condiciones de Coffman, pruebas y conclusiones.

## Instrucciones Rápidas

```bash
# Compilar
make

# Ejecutar simulación normal (30 usuarios)
make run

# Ejecutar simulación de alta concurrencia (60 usuarios para saturar licencias)
make run-heavy
```
