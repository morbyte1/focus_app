import React, { useState, useContext, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Coffee, CheckCircle2, Plus, Trash2, 
  Target, Zap, Clock, List, AlertTriangle, BookOpen, Layers, MoreVertical 
} from 'lucide-react';
import { FocusContext, formatTime, POMODORO_PRESETS } from '../../context/FocusContext';
import { triggerCelebration } from '../../utils/celebration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// --- COMPONENTES AUXILIARES ---

const ModeToggle = ({ current, onSelect }) => (
  <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xs mx-auto mb-6">
    {['POMODORO', 'FLOW'].map((mode) => (
      <button
        key={mode}
        onClick={() => onSelect(mode)}
        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
          current === mode 
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
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
    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all ${
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

// --- COMPONENTE PRINCIPAL ---

export const FocusView = () => {
  const { 
    timerState, setTimerState, timerConfig, setTimerConfig,
    subjects, selectedSubjectId, setSelectedSubjectId, 
    tasks, addTask, toggleTask, deleteTask, addSubTask, toggleSubTask, deleteSubTask,
    addSession, elapsedTime, setElapsedTime, flowTotalTime, setFlowTotalTime, startFlowBreak, resetTimer,
    themes
  } = useContext(FocusContext);

  // Estados Locais
  const [selectedTopic, setSelectedTopic] = useState("");
  const [taskText, setTaskText] = useState("");
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishForm, setFinishForm] = useState({ notes: "", questions: "", errors: "" });
  const [safetyModal, setSafetyModal] = useState({ open: false, action: null });
  const [showTopicWarning, setShowTopicWarning] = useState(false);

  const { type: timerType, mode: timerMode, active: isActive, timeLeft, cycles } = timerState;

  // Filtros e Dados
  const availableTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    const subjectThemes = themes.filter(t => t.subjectId === selectedSubjectId);
    return subjectThemes.flatMap(t => t.items).filter(i => !i.completed).map(i => i.text);
  }, [selectedSubjectId, themes]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.subjectId === selectedSubjectId && (selectedTopic ? t.topic === selectedTopic : true));
  }, [tasks, selectedSubjectId, selectedTopic]);

  // Handlers Seguros
  const handleSafeAction = (actionFn) => {
    if (isActive || (timerType === 'FLOW' && flowTotalTime > 10)) {
      setSafetyModal({ 
        open: true, 
        desc: "O timer está rodando. Se continuar, o progresso da sessão atual será perdido.",
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
      setTimerState(p => ({ ...p, active: false, type: newMode, mode: 'WORK', cycles: 0, timeLeft: newMode === 'POMODORO' ? timerConfig.work * 60 : 0 }));
      setElapsedTime(0);
      setFlowTotalTime(0);
    });
  };

  const handlePresetChange = (preset) => {
    handleSafeAction(() => {
      setTimerConfig(preset);
      setTimerState(p => ({ ...p, active: false, mode: 'WORK', timeLeft: preset.work * 60, cycles: 0 }));
    });
  };

  const handlePlayPause = () => {
    if (!selectedTopic) {
      setShowTopicWarning(true);
      setTimeout(() => setShowTopicWarning(false), 2000);
      return;
    }
    setTimerState(p => ({ ...p, active: !p.active }));
  };

  const handleSubTaskCreate = (taskId) => {
      const text = prompt("Digite a sub-tarefa:");
      if(text) addSubTask(taskId, text);
  };

  // UI - Estrutura Principal
  return (
    <div className="h-full pb-24 md:pb-0 animate-fadeIn">
        {/* GRID LAYOUT: Timer (Esq) | Tarefas (Dir) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            
            {/* === COLUNA ESQUERDA: TIMER (Maior) === */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                
                <Card className="flex flex-col items-center justify-center relative overflow-hidden bg-white dark:bg-[#0A0A0A] border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl min-h-[450px] lg:min-h-[600px] p-6">
                    
                    {/* Topo: Modo e Config */}
                    <div className="w-full flex justify-center relative z-10">
                        <ModeToggle current={timerType} onSelect={handleModeSwitch} />
                    </div>

                    {/* Centro: Relógio */}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
                        <div className={`mb-8 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2
                            ${timerMode === 'WORK' 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            }`}
                        >
                            {timerMode === 'WORK' ? <Zap size={12}/> : <Coffee size={12}/>}
                            {timerMode === 'WORK' ? 'Deep Focus' : 'Descanso'}
                        </div>

                        {/* Display Gigante */}
                        <div className="text-[6rem] sm:text-[8rem] lg:text-[9rem] leading-none font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter tabular-nums select-none font-mono">
                            {formatTime(timeLeft)}
                        </div>

                        {/* Ciclos / Total */}
                        <div className="mt-8 h-8 flex items-center justify-center">
                            {timerType === 'POMODORO' ? (
                                <div className="flex gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < (cycles % 4) ? 'bg-blue-500 w-8' : 'bg-zinc-200 dark:bg-zinc-800 w-2'}`} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-lg">
                                    <Clock size={12} /> 
                                    <span>Total: {formatTime(flowTotalTime)}</span>
                                </div>
                            )}
                        </div>

                        {/* Atalhos Pomodoro (Só visível se parado) */}
                        {timerType === 'POMODORO' && !isActive && (
                            <div className="mt-6 flex gap-2 animate-fadeIn">
                                <PresetBadge active={timerConfig.work === 30} label="30/5" onClick={() => handlePresetChange(POMODORO_PRESETS.SHORT)} />
                                <PresetBadge active={timerConfig.work === 50} label="50/10" onClick={() => handlePresetChange(POMODORO_PRESETS.LONG)} />
                            </div>
                        )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="w-full flex items-center justify-center gap-4 sm:gap-8 mt-4 pb-4">
                        <button 
                            onClick={() => handleSafeAction(timerType === 'FLOW' && timerMode === 'WORK' ? startFlowBreak : resetTimer)}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800"
                            title="Resetar"
                        >
                            {timerType === 'FLOW' && timerMode === 'WORK' ? <Coffee size={22}/> : <RotateCcw size={22}/>}
                        </button>

                        <button 
                            onClick={handlePlayPause}
                            disabled={!selectedTopic && !isActive}
                            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale
                                ${isActive 
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-4 border-zinc-100 dark:border-zinc-700' 
                                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
                                }`}
                        >
                            {isActive ? <Pause size={36} fill="currentColor"/> : <Play size={36} fill="currentColor" className="ml-1.5"/>}
                        </button>

                        <button 
                            onClick={() => { setTimerState(p => ({...p, active: false})); setIsFinishModalOpen(true); }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-emerald-600 bg-zinc-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-zinc-200 dark:border-zinc-800"
                            title="Finalizar"
                        >
                            <CheckCircle2 size={22}/>
                        </button>
                    </div>
                </Card>
            </div>

            {/* === COLUNA DIREITA: CONTEXTO E TAREFAS (Sidebar Funcional) === */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 h-full">
                
                {/* 1. Seletores (Sempre visíveis) */}
                <Card className={`p-5 transition-all duration-300 border-zinc-200 dark:border-zinc-800 ${showTopicWarning ? 'ring-2 ring-red-500' : ''}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1"><BookOpen size={10}/> Matéria</label>
                            <select 
                                disabled={isActive}
                                value={selectedSubjectId || ''} 
                                onChange={(e) => { setSelectedSubjectId(Number(e.target.value)); setSelectedTopic(""); }} 
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-200 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1 ${!selectedTopic && showTopicWarning ? 'text-red-500' : 'text-zinc-400'}`}><Layers size={10}/> Tópico</label>
                            <select 
                                disabled={isActive || !selectedSubjectId}
                                value={selectedTopic} 
                                onChange={(e) => { setSelectedTopic(e.target.value); setShowTopicWarning(false); }} 
                                className={`w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl px-3 py-3 text-sm font-bold outline-none transition-all appearance-none cursor-pointer
                                    ${!selectedTopic && showTopicWarning ? 'border-red-400 text-red-500 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:border-primary'}
                                `}
                            >
                                <option value="">Selecione o Tópico...</option>
                                {availableTopics.map((topic, idx) => <option key={idx} value={topic}>{topic}</option>)}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* 2. Lista de Tarefas (Só aparece se tópico selecionado) */}
                {selectedTopic ? (
                    <Card className="flex-1 flex flex-col p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 min-h-[300px]">
                        {/* Header Tarefas */}
                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2">
                                <List size={14}/> Tarefas
                            </span>
                        </div>
                        
                        {/* Input Rápido */}
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                             <form onSubmit={(e) => { e.preventDefault(); if(taskText && selectedSubjectId && selectedTopic) { addTask(taskText, selectedSubjectId, selectedTopic); setTaskText(""); } }} className="flex gap-2">
                                <input 
                                    className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg px-3 py-2 text-sm outline-none placeholder:text-zinc-400"
                                    placeholder="+ Nova tarefa..."
                                    value={taskText}
                                    onChange={e => setTaskText(e.target.value)}
                                />
                                <button type="submit" disabled={!taskText} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors disabled:opacity-30"><Plus size={18}/></button>
                             </form>
                        </div>

                        {/* Lista Scrollável */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {filteredTasks.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <List size={24} className="mx-auto mb-2 text-zinc-300"/>
                                    <p className="text-xs text-zinc-400">Nenhuma tarefa.</p>
                                </div>
                            )}
                            {filteredTasks.map(t => (
                                <div key={t.id} className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 hover:border-primary/30 transition-all group">
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => toggleTask(t.id)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${t.completed ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600 hover:border-primary'}`}>
                                            {t.completed && <CheckCircle2 size={12} className="text-white" />}
                                        </button>
                                        <span className={`flex-1 text-sm leading-tight ${t.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{t.text}</span>
                                        
                                        {/* Ações Visíveis da Tarefa */}
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleSubTaskCreate(t.id)} 
                                                className="p-1 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                                                title="Adicionar Sub-tarefa"
                                            >
                                                <Plus size={14}/>
                                            </button>
                                            <button onClick={() => deleteTask(t.id)} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-tarefas */}
                                    {t.subTasks && t.subTasks.length > 0 && (
                                        <div className="mt-3 pl-2 ml-2 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2">
                                            {t.subTasks.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-2">
                                                    <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-3 h-3 rounded border flex items-center justify-center ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                                                        {sub.completed && <CheckCircle2 size={8} className="text-white" />}
                                                    </button>
                                                    <span className={`flex-1 text-xs ${sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}>{sub.text}</span>
                                                    <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={10}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    /* Placeholder se nenhum tópico selecionado */
                    <div className="hidden lg:flex flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl items-center justify-center text-zinc-400 flex-col gap-2 p-6 text-center">
                         <Layers size={32} className="opacity-20"/>
                         <p className="text-sm font-medium opacity-50">Selecione uma Matéria e Tópico<br/>para ver suas tarefas.</p>
                    </div>
                )}
            </div>
        </div>

        {/* MODAIS */}
        <SafeActionModal 
            isOpen={safetyModal.open}
            onClose={() => setSafetyModal({ open: false, action: null })}
            onConfirm={safetyModal.action}
            title="Atenção"
            desc={safetyModal.desc}
        />

        <Modal isOpen={isFinishModalOpen} onClose={() => setIsFinishModalOpen(false)} title="Sessão Concluída">
            <form onSubmit={(e) => {
                e.preventDefault();
                const mins = Math.round((timerType === 'FLOW' ? flowTotalTime : elapsedTime) / 60);
                if (mins >= 1) {
                    addSession(mins, finishForm.notes, null, finishForm.questions, finishForm.errors, selectedTopic);
                    triggerCelebration();
                }
                resetTimer();
                setIsFinishModalOpen(false);
            }} className="space-y-4">
                <div className="bg-zinc-50 dark:bg-black/20 p-4 rounded-xl flex items-center gap-4">
                     <Target className="text-emerald-500" size={24}/>
                     <div>
                         <p className="text-xs uppercase font-bold text-zinc-500">Tempo Total</p>
                         <p className="text-2xl font-bold">{formatTime(timerType === 'FLOW' ? flowTotalTime : elapsedTime)}</p>
                     </div>
                </div>
                <textarea className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl p-3 text-sm h-24 resize-none outline-none focus:ring-2 ring-primary/20" placeholder="Notas sobre o estudo..." value={finishForm.notes} onChange={e => setFinishForm({...finishForm, notes: e.target.value})}/>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setIsFinishModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Salvar Sessão</Button>
                </div>
            </form>
        </Modal>
    </div>
  );
};