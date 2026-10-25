import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Bot, Sparkles, Send, X, MessageSquare, Trash2, 
  ChevronDown, CornerDownLeft 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { sendChatMessage } from '../api/chat';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu **Tutor IA de Sistemas Operativos UNS** 🎓.\n\nPuedo responder dudas sobre la **página actual que estás viendo** (teorías, Trabajos Prácticos o Parciales) o sobre **cualquier otro tema de la materia** (Concurrencia, Semáforos, Algoritmo del Banquero, Tiempo Real, etc.).\n\n¿En qué te puedo ayudar hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Extraer ID de lección de la URL si estamos en /lesson/:id
  const isLessonPage = location.pathname.startsWith('/lesson/');
  const currentLessonId = isLessonPage ? location.pathname.split('/')[2] : null;

  // Auto-scroll al final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Asegurar limpieza de claves locales residuales
    localStorage.removeItem('os_groq_api_key');
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Historial reiniciado. ¿Qué tema o ejercicio querés que revisemos ahora?'
      }
    ]);
  };

  const handleSend = async (messageToSend = null) => {
    const text = messageToSend || input;
    if (!text || text.trim() === '' || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Capturar contexto de la página actual
      const pageTitleElement = document.querySelector('h1, h2');
      const pageTitle = pageTitleElement ? pageTitleElement.innerText : 'Plataforma OS-UNS';

      const payload = {
        message: text.trim(),
        history: newHistory,
        context: {
          pathname: location.pathname,
          lessonId: currentLessonId,
          pageTitle: pageTitle
        }
      };

      const response = await sendChatMessage(payload);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          source: response.source
        }
      ]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Lo siento, ocurrió un error temporal al procesar tu consulta. Por favor intentá nuevamente.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sugerencias de preguntas rápidas según contexto
  const quickPrompts = isLessonPage ? [
    '💡 Explicame este ejercicio',
    '🔍 ¿Por qué da este resultado?',
    '📝 Dame un ejemplo práctico',
    '❓ Posible pregunta de parcial de esto'
  ] : [
    '¿Qué diferencia hay entre KLT y ULT?',
    '¿Cómo funciona el Algoritmo del Banquero?',
    'Explicame inversión de prioridades',
    '¿Qué parciales hay disponibles?'
  ];

  return (
    <div id="chat-widget" className="fixed bottom-5 right-5 z-50 font-sans print:hidden">
      {/* Botón flotante para abrir el chat cuando está cerrado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Abrir Asistente IA"
        >
          <div className="relative">
            <Bot size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm">Preguntar a la IA</span>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header del Chat */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="p-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <Sparkles size={18} className="text-blue-300" />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-sm tracking-wide leading-tight">TutorSO IA - Sistemas Operativos</h3>
                <div className="flex items-center space-x-1.5 text-xs text-blue-200/80 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span className="truncate">
                    {isLessonPage ? 'Detectando contenido de la página' : 'Contexto: Plataforma Global'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-blue-200">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Limpiar conversación"
              >
                <Trash2 size={17} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1"
                title="Minimizar chat"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-xs'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <article className="prose prose-sm prose-slate max-w-none text-gray-800 prose-headings:text-gray-900 prose-headings:font-bold prose-headings:text-sm prose-p:my-1 prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-pre:border prose-pre:border-slate-200 prose-pre:p-2.5 prose-pre:rounded-lg prose-code:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{m.content}</ReactMarkdown>
                    </article>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.source && (
                    <div className="mt-1.5 text-[10px] text-gray-400 font-medium">
                      Fuente: {m.source}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicador de pensando / tipeando */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-gray-400 ml-1">Consultando material...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Sugerencias Rápidas */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-full text-xs font-medium border border-gray-200 transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Formulario de Entrada */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hacé una pregunta sobre esta página o cualquier tema..."
                rows={1}
                className="w-full pl-3.5 pr-11 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none max-h-24 leading-normal"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm focus:outline-none"
                title="Enviar mensaje (Enter)"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1.5 flex items-center justify-center">
              <span>Presiona <strong>Enter</strong> para enviar &bull; Asistente contextual de Sistemas Operativos</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChatWidget;
