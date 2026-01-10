import React, { useState, useContext, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Calendar as CalIcon, BookOpen, Layers, X, Check, Plus, Trash2, Trophy } from 'lucide-react';
// Importamos o contexto do App para pegar as matérias salvas
import { FocusContext } from '../context/FocusContext';

// Hook simples para persistir o cronograma no LocalStorage
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) { return defaultValue; }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function CalendarTab() {
  const { subjects } = useContext(FocusContext); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estado do Cronograma Semanal (Seg-Sex)
  const [schedule, setSchedule] = useStickyState({}, 'my_study_schedule');

  // Estado do Ciclo de Simulados (Finais de Semana)
  // Formato: [{ id: 1, name: "ETEC", color: "#ff0000" }, ...]
  const [examCycle, setExamCycle] = useStickyState([], 'my_exam_cycle');

  // Estados temporários para adicionar novo simulado no modal
  const [newExamName, setNewExamName] = useState('');
  const [newExamColor, setNewExamColor] = useState('#4d4dff');

  // --- LÓGICA DE DATA ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- LÓGICA DE VISUALIZAÇÃO ---
  
  // Função para descobrir qual Simulado é o da vez baseado na data
  const getExamForDate = (dateObj) => {
    if (!examCycle || examCycle.length === 0) return null;
    
    const oneDay = 24 * 60 * 60 * 1000;
    const currentDay = dateObj.getDay(); 
    
    // Clona a data para não alterar a original
    let calcDate = new Date(dateObj.getTime());
    
    // Se for Domingo (0), volta 1 dia para alinhar com o Sábado da mesma "janela" de fim de semana
    if (currentDay === 0) {
        calcDate = new Date(calcDate.getTime() - oneDay);
    }

    const oneWeekMs = oneDay * 7;
    const absoluteWeekIndex = Math.floor(calcDate.getTime() / oneWeekMs);
    const cycleIndex = absoluteWeekIndex % examCycle.length;
    
    const exam = examCycle[cycleIndex];
    if (!exam) return null;

    return {
        id: `exam-${exam.id}`,
        name: `Simulado: ${exam.name}`,
        color: exam.color,
        goalHours: '4h', // Meta padrão para prova
        isExam: true
    };
  };

  const getSubjectsForDay = (dateObj) => {
    const dayIndex = dateObj.getDay();

    // Se for Final de Semana (0 = Domingo, 6 = Sábado)
    if (dayIndex === 0 || dayIndex === 6) {
        const exam = getExamForDate(dateObj);
        return exam ? [exam] : [];
    }

    // Se for Dia de Semana (Rotina normal)
    const daySchedule = schedule[dayIndex];
    if (!daySchedule) return [];

    const mainSub = subjects.find(s => s.id == daySchedule.main);
    const secSub = subjects.find(s => s.id == daySchedule.sec);
    
    return [mainSub, secSub].filter(Boolean);
  };

  const selectedSubjects = getSubjectsForDay(selectedDate);
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  // Handlers para o Modal de Configuração
  const handleAddExam = () => {
    if (!newExamName.trim()) return;
    const newExam = {
        id: Date.now(),
        name: newExamName,
        color: newExamColor
    };
    setExamCycle([...examCycle, newExam]);
    setNewExamName('');
  };

  const handleRemoveExam = (id) => {
    setExamCycle(examCycle.filter(e => e.id !== id));
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn pb-24 md:pb-0 gap-6">
      
      {/* HEADER ADICIONADO (Mantém harmonia com as outras páginas) */}
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Calendário Acadêmico</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* --- COLUNA 1: CALENDÁRIO --- */}
        <div className="flex-1 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm dark:shadow-lg h-fit transition-colors">
            
            {/* Header Calendário */}
            <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3 transition-colors">
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl text-primary-light">
                    <CalIcon size={20} />
                </div>
                {MONTHS[month]} <span className="text-zinc-400 dark:text-zinc-500">{year}</span>
            </h2>
            <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800"><ChevronLeft size={18}/></button>
                <button onClick={nextMonth} className="p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800"><ChevronRight size={18}/></button>
            </div>
            </div>

            {/* Grid Calendário */}
            <div className="grid grid-cols-7 mb-4 text-center">
            {['D','S','T','Q','Q','S','S'].map((d,i) => (
                <span key={i} className="text-xs font-bold text-zinc-400 dark:text-zinc-500 py-2 uppercase tracking-wider">{d}</span>
            ))}
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const daySubjects = getSubjectsForDay(date);
                const hasClass = daySubjects.length > 0;

                return (
                <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`
                    relative h-10 md:h-12 w-full rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${isSelected 
                        ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-105' 
                        : 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}
                    ${isToday && !isSelected ? 'border border-primary text-primary-light' : ''}
                    `}
                >
                    {day}
                    {/* Bolinhas indicadoras */}
                    {hasClass && !isSelected && (
                    <div className="absolute bottom-1.5 flex gap-1">
                        {daySubjects.map((s, idx) => (
                        <div key={idx} className="w-1 h-1 rounded-full shadow-[0_0_4px_currentColor]" style={{ backgroundColor: s.color }}></div>
                        ))}
                    </div>
                    )}
                </button>
                );
            })}
            </div>

            {/* Botão Configurar */}
            <button 
            onClick={() => setIsConfigOpen(true)}
            className="mt-8 w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary transition-all text-sm font-bold flex items-center justify-center gap-2 group"
            >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" /> Configurar Rotina
            </button>
        </div>

        {/* --- COLUNA 2: INFO DO DIA --- */}
        <div className="lg:w-96 flex flex-col gap-6">
            
            {/* Card Data Selecionada */}
            <div className="bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/30 dark:via-[#09090b] dark:to-[#09090b] border border-primary/20 dark:border-primary/30 p-6 rounded-3xl relative overflow-hidden shadow-sm dark:shadow-lg transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 dark:bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            <p className="text-primary-light text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-light animate-pulse"></span>
                {selectedDate.toDateString() === new Date().toDateString() ? 'Hoje' : 'Selecionado'}
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1 transition-colors">{DAYS[selectedDate.getDay()]}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium transition-colors">{selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</p>
            </div>

            {/* Lista de Matérias / Simulados */}
            <div className="flex-1 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm dark:shadow-lg flex flex-col min-h-[300px] transition-colors">
            <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center gap-2 text-lg transition-colors">
                <BookOpen size={20} className="text-primary"/> {isWeekend ? 'Simulado do Fim de Semana' : 'Plano do Dia'}
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {selectedSubjects.length > 0 ? (
                selectedSubjects.map((subject, index) => (
                    <div key={index} className="group p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: subject.color }}></div>
                    <div className="pl-2">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                                {subject.isExam ? 'Prova / Simulado' : (index === 0 ? 'Foco Principal' : 'Revisão / Secundário')}
                            </p>
                            {index === 0 && <span className="bg-primary/10 text-primary-light p-1 rounded-lg"><Check size={12}/></span>}
                        </div>
                        <p className="text-zinc-900 dark:text-white font-bold text-lg leading-tight mb-1 transition-colors">{subject.name}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                            {subject.isExam ? 'Duração Est.:' : 'Meta:'} <span className="text-zinc-700 dark:text-zinc-300">{subject.goalHours}</span> {subject.isExam ? '' : '/ semana'}
                        </p>
                    </div>
                    </div>
                ))
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                    {isWeekend ? (
                    <>
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-600 transition-colors">
                            <Trophy size={28} />
                        </div>
                        <p className="text-zinc-900 dark:text-white font-bold transition-colors">Sem simulado programado</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-4">Adicione simulados nas configurações para rotacionar aos finais de semana.</p>
                        <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light rounded-xl text-xs font-bold transition-colors">
                            Configurar Ciclo
                        </button>
                    </>
                    ) : (
                    <>
                        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4 text-zinc-400 dark:text-zinc-500 transition-colors">
                            <Layers size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-zinc-900 dark:text-zinc-300 font-medium transition-colors">Dia Livre</p>
                        <p className="text-sm text-zinc-500 mt-1 mb-4">Nenhuma matéria fixa definida.</p>
                        <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary-light rounded-xl text-xs font-bold transition-colors">
                            Configurar agora
                        </button>
                    </>
                    )}
                </div>
                )}
            </div>
            </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIGURAÇÃO --- */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setIsConfigOpen(false)}></div>
            
            <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] relative z-10 transition-colors">
            {/* Header Modal */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-[#09090b] rounded-t-3xl transition-colors">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Configurar Rotina</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Defina suas matérias e ciclo de simulados.</p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b] transition-colors">
                <div className="p-6 space-y-8">
                    
                    {/* SEÇÃO 1: SEMANA (SEG-SEX) */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Dias Úteis (Matérias Fixas)</h4>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((dayIdx) => (
                                <div key={dayIdx} className="bg-zinc-50 dark:bg-[#18181B] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <p className="text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wide transition-colors">{DAYS[dayIdx]}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Select Matéria 1 */}
                                    <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Principal</label>
                                    <select 
                                        className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                                        value={schedule[dayIdx]?.main || ''}
                                        onChange={(e) => setSchedule(prev => ({
                                        ...prev, 
                                        [dayIdx]: { ...prev[dayIdx], main: e.target.value }
                                        }))}
                                    >
                                        <option value="">Selecione...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    </div>

                                    {/* Select Matéria 2 */}
                                    <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Secundária</label>
                                    <select 
                                        className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                                        value={schedule[dayIdx]?.sec || ''}
                                        onChange={(e) => setSchedule(prev => ({
                                        ...prev, 
                                        [dayIdx]: { ...prev[dayIdx], sec: e.target.value }
                                        }))}
                                    >
                                        <option value="">(Livre)</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    </div>
                                </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEÇÃO 2: FIM DE SEMANA (CICLO) */}
                    <div>
                         <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex justify-between items-center">
                            <span>Finais de Semana (Ciclo de Simulados)</span>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md normal-case font-normal">Sábados e Domingos</span>
                        </h4>
                        
                        {/* Formulário de Adição */}
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Nome do Simulado (ex: ETEC)"
                                value={newExamName}
                                onChange={(e) => setNewExamName(e.target.value)}
                                className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors"
                            />
                            <div className="relative">
                                <input 
                                    type="color" 
                                    value={newExamColor}
                                    onChange={(e) => setNewExamColor(e.target.value)}
                                    className="w-10 h-full p-0 border-none bg-transparent absolute opacity-0 cursor-pointer"
                                />
                                <div 
                                    className="w-10 h-full rounded-xl border border-zinc-300 dark:border-zinc-700" 
                                    style={{ backgroundColor: newExamColor }}
                                ></div>
                            </div>
                            <button 
                                onClick={handleAddExam}
                                className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Lista de Simulados no Ciclo */}
                        <div className="space-y-2">
                            {examCycle.length === 0 && (
                                <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhum simulado no ciclo.</p>
                            )}
                            {examCycle.map((exam, idx) => (
                                <div key={exam.id} className="flex items-center justify-between bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-400 text-xs font-mono w-4">#{idx + 1}</span>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exam.color }}></div>
                                        <span className="text-zinc-900 dark:text-white font-medium text-sm">{exam.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveExam(exam.id)}
                                        className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2">
                            * O ciclo se repete automaticamente a cada fim de semana na ordem acima.
                        </p>
                    </div>

                </div>
            </div>

            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] rounded-b-3xl transition-colors">
              <button 
                onClick={() => setIsConfigOpen(false)} 
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Check size={18} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}