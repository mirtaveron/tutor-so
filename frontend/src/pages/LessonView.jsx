import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLesson, useProgress, useToggleProgress } from '../hooks/useContent';
import Stepper from '../components/Stepper';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lesson, isLoading } = useLesson(id);
  const { data: progress } = useProgress();
  const { mutate: toggleProgress, isPending: toggling } = useToggleProgress();

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando contenido de la clase...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500 font-medium">Clase no encontrada</div>;

  const isCompleted = progress?.some(p => p.lessonId === lesson.id);

  const handleToggle = () => {
    toggleProgress(lesson.id);
  };

  const handlePrint = () => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header flotante */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Volver al plan de estudio"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold truncate max-w-md md:max-w-xl">{lesson.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {lesson.title.toLowerCase().includes('resumen') && (
              <button 
                onClick={handlePrint}
                className="flex items-center px-3.5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors print:hidden"
                title="Imprimir resumen o guardar como PDF"
              >
                <Printer size={16} className="mr-1.5" /> Imprimir / PDF
              </button>
            )}
            <button 
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isCompleted 
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={18} className={`mr-2 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
              {isCompleted ? 'Completado' : 'Marcar completado'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {lesson.type === 'SUMMARY' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <article className="prose prose-primary prose-slate max-w-none">
              {lesson.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{lesson.content}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic not-prose">El contenido teórico aún no ha sido cargado para esta unidad.</p>
              )}
            </article>
          </div>
        ) : (
          <div className="space-y-6">
            {lesson.content && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-medium mb-4 text-gray-900">
                  {lesson.title.toLowerCase().includes('parcial') || lesson.title.toLowerCase().includes('recuperatorio')
                    ? 'Consigna de la Evaluación'
                    : 'Consigna del Trabajo Práctico'}
                </h2>
                <article className="prose prose-primary prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{lesson.content}</ReactMarkdown>
                </article>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-2 text-gray-900">Resolución Paso a Paso</h2>
              <p className="text-gray-600">
                {lesson.title.toLowerCase().includes('parcial') || lesson.title.toLowerCase().includes('recuperatorio')
                  ? 'Revisa cada ejercicio y problema de la evaluación con su justificación teórica y resolución analítica detallada.'
                  : 'Sigue las instrucciones cuidadosamente para completar este trabajo práctico en tu terminal o entorno de Linux.'}
              </p>
            </div>
            <Stepper steps={lesson.steps} />
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonView;
