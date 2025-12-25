import React, { useState, useContext, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Calendar as CalIcon, BookOpen, Layers } from 'lucide-react';
// Importamos o contexto do App para pegar as matérias salvas
import { FocusContext } from '../App'; 

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
  const { subjects } = useContext(FocusContext); // Pega matérias do App
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estado do Cronograma: { "1": { main: id, sec: id }, "2": ... } (1 = Segunda)
  const [schedule, setSchedule] = useStickyState({}, 'my_study_schedule');

  // --- LÓGICA DE DATA ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- LÓGICA DE VISUALIZAÇÃO ---
  // Pega as matérias de um dia específico (baseado no dia da semana 0-6)
  const getSubjectsForDay = (dateObj) => {
    const dayIndex = dateObj.getDay();
    const daySchedule = schedule[dayIndex];
    if (!daySchedule) return [];

    const mainSub = subjects.find(s => s.id == daySchedule.main);
    const secSub = subjects.find(s => s.id == daySchedule.sec);
    
    return [mainSub, secSub].filter(Boolean);
  };

  // Matérias do dia SELECIONADO no calendário (ou hoje)
  const selectedSubjects = getSubjectsForDay(selectedDate);
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fadeIn text-gray-100">
      
      {/* --- COLUNA 1: CALENDÁRIO COMPACTO --- */}
      <div className="flex-1 bg-[#18181B] border border-gray-800 rounded-2xl p-6 shadow-xl h-fit">
        
        {/* Header Calendário */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalIcon size={20} className="text-violet-500"/> 
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><ChevronLeft size={18}/></button>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><ChevronRight size={18}/></button>
          </div>
        </div>

        {/* Grid Calendário */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['D','S','T','Q','Q','S','S'].map((d,i) => (
            <span key={i} className="text-xs font-bold text-zinc-500 py-2">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
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
                  relative h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'hover:bg-zinc-800 text-zinc-300'}
                  ${isToday && !isSelected ? 'border border-violet-500 text-violet-400' : ''}
                `}
              >
                {day}
                {/* Bolinhas indicadoras de matéria */}
                {hasClass && !isSelected && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {daySubjects.map((s, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }}></div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Botão para Configurar Cronograma */}
        <button 
          onClick={() => setIsConfigOpen(true)}
          className="mt-6 w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800/50 hover:border-violet-500 transition-all text-sm flex items-center justify-center gap-2"
        >
          <Settings size={16} /> Configurar Cronograma Semanal
        </button>
      </div>

      {/* --- COLUNA 2: INFO DO DIA --- */}
      <div className="lg:w-80 flex flex-col gap-4">
        
        {/* Card Data Selecionada */}
        <div className="bg-gradient-to-br from-violet-900/20 to-[#18181B] border border-violet-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CalIcon size={100} /></div>
          <p className="text-violet-400 text-sm font-bold uppercase tracking-wider mb-1">
            {selectedDate.toDateString() === new Date().toDateString() ? 'Hoje' : 'Visualizando'}
          </p>
          <h2 className="text-3xl font-bold text-white">{DAYS[selectedDate.getDay()]}</h2>
          <p className="text-gray-400 text-lg">{selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}</p>
        </div>

        {/* Lista de Matérias do Dia */}
        <div className="flex-1 bg-[#18181B] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-gray-200 font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-violet-500"/> Matérias do Dia
          </h3>

          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {selectedSubjects.length > 0 ? (
              selectedSubjects.map((subject, index) => (
                <div key={index} className="group p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: subject.color }}></div>
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-1">
                    {index === 0 ? 'Matéria Principal' : 'Segunda Matéria'}
                  </p>
                  <p className="text-white font-medium text-lg">{subject.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">Meta: {subject.goalHours}h semanais</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
                {isWeekend ? (
                  <>
                    <CalendarHeartIcon />
                    <p className="mt-3 text-sm">Fim de semana! Aproveite para descansar ou revisar.</p>
                  </>
                ) : (
                  <>
                    <Layers size={32} className="mb-2"/>
                    <p className="text-sm">Nada agendado para este dia.</p>
                    <button onClick={() => setIsConfigOpen(true)} className="text-xs text-violet-400 underline mt-2">Configurar agora</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIGURAÇÃO --- */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#18181B] border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Cronograma Semanal</h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-sm text-zinc-400 mb-4">Defina suas matérias fixas de Segunda a Sexta. O calendário atualizará automaticamente.</p>
              
              {/* Loop pelos dias da semana (Segunda=1 a Sexta=5) */}
              {[1, 2, 3, 4, 5].map((dayIdx) => (
                <div key={dayIdx} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <p className="text-violet-400 font-bold text-sm mb-3 uppercase tracking-wider">{DAYS[dayIdx]}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Select Matéria 1 */}
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold">Principal</label>
                      <select 
                        className="w-full mt-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white outline-none focus:border-violet-500"
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
                      <label className="text-[10px] text-zinc-500 uppercase font-bold">Secundária</label>
                      <select 
                        className="w-full mt-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white outline-none focus:border-violet-500"
                        value={schedule[dayIdx]?.sec || ''}
                        onChange={(e) => setSchedule(prev => ({
                          ...prev, 
                          [dayIdx]: { ...prev[dayIdx], sec: e.target.value }
                        }))}
                      >
                        <option value="">(Opcional)</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setIsConfigOpen(false)} 
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Salvar Cronograma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ícone decorativo simples
const CalendarHeartIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
  </svg>
);