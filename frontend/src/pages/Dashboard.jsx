import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useContent';
import { BookOpen, TerminalSquare, GraduationCap, FileText, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { data: units, isLoading: loadingUnits } = useUnits();
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'examenes'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'teoria' | 'practico'
  const [examFilter, setExamFilter] = useState('all'); // 'all' | 'parciales' | 'laboratorios' | 'recuperatorios' | 'resumen'

  if (loadingUnits) return <div className="p-8 text-center text-gray-500">Cargando contenido...</div>;

  const planUnits = Array.isArray(units) ? units.filter(u => u.order < 100) : [];
  const examUnits = Array.isArray(units) ? units.filter(u => u.order >= 100 || (u.title && u.title.toLowerCase().includes('examen'))) : [];

  const allPlanLessons = planUnits.flatMap(u => u.lessons || []);
  const teoriaCount = allPlanLessons.filter(l => l.type === 'SUMMARY').length;
  const practicoCount = allPlanLessons.filter(l => l.type !== 'SUMMARY').length;

  const filteredPlanUnits = planUnits
    .map(unit => {
      const lessons = (unit.lessons || []).filter(lesson => {
        if (planFilter === 'teoria') return lesson.type === 'SUMMARY';
        if (planFilter === 'practico') return lesson.type !== 'SUMMARY';
        return true;
      });
      return { ...unit, lessons };
    })
    .filter(unit => planFilter === 'all' || unit.lessons.length > 0);

  const allExamLessons = examUnits.flatMap(u => u.lessons || []);
  const examParcialCount = allExamLessons.filter(l => {
    const t = l.title.toLowerCase();
    return !t.includes('resumen') && !t.includes('recuperatorio') && !t.includes('laboratorio') && !t.includes('actividades');
  }).length;
  const examLabCount = allExamLessons.filter(l => {
    const t = l.title.toLowerCase();
    return t.includes('laboratorio') || t.includes('actividades');
  }).length;
  const examRecupCount = allExamLessons.filter(l => l.title.toLowerCase().includes('recuperatorio')).length;
  const examSummaryCount = allExamLessons.filter(l => l.title.toLowerCase().includes('resumen')).length;

  const filteredExamUnits = examUnits
    .map(unit => {
      const lessons = (unit.lessons || []).filter(lesson => {
        const titleLower = lesson.title.toLowerCase();
        const isSummary = titleLower.includes('resumen');
        const isRecup = titleLower.includes('recuperatorio');
        const isLab = titleLower.includes('laboratorio') || titleLower.includes('actividades');
        const isParcial = !isSummary && !isRecup && !isLab;

        if (examFilter === 'parciales') return isParcial;
        if (examFilter === 'laboratorios') return isLab;
        if (examFilter === 'recuperatorios') return isRecup;
        if (examFilter === 'resumen') return isSummary;
        return true;
      });
      return { ...unit, lessons };
    })
    .filter(unit => examFilter === 'all' || unit.lessons.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 flex items-center tracking-tight">
            TutorSO <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 hidden sm:inline-block">Sistemas Operativos UNS</span>
          </h1>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles size={13} className="mr-1.5 text-blue-600" /> Cátedra UNS 2026
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Selector de Pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-lg shadow-sm px-2 pt-2">
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center transition-all ${
              activeTab === 'plan'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-md'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen size={18} className="mr-2" />
            Plan de Estudio
          </button>
          <button
            onClick={() => setActiveTab('examenes')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center transition-all ${
              activeTab === 'examenes'
                ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-md'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap size={18} className="mr-2" />
            Exámenes
          </button>
        </div>

        {/* CONTENIDO PESTAÑA: PLAN DE ESTUDIO */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Unidades y Material de Estudio</h2>

              {/* Filtro por Teoría / Práctico */}
              <div className="inline-flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPlanFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    planFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Todos ({allPlanLessons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter('teoria')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                    planFilter === 'teoria'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen size={13} className="mr-1.5" />
                  Teoría ({teoriaCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter('practico')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                    planFilter === 'practico'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <TerminalSquare size={13} className="mr-1.5" />
                  Práctico ({practicoCount})
                </button>
              </div>
            </div>
            
            {filteredPlanUnits.map((unit) => (
              <div key={unit.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">
                    {unit.order < 99 ? `${unit.order}. ` : ''}{unit.title}
                  </h3>
                  {unit.description && <p className="text-sm text-gray-500 mt-1">{unit.description}</p>}
                </div>
                
                <div className="divide-y divide-gray-50">
                  {unit.lessons?.map((lesson) => {
                    return (
                      <Link 
                        key={lesson.id} 
                        to={`/lesson/${lesson.id}`}
                        className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="mr-4 p-2 rounded-lg bg-blue-50 text-blue-600">
                          {lesson.type === 'SUMMARY' ? (
                            <BookOpen size={20} />
                          ) : (
                            <TerminalSquare size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <div className="flex items-center mt-1.5 space-x-2">
                            {lesson.type === 'SUMMARY' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                <BookOpen size={12} className="mr-1.5" /> Teoría
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                <TerminalSquare size={12} className="mr-1.5" /> Trabajo Práctico
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary-600 hover:translate-x-1 transition-transform hidden sm:block">
                          Ver clase →
                        </div>
                      </Link>
                    );
                  })}
                  {(!unit.lessons || unit.lessons.length === 0) && (
                    <div className="px-6 py-4 text-sm text-gray-500 italic">No hay clases en esta unidad aún.</div>
                  )}
                </div>
              </div>
            ))}

            {filteredPlanUnits.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">
                  {planFilter === 'all'
                    ? 'Aún no hay unidades publicadas.'
                    : `No se encontraron clases de tipo ${planFilter === 'teoria' ? 'Teoría' : 'Práctico'}.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA: EXÁMENES */}
        {activeTab === 'examenes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">Parciales y Evaluaciones</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Exámenes oficiales de la cátedra con sus enunciados completos y resolución analítica explicada paso a paso.
                </p>
              </div>

              {/* Filtro de Exámenes */}
              <div className="inline-flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-xs flex-wrap gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setExamFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    examFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Todos ({allExamLessons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExamFilter('parciales')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                    examFilter === 'parciales'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <GraduationCap size={13} className="mr-1.5" />
                  Parciales ({examParcialCount})
                </button>
                <button
                  type="button"
                  onClick={() => setExamFilter('laboratorios')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                    examFilter === 'laboratorios'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <TerminalSquare size={13} className="mr-1.5" />
                  Laboratorios ({examLabCount})
                </button>
                {examRecupCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExamFilter('recuperatorios')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                      examFilter === 'recuperatorios'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <FileText size={13} className="mr-1.5" />
                    Recuperatorios ({examRecupCount})
                  </button>
                )}
                {examSummaryCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExamFilter('resumen')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                      examFilter === 'resumen'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <FileText size={13} className="mr-1.5" />
                    Guía Resumen ({examSummaryCount})
                  </button>
                )}
              </div>
            </div>

            {filteredExamUnits.map((unit) => (
              <div key={unit.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {unit.lessons?.map((lesson) => {
                    const titleLower = lesson.title.toLowerCase();
                    const isSummary = titleLower.includes('resumen');
                    const isRecup = titleLower.includes('recuperatorio');
                    const isLab = titleLower.includes('laboratorio') || titleLower.includes('actividades');

                    return (
                      <Link 
                        key={lesson.id} 
                        to={`/lesson/${lesson.id}`}
                        className={`flex items-center px-6 py-5 transition-colors group ${
                          isSummary 
                            ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 hover:bg-blue-100/60 border-l-4 border-l-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="mr-4 p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          {isSummary ? (
                            <FileText size={22} />
                          ) : isLab ? (
                            <TerminalSquare size={22} />
                          ) : (
                            <GraduationCap size={22} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-base flex items-center gap-2">
                            {lesson.title}
                            {isSummary && (
                              <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md hidden sm:inline">
                                🖨️ Formato Imprimible
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center mt-2 space-x-2">
                            {isSummary ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                                📋 Guía Teórico-Práctica Completa
                              </span>
                            ) : isRecup ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                <FileText size={12} className="mr-1.5" /> Examen Recuperatorio
                              </span>
                            ) : isLab ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <TerminalSquare size={12} className="mr-1.5" /> Laboratorio
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                                <GraduationCap size={12} className="mr-1.5" /> Examen Parcial
                              </span>
                            )}
                            {!isSummary && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <TerminalSquare size={12} className="mr-1.5" /> Resolución Paso a Paso
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform hidden sm:block">
                          {isSummary ? 'Abrir Resumen →' : 'Ver Resolución →'}
                        </div>
                      </Link>
                    );
                  })}
                  {(!unit.lessons || unit.lessons.length === 0) && (
                    <div className="px-6 py-8 text-center text-gray-500 italic">
                      No hay exámenes con el filtro seleccionado.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredExamUnits.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No se encontraron evaluaciones con el filtro seleccionado.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
