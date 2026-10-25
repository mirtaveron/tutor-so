const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTP1Full() {
  console.log('Agregando resoluciones completas para TP1...');

  const tp1 = await prisma.lesson.findFirst({
    where: { title: { contains: 'Practico1' } }
  });

  if (!tp1) {
    console.log('TP1 no encontrado.');
    return;
  }

  // Eliminar los pasos del 5 en adelante por si se corre múltiples veces
  await prisma.step.deleteMany({
    where: { 
      lessonId: tp1.id,
      order: { gte: 5 }
    }
  });

  const steps = [
    {
      order: 5,
      instruction: 'Pregunta 5: Contradicción de objetivos de diseño',
      explanation: 'Un ejemplo clásico de contradicción es el **Rendimiento vs. Seguridad/Robustez**. Si un sistema verifica todos los límites de memoria, comprueba parámetros de usuario exhaustivamente y aísla procesos, será muy robusto, pero el procesamiento de todas estas validaciones disminuirá el rendimiento del sistema.\n\nOtro ejemplo es **Facilidad de uso vs. Consumo de recursos** (Ej: Una Interfaz Gráfica (GUI) bonita consume muchísimos más recursos que una interfaz de línea de comandos).'
    },
    {
      order: 6,
      instruction: 'Pregunta 6: ¿Cuándo es apropiado sacrificar eficiencia?',
      explanation: 'Es apropiado sacrificar la eficiencia máxima de la CPU/Memoria cuando los recursos humanos o de desarrollo son más valiosos, o cuando se busca una **mejor experiencia de usuario (UX)** y **seguridad**. Por ejemplo, los sistemas operativos modernos utilizan interfaces gráficas y animaciones que consumen ciclos de reloj "innecesarios", pero son utilizados masivamente porque hacen que las computadoras sean accesibles para el público general.'
    },
    {
      order: 7,
      instruction: 'Pregunta 7: Aplicaciones integradas en el SO (Navegadores, correo)',
      explanation: '**Pros de incluirlos:** Pueden ofrecer un mejor rendimiento percibido ya que tienen integración directa con la API del SO, y facilitan la vida del usuario que tiene "todo en uno" al instalar (Ej: Internet Explorer en Windows en su momento).\n\n**Contras de incluirlos:** Representa un riesgo de seguridad gigantesco (una vulnerabilidad en el navegador podría dar acceso al kernel si no están bien separados). Además, "infla" el tamaño del SO y va en contra de la filosofía de diseño modular.'
    },
    {
      order: 8,
      instruction: 'Pregunta 8: SO en lenguaje de alto nivel',
      explanation: '**Es totalmente posible y es la norma.** (Ej: C, C++, Rust). \n\n**Ventajas:** Código más fácil y rápido de escribir, entender y mantener. Facilita enormemente la **portabilidad** a otras arquitecturas de procesador (solo hay que recompilar).\n\n**Desventajas:** Menor eficiencia teórica comparada con código en Lenguaje Ensamblador optimizado a mano. Ciertas interacciones de muy bajo nivel con el hardware puro aún requieren porciones en ensamblador.'
    },
    {
      order: 9,
      instruction: 'Pregunta 9: Propiedades esenciales de sistemas',
      explanation: '- **a) Batch (Por lotes):** Trabajos agrupados que se ejecutan secuencialmente sin interacción del usuario.\n- **b) Interactivo:** El usuario envía instrucciones y recibe respuestas inmediatas.\n- **c) Tiempo compartido (Multitarea):** Intercala la CPU rápidamente entre múltiples usuarios o procesos, dando la ilusión de que todos tienen la CPU en simultáneo.\n- **d) Tiempo real:** Tiene requerimientos de tiempo (deadlines) estrictos; una respuesta tardía se considera un fallo catastrófico (Ej: frenos ABS).'
    },
    {
      order: 10,
      instruction: 'Pregunta 10: Multiprogramación vs Tiempo Compartido',
      explanation: '**Multiprogramación:** Mantiene varios procesos en memoria para que cuando uno hace E/S, la CPU ejecute otro, maximizando la utilización del procesador.\n\n**Relación y Diferencia:** El *tiempo compartido* es una extensión lógica de la multiprogramación. Mientras la multiprogramación busca mantener la CPU ocupada, el tiempo compartido busca minimizar el tiempo de respuesta del usuario (interactividad) intercalando la CPU por quantums de tiempo.'
    },
    {
      order: 11,
      instruction: 'Pregunta 11: Problemas de seguridad en Tiempo Compartido',
      explanation: '**Problemas:** Un usuario malicioso podría intentar leer datos de otros procesos en memoria, monopolizar el uso de la CPU, o acceder a archivos del disco sin permiso.\n\n¿Se garantiza el mismo grado de seguridad que en máquina dedicada? **No exactamente**. Al compartir hardware, siempre hay vectores de ataque (ej. Side-channel attacks en la caché de CPU). Sin embargo, con protección por hardware (MMU) y modos duales, el SO se aproxima a un entorno seguro.'
    },
    {
      order: 12,
      instruction: 'Pregunta 12: Multiprocesamiento SMP vs AMP',
      explanation: '**Simétrico (SMP):** Todos los procesadores son iguales y cualquiera puede ejecutar código del SO o de usuarios. Es el estándar moderno.\n**Asimétrico (AMP):** Un procesador maestro controla el SO y distribuye tareas a los procesadores "esclavos".\n\n**Ventajas del multiprocesador:** Mayor rendimiento, mayor tolerancia a fallos.\n**Desventajas:** Gran complejidad para sincronizar la memoria compartida y evitar condiciones de carrera.'
    },
    {
      order: 13,
      instruction: 'Pregunta 13: Interrupción vs Trap',
      explanation: '- **Interrupción:** Señal generada asincrónicamente por el **hardware** externo (ej. teclado, disco terminó de leer). Su uso es notificar eventos físicos.\n- **Trap (Excepción):** Señal generada sincrónicamente por el **software** (ej. división por cero, o instrucción deliberada para hacer una Syscall). Se usa para atrapar errores o cambiar a modo Kernel.'
    },
    {
      order: 14,
      instruction: 'Pregunta 14: Operación en modo dual',
      explanation: 'Es estrictamente necesaria para proteger al Sistema Operativo (y a otros usuarios) de los errores o programas maliciosos de un usuario. Permite diferenciar entre una ejecución sin privilegios limitados (**Modo Usuario**) y una ejecución con control total del hardware (**Modo Monitor/Kernel**).'
    },
    {
      order: 15,
      instruction: 'Pregunta 15: ¿Cómo sabe el sistema en qué modo está?',
      explanation: 'Se determina por hardware utilizando un bit de estado especial dentro del registro de estado del procesador (conocido como **Mode bit**). Si el bit es 0 indica modo kernel, y si es 1 indica modo usuario (o viceversa dependiendo la arquitectura).'
    },
    {
      order: 16,
      instruction: 'Pregunta 16: Propósito de los System Calls',
      explanation: 'Las "Llamadas al Sistema" son la interfaz o el puente que provee el Sistema Operativo para que los programas de usuario puedan solicitar servicios protegidos (como escribir en disco, asignar RAM, o abrir una conexión de red) de manera segura y controlada.'
    },
    {
      order: 17,
      instruction: 'Pregunta 17: Protecciones de Hardware',
      explanation: '- **E/S:** Se protege impidiendo usar instrucciones de E/S en modo usuario para que un proceso no pueda leer el teclado de otros o borrar el disco.\n- **Memoria:** Se protege mediante registros base y límite o MMU, evitando que un proceso escriba en la memoria del kernel u otros procesos.\n- **CPU:** Se protege con un temporizador (Timer) que interrumpe al proceso periódicamente para evitar que monopolice el uso (bucles infinitos).'
    },
    {
      order: 18,
      instruction: 'Pregunta 18: Instrucciones privilegiadas',
      explanation: 'Deberían ser privilegiadas (solo modo kernel):\n- **a)** Fijar el timer (evita que un proceso anule su propia interrupción por tiempo).\n- **c)** Borrar la memoria.\n- **d)** Deshabilitar las interrupciones.\n- **g)** Leer un sector físico del disco (esto evita el sistema de permisos de archivos).\n\n*(Leer el reloj "b" o cambiar a modo usuario "e" suelen no ser privilegiadas porque no representan riesgo de seguridad).*'
    },
    {
      order: 19,
      instruction: 'Pregunta 19: SO Seguro sin modo dual en hardware',
      explanation: 'Hacer un SO verdaderamente seguro sin modo dual por hardware es prácticamente **imposible** con programas de código nativo arbitrarios. El usuario podría manipular cualquier dirección física. \nSolo se puede emular seguridad si TODOS los programas corren bajo un intérprete, máquina virtual estricta o son compilados por un lenguaje seguro (como Java/C# gestionado), lo cual resta muchísimo rendimiento.'
    },
    {
      order: 20,
      instruction: 'Pregunta 20: Protección alojándolo en una partición especial',
      explanation: 'Si el SO se guarda en una partición fija protegida, las dificultades son:\n- Poca flexibilidad para que el SO crezca o asigne memoria dinámica si necesita más RAM de lo esperado.\n- Fragmentación: El espacio sobrante de esa partición no puede ser usado por los procesos de usuario.'
    },
    {
      order: 21,
      instruction: 'Pregunta 21: Operaciones que deben protegerse',
      explanation: 'El conjunto mínimo para evitar comprometer el sistema es:\n- **b)** Escribir en la memoria del monitor (un usuario podría sobreescribir código del kernel con código malicioso).\n- **e)** Acceder al área de I/O (lectura o escritura, podría saltarse la protección de archivos).\n\n*(Ejecutar un trap -d- no debe protegerse, porque es el mecanismo mediante el cual el usuario entra legítimamente al modo kernel).*'
    },
    {
      order: 22,
      instruction: 'Pregunta 22: El intérprete de comandos',
      explanation: 'Su propósito es obtener las instrucciones escritas por el usuario y transformarlas en llamadas al sistema o ejecución de binarios.\nUsualmente está **separado del kernel** porque no necesita permisos especiales del núcleo para leer texto. Además, separarlo permite que el sistema tenga múltiples intérpretes (como bash, zsh, cmd, PowerShell) que el usuario puede intercambiar.'
    },
    {
      order: 23,
      instruction: 'Pregunta 23: Arquitectura Microkernel',
      explanation: '**Ventaja:** Gran robustez y seguridad. Si un driver de video o sistema de archivos falla, solo crashea ese proceso de usuario, no todo el sistema operativo.\n\n**Interacción:** Los programas interactúan con los servicios del sistema mediante el paso de mensajes (IPC) a través del microkernel.\n\n**Desventaja:** Menor rendimiento debido al gran overhead de hacer "context switches" y pase de mensajes constantemente.'
    },
    {
      order: 24,
      instruction: 'Pregunta 24: Modular vs En niveles',
      explanation: '**Semejanza:** Ambas buscan dividir el kernel en partes lógicas manejables para facilitar el desarrollo y el aislamiento de errores.\n\n**Diferencia:** La arquitectura en niveles es estricta (el nivel N solo puede llamar funciones del nivel N-1). La arquitectura modular es más libre; carga módulos dinámicamente según necesidad y cualquier módulo puede invocar funciones de otro.'
    },
    {
      order: 25,
      instruction: 'Pregunta 25: Ventajas de la Máquina Virtual',
      explanation: '**Para el diseñador de SO:** Permite desarrollar, probar y depurar un sistema operativo nuevo en modo seguro sin requerir hardware dedicado ni arriesgar los datos de la máquina host.\n\n**Para el usuario:** Permite ejecutar aplicaciones de otros sistemas operativos (ej: usar Linux dentro de Windows) o aislar entornos para mayor seguridad.'
    }
  ];

  for (const step of steps) {
    await prisma.step.create({
      data: {
        lessonId: tp1.id,
        order: step.order,
        instruction: step.instruction,
        explanation: step.explanation,
        codeSnippet: step.codeSnippet
      }
    });
  }

  console.log('Resoluciones completas insertadas con éxito.');
}

seedTP1Full()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
