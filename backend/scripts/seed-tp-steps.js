const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTPSteps() {
  console.log('Actualizando resolución paso a paso con el contenido real de los TPs...');

  const tps = await prisma.lesson.findMany({
    where: { type: 'PRACTICAL_WORK' }
  });

  for (const tp of tps) {
    if (tp.title.includes('Practico1')) {
      await prisma.step.deleteMany({ where: { lessonId: tp.id } });
      
      await prisma.step.createMany({
        data: [
          {
            lessonId: tp.id,
            order: 1,
            instruction: 'Pregunta 1: Funciones principales de un SO',
            explanation: 'Un Sistema Operativo tiene dos funciones principales: \n\n1. **Administrador de Recursos:** Asigna de forma eficiente y segura la CPU, memoria, almacenamiento y dispositivos de E/S entre los distintos programas.\n2. **Máquina Extendida (Abstracción):** Oculta la complejidad del hardware proporcionando una interfaz limpia y sencilla para que los programadores y usuarios interactúen con la máquina.',
            codeSnippet: null
          },
          {
            lessonId: tp.id,
            order: 2,
            instruction: 'Pregunta 2: Ejemplos y clasificación de SO',
            explanation: 'Ejemplos: Windows, macOS, Linux (Ubuntu, Debian), Android, iOS.\n\nSe pueden clasificar según distintos criterios:\n- **Por lote (batch):** Procesan trabajos sin interacción del usuario (antiguos mainframes).\n- **Interactivos/Tiempo compartido:** Múltiples usuarios interactuando simultáneamente (Linux, Windows).\n- **Tiempo real (RTOS):** Responden a eventos en tiempos estrictos (sistemas médicos, control industrial).\n- **Embebidos:** Integrados en dispositivos específicos (electrodomésticos, routers).',
            codeSnippet: null
          },
          {
            lessonId: tp.id,
            order: 3,
            instruction: 'Pregunta 3a: ¿PC sin sistema operativo?',
            explanation: '**Verdadero**. Técnicamente, una computadora puede funcionar sin un SO. Sin embargo, el programador tendría que escribir código máquina o ensamblador interactuando directamente con los registros del hardware, manejando las interrupciones, la memoria de video y los discos manualmente para cada aplicación que desarrolle.',
            codeSnippet: null
          },
          {
            lessonId: tp.id,
            order: 4,
            instruction: 'Pregunta 4: ¿Cómo utiliza el usuario el SO?',
            explanation: '**Directamente:** A través del intérprete de comandos (Shell) o la interfaz gráfica (GUI) para interactuar con los archivos y configuraciones.\n**Indirectamente:** Al usar aplicaciones de usuario (como un navegador o un procesador de texto), estas aplicaciones realizan "System Calls" (llamadas al sistema) al SO en nombre del usuario para leer archivos, asignar memoria o enviar datos por red.',
            codeSnippet: null
          }
        ]
      });
      console.log(`- Resolución real agregada a ${tp.title}`);
    } else if (tp.title.includes('Practico2')) {
      await prisma.step.deleteMany({ where: { lessonId: tp.id } });
      
      await prisma.step.createMany({
        data: [
          {
            lessonId: tp.id,
            order: 1,
            instruction: 'Pregunta 1: Intervención del SO en el diagrama de estados',
            explanation: 'El Sistema Operativo interviene en todas las transiciones (flechas) del diagrama. Por ejemplo, el **Planificador a corto plazo (Dispatcher)** del SO es quien decide pasar un proceso de "Listo" a "Corriendo". Para ver el SO en el diagrama, deberíamos considerarlo como un proceso o entidad superior que ejecuta sus propias rutinas en el kernel cuando ocurren interrupciones o llamadas al sistema.',
            codeSnippet: null
          },
          {
            lessonId: tp.id,
            order: 2,
            instruction: 'Pregunta 2: Sucesos para la creación de un proceso',
            explanation: 'Sucesos comunes:\n1. Arranque del sistema (procesos init/systemd).\n2. Ejecución de un programa por el usuario (doble clic o comando).\n3. Petición de un proceso de usuario para crear otro proceso (fork).\n4. Inicio de un trabajo por lotes.\n\nPasos del SO: Asigna un identificador (PID), crea el PCB (Bloque de Control de Proceso), le asigna espacio en memoria e inicializa sus estructuras.',
            codeSnippet: null
          },
          {
            lessonId: tp.id,
            order: 3,
            instruction: 'Pregunta 4: Planificadores a corto, mediano y largo plazo',
            explanation: '- **Corto plazo (CPU Scheduler):** Selecciona qué proceso de la cola de listos (RAM) va a ejecutarse en la CPU. Debe ser extremadamente rápido.\n- **Mediano plazo (Swapper):** Retira procesos de la RAM y los envía a disco (Swap/Suspendido) para liberar memoria, o los trae de vuelta.\n- **Largo plazo (Job Scheduler):** Decide qué trabajos entran al sistema para competir por recursos. Controla el grado de multiprogramación.',
            codeSnippet: null
          }
        ]
      });
      console.log(`- Resolución real agregada a ${tp.title}`);
    }
  }
  
  console.log('Resoluciones actualizadas correctamente.');
}

updateTPSteps()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
