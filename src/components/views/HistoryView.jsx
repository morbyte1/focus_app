import React, { useState, useContext, useMemo } from 'react';
import { History, Clock, CheckSquare, AlertTriangle, Trash2, ChevronDown } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

export const HistoryView = () => {
  const { sessions, subjects, deleteDayHistory } = useContext(FocusContext);
  const [openDates, setOpenDates] = useState({});

  const history = useMemo(() => {
    const grp = {};
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(s => {
      const d = new Date(s.date).toDateString();
      if (!grp[d]) grp[d] = [];
      grp[d].push(s);
    });
    return Object.entries(grp);
  }, [sessions]);

  const toggleDate = (date) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const getDaySummary = (items) => {
    const mins = items.reduce((a, b) => a + b.minutes, 0);
    const q = items.reduce((a, b) => a + (b.questions || 0), 0);
    const e = items.reduce((a, b) => a + (b.errors || 0), 0);
    return { mins, q, e };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Histórico</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Clique nos dias para ver os detalhes.</p>
      </header>
      
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-10 opacity-50">
             <History size={40} className="mx-auto mb-2 text-zinc-500" />
             <p className="text-zinc-500">Nenhum histórico registrado ainda.</p>
          </div>
        ) : (
          history.map(([date, items]) => {
            const isOpen = openDates[date];
            const summary = getDaySummary(items);
            
            return (
              <Card key={date} className="transition-all duration-300">
                <div onClick={() => toggleDate(date)} className="flex justify-between items-center cursor-pointer select-none group">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white capitalize text-lg group-hover:text-primary-light transition-colors">
                      {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12}/> {summary.mins} min</span>
                      {summary.q > 0 && <span className="flex items-center gap-1 text-blue-500/70"><CheckSquare size={12}/> {summary.q}</span>}
                      {summary.e > 0 && <span className="flex items-center gap-1 text-red-500/70"><AlertTriangle size={12}/> {summary.e}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); deleteDayHistory(date); }} className="p-2 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors" title="Apagar dia inteiro">
                      <Trash2 size={16} />
                    </button>
                    <div className={`p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} className="text-zinc-400" />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 space-y-3 animate-fadeIn border-t border-zinc-200 dark:border-zinc-800/50 pt-4">
                    {items.map(s => {
                      
                      // ✅ CORREÇÃO BUG 2: Fallback limpo para a pseudo-matéria de Idiomas
                      const subject = s.subjectId === 999999 
                        ? { name: 'Prática de Idioma', color: '#3b82f6' } 
                        : subjects.find(sub => sub.id === s.subjectId);

                      return (
                        <div key={s.id} className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: subject?.color || '#555', backgroundColor: subject?.color || '#555' }}></div>
                              <span className="text-zinc-700 dark:text-zinc-200 font-medium">
                                {subject?.name || 'Matéria Excluída'}
                                {s.topic && ` - ${s.topic}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm bg-black/5 dark:bg-black/20 p-2 rounded-xl sm:bg-transparent sm:p-0 self-start sm:self-auto">
                               <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300" title="Tempo Focado">
                                  <Clock size={14} className="text-zinc-500"/>
                                  <span>{s.minutes} min</span>
                                </div>
                               <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800"></div>
                               <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400" title="Questões Realizadas">
                                  <CheckSquare size={14} />
                                  <span className="font-bold">{s.questions || 0}</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400" title="Erros">
                                  <AlertTriangle size={14} />
                                  <span className="font-bold">{s.errors || 0}</span>
                               </div>
                            </div>
                          </div>
                          
                          {s.notes && (
                            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50 w-full">
                              <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Diário da Sessão</p>
                              <div className="text-sm text-zinc-600 dark:text-zinc-300 italic whitespace-pre-wrap leading-relaxed">"{s.notes}"</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};