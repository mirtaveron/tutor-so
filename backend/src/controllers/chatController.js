const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');
const prisma = new PrismaClient();

// Base de conocimiento temática y respuestas pedagógicas de respaldo para SO - UNS
const KNOWLEDGE_BASE = [
  {
    topics: ['hilos', 'klt', 'ult', 'threads', 'usuario', 'kernel'],
    title: 'Hilos a nivel de Usuario (ULT) vs Kernel (KLT)',
    summary: `**Hilos de Usuario (ULT) vs Hilos de Kernel (KLT):**
- **Planificación:** Los ULT son gestionados por una biblioteca en espacio de usuario sin que el kernel sepa de su existencia. Los KLT son gestionados directamente por el scheduler del SO.
- **Llamadas bloqueantes:** En ULT, si un hilo hace una llamada al sistema bloqueante (ej. lectura de disco), el kernel bloquea al **proceso completo**. En KLT, solo se bloquea ese hilo y los demás pueden continuar.
- **Multiprocesamiento:** Los ULT no pueden paralelizarse físicamente en múltiples cores (todos corren en el core asignado al proceso). Los KLT aprovechan verdaderamente múltiples CPUs/cores en paralelo.
- **Cambio de contexto:** En ULT es ultrarrápido (solo registros en user-space). En KLT requiere trampa al kernel y cambio de TCB.`
  },
  {
    topics: ['inversion', 'prioridad', 'prioridades', 'herencia', 'pip', 'pathfinder'],
    title: 'Inversión de Prioridades y Protocolo de Herencia (PIP)',
    summary: `**Inversión de Prioridades:**
Ocurre cuando una tarea de alta prioridad ($P_{alta}$) queda indirectamente postergada por tareas de prioridad media ($P_{media}$), debido a que una tarea de baja prioridad ($P_{baja}$) retiene un recurso exclusivo que $P_{alta}$ necesita.

**¿Cómo se soluciona?**
Con el **Protocolo de Herencia de Prioridad (Priority Inheritance Protocol):**
En el instante en que $P_{alta}$ se bloquea esperando el recurso en manos de $P_{baja}$, $P_{baja}$ **hereda temporalmente la prioridad más alta**. Esto impide que procesos de prioridad intermedia lo desalojen de la CPU, permitiendo que $P_{baja}$ libere el recurso cuanto antes y se lo ceda a $P_{alta}$.`
  },
  {
    topics: ['deadlock', 'interbloqueo', 'coffman', 'condiciones'],
    title: 'Condiciones de Coffman para Interbloqueos (Deadlock)',
    summary: `Para que ocurra un **Deadlock**, deben cumplirse simultáneamente las 4 condiciones de Coffman:
1. **Exclusión Mutua:** Los recursos no son compartibles simultáneamente.
2. **Retención y Espera (Hold and Wait):** Los procesos retienen recursos mientras esperan otros.
3. **No Expropiación (No Preemption):** Los recursos no pueden ser quitados a la fuerza.
4. **Espera Circular:** Existe una cadena cerrada de procesos esperando recursos retenidos por el siguiente.

*Estrategias de resolución:*
- **Prevención:** Invalidar a priori alguna de las 4 condiciones.
- **Evasión:** Algoritmo del Banquero (solo otorga recursos si el estado resultante es Seguro).
- **Detección y Recuperación:** Monitorear el grafo de recursos y resolver ciclos con abortos o expropiación.
- **Algoritmo del Avestruz:** Ignorar el problema si es muy infrecuente.`
  },
  {
    topics: ['banquero', 'banker', 'estado seguro', 'need', 'disponible', 'matriz'],
    title: 'Algoritmo del Banquero y Estado Seguro',
    summary: `**Algoritmo del Banquero (Dijkstra):**
- **Matriz de Necesidad:** $\\text{Need} = \\text{Max} - \\text{Allocation}$.
- **Estado Seguro:** Existe al menos una secuencia $\\langle P_1, P_2, \\dots, P_n \\rangle$ donde cada proceso puede satisfacer su $\\text{Need}_i$ con el Disponible actual más lo liberado por los procesos anteriores.
- **Evaluación de Solicitud ($Req$):**
  1. Si $Req \\le Need$ y $Req \\le Disponible$: se simula la asignación.
  2. Si el estado resultante es **Seguro**, se concede. Si es **Inseguro**, el proceso debe esperar.`
  },
  {
    topics: ['rm', 'edf', 'tiempo real', 'rate monotonic', 'deadline', 'utilizacion'],
    title: 'Planificación de Tiempo Real: RM vs EDF',
    summary: `**Rate Monotonic (RM) - Prioridades Estáticas:**
- Tareas con período más corto ($T_i$) tienen mayor prioridad.
- Cota suficiente de Liu & Layland: $U = \\sum \\frac{C_i}{T_i} \\le n(2^{1/n} - 1)$.
- Si $U$ supera la cota pero $U \\le 1$, se aplica **Análisis de Tiempo de Respuesta (RTA):** $R_i^{(k+1)} = C_i + \\sum_{j \\in hp(i)} \\lceil \\frac{R_i^{(k)}}{T_j} \\rceil C_j$.

**Earliest Deadline First (EDF) - Prioridades Dinámicas:**
- La tarea con el plazo de vencimiento más cercano recibe la CPU.
- Criterio óptimo necesario y suficiente: $U \\le 1.0$ (100% de utilización).`
  },
  {
    topics: ['semaforo', 'semaforos', 'mutex', 'wait', 'signal', 'atomicidad'],
    title: 'Semáforos y Exclusión Mutua',
    summary: `**Semáforo vs Mutex:**
- **Mutex:** Tiene dueño (*ownership*). Solo el hilo que hizo \`lock\` puede hacer \`unlock\`. Diseñado para exclusión mutua estricta.
- **Semáforo:** Es un contador protegido. No tiene dueño. Un hilo puede hacer \`wait()\` y otro distinto \`signal()\`. Usado para señalización y sincronización entre hilos.

**Atomicidad:** \`wait\` y \`signal\` deben ser indivisibles (atómicas). Si dos hilos ejecutan \`wait\` a la vez sobre un semáforo en 1 y se intercalan antes de decrementar, ambos entrarán a la sección crítica, rompiendo la exclusión mutua.`
  },
  {
    topics: ['filosofos', 'cena', 'comensales', 'tenedores'],
    title: 'Problema de los Filósofos Comensales',
    summary: `**Desafío:** 5 filósofos sentados en una mesa circular con 1 tenedor entre cada par. Necesitan 2 tenedores para comer.
- *Riesgo de Deadlock:* Si todos toman simultáneamente su tenedor izquierdo, todos esperan el derecho eternamente.
- *Soluciones:*
  1. **Ruptura de asimetría:** Filósofos pares toman primero el izquierdo; filósofos impares primero el derecho.
  2. **Toma atómica:** Proteger la verificación y toma de ambos tenedores en una sección crítica (usando estados Pensando, Hambriento, Comiendo).
  3. **Límite de comensales:** Permitir un máximo de $N-1$ filósofos sentados al mismo tiempo.`
  }
];

// Generar texto usando Groq SDK con la lógica anti-errores
async function generarTextoConGroq(apiKey, promptUsuario, systemInstruction, history = []) {
  try {
    const groq = new Groq({ apiKey: apiKey || process.env.GROQ_API_KEY });

    // 1. Pedimos la lista de modelos permitidos para nuestra cuenta
    const models = await groq.models.list();
    const availableModels = models.data.map(m => m.id);

    // 2. Definimos nuestros modelos de texto favoritos en orden de prioridad
    const PREFERRED_MODELS = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768'
    ];

    // 3. Elegimos el primero que coincida, ignorando audios ('whisper') y filtros ('guard')
    let selectedModel = PREFERRED_MODELS.find(m => availableModels.includes(m)) ||
      availableModels.find(id => !id.includes('whisper') && !id.includes('guard'));

    // Construimos los mensajes respetando la instrucción de sistema y el historial
    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    if (history && history.length > 0) {
      for (const h of history.slice(-6)) {
        messages.push({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content
        });
      }
    }

    messages.push({ role: 'user', content: promptUsuario });

    // 4. Hacemos la petición a la IA
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: selectedModel,
      temperature: 0.7,
    });

    // 5. Devolvemos el texto generado y el modelo utilizado
    return {
      text: chatCompletion.choices[0]?.message?.content || '',
      model: selectedModel
    };
  } catch (error) {
    console.error('Error con Groq:', error);
    throw error;
  }
}

// Controlador principal del Chat
exports.sendMessage = async (req, res) => {
  try {
    const { message, history = [], context = {}, apiKey: clientApiKey } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // 1. Obtener detalles de la lección actual si está en una página de contenido
    let currentLessonData = null;
    if (context.lessonId) {
      currentLessonData = await prisma.lesson.findUnique({
        where: { id: context.lessonId },
        include: {
          unit: true,
          steps: { orderBy: { order: 'asc' } }
        }
      });
    }

    // 2. Obtener resumen de las unidades y temas de la plataforma
    const allUnits = await prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          select: { id: true, title: true, type: true, order: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    // Construir la instrucción de sistema para Groq
    const syllabusSummary = allUnits.map(u => 
      `- ${u.order < 99 ? 'Unidad ' + u.order + ': ' : ''}[${u.title}]: ${u.lessons.map(l => l.title).join(', ')}`
    ).join('\n');

    let currentContextText = 'El estudiante está actualmente en el Dashboard principal de la plataforma.';
    if (currentLessonData) {
      currentContextText = `El estudiante está visualizando actualmente la clase/evaluación: "${currentLessonData.title}" (Unidad: "${currentLessonData.unit.title}").
Tipo: ${currentLessonData.type}
${currentLessonData.steps && currentLessonData.steps.length > 0 ? `Pasos/Ejercicios disponibles en esta página:\n` + currentLessonData.steps.map(s => `* [Paso ${s.order}] ${s.instruction}:\n${s.explanation}`).join('\n\n') : ''}`;
    } else if (context.pageTitle) {
      currentContextText = `El estudiante está en: ${context.pageTitle}. Ruta: ${context.pathname}`;
    }

    const systemInstruction = `Sos el Asistente Virtual y Tutor Académico de la cátedra de Sistemas Operativos de la Universidad Nacional del Sur (UNS), diseñado para estudiantes de Ingeniería en Computación e Ingeniería en Sistemas.

Tus responsabilidades:
1. Responder con precisión conceptual y rigor académico sobre Sistemas Operativos (siguiendo autores como Silberschatz, Tanenbaum y Stallings).
2. Tener en cuenta el contexto exacto de lo que el alumno está viendo en pantalla en este instante:
${currentContextText}

3. Conocer todo el mapa curricular y material disponible en la plataforma:
${syllabusSummary}

Directrices de respuesta:
- Respondé en español claro, pedagógico y alentador.
- Usá Markdown estructurado: negritas para términos técnicos, listas numeradas para pasos y bloques de código para algoritmos o comandos en C/Bash.
- Si el usuario te pregunta sobre "esta página", "este ejercicio" o "el paso actual", enfocate directamente en el contenido que tiene abierto.
- Si te pregunta sobre cualquier otro tema o sección de la plataforma, respondé la duda técnica e indicale en qué unidad, práctico o parcial de la plataforma puede profundizarlo.`;

    const effectiveApiKey = clientApiKey || process.env.GROQ_API_KEY;

    // 3. Si hay API Key de Groq (en .env o enviada desde la app), usamos Groq con ultra-baja latencia
    if (effectiveApiKey && effectiveApiKey.trim() !== '') {
      try {
        const groqResult = await generarTextoConGroq(effectiveApiKey.trim(), message, systemInstruction, history);
        if (groqResult && groqResult.text) {
          return res.status(200).json({
            reply: groqResult.text,
            source: `Groq (${groqResult.model})`,
            currentTopic: currentLessonData ? currentLessonData.title : (context.pageTitle || 'Plataforma')
          });
        }
      } catch (groqError) {
        console.warn('Fallo llamada a Groq API, usando motor pedagógico local:', groqError.message);
      }
    }

    // 4. Motor Pedagógico Local de Respaldo (Funciona sin API key si aún no la configuró)
    const localReply = generateLocalResponse(message, context, currentLessonData, allUnits);

    return res.status(200).json({
      reply: localReply,
      source: 'Tutor Académico UNS (Local)',
      currentTopic: currentLessonData ? currentLessonData.title : (context.pageTitle || 'Plataforma')
    });

  } catch (error) {
    console.error('Error en chatController:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar tu consulta' });
  }
};

// Generador de respuestas pedagógicas locales sin necesidad de API externa
function generateLocalResponse(message, context, currentLesson, allUnits) {
  const query = message.toLowerCase().trim();

  // 1. Pregunta sobre el contenido específico que tiene abierto en pantalla
  if (currentLesson) {
    const stepMatch = query.match(/(?:ejercicio|paso|pregunta|problema)\s*(\d+)/i);
    if (stepMatch) {
      const stepNum = parseInt(stepMatch[1], 10);
      const foundStep = currentLesson.steps.find(s => s.order === stepNum);
      if (foundStep) {
        return `### 📌 ${foundStep.instruction} (${currentLesson.title})\n\n${foundStep.explanation}\n\n${foundStep.codeSnippet ? `\`\`\`c\n${foundStep.codeSnippet}\n\`\`\`\n` : ''}\n\n*¿Hay algún punto de este razonamiento que quieras que analicemos en más detalle?*`;
      }
    }

    if (query.includes('esta pagina') || query.includes('este tema') || query.includes('este examen') || query.includes('este practico') || query.includes('resumen')) {
      if (currentLesson.steps && currentLesson.steps.length > 0) {
        const topicsList = currentLesson.steps.map(s => `* **Paso ${s.order}:** ${s.instruction}`).join('\n');
        return `Estás viendo **${currentLesson.title}** correspondiente a la sección de *${currentLesson.unit.title}*.\n\nEsta sección incluye **${currentLesson.steps.length} ejercicios/pasos guiados** con su resolución:\n\n${topicsList}\n\nPodés preguntarme por cualquiera de ellos (por ejemplo: *"Explicame el ejercicio 2"* o *"¿Por qué da este resultado?"*) o cualquier duda general sobre el tema.`;
      }
    }
  }

  // 2. Búsqueda por tópicos en la Base de Conocimiento de Sistemas Operativos
  for (const item of KNOWLEDGE_BASE) {
    if (item.topics.some(t => query.includes(t))) {
      let locationHint = '';
      if (item.topics.includes('banquero') || item.topics.includes('deadlock')) {
        locationHint = '\n\n💡 *Podés profundizar este tema y ver ejercicios prácticos en la **Unidad 4 (Interbloqueos)**, en el **TP 5** y en los ejercicios de los **Parciales 2022, 2023, 2024 y 2025**.*';
      } else if (item.topics.includes('rm') || item.topics.includes('edf')) {
        locationHint = '\n\n💡 *Podés ver ejemplos y cálculos de tiempo real resueltos en el **Parcial 2023**, **Parcial 2024** y **Recuperatorio 2025**.*';
      } else if (item.topics.includes('inversion')) {
        locationHint = '\n\n💡 *El problema de inversión de prioridades y el protocolo PIP están explicados con gráficos en el **Parcial 2022**, **Parcial 2024** y **Parcial 2025**.*';
      }
      return `### 📚 ${item.title}\n\n${item.summary}${locationHint}`;
    }
  }

  // 3. Consultas sobre el plan de estudio y exámenes
  if (query.includes('plan de estudio') || query.includes('temas') || query.includes('donde') || query.includes('que hay') || query.includes('parciales')) {
    const unitsList = allUnits.filter(u => u.order < 100).map(u => 
      `* **${u.order < 99 ? u.order + '. ' : ''}${u.title}:** ${u.lessons.length} documentos y actividades.`
    ).join('\n');

    return `### 🗺️ Contenidos disponibles en la plataforma OS-UNS:\n\n${unitsList}\n\nAdemás, tenés la pestaña de **Exámenes** donde podés acceder a los **Parciales 2022, 2023, 2024, 2025** y al **Recuperatorio 2025** con todas las consignas y sus resoluciones paso a paso.\n\n*¿Sobre qué tema o ejercicio querés consultar?*`;
  }

  // 4. Si está en una lección específica
  if (currentLesson) {
    return `Actualmente estás visualizando **${currentLesson.title}** en la unidad *${currentLesson.unit.title}*.\n\nPuedo ayudarte a:\n- Explicar cualquiera de los enunciados o pasos del examen/práctico.\n- Resolver dudas sobre la justificación teórica o los algoritmos de esta página.\n- Comparar con otros temas de la cursada (Planificación, Sincronización, Deadlocks, etc.).\n\n*¿Qué duda tenés sobre esta pantalla o sobre la materia?*`;
  }

  // 5. Bienvenida orientadora
  return `¡Hola! Soy tu **Tutor Virtual de Sistemas Operativos (UNS)** 🎓.\n\nPuedo responder cualquier duda sobre la página que estés mirando en este momento (teorías, Trabajos Prácticos del 1 al 5 o los Exámenes Parciales y Recuperatorios), o explicarte cualquier concepto de la materia como:\n- **Concurrencia y Sincronización** (Semáforos, Mutex, Monitores, Filósofos, Lectores/Escritores)\n- **Interbloqueos / Deadlocks** (Condiciones de Coffman, Algoritmo del Banquero)\n- **Planificación de CPU y Tiempo Real** (RM, EDF, Round Robin, Inversión de Prioridades)\n- **Hilos y Procesos** (KLT vs ULT, System Calls, Cambio de Contexto)\n\n*(Tip: Podés configurar tu clave de Groq en el botón de ajustes ⚙️ del chat o en el archivo .env del backend).*`;
}
