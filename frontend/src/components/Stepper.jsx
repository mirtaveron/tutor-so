import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Stepper = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) return <div className="p-4 text-gray-500 italic">No hay pasos definidos para este TP.</div>;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Barra de progreso */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Paso {currentStep + 1} de {steps.length}
        </span>
        <select
          value={currentStep}
          onChange={(e) => setCurrentStep(Number(e.target.value))}
          className="block w-full sm:max-w-xs pl-3 pr-10 py-1.5 text-base border-gray-300 border focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white text-gray-700 shadow-sm"
        >
          {steps.map((s, idx) => {
            let label = s.instruction.replace(/^(Pregunta|Ejercicio|Problema|Conceptos)\s*\d*:\s*/i, '');
            if(label.length > 45) label = label.substring(0, 45) + '...';
            return (
              <option key={idx} value={idx}>
                {idx + 1}. {label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Contenido del paso */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900">{step.instruction}</h3>
        
        {step.explanation && (
          <div className="prose prose-primary max-w-none mb-6 text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.explanation}</ReactMarkdown>
          </div>
        )}

        {step.codeSnippet && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2 overflow-x-auto shadow-xs">
            <pre className="text-slate-800 font-mono text-sm leading-relaxed">
              <code>{step.codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} className="mr-2" /> Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente <ChevronRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Stepper;
