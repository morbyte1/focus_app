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

    // Lógica Matemática:
    // 1. Pegamos o timestamp da data
    // 2. Se for Domingo, subtraímos 1 dia para que ele caia na mesma semana matemática do Sábado anterior.
    // 3. Dividimos por 7 dias em milissegundos para obter o "índice da semana absoluta".
    // 4. Usamos o operador % (resto) pelo tamanho do array de simulados para fazer o ciclo.
    
    const oneDay = 24 * 60 * 60 * 1000;
    const currentDay = dateObj.getDay(); // 0 = Dom, 6 = Sab
    
    // Clona a data para não alterar a original
    let calcDate = new Date(dateObj.getTime());
    
    // Se for Domingo (0), volta 1 dia para alinhar com o Sábado da mesma "janela" de fim de semana
    if (currentDay === 0) {
        calcDate = new Date(calcDate.getTime() - oneDay);
    }

    // Definimos uma data base fixa (Epoch) e calculamos quantas semanas se passaram
    const oneWeekMs = oneDay * 7;
    // Ajuste fino: floor para pegar o inteiro da semana
    const absoluteWeekIndex = Math.floor(calcDate.getTime() / oneWeekMs);
    
    // O ciclo
    const cycleIndex = absoluteWeekIndex % examCycle.length;
    
    // Retorna o simulado formatado como se fosse uma matéria para o layout funcionar
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
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fadeIn pb-24 md:pb-0">
      
      {/* --- COLUNA 1: CALENDÁRIO --- */}
      <div className="flex-1 bg-[#09090b] border border-white/5 rounded-3xl p-6 shadow-lg h-fit">
        
        {/* Header Calendário */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-[#1100ab]/20 rounded-xl text-[#4d4dff]">
                <CalIcon size={20} />
            </div>
            {MONTHS[month]} <span className="text-zinc-500">{year}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"><ChevronLeft size={18}/></button>
            <button onClick={nextMonth} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* Grid Calendário */}
        <div className="grid grid-cols-7 mb-4 text-center">
          {['D','S','T','Q','Q','S','S'].map((d,i) => (
            <span key={i} className="text-xs font-bold text-zinc-500 py-2 uppercase tracking-wider">{d}</span>
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
                    ? 'bg-[#1100ab] text-white shadow-lg shadow-[#1100ab]/40 scale-105' 
                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-white bg-transparent'}
                  ${isToday && !isSelected ? 'border border-[#1100ab] text-[#4d4dff]' : ''}
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
          className="mt-8 w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-dashed border-zinc-700 hover:border-[#1100ab] transition-all text-sm font-bold flex items-center justify-center gap-2 group"
        >
          <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" /> Configurar Rotina
        </button>
      </div>

      {/* --- COLUNA 2: INFO DO DIA --- */}
      <div className="lg:w-96 flex flex-col gap-6">
        
        {/* Card Data Selecionada */}
        <div className="bg-gradient-to-br from-[#1100ab]/30 via-[#09090b] to-[#09090b] border border-[#1100ab]/30 p-6 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1100ab]/20 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-[#4d4dff] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4d4dff] animate-pulse"></span>
            {selectedDate.toDateString() === new Date().toDateString() ? 'Hoje' : 'Selecionado'}
          </p>
          <h2 className="text-3xl font-bold text-white mb-1">{DAYS[selectedDate.getDay()]}</h2>
          <p className="text-zinc-400 font-medium">{selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</p>
        </div>

        {/* Lista de Matérias / Simulados */}
        <div className="flex-1 bg-[#09090b] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
            <BookOpen size={20} className="text-[#1100ab]"/> {isWeekend ? 'Simulado do Fim de Semana' : 'Plano do Dia'}
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {selectedSubjects.length > 0 ? (
              selectedSubjects.map((subject, index) => (
                <div key={index} className="group p-4 rounded-2xl bg-[#18181B] border border-zinc-800 hover:border-[#1100ab]/50 transition-all relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: subject.color }}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                            {subject.isExam ? 'Prova / Simulado' : (index === 0 ? 'Foco Principal' : 'Revisão / Secundário')}
                        </p>
                        {index === 0 && <span className="bg-[#1100ab]/10 text-[#4d4dff] p-1 rounded-lg"><Check size={12}/></span>}
                    </div>
                    <p className="text-white font-bold text-lg leading-tight mb-1">{subject.name}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        {subject.isExam ? 'Duração Est.:' : 'Meta:'} <span className="text-zinc-300">{subject.goalHours}</span> {subject.isExam ? '' : '/ semana'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                {isWeekend ? (
                  <>
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                        <Trophy size={28} />
                    </div>
                    <p className="text-white font-bold">Sem simulado programado</p>
                    <p className="text-sm text-zinc-400 mt-1 mb-4">Adicione simulados nas configurações para rotacionar aos finais de semana.</p>
                    <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-[#1100ab]/10 hover:bg-[#1100ab]/20 text-[#4d4dff] rounded-xl text-xs font-bold transition-colors">
                        Configurar Ciclo
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-zinc-900 p-4 rounded-full mb-4 text-zinc-500">
                        <Layers size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-zinc-300 font-medium">Dia Livre</p>
                    <p className="text-sm text-zinc-500 mt-1 mb-4">Nenhuma matéria fixa definida.</p>
                    <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-[#1100ab]/10 hover:bg-[#1100ab]/20 text-[#4d4dff] rounded-xl text-xs font-bold transition-colors">
                        Configurar agora
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIGURAÇÃO --- */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setIsConfigOpen(false)}></div>
            
            <div className="bg-[#09090b] border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] relative z-10">
            {/* Header Modal */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b] rounded-t-3xl">
              <div>
                <h3 className="text-xl font-bold text-white">Configurar Rotina</h3>
                <p className="text-xs text-zinc-400 mt-1">Defina suas matérias e ciclo de simulados.</p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
                <div className="p-6 space-y-8">
                    
                    {/* SEÇÃO 1: SEMANA (SEG-SEX) */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Dias Úteis (Matérias Fixas)</h4>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((dayIdx) => (
                                <div key={dayIdx} className="bg-[#18181B] p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1100ab]"></div>
                                    <p className="text-white font-bold text-sm uppercase tracking-wide">{DAYS[dayIdx]}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Select Matéria 1 */}
                                    <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Principal</label>
                                    <select 
                                        className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm text-white outline-none focus:border-[#1100ab] transition-colors appearance-none cursor-pointer"
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
                                        className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm text-white outline-none focus:border-[#1100ab] transition-colors appearance-none cursor-pointer"
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
                         <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex justify-between items-center">
                            <span>Finais de Semana (Ciclo de Simulados)</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md normal-case font-normal">Sábados e Domingos</span>
                        </h4>
                        
                        {/* Formulário de Adição */}
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="Nome do Simulado (ex: ETEC)"
                                value={newExamName}
                                onChange={(e) => setNewExamName(e.target.value)}
                                className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#1100ab] transition-colors"
                            />
                            <div className="relative">
                                <input 
                                    type="color" 
                                    value={newExamColor}
                                    onChange={(e) => setNewExamColor(e.target.value)}
                                    className="w-10 h-full p-0 border-none bg-transparent absolute opacity-0 cursor-pointer"
                                />
                                <div 
                                    className="w-10 h-full rounded-xl border border-zinc-700" 
                                    style={{ backgroundColor: newExamColor }}
                                ></div>
                            </div>
                            <button 
                                onClick={handleAddExam}
                                className="bg-[#1100ab] hover:bg-[#0c007a] text-white p-2.5 rounded-xl transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Lista de Simulados no Ciclo */}
                        <div className="space-y-2">
                            {examCycle.length === 0 && (
                                <p className="text-zinc-600 text-sm text-center py-4 italic">Nenhum simulado no ciclo.</p>
                            )}
                            {examCycle.map((exam, idx) => (
                                <div key={exam.id} className="flex items-center justify-between bg-[#18181B] border border-zinc-800 p-3 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 text-xs font-mono w-4">#{idx + 1}</span>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exam.color }}></div>
                                        <span className="text-white font-medium text-sm">{exam.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveExam(exam.id)}
                                        className="text-zinc-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
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

            <div className="p-5 border-t border-zinc-800 bg-[#09090b] rounded-b-3xl">
              <button 
                onClick={() => setIsConfigOpen(false)} 
                className="w-full py-3.5 bg-[#1100ab] hover:bg-[#0c007a] text-white rounded-2xl font-bold shadow-lg shadow-[#1100ab]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
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

// Ícone decorativo simples mantido
const CalendarHeartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
  </svg>
);