import React, { useState, useContext, useMemo, useEffect } from 'react';
import { 
    Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Clock, Trash2, 
    Watch, CornerDownRight, AlertTriangle, BookOpen, Mic, Ear, Type, Eye, X 
} from 'lucide-react';
import { FocusContext, formatTime } from '../../context/FocusContext';
import { LanguageContext } from '../../context/LanguageContext';
import { triggerCelebration } from '../../utils/celebration';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// --- HOOK CUSTOMIZADO PARA O FORMULÁRIO DE IDIOMAS ---
const useLanguageForm = () => {
    const [langForm, setLangForm] = useState({
        words: [],
        currentWord: '',
        hasGrammar: false,
        grammarText: '',
        skills: [],
        materials: [] // Transformado em array [{ name, minutes }]
    });

    const handleAddWord = (e) => {
        if(e) e.preventDefault();
        if (langForm.currentWord.trim()) {
            setLangForm(p => ({ ...p, words: [...p.words, p.currentWord.trim()], currentWord: '' }));
        }
    };

    const handleKeyDownWord = (e) => {
        if (e.key === 'Enter') handleAddWord(e);
    };

    const removeWord = (idx) => setLangForm(p => ({ ...p, words: p.words.filter((_, i) => i !== idx) }));
    
    const toggleSkill = (skill) => setLangForm(p => ({
        ...p, skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill]
    }));

    const resetLangForm = () => setLangForm({ words: [], currentWord: '', hasGrammar: false, grammarText: '', skills: [], materials: [] });

    return { langForm, setLangForm, handleAddWord, handleKeyDownWord, removeWord, toggleSkill, resetLangForm };
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
    accumulatedTime, setAccumulatedTime,
    themes,
    timerConfig, setTimerConfig
  } = useContext(FocusContext);

  // Contexto de Idiomas
  const { getTheme, addLanguageSession, languageMaterials, activeLanguage } = useContext(LanguageContext);
  const langTheme = getTheme();

  // ID e Matéria Virtual de Idiomas
  const LANG_SUBJECT_ID = 999999;
  
  const languagePseudoSubject = useMemo(() => langTheme ? { 
      id: LANG_SUBJECT_ID, 
      name: `Idiomas - ${langTheme.name}`, 
      color: langTheme.colors.primary, 
      isLanguage: true 
  } : null, [langTheme]);

  const displaySubjects = useMemo(() => 
    languagePseudoSubject ? [...subjects, languagePseudoSubject] : subjects
  , [subjects, languagePseudoSubject]);

  const currentMaterials = languageMaterials.filter(m => m.languageId === activeLanguage);

  const [taskT, setTaskT] = useState(""); 
  const [finMod, setFinMod] = useState(false); 
  const [manMod, setManMod] = useState(false);
  const [langFinMod, setLangFinMod] = useState(false);
  
  const [mForm, setMForm] = useState({ t: "", n: "", s: "", q: "", e: "", topic: "" });
  const [fForm, setFForm] = useState({ n: "", q: "", e: "" }); 
  const [manualDate, setManualDate] = useState('');
  
  const [switchModal, setSwitchModal] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  
  const { langForm, setLangForm, handleAddWord, handleKeyDownWord, removeWord, toggleSkill, resetLangForm } = useLanguageForm();

  const isCurrentSubCursinho = useMemo(() => subjects.find(s => s.id === selectedSubjectId)?.isCursinho, [subjects, selectedSubjectId]);
  const isManSubCursinho = useMemo(() => subjects.find(s => s.id === Number(mForm.s))?.isCursinho, [subjects, mForm.s]);
  const isManSubLanguage = useMemo(() => Number(mForm.s) === LANG_SUBJECT_ID, [mForm.s]);

  // Cálculo de tempo dinâmico dos materiais
  const totalMaterialTime = langForm.materials.reduce((acc, m) => acc + (Number(m.minutes) || 0), 0);

  const finishLanguageTimer = (e) => {
      e.preventDefault();
      const timerTotalSeconds = accumulatedTime + elapsedTime;
      // Se preencheu tempo nos materiais, o tempo total é a soma deles. Se não, usa o do relógio.
      const mins = totalMaterialTime > 0 ? totalMaterialTime : Math.round(timerTotalSeconds / 60); 
      
      if (mins > 0) {
          addLanguageSession(mins, langForm.words, langForm.grammarText, langForm.skills, langForm.materials);
          addSession(mins, "Prática de Idioma", LANG_SUBJECT_ID, 0, 0, "Idioma");
          triggerCelebration(); 
      }
      
      setIsActive(false);
      setTimerMode('WORK'); 
      setTimeLeft(timerType === 'FLOW' ? 0 : timerConfig.work * 60); 
      setElapsedTime(0); 
      setCycles(0);
      setLangFinMod(false); 
      resetLangForm(); 
  };

  const manual = (e) => { 
      e.preventDefault();
      // Validação de tempo para registro manual
      const finalTime = isManSubLanguage && langForm.materials.length > 0 ? totalMaterialTime : mForm.t;
      if (!finalTime || !mForm.s) return alert("Preencha tempo e matéria."); 
      
      const tValid = Math.max(1, parseInt(finalTime) || 0);

      if (isManSubLanguage) {
          addLanguageSession(tValid, langForm.words, langForm.grammarText, langForm.skills, langForm.materials);
          addSession(tValid, "Prática de Idioma", LANG_SUBJECT_ID, 0, 0, "Idioma");
          resetLangForm();
      } else {
          addSession(tValid, mForm.n, mForm.s, mForm.q, mForm.e, mForm.topic, isManSubCursinho && manualDate ? manualDate : null);
      }

      setMForm({ t: "", n: "", s: "", q: "", e: "", topic: "" });
      setManualDate('');
      setManMod(false); 
      triggerCelebration();
  };

  // Tópicos disponíveis (Filtragem original)
  const availableTopics = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === LANG_SUBJECT_ID) return [];
    return themes
      .filter(t => t.subjectId === selectedSubjectId)
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [selectedSubjectId, themes]);

  const manualAvailableTopics = useMemo(() => {
    const sId = Number(mForm.s);
    if (!mForm.s || sId === LANG_SUBJECT_ID) return [];
    return themes
      .filter(t => t.subjectId === sId)
      .flatMap(t => t.items)
      .filter(i => !i.completed)
      .map(i => i.text);
  }, [mForm.s, themes]);

  useEffect(() => {
    if (mForm.s && isManSubCursinho) {
      setMForm(prev => ({ ...prev, t: "160", topic: "" }));
    }
  }, [mForm.s, isManSubCursinho]);

  const handleWorkTimeChange = (newWorkMinutes) => {
    const pairedBreak = newWorkMinutes === 60 ? 12 : 6;
    setTimerConfig({ work: newWorkMinutes, short: pairedBreak });
    setIsActive(false);
    setElapsedTime(0);
    setTimeLeft(timerMode === 'WORK' ? newWorkMinutes * 60 : pairedBreak * 60);
  };

  const handleBreakTimeChange = (newBreakMinutes) => {
    const pairedWork = newBreakMinutes === 12 ? 60 : 30;
    setTimerConfig({ work: pairedWork, short: newBreakMinutes });
    setIsActive(false);
    setElapsedTime(0);
    setTimeLeft(timerMode === 'BREAK' ? newBreakMinutes * 60 : pairedWork * 60);
  };

  const handleModeSwitchRequest = (newType) => {
    if (timerType === newType) return;
    if (isActive || elapsedTime > 0 || accumulatedTime > 0) {
      setPendingMode(newType);
      setSwitchModal(true);
    } else {
      executeModeSwitch(newType);
    }
  };

  const executeModeSwitch = (newType) => {
    setIsActive(false);
    setTimerType(newType);
    setTimerMode('WORK');
    setElapsedTime(0);
    setAccumulatedTime(0);
    setCycles(0);
    setTimeLeft(newType === 'POMODORO' ? timerConfig.work * 60 : 0);
    setSwitchModal(false);
    setPendingMode(null);
  };

  const finish = (e) => { 
      e.preventDefault(); 
      const totalSeconds = accumulatedTime + elapsedTime;
      const mins = Math.round(totalSeconds / 60); 
      if (mins > 0) { 
          addSession(mins, fForm.n, null, fForm.q, fForm.e, selectedTopic);
          triggerCelebration(); 
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

  const handleCreateTask = (e) => {
      e.preventDefault();
      if (!selectedTopic) return alert("Selecione um tópico acima para criar tarefas vinculadas.");
      if (taskT && selectedSubjectId) { 
          addTask(taskT, selectedSubjectId, selectedTopic); 
          setTaskT("");
      }
  };

  const filteredTasks = tasks.filter(t => t.subjectId === selectedSubjectId && t.topic === selectedTopic);

  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <header className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Modo Foco</h1>
      </header>

      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${isActive ? (timerMode === 'WORK' ? 'bg-primary/20 animate-pulse' : 'bg-emerald-500/20 animate-pulse') : 'bg-zinc-200/50 dark:bg-zinc-800/30'}`}></div>

          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 z-10 shadow-sm">
            <button onClick={() => handleModeSwitchRequest('POMODORO')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Pomodoro</button>
            <button onClick={() => handleModeSwitchRequest('FLOW')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'FLOW' ? 'bg-primary text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Flow</button>
          </div>

          <div className="w-full max-w-xs mb-6 z-10 text-center space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Matéria</label>
              <select disabled={isActive} value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(Number(e.target.value))} className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                {displaySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {!isCurrentSubCursinho && selectedSubjectId !== LANG_SUBJECT_ID && (
              <div className="animate-fadeIn">
                <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Tópico</label>
                <select 
                  disabled={isActive || !selectedSubjectId || availableTopics.length === 0} 
                  value={selectedTopic} 
                  onChange={(e) => setSelectedTopic(e.target.value)} 
                  className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                  <option value="">{selectedSubjectId ? (availableTopics.length === 0 ? "Sem tópicos" : "Selecione...") : "Selecione a matéria"}</option>
                  {availableTopics.map((topic, idx) => <option key={idx} value={topic}>{topic}</option>)}
                </select>
              </div>
            )}
          </div>

          {timerType === 'POMODORO' && (
            <div className="grid grid-cols-2 gap-8 mb-6 z-10 w-full max-w-xs px-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-2 text-primary dark:text-primary-light">
                    <Clock size={14} /> <span className="text-[10px] font-bold uppercase">Trabalho</span>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => handleWorkTimeChange(30)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.work === 30 ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}>30</button>
                    <button onClick={() => handleWorkTimeChange(60)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.work === 60 ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}>60</button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                    <Coffee size={14} /> <span className="text-[10px] font-bold uppercase">Pausa</span>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => handleBreakTimeChange(6)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.short === 6 ? 'bg-emerald-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}>6</button>
                    <button onClick={() => handleBreakTimeChange(12)} className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${timerConfig.short === 12 ? 'bg-emerald-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}>12</button>
                </div>
              </div>
            </div>
          )}

          <div className="z-10 text-center flex flex-col items-center">
            <div className="mb-6"><span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode === 'WORK' ? 'bg-primary/10 text-primary-light border-primary/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{timerMode === 'WORK' ? 'Foco Total' : 'Pausa'}</span></div>
            <div className="text-8xl md:text-9xl font-mono font-bold text-zinc-900 dark:text-white tracking-tighter mb-4 tabular-nums">{formatTime(timeLeft)}</div>

            <div className="flex gap-4 justify-center items-center mt-2">
              <button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive ? 'bg-zinc-100 dark:bg-zinc-800' : (timerMode === 'WORK' ? 'bg-primary text-white' : 'bg-emerald-500 text-white')}`}>
                {isActive ? <Pause size={24} /> : <Play size={24} />} <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
              </button>
              <button onClick={() => { setIsActive(false); setTimerMode('WORK'); setTimeLeft(timerType === 'FLOW' ? 0 : timerConfig.work * 60); setElapsedTime(0); setAccumulatedTime(0); setCycles(0); }} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 transition-colors"><RotateCcw size={24} /></button>
              <button onClick={() => { 
                setIsActive(false);
                if (selectedSubjectId === LANG_SUBJECT_ID) {
                    setLangFinMod(true);
                } else {
                    setFinMod(true);
                }
              }} className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"><CheckCircle size={24} /></button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
          <Card className="h-full flex flex-col min-h-[300px]">
            {isCurrentSubCursinho || selectedSubjectId === LANG_SUBJECT_ID ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 p-6 flex-1">
                    <BookOpen size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-medium">As tarefas não estão disponíveis para {selectedSubjectId === LANG_SUBJECT_ID ? 'Idiomas' : 'Cursinho'}.</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2"><CheckCircle size={20} className="text-primary" /> Tarefas</h3>
                        <button onClick={() => window.confirm("Apagar todas?") && deleteAllTasks()} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <form onSubmit={handleCreateTask} className="mb-4 flex gap-2">
                        <input placeholder={selectedTopic ? `Tarefa em: ${selectedTopic}` : "Selecione um tópico..."} className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50" value={taskT} onChange={e => setTaskT(e.target.value)} disabled={!selectedTopic}/>
                        <button type="submit" disabled={!selectedTopic} className="bg-primary hover:bg-primary-dark rounded-2xl px-3 text-white disabled:opacity-50"><Plus size={18} /></button>
                    </form>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredTasks.length === 0 && <p className="text-center text-zinc-400 text-sm mt-4 italic">{selectedTopic ? "Sem tarefas." : "Escolha um tópico."}</p>}
                        {filteredTasks.map(t => (
                            <div key={t.id} className="animate-fadeIn">
                                <div className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${t.completed ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-zinc-50 dark:bg-[#18181B] border-zinc-200'}`}>
                                    <button onClick={() => toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-primary border-primary' : 'border-zinc-400 hover:border-primary'}`}>{t.completed && <CheckCircle size={14} className="text-white" />}</button>
                                    <span className={`text-sm flex-1 break-words ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{t.text}</span>
                                    <button onClick={() => handleAddSubTask(t.id)} className="text-zinc-400 hover:text-primary p-1.5"><Plus size={14} /></button>
                                    <button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1.5 transition-all"><Trash2 size={16} /></button>
                                </div>
                                {t.subTasks?.map(sub => (
                                    <div key={sub.id} className="ml-6 mt-1 flex items-center gap-2 p-2 group/sub">
                                        <CornerDownRight size={12} className="text-zinc-300" />
                                        <button onClick={() => toggleSubTask(t.id, sub.id)} className={`w-4 h-4 rounded border flex items-center justify-center ${sub.completed ? 'bg-zinc-400 border-zinc-400' : 'border-zinc-300'}`}>{sub.completed && <CheckCircle size={10} className="text-white" />}</button>
                                        <span className={`text-xs flex-1 ${sub.completed ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{sub.text}</span>
                                        <button onClick={() => deleteSubTask(t.id, sub.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
          </Card>
      </div>

      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-200 dark:border-zinc-800/50 pt-10">
        <div className="bg-white dark:bg-[#09090b] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full text-center">
            <Clock size={24} className="mx-auto mb-3 text-zinc-400 opacity-50" />
            <p className="text-zinc-500 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p>
            <button onClick={() => { setMForm({ ...mForm, s: displaySubjects[0]?.id }); setManMod(true); }} className="px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary-light hover:text-white rounded-2xl border border-primary/20 transition-all font-bold text-sm shadow-lg shadow-primary/5"><Plus size={18} className="inline mr-2" /> Lançar Estudo Manual</button>
        </div>
      </div>

      {/* MODAL DE RESUMO (FIM DO TIMER) */}
      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Resumo da Sessão">
        <form onSubmit={finish} className="space-y-4">
            <div><label className="text-xs text-zinc-500 font-bold uppercase">O que você estudou?</label><textarea className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm h-24 outline-none focus:border-primary resize-none" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-zinc-500 font-bold uppercase">Questões Feitas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-blue-500" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} /></div>
                <div><label className="text-xs text-zinc-500 font-bold uppercase">Erradas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-red-500" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} /></div>
            </div>
            <div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-[2]">Salvar Sessão</Button></div>
        </form>
      </Modal>

      {/* MODAL DE RESUMO (FIM DO TIMER REAL-TIME DE IDIOMAS) */}
      <Modal isOpen={langFinMod} onClose={() => setLangFinMod(false)} title="Resumo: Prática de Idioma">
        <form onSubmit={finishLanguageTimer} className="space-y-4">
            <div className="space-y-4 animate-fadeIn mb-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Type size={14}/> Palavras Aprendidas</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="text" placeholder="Adicionar palavra..." className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-xl p-3 text-sm outline-none focus:border-primary" value={langForm.currentWord} onChange={e => setLangForm(p => ({ ...p, currentWord: e.target.value }))} onKeyDown={handleKeyDownWord}/>
                        <button type="button" onClick={handleAddWord} className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl transition-colors"><Plus size={16}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {langForm.words.map((w, idx) => (
                            <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{w} <button type="button" onClick={() => removeWord(idx)}><X size={12}/></button></span>
                        ))}
                    </div>
                </div>
                <div className="bg-zinc-50 dark:bg-[#09090b] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setLangForm(p => ({...p, hasGrammar: !p.hasGrammar}))}>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">Aprendeu gramática?</span>
                        <div className={`w-10 h-6 rounded-full px-1 flex items-center ${langForm.hasGrammar ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${langForm.hasGrammar ? 'translate-x-4' : ''}`}/></div>
                    </div>
                    {langForm.hasGrammar && <textarea className="w-full mt-3 bg-white dark:bg-black border border-zinc-200 rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-20 animate-fadeIn" placeholder="Regras..." value={langForm.grammarText} onChange={e => setLangForm(p => ({ ...p, grammarText: e.target.value }))}/>}
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[ { id: 'escuta', l: 'Escuta', i: Ear }, { id: 'leitura', l: 'Leitura', i: Eye }, { id: 'fala', l: 'Fala', i: Mic }, { id: 'escrita', l: 'Escrita', i: BookOpen } ].map(s => (
                            <button type="button" key={s.id} onClick={() => toggleSkill(s.id)} className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${langForm.skills.includes(s.id) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><s.i size={16}/> {s.l}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Materiais e Tempo Opcional</label>
                    <div className="flex flex-wrap gap-2">
                        {currentMaterials.map(m => {
                            const isSel = langForm.materials.some(x => x.name === m.name);
                            return (
                                <button type="button" key={m.id} onClick={() => {
                                    setLangForm(p => {
                                        if(isSel) return {...p, materials: p.materials.filter(x => x.name !== m.name)};
                                        return {...p, materials: [...p.materials, { name: m.name, minutes: '' }]};
                                    })
                                }} className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${isSel ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>{m.name}</button>
                            )
                        })}
                        {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Nenhum material cadastrado.</span>}
                    </div>
                    {langForm.materials.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-fadeIn mt-2">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                            <input type="number" min="1" placeholder="Minutos" className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none focus:border-primary" value={m.minutes} onChange={e => {
                                setLangForm(p => ({
                                    ...p,
                                    materials: p.materials.map(x => x.name === m.name ? { ...x, minutes: e.target.value } : x)
                                }))
                            }}/>
                        </div>
                    ))}
                    {langForm.materials.length > 0 && <p className="text-xs text-primary mt-2">*A soma dos minutos substituirá o tempo automático do relógio.</p>}
                </div>
            </div>
            <div className="pt-2 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setLangFinMod(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-[2]">Salvar Sessão</Button>
            </div>
        </form>
      </Modal>

      {/* MODAL DE REGISTRO MANUAL (COM LÓGICA DE IDIOMAS) */}
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual">
        <form onSubmit={manual} className="space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Matéria</label>
                <select required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 outline-none focus:border-primary" value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value, topic: "" })}>
                    {displaySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {!isManSubLanguage && !isManSubCursinho && (
              <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Tópico</label>
                  <select 
                      className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-primary disabled:opacity-50"
                      value={mForm.topic} onChange={e => setMForm({ ...mForm, topic: e.target.value })}
                      disabled={!mForm.s || manualAvailableTopics.length === 0}
                  >
                      <option value="">{!mForm.s ? "Selecione a matéria" : (manualAvailableTopics.length === 0 ? "Sem tópicos" : "Selecione...")}</option>
                      {manualAvailableTopics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                  </select>
              </div>
            )}

            {isManSubCursinho && (
                <div className="space-y-2 animate-fadeIn">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Data do Estudo</label>
                    <input type="date" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-primary" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tempo Total (min)</label>
                <input required type="number" min="1" 
                    className={`w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-primary ${isManSubLanguage && langForm.materials.length > 0 ? 'bg-zinc-200 dark:bg-zinc-800 cursor-not-allowed opacity-80' : ''}`} 
                    value={isManSubLanguage && langForm.materials.length > 0 ? totalMaterialTime : mForm.t} 
                    onChange={e => setMForm({ ...mForm, t: e.target.value })}
                    readOnly={isManSubLanguage && langForm.materials.length > 0} 
                />
            </div>

            {!isManSubLanguage ? (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Diário</label>
                        <textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 h-28 outline-none focus:border-primary resize-none text-sm" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-zinc-500 uppercase">Feitas</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-blue-500" value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} /></div>
                        <div><label className="text-xs font-bold text-zinc-500 uppercase">Erradas</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-2xl p-3 outline-none focus:border-red-500" value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} /></div>
                    </div>
                </>
            ) : (
                <div className="space-y-4 animate-fadeIn border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Type size={14}/> Palavras Aprendidas</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="text" placeholder="Adicionar palavra..." className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 rounded-xl p-3 text-sm outline-none focus:border-primary" value={langForm.currentWord} onChange={e => setLangForm(p => ({ ...p, currentWord: e.target.value }))} onKeyDown={handleKeyDownWord}/>
                            <button type="button" onClick={handleAddWord} className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl transition-colors"><Plus size={16}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {langForm.words.map((w, idx) => (
                                <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{w} <button type="button" onClick={() => removeWord(idx)}><X size={12}/></button></span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#09090b] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setLangForm(p => ({...p, hasGrammar: !p.hasGrammar}))}>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">Aprendeu gramática?</span>
                            <div className={`w-10 h-6 rounded-full px-1 flex items-center ${langForm.hasGrammar ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${langForm.hasGrammar ? 'translate-x-4' : ''}`}/></div>
                        </div>
                        {langForm.hasGrammar && <textarea className="w-full mt-3 bg-white dark:bg-black border border-zinc-200 rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-20 animate-fadeIn" placeholder="Regras..." value={langForm.grammarText} onChange={e => setLangForm(p => ({ ...p, grammarText: e.target.value }))}/>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[ { id: 'escuta', l: 'Escuta', i: Ear }, { id: 'leitura', l: 'Leitura', i: Eye }, { id: 'fala', l: 'Fala', i: Mic }, { id: 'escrita', l: 'Escrita', i: BookOpen } ].map(s => (
                                <button type="button" key={s.id} onClick={() => toggleSkill(s.id)} className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${langForm.skills.includes(s.id) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><s.i size={16}/> {s.l}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Materiais e Tempo Exato</label>
                        <div className="flex flex-wrap gap-2">
                            {currentMaterials.map(m => {
                                const isSel = langForm.materials.some(x => x.name === m.name);
                                return (
                                    <button type="button" key={m.id} onClick={() => {
                                        setLangForm(p => {
                                            if(isSel) return {...p, materials: p.materials.filter(x => x.name !== m.name)};
                                            return {...p, materials: [...p.materials, { name: m.name, minutes: '' }]};
                                        })
                                    }} className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${isSel ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>{m.name}</button>
                                )
                            })}
                            {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Nenhum material cadastrado.</span>}
                        </div>
                        {langForm.materials.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2 animate-fadeIn mt-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                                <input type="number" min="1" placeholder="Minutos" className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none focus:border-primary" value={m.minutes} onChange={e => {
                                    setLangForm(p => ({
                                        ...p,
                                        materials: p.materials.map(x => x.name === m.name ? { ...x, minutes: e.target.value } : x)
                                    }))
                                }}/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-primary/20">Confirmar Registro</Button>
        </form>
      </Modal>

      <Modal isOpen={switchModal} onClose={() => setSwitchModal(false)} title="Trocar de Modo?">
         <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 mb-2"><AlertTriangle size={32} /></div>
            <p className="text-zinc-600 dark:text-zinc-300">Você tem progresso não salvo.<br/><span className="font-bold text-zinc-900 dark:text-white">Trocar agora perderá o progresso do relógio.</span></p>
            <div className="flex gap-3 w-full mt-4"><Button variant="secondary" onClick={() => setSwitchModal(false)} className="flex-1">Cancelar</Button><Button onClick={() => executeModeSwitch(pendingMode)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-amber-600">Sim, continuar</Button></div>
         </div>
      </Modal>
    </div>
)};