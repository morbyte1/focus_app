import React, { useState, useContext, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Clock, Trash2, Watch, CornerDownRight } from 'lucide-react';
import { FocusContext, POMODORO, formatTime } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

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
    accumulatedTime, setAccumulatedTime, // Usando o novo estado acumulado
    setFlowStoredTime, // Mantido apenas se necessário para compatibilidade
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

  const handleWorkTimeChange = (newWorkMinutes) => {
    // Se escolheu 60min, pausa curta é 12, senão 6
    const pairedBreak = newWorkMinutes === 60 ? 12 : 6;
    setTimerConfig({ work: newWorkMinutes, short: pairedBreak });
    if (timerType === 'POMODORO' && timerMode === 'WORK') {
      setIsActive(false);
      setTimeLeft(newWorkMinutes * 60);
      setElapsedTime(0);
    }
  };

  const handleBreakTimeChange = (newBreakMinutes) => {
    // Se escolheu 12min, trabalho é 60, senão 30
    const pairedWork = newBreakMinutes === 12 ? 60 : 30;
    setTimerConfig({ work: pairedWork, short: newBreakMinutes });
    if (timerType === 'POMODORO' && timerMode === 'BREAK') {
      setIsActive(false);
      setTimeLeft(newBreakMinutes * 60);
      setElapsedTime(0);
    }
  };

  if (!subjects.length) return <div className="text-center mt-20 text-zinc-400">Adicione matérias em Matérias.</div>;

  const finish = (e) => { 
      e.preventDefault(); 
      // SOMA TOTAL: Acumulado de ciclos anteriores + ciclo atual (elapsedTime)
      const totalSeconds = accumulatedTime + elapsedTime;
      const mins = Math.round(totalSeconds / 60); 
      
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
      if (!selectedTopic) return alert("Selecione um tópico acima para criar tarefas vinculadas.");
      if (taskT && selectedSubjectId) { 
          addTask(taskT, selectedSubjectId, selectedTopic); 
          setTaskT(""); 
      }
  };

  const handleAddSubTask = (parentId) => {
      const text = window.prompt("Nome da sub-tarefa:");
      if (text) addSubTask(parentId, text);
  };

  const filteredTasks = tasks.filter(t => t.subjectId === selectedSubjectId && t.topic === selectedTopic);

  // Calcula tempo total para exibição visual (Acumulado + Atual)
  const displayTotalTime = accumulatedTime + elapsedTime;

  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <header className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Modo Foco</h1>
      </header>

      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${isActive ? (timerMode === 'WORK' ? 'bg-primary/20 animate-pulse' : 'bg-emerald-500/20 animate-pulse') : 'bg-zinc-200/50 dark:bg-zinc-800/30'}`}></div>

          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 z-10 shadow-sm">
            <button onClick={() => { setIsActive(false); setTimerType('POMODORO'); setTimeLeft(timerConfig.work * 60); setTimerMode('WORK'); setElapsedTime(0); setAccumulatedTime(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Pomodoro</button>
            <button onClick={() => { setIsActive(false); setTimerType('FLOW'); setTimeLeft(0); setTimerMode('WORK'); setElapsedTime(0); setAccumulatedTime(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'FLOW' ? 'bg-primary text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Flow</button>
          </div>

          <div className="w-full max-w-xs mb-6 z-10 text-center space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Matéria</label>
              <select disabled={isActive} value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(Number(e.target.value))} className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Tópico</label>
              <select 
                disabled={isActive || !selectedSubjectId || availableTopics.length === 0} 
                value={selectedTopic} 
                onChange={(e) => setSelectedTopic(e.target.value)} 
                className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors disabled:opacity-50"
              >
                <option value="">
                    {selectedSubjectId 
                        ? (availableTopics.length === 0 ? "Sem tópicos pendentes" : "Selecione um tópico...") 
                        : "Selecione uma matéria primeiro"}
                </option>
                {availableTopics.map((topic, idx) => (
                    <option key={idx} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>

          {timerType === 'POMODORO' && (
            <div className="grid grid-cols-2 gap-8 mb-6 z-10 w-full max-w-xs px-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-2 text-primary dark:text-primary-light">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Trabalho</span>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => handleWorkTimeChange(30)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.work === 30 ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>30</button>
                    <button onClick={() => handleWorkTimeChange(60)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.work === 60 ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>60</button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                    <Coffee size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Descanso</span>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => handleBreakTimeChange(6)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.short === 6 ? 'bg-emerald-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>6</button>
                    <button onClick={() => handleBreakTimeChange(12)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.short === 12 ? 'bg-emerald-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>12</button>
                </div>
              </div>
            </div>
          )}

          <div className="z-10 text-center">
            <div className="mb-6">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode === 'WORK' ? 'bg-primary/10 text-primary-light border-primary/20' : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'}`}>{timerMode === 'WORK' ? 'Foco Total' : 'Pausa'}</span>
            </div>

            {/* Timer Principal: Se Flow e Work, mostra tempo DECORRIDO. Senão, mostra tempo RESTANTE */}
            <div className="text-8xl md:text-9xl font-mono font-bold text-zinc-900 dark:text-white tracking-tighter mb-4 tabular-nums drop-shadow-sm dark:drop-shadow-2xl">
                {timerType === 'FLOW' && timerMode === 'WORK' ? formatTime(timeLeft) : formatTime(timeLeft)}
            </div>

            {/* Mostrador de Ciclos e Tempo Total Acumulado */}
            <div className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
                Ciclos: <span className="text-zinc-900 dark:text-white font-bold ml-2">{cycles}</span>
                {accumulatedTime > 0 && (
                   <span className="ml-4 pl-4 border-l border-zinc-300 dark:border-zinc-700">Total: <span className="text-primary font-bold">{formatTime(displayTotalTime)}</span></span>
                )}
            </div>

            <div className="flex gap-4 justify-center items-center mt-8">
              <button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700' : (timerMode === 'WORK' ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-emerald-500 text-white hover:bg-emerald-600')}`}>
                {isActive ? <Pause size={24} /> : <Play size={24} />} <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
              </button>

              <button onClick={() => { setIsActive(false); const resetTime = timerType === 'FLOW' ? 0 : (timerMode === 'WORK' ? timerConfig.work * 60 : timerConfig.short * 60); setTimeLeft(resetTime); setElapsedTime(0); if(timerType === 'FLOW') setAccumulatedTime(0); }} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 transition-colors"><RotateCcw size={24} /></button>

{/* Botão de Pausa do Flow: Consolidar tempo antes de iniciar o break */}
              {timerType === 'FLOW' && timerMode === 'WORK' && (
                <button 
                  onClick={() => { 
                      const currentCycleTime = timeLeft; // No flow, timeLeft conta pra cima (work)
                      setAccumulatedTime(prev => prev + currentCycleTime); // Consolidar
                      
                      // --- CORREÇÃO APLICADA AQUI ---
                      setCycles(prev => prev + 1); 
                      // ------------------------------
                      
                      setTimerMode('BREAK'); 
                      setTimeLeft(Math.floor(currentCycleTime * 0.2)); // 20% do ciclo ATUAL
                      setIsActive(true);
                      setElapsedTime(0); // Reiniciar visual do ciclo
                  }} 
                  className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                >
                    <Coffee size={24} />
                </button>
              )}

              <button onClick={() => { setIsActive(false); setFinMod(true); }} className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"><CheckCircle size={24} /></button>
            </div>
            {timerType === 'FLOW' && timerMode === 'WORK' && <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4">Clique no <Coffee size={12} className="inline" /> para pausa.</p>}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
          <Card className="h-full flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={20} className="text-primary" /> Tarefas
                </h3>
                <button 
                    onClick={() => window.confirm("Tem certeza que deseja apagar todas as tarefas?") && deleteAllTasks()} 
                    title="Excluir Todas" 
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <form onSubmit={handleCreateTask} className="mb-4 flex gap-2">
                <input 
                    placeholder={selectedTopic ? `Tarefa em: ${selectedTopic}` : "Selecione um tópico..."} 
                    className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary disabled:opacity-50" 
                    value={taskT} 
                    onChange={e => setTaskT(e.target.value)} 
                    disabled={!selectedTopic}
                />
                <button type="submit" disabled={!selectedTopic} className="bg-primary hover:bg-primary-dark transition-colors rounded-2xl px-3 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus size={18} />
                </button>
            </form>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredTasks.length === 0 && (
                    <p className="text-center text-zinc-400 text-sm mt-4 italic">
                        {selectedTopic ? "Nenhuma tarefa neste tópico." : "Selecione um tópico para ver as tarefas."}
                    </p>
                )}
                {filteredTasks.map(t => (
                    <div key={t.id} className="animate-fadeIn">
                        {/* Tarefa Principal */}
                        <div className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${t.completed ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800'}`}>
                            <button onClick={() => toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-zinc-500 hover:border-primary'}`}>
                                {t.completed && <CheckCircle size={14} className="text-white" />}
                            </button>
                            <span className={`text-sm flex-1 break-words ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                {t.text}
                            </span>
                            
                            <button onClick={() => handleAddSubTask(t.id)} title="Adicionar Sub-tarefa" className="text-zinc-400 hover:text-primary dark:text-zinc-600 hover:bg-primary/10 p-1.5 rounded-lg transition-colors">
                                <Plus size={14} />
                            </button>
                            
                            <button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Sub-tarefas (Indentadas) */}
                        {t.subTasks && t.subTasks.length > 0 && (
                            <div className="ml-6 mt-1 space-y-1 pl-2 border-l-2 border-zinc-100 dark:border-zinc-800">
                                {t.subTasks.map(sub => (
                                    <div key={sub.id} className="group/sub flex items-center gap-2 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <CornerDownRight size={12} className="text-zinc-300 dark:text-zinc-700" />
                                        <button onClick={() => toggleSubTask(t.id, sub.id)} className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-600 hover:border-primary'}`}>
                                            {sub.completed && <CheckCircle size={10} className="text-white" />}
                                        </button>
                                        <span className={`text-xs flex-1 break-words ${sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {sub.text}
                                        </span>
                                        <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </Card>
      </div>

      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-200 dark:border-zinc-800/50 pt-10"><div className="bg-white dark:bg-[#09090b] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full text-center"><Clock size={24} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-500 opacity-50" /><p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p><button onClick={() => { setMForm({ ...mForm, s: subjects[0]?.id }); setManMod(true); }} className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary-light hover:text-white rounded-2xl border border-primary/20 transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/5"><Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Lançar Estudo Manual</button></div></div>

      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Resumo da Sessão"><form onSubmit={finish} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">O que você estudou?</label><textarea className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Questões Feitas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-blue-500" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} /></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Erradas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-red-500" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} /></div></div><div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-[2]">Salvar Sessão</Button></div></form></Modal>

      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual">
        <form onSubmit={manual} className="space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Matéria</label>
                <select required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value, topic: "" })}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tópico</label>
                <select 
                    className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary disabled:opacity-50"
                    value={mForm.topic} 
                    onChange={e => setMForm({ ...mForm, topic: e.target.value })}
                    disabled={!mForm.s || manualAvailableTopics.length === 0}
                >
                    <option value="">
                       {!mForm.s ? "Selecione a matéria" : (manualAvailableTopics.length === 0 ? "Sem tópicos pendentes" : "Selecione um tópico...")}
                    </option>
                    {manualAvailableTopics.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tempo (min)</label>
                <input required type="number" min="1" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={mForm.t} onChange={e => setMForm({ ...mForm, t: e.target.value })} />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Diário</label>
                <textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white h-28 outline-none focus:border-primary resize-none text-sm" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Feitas</label>
                    <input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-blue-500" value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Erradas</label>
                    <input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-red-500" value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} />
                </div>
            </div>
            <Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-primary/20">Confirmar</Button>
        </form>
      </Modal>
    </div>
)};