import React, { useState, useContext, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Trash2, CornerDownRight, Zap, Target, MoreVertical } from 'lucide-react';
import { FocusContext, formatTime } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Helper para formatar horas e minutos (ex: 1h 30m)
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
    timerConfig, setTimerConfig
  } = useContext(FocusContext);

  const [taskT, setTaskT] = useState(""); 
  const [finMod, setFinMod] = useState(false); 
  const [manMod, setManMod] = useState(false);
  const [fForm, setFForm] = useState({ n: "", q: "", e: "" }); 
  const [mForm, setMForm] = useState({ t: "", n: "", s: "", q: "", e: "", topic: "" });
  
  const [selectedTopic, setSelectedTopic] = useState("");

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

  // Configuração de Tempo (Pomodoro)
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
      // Usa elapsedTime (acumulado global) para o registro final
      const mins = Math.round(elapsedTime / 60); 
      if (mins > 0) { 
          addSession(mins, fForm.n, null, fForm.q, fForm.e, selectedTopic); 
          triggerCelebration(); 
      } else {
          alert("Tempo insuficiente para salvar.");
      }
      setIsActive(false); 
      setTimerMode('WORK'); 
      setTimeLeft(timerType === 'FLOW' ? 0 : timerConfig.work * 60); 
      setElapsedTime(0); 
      setCycles(0); 
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
    // Lógica Flow: Pausa é 20% do tempo atual
    // Próximo ciclo começará do 0
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
        <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-h-[500px] overflow-hidden">
            {/* Glow de Fundo */}
            <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-1000 ${isActive ? (timerMode === 'WORK' ? 'bg-primary' : 'bg-emerald-500') : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>

            {/* Switch de Modo */}
            <div className="z-10 bg-zinc-100 dark:bg-black/50 p-1.5 rounded-full flex gap-1 mb-8 border border-zinc-200 dark:border-zinc-800/50">
                {['POMODORO', 'FLOW'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => { setIsActive(false); setTimerType(type); setTimeLeft(type === 'FLOW' ? 0 : timerConfig.work * 60); setTimerMode('WORK'); setCycles(0); setElapsedTime(0); }}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${timerType === type ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Display Principal */}
            <div className="z-10 text-center relative">
                {/* Status Badge */}
                <div className="mb-6 flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border flex items-center gap-2 ${timerMode === 'WORK' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {timerMode === 'WORK' ? <Zap size={14}/> : <Coffee size={14}/>}
                        {timerMode === 'WORK' ? 'Foco Total' : 'Descanso'}
                    </span>
                </div>

                {/* RELÓGIO */}
                <div className="text-[7rem] sm:text-[9rem] leading-none font-bold text-zinc-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm dark:drop-shadow-2xl font-mono transition-all">
                    {formatTime(timeLeft)}
                </div>

                {/* Indicador de Ciclo */}
                <div className="mt-4 text-zinc-400 dark:text-zinc-500 font-medium text-sm uppercase tracking-wide">
                    Ciclo Atual: <span className="text-zinc-900 dark:text-white font-bold">#{cycles + 1}</span>
                </div>
            </div>

            {/* Métrica de Tempo Total (Elapsed) */}
            <div className="z-10 mt-8 bg-zinc-50 dark:bg-zinc-800/50 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 flex items-center gap-3">
                <div className="bg-zinc-200 dark:bg-zinc-700 p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300">
                    <Target size={18} />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Tempo Acumulado</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                        {formatDuration(elapsedTime)}
                    </span>
                </div>
            </div>

            {/* Configuração Rápida (Apenas Pomodoro) */}
            {timerType === 'POMODORO' && !isActive && (
                 <div className="z-10 mt-8 flex gap-2">
                    {[30, 50].map(mins => (
                        <button key={mins} onClick={() => handleWorkTimeChange(mins)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${timerConfig.work === mins ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-primary'}`}>
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
                className={`col-span-2 py-5 rounded-3xl font-bold flex items-center justify-center gap-3 text-lg transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-[0px] ${isActive ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'}`}
            >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                {isActive ? 'Pausar' : 'Iniciar Foco'}
             </button>

             {timerType === 'FLOW' && timerMode === 'WORK' ? (
                 <button 
                    onClick={handleFlowBreak}
                    className="col-span-1 rounded-3xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 flex items-center justify-center transition-colors"
                    title="Pausa (20% do tempo)"
                 >
                     <Coffee size={24} />
                 </button>
             ) : (
                <button 
                    onClick={() => { setIsActive(false); const resetTime = timerType === 'FLOW' ? 0 : (timerMode === 'WORK' ? timerConfig.work * 60 : timerConfig.short * 60); setTimeLeft(resetTime); }} 
                    className="col-span-1 rounded-3xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                    title="Reiniciar Timer"
                >
                    <RotateCcw size={22} />
                </button>
             )}

             <button 
                onClick={() => { setIsActive(false); setFinMod(true); }} 
                className="col-span-1 rounded-3xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition-colors shadow-lg"
                title="Finalizar Sessão"
             >
                 <CheckCircle size={24} />
             </button>
        </div>

        {/* Atalho Manual */}
        <div className="flex justify-center">
             <button onClick={() => { setMForm({ ...mForm, s: subjects[0]?.id }); setManMod(true); }} className="text-xs text-zinc-400 hover:text-primary underline decoration-dotted underline-offset-4 transition-colors">
                Estudou fora? Lançar manual
             </button>
        </div>
      </div>

      {/* --- COLUNA LATERAL: TAREFAS & CONTEXTO --- */}
      <div className="w-full xl:w-96 flex flex-col gap-6">
         {/* Seletor de Matéria */}
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <label className="text-xs font-bold text-zinc-400 uppercase mb-3 block">Matéria em Foco</label>
            <select 
                disabled={isActive} 
                value={selectedSubjectId || ''} 
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))} 
                className="w-full bg-zinc-50 dark:bg-black text-lg font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 outline-none focus:border-primary cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <div className="mt-4">
                <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Tópico Atual</label>
                <select 
                    disabled={isActive || !selectedSubjectId} 
                    value={selectedTopic} 
                    onChange={(e) => setSelectedTopic(e.target.value)} 
                    className="w-full bg-zinc-50 dark:bg-black text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                >
                    <option value="">
                        {availableTopics.length === 0 ? "Sem tópicos pendentes" : "Selecione um tópico..."}
                    </option>
                    {availableTopics.map((topic, idx) => (
                        <option key={idx} value={topic}>{topic}</option>
                    ))}
                </select>
            </div>
         </div>

         {/* Lista de Tarefas */}
         <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
             <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                 <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                     <CheckCircle size={18} className="text-primary" /> Tarefas
                 </h3>
                 <button onClick={() => window.confirm("Limpar tarefas?") && deleteAllTasks()} className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                     <Trash2 size={16} />
                 </button>
             </div>

             <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                <form onSubmit={handleCreateTask} className="flex gap-2">
                    <input 
                        placeholder={selectedTopic ? "Nova tarefa..." : "Selecione um tópico"} 
                        className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary disabled:opacity-50 transition-all" 
                        value={taskT} 
                        onChange={e => setTaskT(e.target.value)} 
                        disabled={!selectedTopic}
                    />
                    <button type="submit" disabled={!selectedTopic} className="bg-primary hover:bg-primary-dark text-white rounded-xl px-3 transition-colors disabled:opacity-50 shadow-sm">
                        <Plus size={18} />
                    </button>
                </form>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <CheckCircle size={32} className="text-zinc-300 dark:text-zinc-600 mb-2" />
                        <p className="text-sm text-zinc-400">Nenhuma tarefa para este tópico.</p>
                    </div>
                )}
                {filteredTasks.map(t => (
                    <div key={t.id} className="animate-fadeIn">
                        {/* Tarefa Pai */}
                        <div className={`group flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${t.completed ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-white dark:bg-black border-zinc-100 dark:border-zinc-800'}`}>
                            <button onClick={() => toggleTask(t.id)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${t.completed ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600 hover:border-primary'}`}>
                                {t.completed && <CheckCircle size={12} className="text-white" />}
                            </button>
                            <span className={`text-sm flex-1 leading-tight pt-0.5 ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                {t.text}
                            </span>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addSubTask(t.id, window.prompt("Sub-tarefa:"))} className="text-zinc-400 hover:text-primary"><Plus size={14}/></button>
                                <button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        
                        {/* Subtarefas */}
                        {t.subTasks?.length > 0 && (
                            <div className="ml-8 mt-2 space-y-2 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800">
                                {t.subTasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 text-xs group/sub">
                                        <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                            {sub.completed && <CheckCircle size={8} className="text-white" />}
                                        </button>
                                        <span className={`flex-1 ${sub.completed ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{sub.text}</span>
                                        <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
             </div>
         </div>
      </div>

      {/* Modais (Mantidos e Estilizados) */}
      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Resumo da Sessão">
          <form onSubmit={finish} className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl mb-4 border border-primary/10">
                  <p className="text-center text-primary font-bold text-lg">Tempo Total: {formatDuration(elapsedTime)}</p>
              </div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">O que estudou?</label><textarea className="w-full mt-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm focus:border-primary outline-none h-24 resize-none" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-zinc-500 font-bold uppercase">Questões</label><input type="number" min="0" className="w-full mt-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-primary" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} /></div>
                  <div><label className="text-xs text-zinc-500 font-bold uppercase">Erros</label><input type="number" min="0" className="w-full mt-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 outline-none focus:border-red-500" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button>
                  <Button type="submit" className="flex-[2]">Salvar Sessão</Button>
              </div>
          </form>
      </Modal>
      
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual">
        <form onSubmit={manual} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Matéria</label>
                <select required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value, topic: "" })}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tópico</label>
                <select className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary disabled:opacity-50" value={mForm.topic} onChange={e => setMForm({ ...mForm, topic: e.target.value })} disabled={!mForm.s || manualAvailableTopics.length === 0}>
                    <option value="">{manualAvailableTopics.length === 0 ? "Sem tópicos" : "Selecione..."}</option>
                    {manualAvailableTopics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tempo (min)</label>
                <input required type="number" min="1" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={mForm.t} onChange={e => setMForm({ ...mForm, t: e.target.value })} />
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Diário</label><textarea className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary h-20 resize-none text-sm" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-zinc-500 uppercase">Feitas</label><input type="number" min="0" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none" value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-zinc-500 uppercase">Erradas</label><input type="number" min="0" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none" value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} /></div>
            </div>
            <Button type="submit" className="w-full mt-2">Confirmar</Button>
        </form>
      </Modal>
    </div>
  );
};