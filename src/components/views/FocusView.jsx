import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Trash2, Target, Zap, Clock, List, AlertCircle, RefreshCw } from 'lucide-react';
import { FocusContext, formatTime, POMODORO_PRESETS } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Formata segundos para texto legível (ex: 1h 30m)
const formatDuration = (seconds) => {
  if (!seconds) return '0m';
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
    addSession, elapsedTime, setElapsedTime, flowTotalTime, setFlowTotalTime, startFlowBreak,
    themes,
    timerConfig, setTimerConfig
  } = useContext(FocusContext);

  const [taskText, setTaskText] = useState(""); 
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false); 
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [finishForm, setFinishForm] = useState({ notes: "", questions: "", errors: "" }); 
  const [manualForm, setManualForm] = useState({ minutes: "", notes: "", subjectId: "", questions: "", errors: "", topic: "" });
  const [selectedTopic, setSelectedTopic] = useState("");

  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    const subjectThemes = themes.filter(t => t.subjectId === selectedSubjectId);
    return subjectThemes.flatMap(t => t.items).filter(i => !i.completed).map(i => i.text);
  }, [selectedSubjectId, themes]);

  // Handler para configurar Pomodoro (30/6 ou 50/10)
  const setPomodoroPreset = (preset) => {
    setTimerConfig(preset); // { work: 30, break: 6 } ou { work: 50, break: 10 }
    setIsActive(false);
    setTimerType('POMODORO');
    setTimerMode('WORK');
    setTimeLeft(preset.work * 60);
    setCycles(0);
    setElapsedTime(0);
  };

  const handleFinishSession = (e) => { 
      e.preventDefault(); 
      const mins = Math.round((timerType === 'FLOW' ? flowTotalTime : elapsedTime) / 60); 
      
      if (mins >= 1) { 
          addSession(mins, finishForm.notes, null, finishForm.questions, finishForm.errors, selectedTopic || "Geral"); 
          triggerCelebration(); 
      }
      resetAll();
      setIsFinishModalOpen(false); 
  };
  
  const handleManualSession = (e) => { 
      e.preventDefault(); 
      if (!manualForm.minutes || !manualForm.subjectId) return alert("Preencha tempo e matéria."); 
      addSession(Math.max(1, parseInt(manualForm.minutes)), manualForm.notes, manualForm.subjectId, manualForm.questions, manualForm.errors, manualForm.topic || "Manual"); 
      setIsManualModalOpen(false); 
      triggerCelebration();
  };

  const handleCreateTask = (e) => {
      e.preventDefault();
      if (!taskText.trim() || !selectedSubjectId) return;
      addTask(taskText, selectedSubjectId, selectedTopic || "Geral"); 
      setTaskText(""); 
  };

  const resetAll = () => {
      setIsActive(false); 
      setTimerMode('WORK'); 
      setElapsedTime(0); 
      setFlowTotalTime(0);
      setCycles(0); 
      setFinishForm({ notes: "", questions: "", errors: "" }); 
      if (timerType === 'POMODORO') setTimeLeft(timerConfig.work * 60);
      else setTimeLeft(0);
  };

  const filteredTasks = tasks.filter(t => t.subjectId === selectedSubjectId && (selectedTopic ? t.topic === selectedTopic : true));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn pb-24 md:pb-0 h-full">
      
      {/* === COLUNA ESQUERDA: TIMER === */}
      <div className="flex flex-col gap-6">
        <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#000000]">
            
            {/* Indicador de Tipo de Timer (Tabs) */}
            <div className="absolute top-6 flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button 
                    onClick={() => setPomodoroPreset(POMODORO_PRESETS.SHORT)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' && timerConfig.work === 30 ? 'bg-white dark:bg-[#000000] text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                    30 / 6
                </button>
                <button 
                    onClick={() => setPomodoroPreset(POMODORO_PRESETS.LONG)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' && timerConfig.work === 50 ? 'bg-white dark:bg-[#000000] text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                    50 / 10
                </button>
                <button 
                    onClick={() => { setIsActive(false); setTimerType('FLOW'); setTimerMode('WORK'); setTimeLeft(0); setCycles(0); setElapsedTime(0); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'FLOW' ? 'bg-white dark:bg-[#000000] text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                    Flow
                </button>
            </div>

            {/* Relógio Principal */}
            <div className="relative z-10 flex flex-col items-center mt-8">
                {/* Status Badge */}
                <span className={`mb-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 ${timerMode === 'WORK' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                    {timerMode === 'WORK' ? <Zap size={12}/> : <Coffee size={12}/>}
                    {timerMode === 'WORK' ? 'Focando' : 'Descanso'}
                </span>

                {/* Dígitos */}
                <div className="text-[7rem] leading-none font-bold text-zinc-900 dark:text-white tracking-tighter font-mono tabular-nums select-none">
                    {formatTime(timeLeft)}
                </div>

                {/* Info Extra (Ciclos ou Total Flow) */}
                <div className="mt-6 flex flex-col items-center gap-1">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wide">
                        {timerType === 'FLOW' ? 'Tempo Total Sessão' : 'Ciclo Atual'}
                    </p>
                    {timerType === 'FLOW' ? (
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-lg font-mono text-sm border border-zinc-200 dark:border-zinc-800">
                            <Clock size={12} className="text-primary"/> {formatDuration(flowTotalTime)}
                        </div>
                    ) : (
                        <div className="flex gap-1">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < (cycles % 4) ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-12 flex items-center gap-4">
                {/* Botão Reset / Flow Break */}
                {timerType === 'FLOW' && timerMode === 'WORK' ? (
                     <button onClick={startFlowBreak} className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all" title="Pausa (20%)">
                        <Coffee size={20} />
                     </button>
                ) : (
                    <button onClick={resetAll} className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all" title="Resetar">
                        <RotateCcw size={20} />
                    </button>
                )}

                {/* Botão Play/Pause Principal */}
                <button 
                    onClick={() => setIsActive(!isActive)}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${isActive ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-100 dark:border-zinc-800' : 'bg-primary text-white shadow-primary/30'}`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                {/* Botão Finalizar */}
                <button onClick={() => { setIsActive(false); setIsFinishModalOpen(true); }} className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all" title="Finalizar">
                    <CheckCircle size={20} />
                </button>
            </div>
            
            <button onClick={() => setIsManualModalOpen(true)} className="absolute bottom-4 text-[10px] font-bold text-zinc-400 hover:text-primary uppercase tracking-wider flex items-center gap-1">
                <Plus size={10} /> Lançamento Manual
            </button>
        </Card>
      </div>

      {/* === COLUNA DIREITA: CONTEXTO & TAREFAS === */}
      <div className="flex flex-col gap-6 h-full min-h-0">
          
          {/* Selector de Matéria */}
          <Card className="bg-white dark:bg-[#000000] border-zinc-200 dark:border-zinc-800 p-5">
             <div className="flex flex-col gap-4">
                <div className="relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Matéria</label>
                    <select 
                        disabled={isActive} 
                        value={selectedSubjectId || ''} 
                        onChange={(e) => setSelectedSubjectId(Number(e.target.value))} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="absolute right-3 bottom-3 pointer-events-none text-zinc-500"><List size={14}/></div>
                </div>
                <div className="relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Tópico</label>
                    <select 
                        disabled={isActive || !selectedSubjectId} 
                        value={selectedTopic} 
                        onChange={(e) => setSelectedTopic(e.target.value)} 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="">Geral</option>
                        {availableTopics.map((topic, idx) => <option key={idx} value={topic}>{topic}</option>)}
                    </select>
                    <div className="absolute right-3 bottom-3 pointer-events-none text-zinc-500"><List size={14}/></div>
                </div>
             </div>
          </Card>

          {/* Lista de Tarefas */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-white dark:bg-[#000000] border-zinc-200 dark:border-zinc-800 min-h-[300px]">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <List size={14}/> Tarefas
                  </span>
                  {filteredTasks.length > 0 && <button onClick={() => window.confirm("Limpar tarefas?") && deleteAllTasks()} className="text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
              
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-900">
                  <form onSubmit={handleCreateTask} className="flex gap-2">
                      <input 
                        className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary placeholder:text-zinc-400"
                        placeholder="Nova tarefa..."
                        value={taskText}
                        onChange={e => setTaskText(e.target.value)}
                        disabled={!selectedSubjectId} // Desabilita apenas se não houver matéria (o que é raro pois seleciona default)
                      />
                      <button type="submit" disabled={!taskText.trim()} className="bg-primary hover:bg-primary-dark text-white rounded-xl w-10 flex items-center justify-center transition-colors disabled:opacity-50">
                          <Plus size={18}/>
                      </button>
                  </form>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredTasks.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                          <CheckCircle size={24} className="mb-2"/>
                          <p className="text-xs">Sem tarefas.</p>
                      </div>
                  )}
                  {filteredTasks.map(t => (
                      <div key={t.id} className="group animate-fadeIn bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 hover:border-primary/30 transition-all">
                          <div className="flex items-start gap-3">
                              <button onClick={() => toggleTask(t.id)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                  {t.completed && <CheckCircle size={10} className="text-white" />}
                              </button>
                              <span className={`text-sm flex-1 leading-tight ${t.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{t.text}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => addSubTask(t.id, prompt("Sub-tarefa:"))} className="text-zinc-400 hover:text-primary"><Plus size={14}/></button>
                                  <button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>
                              </div>
                          </div>
                          {t.subTasks?.length > 0 && (
                              <div className="mt-2 pl-7 space-y-1">
                                  {t.subTasks.map(sub => (
                                      <div key={sub.id} className="flex items-center gap-2 text-xs">
                                          <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-3 h-3 rounded border flex items-center justify-center ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                              {sub.completed && <CheckCircle size={8} className="text-white" />}
                                          </button>
                                          <span className={`flex-1 ${sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}>{sub.text}</span>
                                          <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={10}/></button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </Card>
      </div>

      {/* === MODAL FINALIZAR === */}
      <Modal isOpen={isFinishModalOpen} onClose={() => setIsFinishModalOpen(false)} title="Sessão Finalizada">
          <form onSubmit={handleFinishSession} className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Target size={20}/></div>
                  <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Tempo Total</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {formatDuration(timerType === 'FLOW' ? flowTotalTime : elapsedTime)}
                      </p>
                  </div>
              </div>
              <div><label className="text-xs text-zinc-500 font-bold uppercase">Notas</label><textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 text-sm dark:text-white outline-none focus:border-primary resize-none" value={finishForm.notes} onChange={e => setFinishForm({...finishForm, notes: e.target.value})} placeholder="O que você estudou?"/></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-zinc-500 font-bold uppercase">Questões</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-primary" value={finishForm.questions} onChange={e => setFinishForm({...finishForm, questions: e.target.value})}/></div>
                  <div><label className="text-xs text-zinc-500 font-bold uppercase">Erros</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-red-500" value={finishForm.errors} onChange={e => setFinishForm({...finishForm, errors: e.target.value})}/></div>
              </div>
              <div className="flex gap-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsFinishModalOpen(false)} className="flex-1">Cancelar</Button>
                  <Button type="submit" className="flex-[2]">Salvar</Button>
              </div>
          </form>
      </Modal>

      {/* === MODAL MANUAL === */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Lançamento Manual">
         <form onSubmit={handleManualSession} className="space-y-4">
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label><select className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-primary" value={manualForm.subjectId} onChange={e => setManualForm({...manualForm, subjectId: e.target.value})}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Tempo (min)</label><input type="number" required min="1" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-primary" value={manualForm.minutes} onChange={e => setManualForm({...manualForm, minutes: e.target.value})}/></div>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Notas</label><textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-20 text-sm dark:text-white outline-none focus:border-primary resize-none" value={manualForm.notes} onChange={e => setManualForm({...manualForm, notes: e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-zinc-500 font-bold uppercase">Questões</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-primary" value={manualForm.questions} onChange={e => setManualForm({...manualForm, questions: e.target.value})}/></div>
                <div><label className="text-xs text-zinc-500 font-bold uppercase">Erros</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 dark:text-white outline-none focus:border-primary" value={manualForm.errors} onChange={e => setManualForm({...manualForm, errors: e.target.value})}/></div>
            </div>
            <Button type="submit" className="w-full mt-2">Confirmar</Button>
         </form>
      </Modal>

    </div>
  );
};