import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Coffee, CheckCircle2, Plus, Trash2, 
  Target, Zap, Clock, List, AlertTriangle, BookOpen, Layers 
} from 'lucide-react';
import { FocusContext, formatTime, POMODORO_PRESETS } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// --- Sub-components para Organização ---

const ModeToggle = ({ current, onSelect }) => (
  <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm mx-auto mb-8 relative">
    {['POMODORO', 'FLOW'].map((mode) => (
      <button
        key={mode}
        onClick={() => onSelect(mode)}
        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative z-10 ${
          current === mode 
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
        }`}
      >
        {mode}
      </button>
    ))}
  </div>
);

const PresetBadge = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all ${
      active 
        ? 'bg-primary/10 border-primary text-primary' 
        : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
    }`}
  >
    {label}
  </button>
);

const SafeActionModal = ({ isOpen, onClose, onConfirm, title, desc }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="flex flex-col items-center text-center p-2">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={32} />
      </div>
      <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-6">{desc}</p>
      <div className="flex gap-3 w-full">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 border-red-500 text-white">Confirmar</Button>
      </div>
    </div>
  </Modal>
);

// --- Componente Principal ---

export const FocusView = () => {
  const { 
    timerType, setTimerType, 
    subjects, selectedSubjectId, setSelectedSubjectId, 
    timerMode, setTimerMode, 
    timeLeft, setTimeLeft, 
    isActive, setIsActive, 
    cycles, setCycles, 
    tasks, addTask, toggleTask, deleteTask, addSubTask, toggleSubTask, deleteSubTask,
    addSession, elapsedTime, setElapsedTime, flowTotalTime, setFlowTotalTime, startFlowBreak, resetTimer,
    themes, timerConfig, setTimerConfig
  } = useContext(FocusContext);

  // UI Local State
  const [selectedTopic, setSelectedTopic] = useState("");
  const [taskText, setTaskText] = useState("");
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishForm, setFinishForm] = useState({ notes: "", questions: "", errors: "" });
  
  // Safety Logic State
  const [safetyModal, setSafetyModal] = useState({ open: false, action: null });
  const [showTopicWarning, setShowTopicWarning] = useState(false);

  // Derived Data
  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    const subjectThemes = themes.filter(t => t.subjectId === selectedSubjectId);
    return subjectThemes.flatMap(t => t.items).filter(i => !i.completed).map(i => i.text);
  }, [selectedSubjectId, themes]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.subjectId === selectedSubjectId && (selectedTopic ? t.topic === selectedTopic : true));
  }, [tasks, selectedSubjectId, selectedTopic]);

  // --- Handlers de Lógica e Segurança ---

  const handleSafeAction = (actionFn, warningText = "O progresso da sessão atual será perdido.") => {
    if (isActive || (timerType === 'FLOW' && flowTotalTime > 10)) {
      setSafetyModal({ 
        open: true, 
        desc: warningText,
        action: () => {
          actionFn();
          setSafetyModal({ open: false, action: null });
        }
      });
    } else {
      actionFn();
    }
  };

  const handleModeSwitch = (newMode) => {
    if (timerType === newMode) return;
    handleSafeAction(() => {
      setIsActive(false);
      setTimerType(newMode);
      setTimerMode('WORK');
      setCycles(0);
      setElapsedTime(0);
      setFlowTotalTime(0);
      if (newMode === 'POMODORO') setTimeLeft(timerConfig.work * 60);
      else setTimeLeft(0);
    });
  };

  const handlePresetChange = (preset) => {
    handleSafeAction(() => {
      setTimerConfig(preset);
      setIsActive(false);
      setTimerMode('WORK');
      setTimeLeft(preset.work * 60);
      setCycles(0);
    });
  };

  const handleReset = () => {
    handleSafeAction(() => {
        resetTimer();
    });
  };

  const handlePlayPause = () => {
    if (!selectedTopic) {
      setShowTopicWarning(true);
      setTimeout(() => setShowTopicWarning(false), 2000);
      return;
    }
    setIsActive(!isActive);
  };

  const handleFinish = () => {
     setIsActive(false);
     setIsFinishModalOpen(true);
  };

  const submitSession = (e) => {
    e.preventDefault();
    const mins = Math.round((timerType === 'FLOW' ? flowTotalTime : elapsedTime) / 60);
    if (mins >= 1) {
        addSession(mins, finishForm.notes, null, finishForm.questions, finishForm.errors, selectedTopic);
        triggerCelebration();
    }
    resetTimer();
    setFinishForm({ notes: "", questions: "", errors: "" });
    setIsFinishModalOpen(false);
  };

  const handleCreateTask = (e) => {
      e.preventDefault();
      if (!taskText.trim() || !selectedSubjectId || !selectedTopic) return;
      addTask(taskText, selectedSubjectId, selectedTopic); 
      setTaskText(""); 
  };

  // --- Renderização ---

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fadeIn space-y-6">
      
      {/* 1. Contexto (Matéria e Tópico) - A "Ignição" */}
      <Card className={`p-4 transition-all duration-300 ${showTopicWarning ? 'ring-2 ring-red-500 shadow-red-500/20' : 'hover:shadow-md'}`}>
         <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-1/2 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><BookOpen size={16}/></div>
                <select 
                    disabled={isActive}
                    value={selectedSubjectId || ''} 
                    onChange={(e) => { setSelectedSubjectId(Number(e.target.value)); setSelectedTopic(""); }} 
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 outline-none focus:border-primary appearance-none disabled:opacity-50 transition-all"
                >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="w-full md:w-1/2 relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${!selectedTopic ? 'text-red-400' : 'text-zinc-400'}`}><Layers size={16}/></div>
                <select 
                    disabled={isActive || !selectedSubjectId}
                    value={selectedTopic} 
                    onChange={(e) => { setSelectedTopic(e.target.value); setShowTopicWarning(false); }} 
                    className={`w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border rounded-xl text-sm font-bold outline-none appearance-none disabled:opacity-50 transition-all
                        ${!selectedTopic && showTopicWarning ? 'border-red-400 text-red-500' : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:border-primary'}
                    `}
                >
                    <option value="">Selecione um Tópico (Obrigatório)</option>
                    {availableTopics.map((topic, idx) => <option key={idx} value={topic}>{topic}</option>)}
                </select>
            </div>
         </div>
      </Card>

      {/* 2. Timer Principal e Controles */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-white dark:bg-[#0A0A0A] dark:border dark:border-zinc-800 rounded-3xl min-h-[500px] flex flex-col items-center justify-center p-8">
        
        {/* Switcher de Modo */}
        <div className="absolute top-8 w-full px-8">
             <ModeToggle current={timerType} onSelect={handleModeSwitch} />
        </div>

        {/* Display do Timer */}
        <div className="flex flex-col items-center justify-center flex-1 z-10 mt-12">
             <div className={`mb-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 shadow-sm
                ${timerMode === 'WORK' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                }`}
             >
                {timerMode === 'WORK' ? <Zap size={12}/> : <Coffee size={12}/>}
                {timerMode === 'WORK' ? 'Deep Focus' : 'Recharge'}
             </div>

             <div className="text-[8rem] md:text-[10rem] leading-none font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter tabular-nums select-none font-mono filter drop-shadow-sm">
                {formatTime(timeLeft)}
             </div>

             {/* Informações Auxiliares */}
             <div className="mt-8 flex flex-col items-center gap-3">
                 {timerType === 'POMODORO' ? (
                     <>
                        <div className="flex gap-2">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className={`w-3 h-1.5 rounded-full transition-all ${i < (cycles % 4) ? 'bg-blue-500 w-6' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                             ))}
                        </div>
                        {/* Configuração Rápida Pomodoro */}
                        {!isActive && (
                            <div className="flex gap-2 mt-4 animate-fadeIn">
                                <PresetBadge 
                                    active={timerConfig.work === 30} 
                                    label="30/5" 
                                    onClick={() => handlePresetChange(POMODORO_PRESETS.SHORT)} 
                                />
                                <PresetBadge 
                                    active={timerConfig.work === 50} 
                                    label="50/10" 
                                    onClick={() => handlePresetChange(POMODORO_PRESETS.LONG)} 
                                />
                            </div>
                        )}
                     </>
                 ) : (
                     <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                        <Clock size={14} /> 
                        <span>Total Sessão: {formatTime(flowTotalTime)}</span>
                     </div>
                 )}
             </div>
        </div>

        {/* Barra de Ação Inferior */}
        <div className="w-full mt-12 flex items-center justify-center gap-6">
             {/* Reset / Flow Break */}
             <button 
                onClick={timerType === 'FLOW' && timerMode === 'WORK' ? startFlowBreak : handleReset}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                title={timerType === 'FLOW' ? "Pausa Rápida" : "Resetar"}
             >
                 {timerType === 'FLOW' && timerMode === 'WORK' ? <Coffee size={24}/> : <RotateCcw size={24}/>}
             </button>

             {/* PLAY / PAUSE (Principal) */}
             <button 
                onClick={handlePlayPause}
                disabled={!selectedTopic && !isActive}
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed
                    ${isActive 
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-4 border-zinc-100 dark:border-zinc-700' 
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
                    }`}
             >
                 {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-2"/>}
             </button>

             {/* Finalizar */}
             <button 
                onClick={handleFinish}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                title="Finalizar e Salvar"
             >
                 <CheckCircle2 size={24}/>
             </button>
        </div>
      </Card>

      {/* 3. Painel de Tarefas Compacto */}
      {selectedTopic && (
          <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black/20">
                  <h3 className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2">
                      <List size={14}/> Tarefas: {selectedTopic}
                  </h3>
                  <div className="flex gap-2">
                      <input 
                        className="bg-transparent border-none text-sm outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 w-48 text-right"
                        placeholder="Adicionar tarefa rápida..."
                        value={taskText}
                        onChange={e => setTaskText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTask(e)}
                      />
                      <button onClick={handleCreateTask} disabled={!taskText} className="text-primary disabled:opacity-30"><Plus size={18}/></button>
                  </div>
              </div>
              <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {filteredTasks.length === 0 && (
                      <p className="text-center text-zinc-400 text-xs py-4">Nenhuma tarefa ativa para este tópico.</p>
                  )}
                  {filteredTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 bg-white dark:bg-black/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:border-primary/30 transition-colors">
                           <button onClick={() => toggleTask(t.id)} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent hover:border-primary'}`}>
                               <CheckCircle2 size={12} fill="currentColor"/>
                           </button>
                           <span className={`flex-1 text-sm font-medium ${t.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{t.text}</span>
                           <button onClick={() => deleteTask(t.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </Card>
      )}

      {/* --- MODAIS --- */}
      
      {/* Modal de Segurança */}
      <SafeActionModal 
        isOpen={safetyModal.open}
        onClose={() => setSafetyModal({ open: false, action: null })}
        onConfirm={safetyModal.action}
        title="Atenção"
        desc={safetyModal.desc}
      />

      {/* Modal de Finalização */}
      <Modal isOpen={isFinishModalOpen} onClose={() => setIsFinishModalOpen(false)} title="Sessão Concluída">
          <form onSubmit={submitSession} className="space-y-5">
              <div className="flex items-center gap-4 bg-zinc-50 dark:bg-black/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <Target size={24}/>
                  </div>
                  <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Tempo Focado</p>
                      <p className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">
                          {formatTime(timerType === 'FLOW' ? flowTotalTime : elapsedTime)}
                      </p>
                  </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">O que foi feito?</label>
                <textarea 
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-transparent focus:bg-white dark:focus:bg-black border focus:border-primary rounded-xl p-3 h-24 text-sm resize-none outline-none transition-all"
                    placeholder="Resumo da sessão..."
                    value={finishForm.notes}
                    onChange={e => setFinishForm({...finishForm, notes: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Questões Feitas</label>
                      <input type="number" min="0" className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 outline-none focus:ring-2 ring-primary/20" value={finishForm.questions} onChange={e => setFinishForm({...finishForm, questions: e.target.value})}/>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Erros</label>
                      <input type="number" min="0" className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 outline-none focus:ring-2 ring-red-500/20" value={finishForm.errors} onChange={e => setFinishForm({...finishForm, errors: e.target.value})}/>
                  </div>
              </div>

              <div className="pt-2 flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setIsFinishModalOpen(false)} className="flex-1">Descartar</Button>
                  <Button type="submit" className="flex-[2]">Salvar Progresso</Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};