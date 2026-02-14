import React, { useState, useContext, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Trash2, Zap, Target } from 'lucide-react';
import { FocusContext, formatTime } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Helper para formatar horas e minutos
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const FocusView = () => {
  const { 
    timerType, setTimerType, 
    subjects, selectedSubjectId, setSelectedSubjectId, 
    timerMode, setTimerMode, 
    timeLeft, setTimeLeft, 
    isActive, setIsActive, 
    cycles, setCycles, 
    tasks, addTask, toggleTask, deleteTask, addSubTask, toggleSubTask, deleteSubTask, deleteAllTasks,
    addSession, elapsedTime, setElapsedTime, 
    themes,
    timerConfig, setTimerConfig,
    resetTimer
  } = useContext(FocusContext);

  const [taskT, setTaskT] = useState(""); 
  const [finMod, setFinMod] = useState(false); 
  const [manMod, setManMod] = useState(false);
  const [fForm, setFForm] = useState({ n: "", q: "", e: "" }); 
  const [mForm, setMForm] = useState({ t: "", n: "", s: "", q: "", e: "", topic: "" });
  
  const [selectedTopic, setSelectedTopic] = useState("");

  // --- Classes Padronizadas (UI Minimalista) ---
  const inputClasses = "w-full bg-zinc-50 dark:bg-zinc-900/50 text-sm font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 outline-none focus:border-primary transition-all cursor-pointer h-10";

  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    return themes
      .filter(t => t.subjectId === selectedSubjectId)
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [selectedSubjectId, themes]);

  const manualAvailableTopics = useMemo(() => {
    if (!mForm.s) return [];
    const sId = Number(mForm.s);
    return themes
      .filter(t => t.subjectId === sId)
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [mForm.s, themes]);

  const handleWorkTimeChange = (work) => {
    const short = work === 50 ? 10 : 6;
    setTimerConfig({ work, short });
    if (timerType === 'POMODORO' && timerMode === 'WORK') {
      setIsActive(false);
      setTimeLeft(work * 60);
      setElapsedTime(0);
    }
  };

  const finish = (e) => { 
      e.preventDefault(); 
      const mins = Math.round(elapsedTime / 60); 
      if (mins > 0) { 
          addSession(mins, fForm.n, null, fForm.q, fForm.e, selectedTopic); 
          triggerCelebration(); 
      }
      resetTimer();
      setFinMod(false); 
      setFForm({ n: "", q: "", e: "" }); 
      setSelectedTopic(""); 
  };
  
  const manual = (e) => { 
      e.preventDefault(); 
      if (!mForm.t || !mForm.s) return alert("Preencha tempo e matéria."); 
      const tValid = Math.max(1, parseInt(mForm.t) || 0);
      addSession(tValid, mForm.n, mForm.s, mForm.q, mForm.e, mForm.topic); 
      setMForm({ t: "", n: "", s: "", q: "", e: "", topic: "" }); 
      setManMod(false); 
      triggerCelebration();
  };

  const handleCreateTask = (e) => {
      e.preventDefault();
      if (!selectedTopic) return alert("Selecione um tópico.");
      if (taskT && selectedSubjectId) { 
          addTask(taskT, selectedSubjectId, selectedTopic); 
          setTaskT(""); 
      }
  };

  const handleFlowBreak = () => {
    const breakTime = Math.floor(timeLeft * 0.2);
    setTimerMode('BREAK');
    setTimeLeft(breakTime);
    setCycles(prev => prev + 1);
    setIsActive(true);
  };

  if (!subjects.length) return <div className="flex h-full items-center justify-center text-zinc-400">Adicione matérias primeiro.</div>;
  
  const filteredTasks = tasks.filter(t => t.subjectId === selectedSubjectId && t.topic === selectedTopic);

  return (
    <div className="flex flex-col xl:flex-row h-full gap-6 animate-fadeIn pb-24 md:pb-6 max-w-7xl mx-auto w-full">
      
      {/* --- COLUNA PRINCIPAL: TIMER --- */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-h-[450px] overflow-hidden shadow-sm">
            
            {/* Seletor de Tipo (Pomodoro/Flow) */}
            <div className="z-10 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full flex gap-1 mb-8 border border-zinc-200 dark:border-zinc-700">
                {['POMODORO', 'FLOW'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => { setIsActive(false); setTimerType(type); setTimeLeft(type === 'FLOW' ? 0 : timerConfig.work * 60); setTimerMode('WORK'); setCycles(0); setElapsedTime(0); }}
                        className={`px-6 py-1.5 rounded-full text-[11px] font-bold transition-all ${timerType === type ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Display Principal */}
            <div className="z-10 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    Total da sessão: {formatDuration(elapsedTime)}
                </p>

                <div className="text-7xl sm:text-8xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter tabular-nums font-mono">
                    {formatTime(timeLeft)}
                </div>

                <div className="mt-4 flex justify-center items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 ${timerMode === 'WORK' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'}`}>
                        {timerMode === 'WORK' ? <Zap size={12}/> : <Coffee size={12}/>}
                        {timerMode === 'WORK' ? 'Foco' : 'Pausa'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Ciclo #{cycles + 1}</span>
                </div>
            </div>

            {/* Configuração Rápida (Pomodoro) */}
            {timerType === 'POMODORO' && !isActive && (
                 <div className="z-10 mt-8 flex gap-2">
                    {[30, 50].map(mins => (
                        <button key={mins} onClick={() => handleWorkTimeChange(mins)} className={`px-4 py-1 rounded-xl text-xs font-bold border transition-all ${timerConfig.work === mins ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-primary'}`}>
                            {mins} min
                        </button>
                    ))}
                 </div>
            )}
        </div>

        {/* Barra de Controlo */}
        <div className="grid grid-cols-4 gap-4">
             <button 
                onClick={() => setIsActive(!isActive)} 
                className={`col-span-2 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-base transition-all ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700' : 'bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20'}`}
            >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                {isActive ? 'Pausar' : 'Iniciar'}
             </button>

             {timerType === 'FLOW' && timerMode === 'WORK' ? (
                 <button 
                    onClick={handleFlowBreak}
                    className="col-span-1 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 flex items-center justify-center transition-colors"
                 >
                     <Coffee size={22} />
                 </button>
             ) : (
                <button 
                    onClick={() => { setIsActive(false); setTimeLeft(timerType === 'FLOW' ? 0 : (timerMode === 'WORK' ? timerConfig.work * 60 : timerConfig.short * 60)); }} 
                    className="col-span-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
             )}

             <button 
                onClick={() => { setIsActive(false); setFinMod(true); }} 
                className="col-span-1 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center transition-colors shadow-md"
             >
                 <CheckCircle size={22} />
             </button>
        </div>

        <div className="flex justify-center">
             <button onClick={() => { setMForm({ ...mForm, s: subjects[0]?.id }); setManMod(true); }} className="text-[10px] font-bold text-zinc-400 hover:text-primary uppercase tracking-widest transition-colors">
                Lançamento Manual
             </button>
        </div>
      </div>

      {/* --- COLUNA LATERAL: TAREFAS & CONTEXTO --- */}
      <div className="w-full xl:w-80 flex flex-col gap-6">
         {/* Seletor de Matéria e Tópico */}
         <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-wider">Matéria</label>
                <select 
                    disabled={isActive} 
                    value={selectedSubjectId || ''} 
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))} 
                    className={inputClasses}
                >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-wider">Tópico</label>
                <select 
                    disabled={isActive || !selectedSubjectId} 
                    value={selectedTopic} 
                    onChange={(e) => setSelectedTopic(e.target.value)} 
                    className={inputClasses}
                >
                    <option value="">{availableTopics.length === 0 ? "Sem tópicos" : "Escolha um tópico..."}</option>
                    {availableTopics.map((topic, idx) => (
                        <option key={idx} value={topic}>{topic}</option>
                    ))}
                </select>
            </div>
         </div>

         {/* Lista de Tarefas */}
         <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
             <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                 <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Tarefas</h3>
                 <button onClick={() => window.confirm("Limpar tarefas?") && deleteAllTasks()} className="text-zinc-400 hover:text-red-500 transition-colors">
                     <Trash2 size={14} />
                 </button>
             </div>

             <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                <form onSubmit={handleCreateTask} className="flex gap-2">
                    <input 
                        placeholder="Nova tarefa..." 
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary disabled:opacity-50" 
                        value={taskT} 
                        onChange={e => setTaskT(e.target.value)} 
                        disabled={!selectedTopic}
                    />
                    <button type="submit" disabled={!selectedTopic} className="bg-primary text-white rounded-xl px-2.5 transition-colors disabled:opacity-50">
                        <Plus size={16} />
                    </button>
                </form>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {filteredTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <CheckCircle size={20} className="mb-1" />
                        <p className="text-[10px] font-bold uppercase">Vazio</p>
                    </div>
                )}
                {filteredTasks.map(t => (
                    <div key={t.id} className="animate-fadeIn">
                        <div className={`group flex items-start gap-2.5 p-2 rounded-xl border transition-all ${t.completed ? 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                            <button onClick={() => toggleTask(t.id)} className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${t.completed ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                {t.completed && <CheckCircle size={10} className="text-white" />}
                            </button>
                            <span className={`text-xs flex-1 leading-tight ${t.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                {t.text}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addSubTask(t.id, window.prompt("Sub-tarefa:"))} className="text-zinc-400 hover:text-primary"><Plus size={12}/></button>
                                <button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={12}/></button>
                            </div>
                        </div>
                        
                        {/* Subtarefas (Preservadas) */}
                        {t.subTasks?.length > 0 && (
                            <div className="ml-6 mt-1.5 space-y-1.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                                {t.subTasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 text-[11px] group/sub">
                                        <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-3 h-3 rounded border flex items-center justify-center ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                            {sub.completed && <CheckCircle size={8} className="text-white" />}
                                        </button>
                                        <span className={`flex-1 ${sub.completed ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{sub.text}</span>
                                        <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100"><Trash2 size={10}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
             </div>
         </div>
      </div>

      {/* --- MODAIS (Estilização Dark Mode Zinc) --- */}
      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Concluir Sessão">
          <form onSubmit={finish} className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl text-center border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Tempo Total</span>
                  <p className="text-primary font-bold text-xl">{formatDuration(elapsedTime)}</p>
              </div>
              <textarea placeholder="O que aprendeste hoje?" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-primary outline-none h-24 resize-none dark:text-zinc-200" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Questões" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none dark:text-zinc-200" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} />
                  <input type="number" placeholder="Erros" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none dark:text-zinc-200" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button>
                  <Button type="submit" className="flex-[2]">Salvar Sessão</Button>
              </div>
          </form>
      </Modal>
      
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Lançamento Manual">
        <form onSubmit={manual} className="space-y-4">
            <select required className={inputClasses} value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value, topic: "" })}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={inputClasses} value={mForm.topic} onChange={e => setMForm({ ...mForm, topic: e.target.value })} disabled={!mForm.s || manualAvailableTopics.length === 0}>
                <option value="">{manualAvailableTopics.length === 0 ? "Sem tópicos" : "Escolha o tópico..."}</option>
                {manualAvailableTopics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
            </select>
            <input required type="number" placeholder="Tempo em minutos" className={inputClasses} value={mForm.t} onChange={e => setMForm({ ...mForm, t: e.target.value })} />
            <textarea placeholder="Notas do estudo..." className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm outline-none h-20 resize-none dark:text-zinc-200" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Feitas" className={inputClasses} value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} />
                <input type="number" placeholder="Erradas" className={inputClasses} value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Confirmar Registro</Button>
        </form>
      </Modal>
    </div>
  );
};