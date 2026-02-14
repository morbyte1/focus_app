import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Trash2, 
  Target, Zap, Clock, List, AlertCircle 
} from 'lucide-react';
import { FocusContext, formatTime } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Helper: Formata segundos para texto legível (ex: 1h 30m)
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
    addSession, elapsedTime, setElapsedTime, 
    themes,
    timerConfig, setTimerConfig
  } = useContext(FocusContext);

  const [taskText, setTaskText] = useState(""); 
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false); 
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  // Formulários
  const [finishForm, setFinishForm] = useState({ notes: "", questions: "", errors: "" }); 
  const [manualForm, setManualForm] = useState({ minutes: "", notes: "", subjectId: "", questions: "", errors: "", topic: "" });
  
  const [selectedTopic, setSelectedTopic] = useState("");

  // Tópicos disponíveis baseados na matéria selecionada
  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    const subjectThemes = themes.filter(t => t.subjectId === selectedSubjectId);
    if (!subjectThemes.length) return [];
    
    // Flatten itens dos temas
    return subjectThemes
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [selectedSubjectId, themes]);

  const manualAvailableTopics = useMemo(() => {
    if (!manualForm.subjectId) return [];
    const sId = Number(manualForm.subjectId);
    return themes
      .filter(t => t.subjectId === sId)
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [manualForm.subjectId, themes]);

  // Reset do tópico ao mudar matéria
  useEffect(() => {
    setSelectedTopic("");
  }, [selectedSubjectId]);

  // Configuração de Tempo (Pomodoro)
  const handleWorkTimeChange = (work) => {
    const short = work === 50 ? 10 : 5;
    setTimerConfig({ work, short });
    if (timerType === 'POMODORO' && timerMode === 'WORK' && !isActive) {
      setTimeLeft(work * 60);
      setElapsedTime(0);
    }
  };

  const handleFinishSession = (e) => { 
      e.preventDefault(); 
      const mins = Math.round(elapsedTime / 60); 
      
      if (mins >= 1) { 
          // Se não houver tópico selecionado, usa "Geral"
          addSession(mins, finishForm.notes, null, finishForm.questions, finishForm.errors, selectedTopic || "Geral"); 
          triggerCelebration(); 
      } else {
          // Permite salvar mesmo com pouco tempo se o usuário insistir (opcional), aqui apenas alerta
          alert("Sessão muito curta para registrar (mínimo 1 min).");
      }

      // Reset total
      setIsActive(false); 
      setTimerMode('WORK'); 
      setTimeLeft(timerType === 'FLOW' ? 0 : timerConfig.work * 60); 
      setElapsedTime(0); 
      setCycles(0); 
      setIsFinishModalOpen(false); 
      setFinishForm({ notes: "", questions: "", errors: "" }); 
      setSelectedTopic(""); 
  };
  
  const handleManualSession = (e) => { 
      e.preventDefault(); 
      if (!manualForm.minutes || !manualForm.subjectId) return alert("Preencha tempo e matéria."); 
      const tValid = Math.max(1, parseInt(manualForm.minutes) || 0);
      
      addSession(tValid, manualForm.notes, manualForm.subjectId, manualForm.questions, manualForm.errors, manualForm.topic || "Manual"); 
      
      setManualForm({ minutes: "", notes: "", subjectId: "", questions: "", errors: "", topic: "" }); 
      setIsManualModalOpen(false); 
      triggerCelebration();
  };

  const handleCreateTask = (e) => {
      e.preventDefault();
      if (!taskText.trim() || !selectedSubjectId) return;
      
      // Cria a tarefa. Se selectedTopic for vazio, o Contexto agora trata ou passamos "Geral" explicitamente
      addTask(taskText, selectedSubjectId, selectedTopic || "Geral"); 
      setTaskText(""); 
  };

  const handleFlowBreak = () => {
    // No Flow, a pausa é livre ou calculada. Aqui definimos 5 min fixos para descanso rápido ou 20% do tempo.
    // Vamos usar config short break padrão para consistência.
    const breakTime = timerConfig.short * 60;
    setTimerMode('BREAK');
    setTimeLeft(breakTime);
    setCycles(prev => prev + 1);
    setIsActive(true);
  };

  const handleReset = () => {
      setIsActive(false);
      const resetTime = timerType === 'FLOW' ? 0 : (timerMode === 'WORK' ? timerConfig.work * 60 : timerConfig.short * 60);
      setTimeLeft(resetTime);
      if(timerMode === 'WORK' && timerType === 'FLOW') setElapsedTime(0); // Reset visual no flow
  };

  if (!subjects.length) {
      return (
          <div className="flex h-full items-center justify-center text-zinc-500 flex-col gap-4">
              <p>Você precisa cadastrar matérias para começar.</p>
              <Button onClick={() => alert("Vá para a aba Matérias")}>Ir para Matérias</Button>
          </div>
      );
  }
  
  // Filtro de tarefas: Mostra tarefas do tópico selecionado OU tarefas "Geral" se nenhum tópico selecionado
  const filteredTasks = tasks.filter(t => 
      t.subjectId === selectedSubjectId && 
      (selectedTopic ? t.topic === selectedTopic : true)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full h-full">
      
      {/* --- COLUNA 1: TIMER & CONTROLES --- */}
      <div className="flex flex-col gap-6">
        
        {/* Card Principal do Timer */}
        <div className="relative flex-1 bg-white dark:bg-black rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-h-[450px] overflow-hidden">
            
            {/* Background Glow Sutil (Otimizado) */}
            <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-700 ${isActive ? (timerMode === 'WORK' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-transparent'}`}></div>

            {/* Switch de Modo (Pomodoro/Flow) */}
            <div className="z-10 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full flex gap-1 mb-8 border border-zinc-200 dark:border-zinc-800">
                {['POMODORO', 'FLOW'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => { setIsActive(false); setTimerType(type); setTimeLeft(type === 'FLOW' ? 0 : timerConfig.work * 60); setTimerMode('WORK'); setCycles(0); setElapsedTime(0); }}
                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${timerType === type ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Display do Tempo */}
            <div className="z-10 text-center relative flex flex-col items-center">
                <span className={`mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${timerMode === 'WORK' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                    {timerMode === 'WORK' ? <Zap size={12}/> : <Coffee size={12}/>}
                    {timerMode === 'WORK' ? 'Foco Total' : 'Descanso'}
                </span>

                <div className="text-[6rem] sm:text-[8rem] leading-none font-bold text-zinc-900 dark:text-white tracking-tighter tabular-nums font-mono select-none">
                    {formatTime(timeLeft)}
                </div>

                <div className="mt-2 text-zinc-400 dark:text-zinc-600 font-medium text-xs uppercase tracking-wide">
                    Ciclo Atual: <span className="text-zinc-900 dark:text-zinc-300 font-bold">#{cycles + 1}</span>
                </div>
            </div>

            {/* Configuração Rápida (Pomodoro Only) */}
            {timerType === 'POMODORO' && !isActive && (
                 <div className="z-10 mt-8 flex gap-2">
                    {[25, 30, 45, 50, 60].map(mins => (
                        <button 
                            key={mins} 
                            onClick={() => handleWorkTimeChange(mins)} 
                            className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold border transition-all ${timerConfig.work === mins ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'}`}
                        >
                            {mins}
                        </button>
                    ))}
                 </div>
            )}
        </div>

        {/* Barra de Ações */}
        <div className="grid grid-cols-4 gap-4">
             <button 
                onClick={() => setIsActive(!isActive)} 
                className={`col-span-2 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 text-base transition-all active:scale-[0.98] ${isActive ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800' : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20'}`}
            >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                {isActive ? 'Pausar' : 'Iniciar'}
             </button>

             {/* Botão Reset / Break Flow */}
             {timerType === 'FLOW' && timerMode === 'WORK' ? (
                 <button 
                    onClick={handleFlowBreak}
                    className="col-span-1 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 flex items-center justify-center transition-colors"
                    title="Pausa Curta"
                 >
                     <Coffee size={20} />
                 </button>
             ) : (
                <button 
                    onClick={handleReset}
                    className="col-span-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors"
                    title="Reiniciar Timer"
                >
                    <RotateCcw size={20} />
                </button>
             )}

             <button 
                onClick={() => { setIsActive(false); setIsFinishModalOpen(true); }} 
                className="col-span-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition-colors shadow-lg"
                title="Finalizar Sessão"
             >
                 <CheckCircle size={20} />
             </button>
        </div>

        <div className="flex justify-center pt-2">
             <button onClick={() => { setManualForm({ ...manualForm, subjectId: subjects[0]?.id }); setIsManualModalOpen(true); }} className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors flex items-center gap-1">
                <Clock size={12}/> Esqueceu o timer? Lançamento manual
             </button>
        </div>
      </div>

      {/* --- COLUNA 2: CONTEXTO & TAREFAS --- */}
      <div className="flex flex-col gap-6 h-full min-h-0">
         
         {/* Bloco de Contexto (Matéria e Tópico) */}
         <div className="bg-white dark:bg-black p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
            <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Matéria em Foco</label>
                <div className="relative">
                    <select 
                        disabled={isActive} 
                        value={selectedSubjectId || ''} 
                        onChange={(e) => setSelectedSubjectId(Number(e.target.value))} 
                        className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 text-lg font-bold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 outline-none focus:border-primary cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <List size={16} />
                    </div>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tópico (Opcional)</label>
                    <span className="text-[10px] text-zinc-500">{availableTopics.length} pendentes</span>
                </div>
                <select 
                    disabled={isActive || !selectedSubjectId} 
                    value={selectedTopic} 
                    onChange={(e) => setSelectedTopic(e.target.value)} 
                    className="w-full bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                >
                    <option value="">Geral / Sem Tópico Específico</option>
                    {availableTopics.map((topic, idx) => (
                        <option key={idx} value={topic}>{topic}</option>
                    ))}
                </select>
            </div>
         </div>

         {/* Lista de Tarefas */}
         <div className="flex-1 bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden min-h-[350px]">
             
             {/* Header Tarefas */}
             <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30">
                 <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                     <CheckCircle size={16} className="text-primary" /> 
                     Tarefas: {selectedTopic || "Geral"}
                 </h3>
                 {filteredTasks.length > 0 && (
                     <button onClick={() => window.confirm("Limpar todas as tarefas desta lista?") && deleteAllTasks()} className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                         <Trash2 size={14} />
                     </button>
                 )}
             </div>

             {/* Input Nova Tarefa */}
             <div className="p-4 bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900">
                <form onSubmit={handleCreateTask} className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            placeholder={selectedTopic ? `Adicionar em "${selectedTopic}"...` : "Adicionar em Geral..."} 
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-400" 
                            value={taskText} 
                            onChange={e => setTaskText(e.target.value)} 
                        />
                        {!selectedTopic && taskText.length > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" title="Será salvo em 'Geral'">
                                <AlertCircle size={14} />
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={!taskText.trim()} className="bg-primary hover:bg-primary-dark text-white rounded-xl px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        <Plus size={18} />
                    </button>
                </form>
             </div>
             
             {/* Lista Scrollable */}
             <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                        <CheckCircle size={32} className="text-zinc-300 dark:text-zinc-700 mb-2" />
                        <p className="text-sm text-zinc-500">Nenhuma tarefa pendente.</p>
                    </div>
                )}
                {filteredTasks.map(t => (
                    <div key={t.id} className="animate-fadeIn">
                        {/* Item da Tarefa */}
                        <div className={`group flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${t.completed ? 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent opacity-60' : 'bg-white dark:bg-black border-zinc-100 dark:border-zinc-900'}`}>
                            
                            <button onClick={() => toggleTask(t.id)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${t.completed ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-700 hover:border-primary'}`}>
                                {t.completed && <CheckCircle size={12} className="text-white" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm block leading-tight break-words ${t.completed ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                    {t.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addSubTask(t.id, window.prompt("Nome da sub-tarefa:"))} className="p-1 text-zinc-400 hover:text-primary rounded"><Plus size={14}/></button>
                                <button onClick={() => deleteTask(t.id)} className="p-1 text-zinc-400 hover:text-red-500 rounded"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        
                        {/* Subtarefas */}
                        {t.subTasks?.length > 0 && (
                            <div className="ml-9 mt-1 space-y-1 pl-3 border-l border-zinc-200 dark:border-zinc-800">
                                {t.subTasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-2 py-1 group/sub">
                                        <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                            {sub.completed && <CheckCircle size={8} className="text-white" />}
                                        </button>
                                        <span className={`text-xs flex-1 truncate ${sub.completed ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{sub.text}</span>
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

      {/* --- MODAIS --- */}
      
      {/* Modal Finalizar */}
      <Modal isOpen={isFinishModalOpen} onClose={() => setIsFinishModalOpen(false)} title="Sessão Concluída">
          <form onSubmit={handleFinishSession} className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl mb-4 border border-primary/10 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary uppercase">Tempo Total Focado</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatDuration(elapsedTime)}</p>
                  </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">O que você aprendeu?</label>
                <textarea 
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:border-primary outline-none h-24 resize-none dark:text-white" 
                    value={finishForm.notes} 
                    onChange={e => setFinishForm({ ...finishForm, notes: e.target.value })}
                    placeholder="Resumo breve..." 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Questões Feitas</label>
                    <input type="number" min="0" className="w-full mt-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary dark:text-white" value={finishForm.questions} onChange={e => setFinishForm({ ...finishForm, questions: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Erros</label>
                    <input type="number" min="0" className="w-full mt-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-red-500 dark:text-white" value={finishForm.errors} onChange={e => setFinishForm({ ...finishForm, errors: e.target.value })} />
                  </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsFinishModalOpen(false)} className="flex-1">Descartar</Button>
                  <Button type="submit" className="flex-[2]">Salvar Sessão</Button>
              </div>
          </form>
      </Modal>
      
      {/* Modal Manual */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Registro Manual">
        <form onSubmit={handleManualSession} className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Matéria</label>
                <select required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary dark:text-white" value={manualForm.subjectId} onChange={e => setManualForm({ ...manualForm, subjectId: e.target.value, topic: "" })}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Tópico (Opcional)</label>
                <select className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary disabled:opacity-50 dark:text-white" value={manualForm.topic} onChange={e => setManualForm({ ...manualForm, topic: e.target.value })} disabled={!manualForm.subjectId || manualAvailableTopics.length === 0}>
                    <option value="">{manualAvailableTopics.length === 0 ? "Geral" : "Selecione..."}</option>
                    {manualAvailableTopics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Tempo (minutos)</label>
                <input required type="number" min="1" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary dark:text-white" value={manualForm.minutes} onChange={e => setManualForm({ ...manualForm, minutes: e.target.value })} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Notas</label>
                <textarea className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary h-20 resize-none text-sm dark:text-white" value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-zinc-500 uppercase">Questões</label><input type="number" min="0" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none dark:text-white" value={manualForm.questions} onChange={e => setManualForm({ ...manualForm, questions: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-zinc-500 uppercase">Erros</label><input type="number" min="0" className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none dark:text-white" value={manualForm.errors} onChange={e => setManualForm({ ...manualForm, errors: e.target.value })} /></div>
            </div>
            <Button type="submit" className="w-full mt-2">Confirmar Lançamento</Button>
        </form>
      </Modal>
    </div>
  );
};