import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLesson } from '../hooks/useContent';
import Stepper from '../components/Stepper';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Printer } from 'lucide-react';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: lesson, isLoading } = useLesson(id);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando contenido de la clase...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500 font-medium">Clase no encontrada</div>;

  const titleLower = (lesson.title || '').toLowerCase();
  const inferredExamTab =
    (lesson.unit && (lesson.unit.order >= 100 || (lesson.unit.title || '').toLowerCase().includes('examen'))) ||
    titleLower.includes('parcial') ||
    titleLower.includes('recuperatorio') ||
    titleLower.includes('resumen') ||
    titleLower.includes('laboratorio 2025') ||
    titleLower.includes('laboratorio 2026') ||
    titleLower.includes('actividades 5');

  const returnTab = location.state?.fromTab || (inferredExamTab ? 'examenes' : 'plan');

  const handleBack = () => {
    navigate(returnTab === 'examenes' ? '/dashboard?tab=examenes' : '/dashboard?tab=plan');
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
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <button 
              onClick={handleBack}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-xs transition-all shrink-0 print:hidden cursor-pointer"
              title={returnTab === 'examenes' ? 'Volver a Exámenes' : 'Volver al Plan de Estudio'}
            >
              <ArrowLeft size={18} className="mr-1.5" />
              <span className="hidden sm:inline">
                {returnTab === 'examenes' ? 'Volver a Exámenes' : 'Volver al Plan'}
              </span>
              <span className="sm:hidden">Volver</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold truncate">{lesson.title}</h1>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {titleLower.includes('resumen') && (
              <button 
                onClick={handlePrint}
                className="flex items-center px-3.5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors print:hidden cursor-pointer"
                title="Imprimir resumen o guardar como PDF"
              >
                <Printer size={16} className="mr-1.5" /> Imprimir / PDF
              </button>
            )}
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
                  {lesson.title.toLowerCase().includes('parcial') || lesson.title.toLowerCase().includes('recuperatorio') || lesson.title.toLowerCase().includes('laboratorio') || lesson.title.toLowerCase().includes('actividades')
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
                {lesson.title.toLowerCase().includes('parcial') || lesson.title.toLowerCase().includes('recuperatorio') || lesson.title.toLowerCase().includes('laboratorio') || lesson.title.toLowerCase().includes('actividades')
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
