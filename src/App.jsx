import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Zap, Target, BarChart2, Play, Pause, Coffee, RotateCcw, 
  CheckCircle, Plus, Clock, Flame, Settings, BookOpen, Quote, Trash2, Menu, X, 
  History, ArrowLeft, Calendar, AlertTriangle, Infinity as InfinityIcon, List, 
  CheckSquare, Download, Upload, ChevronDown, ChevronRight
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarTab } from './components/CalendarTab';

/**
 * --- CONFIGURAÇÕES ---
 */
const POMODORO_WORK = 25 * 60; 
const POMODORO_SHORT_BREAK = 5 * 60; 
const POMODORO_LONG_BREAK = 15 * 60; 

const QUOTES = [
  "A persistência é o caminho do êxito.", "Foco é dizer não.",
  "O sucesso é a soma de pequenos esforços.", "Feito é melhor que perfeito.",
  "A disciplina é a mãe do sucesso.",
];

const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Programação', color: '#8b5cf6', goalHours: 20 },
  { id: 2, name: 'Matemática', color: '#10b981', goalHours: 10 },
  { id: 3, name: 'Inglês', color: '#f59e0b', goalHours: 5 },
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

/**
 * --- CONTEXTO GLOBAL ---
 */
export const FocusContext = createContext();

const FocusProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  const [subjects, setSubjects] = useStickyState(DEFAULT_SUBJECTS, 'focus_subjects');
  const [sessions, setSessions] = useStickyState([], 'focus_sessions');
  const [tasks, setTasks] = useStickyState([], 'focus_tasks');
  const [mistakes, setMistakes] = useStickyState([], 'focus_mistakes');
  const [themes, setThemes] = useStickyState([], 'focus_themes'); 

  const [timerMode, setTimerMode] = useState('WORK'); 
  const [timerType, setTimerType] = useState('POMODORO'); 
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [flowStoredTime, setFlowStoredTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.find(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // CORREÇÃO DOS IDs DUPLICADOS (Cura automática ao iniciar)
  useEffect(() => {
    const healData = () => {
      const healedThemes = themes.map(theme => {
        const uniqueItems = theme.items.map((item, index) => {
          return { ...item, id: item.id + (Math.random() * (index + 1)) };
        });
        return { ...theme, items: uniqueItems };
      });
      if (JSON.stringify(themes) !== JSON.stringify(healedThemes)) {
        setThemes(healedThemes);
      }
    };
    if (themes.length > 0) healData();
  }, []);

  // --- CORREÇÃO DO TÍTULO DA ABA ---
  useEffect(() => {
    if (isActive) {
      const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      const modeText = timerMode === 'WORK' ? 'Foco' : 'Pausa';
      document.title = `${mins}:${secs} - ${modeText}`;
    } else {
      document.title = "Focus App";
    }
  }, [isActive, timeLeft, timerMode]);

  // Lógica do Timer
  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (timerMode === 'WORK') setElapsedTime(prev => prev + 1);
      
      if (timerType === 'FLOW' && timerMode === 'WORK') {
        interval = setInterval(() => setTimeLeft(t => t + 1), 1000);
      } else if (timeLeft > 0) {
        interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      } else if (timeLeft === 0 && !(timerType === 'FLOW' && timerMode === 'WORK')) {
        clearInterval(interval);
        try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play().catch(() => {}); } catch(e){}

        if (timerType === 'POMODORO') {
          if (timerMode === 'WORK') {
            const nextCycle = cycles + 1;
            setCycles(nextCycle);
            setTimerMode('BREAK');
            setTimeLeft(nextCycle % 3 === 0 ? POMODORO_LONG_BREAK : POMODORO_SHORT_BREAK);
            setIsActive(true);
          } else {
            setTimerMode('WORK');
            setTimeLeft(POMODORO_WORK);
            setIsActive(true);
          }
        } else if (timerType === 'FLOW' && timerMode === 'BREAK') {
          setTimerMode('WORK');
          setTimeLeft(flowStoredTime);
          setIsActive(true);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, timerType, flowStoredTime, cycles]);

  // Ações
  const addSession = (minutes, notes, manualSubId = null) => {
    setSessions(prev => [...prev, { 
      id: Date.now(), 
      date: new Date().toISOString(), 
      minutes, 
      subjectId: manualSubId ? Number(manualSubId) : selectedSubjectId, 
      notes 
    }]);
  };

  const addSubject = (name, color, goalHours) => setSubjects(prev => [...prev, { id: Date.now(), name, color, goalHours: Number(goalHours) }]);
  const updateSubject = (id, newGoal) => setSubjects(prev => prev.map(s => s.id === id ? { ...s, goalHours: Number(newGoal) } : s));
  const deleteSubject = (id) => {
    if (subjects.length <= 1) return alert("Mantenha ao menos uma matéria.");
    if (window.confirm("Excluir matéria?")) {
      const remaining = subjects.filter(s => s.id !== id);
      setSubjects(remaining);
      if (selectedSubjectId === id) setSelectedSubjectId(remaining[0].id);
    }
  };

  const addTask = (text, subjectId) => setTasks(prev => [...prev, { id: Date.now(), text, completed: false, subjectId }]);
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => { if (window.confirm("Excluir tarefa?")) setTasks(prev => prev.filter(t => t.id !== id)); };
  
  const addMistake = (subId, desc, reason, sol) => setMistakes(prev => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(subId), description: desc, reason, solution: sol }, ...prev]);
  const deleteMistake = (id) => { if (window.confirm("Apagar erro?")) setMistakes(prev => prev.filter(m => m.id !== id)); };

  const addTheme = (subId, title) => setThemes(prev => [...prev, { id: Date.now(), subjectId: subId, title, items: [] }]);
  const deleteTheme = (id) => { if(window.confirm("Excluir tema?")) setThemes(prev => prev.filter(t => t.id !== id)); };
  const addThemeItem = (themeId, text) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: [...t.items, { id: Date.now() + Math.random(), text, completed: false }] } : t));
  const toggleThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) } : t));
  const deleteThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.filter(i => i.id !== itemId) } : t));

  const kpiData = useMemo(() => {
    const dates = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0;
    let curr = new Date();
    const hasToday = dates.has(curr.toDateString());
    while (true) {
      if (dates.has(curr.toDateString())) { streak++; curr.setDate(curr.getDate() - 1); }
      else { if (curr.toDateString() === new Date().toDateString() && !hasToday) { curr.setDate(curr.getDate() - 1); continue; } break; }
    }
    const todayMins = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((a, c) => a + c.minutes, 0);
    return { todayMinutes: todayMins, totalHours: (sessions.reduce((a,c)=>a+c.minutes,0)/60).toFixed(1), streak };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0);
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const mins = sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.minutes, 0);
      return { name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i], minutos: mins };
    });
  }, [sessions]);

  return (
    <FocusContext.Provider value={{
      currentView, setCurrentView, selectedHistoryDate, setSelectedHistoryDate,
      subjects, addSubject, updateSubject, deleteSubject, sessions, addSession, 
      tasks, addTask, toggleTask, deleteTask, mistakes, addMistake, deleteMistake,
      themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem, 
      timerMode, setTimerMode, timerType, setTimerType, timeLeft, setTimeLeft, isActive, setIsActive, 
      cycles, setCycles, selectedSubjectId, setSelectedSubjectId, flowStoredTime, setFlowStoredTime,
      elapsedTime, setElapsedTime, kpiData, weeklyChartData,
      resetAllData: () => { if(window.confirm("Resetar TUDO?")) { localStorage.clear(); window.location.reload(); } },
      deleteDayHistory: (d) => { if(window.confirm(`Apagar ${d}?`)) setSessions(prev => prev.filter(s => new Date(s.date).toDateString() !== d)); }
    }}>
      {children}
    </FocusContext.Provider>
  );
};

/**
 * --- COMPONENTES UI ---
 */
const Card = ({ children, className = "" }) => <div className={`bg-[#18181B] border border-gray-800 rounded-xl shadow-lg p-5 ${className}`}>{children}</div>;

const Button = ({ children, onClick, variant = 'primary', className = "" }) => {
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
  };
  return <button onClick={onClick} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}>{children}</button>;
};

// --- MODAL CORRIGIDO COM PORTAL ---
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-[#18181B] border border-gray-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
        <h2 className="text-xl font-bold text-white mb-6 pr-8">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};

/**
 * --- VIEWS ---
 */
const DashboardView = () => {
  const { kpiData, weeklyChartData, setCurrentView } = useContext(FocusContext);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="mb-8"><h1 className="text-3xl font-bold text-white mb-1">Seja bem-vindo a melhor plataforma de estudos!</h1><p className="text-gray-400">Visão geral e detalhada do seu progresso.</p></header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500"><div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500"><Zap size={24}/></div><div><p className="text-sm text-gray-400">Hoje</p><p className="text-2xl font-bold text-white">{kpiData.todayMinutes} min</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-violet-500"><div className="p-3 bg-violet-500/20 rounded-full text-violet-500"><Clock size={24}/></div><div><p className="text-sm text-gray-400">Total</p><p className="text-2xl font-bold text-white">{kpiData.totalHours} h</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-orange-500"><div className="p-3 bg-orange-500/20 rounded-full text-orange-500"><Flame size={24}/></div><div><p className="text-sm text-gray-400">Sequência</p><p className="text-2xl font-bold text-white">{kpiData.streak} dias</p></div></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-violet-500"/> Atividade Semanal</h3>
          <div className="h-[250px] w-full"><ResponsiveContainer><LineChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#71717a" tick={{fill:'#a1a1aa',fontSize:12}} axisLine={false}/><YAxis stroke="#71717a" tick={{fill:'#a1a1aa'}} axisLine={false}/><Tooltip contentStyle={{backgroundColor:'#18181B',borderColor:'#3f3f46',color:'#fff'}}/><Line type="monotone" dataKey="minutos" stroke="#8b5cf6" strokeWidth={3} dot={{r:4,fill:'#8b5cf6'}}/></LineChart></ResponsiveContainer></div>
        </Card>
        
        {/* CARD COM FRASE ATUALIZADA (OPÇÃO "DEEP WORK") */}
        <Card className="bg-gradient-to-br from-violet-900/40 to-[#18181B] border-violet-500/30 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] group-hover:bg-violet-500/20 transition-all duration-500"></div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Trabalho Profundo <InfinityIcon size={18} className="text-violet-400"/>
            </h3>
            <p className="text-gray-300 mb-6 italic text-sm border-l-2 border-violet-500/50 pl-3">
              "A superficialidade não constrói impérios."
            </p>
          </div>
          <Button onClick={() => setCurrentView('focus')} className="w-full py-4 text-lg shadow-lg shadow-violet-900/20 hover:shadow-violet-600/40 border border-white/5">
            Mergulhar no Foco <Zap size={20} className="fill-current"/>
          </Button>
        </Card>
      </div>
    </div>
  );
};

const FocusView = () => {
  const { timerType, setTimerType, subjects, selectedSubjectId, setSelectedSubjectId, timerMode, setTimerMode, timeLeft, setTimeLeft, isActive, setIsActive, cycles, setCycles, tasks, addTask, toggleTask, deleteTask, addSession, elapsedTime, setElapsedTime, flowStoredTime, setFlowStoredTime } = useContext(FocusContext);
  const [notes, setNotes] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  
  // Estados para Registro Manual
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualSubId, setManualSubId] = useState("");

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualMinutes || !manualSubId) return alert("Preencha o tempo e a matéria.");
    addSession(parseInt(manualMinutes), manualNotes, manualSubId);
    setManualMinutes(""); setManualNotes(""); setIsManualOpen(false);
    alert("Estudo registrado manualmente!");
  };

  const handleFinish = () => {
    const mins = Math.round(elapsedTime / 60);
    if (mins > 0) { addSession(mins, notes); setNotes(""); alert(`Sessão salva: ${mins} min.`); }
    else alert("Tempo insuficiente para salvar.");
    setIsActive(false); setTimerMode('WORK'); setTimeLeft(timerType==='FLOW'?0:POMODORO_WORK); setElapsedTime(0); setCycles(0);
  };

  if(!subjects.length) return <div className="text-center mt-20 text-gray-400">Adicione matérias em Metas.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${isActive ? (timerMode==='WORK'?'bg-violet-600 animate-pulse':'bg-emerald-500 animate-pulse'):'bg-gray-700'}`}></div>
          <div className="flex bg-[#0F0F12] p-1 rounded-lg border border-gray-800 mb-6 z-10">
            <button onClick={()=> {setIsActive(false); setTimerType('POMODORO'); setTimeLeft(POMODORO_WORK); setTimerMode('WORK');}} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timerType==='POMODORO'?'bg-zinc-800 text-white shadow':'text-gray-500'}`}>Pomodoro</button>
            <button onClick={()=> {setIsActive(false); setTimerType('FLOW'); setTimeLeft(0); setTimerMode('WORK');}} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timerType==='FLOW'?'bg-violet-600 text-white shadow':'text-gray-500'}`}>Flow</button>
          </div>
          <div className="w-full max-w-xs mb-8 z-10 text-center">
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Matéria</label>
            <select disabled={isActive} value={selectedSubjectId||''} onChange={(e)=>setSelectedSubjectId(Number(e.target.value))} className="w-full bg-[#27272A] text-white border border-gray-700 rounded-lg py-2 px-4 outline-none cursor-pointer">
              {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="z-10 text-center">
            <div className="mb-6"><span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode==='WORK'?'bg-violet-500/10 text-violet-400 border-violet-500/20':'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{timerMode==='WORK'?'Foco Total':'Pausa'}</span></div>
            <div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter mb-4 tabular-nums drop-shadow-2xl">{formatTime(timeLeft)}</div>
            <div className="text-gray-400 mb-8 font-medium">Ciclos: <span className="text-white font-bold ml-2">{cycles}</span></div>
            <div className="flex gap-4 justify-center items-center mt-8">
              <button onClick={()=>setIsActive(!isActive)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive?'bg-zinc-800 text-white border border-zinc-700':(timerMode==='WORK'?'bg-violet-600 text-white':'bg-emerald-500 text-white')}`}>
                {isActive ? <Pause size={24}/> : <Play size={24}/>} <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
              </button>
              <button onClick={()=> {setIsActive(false); setTimeLeft(timerType==='FLOW'?0:POMODORO_WORK); setElapsedTime(0);}} className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"><RotateCcw size={24}/></button>
              {timerType==='FLOW' && timerMode==='WORK' && <button onClick={()=> {setFlowStoredTime(timeLeft); setTimerMode('BREAK'); setTimeLeft(Math.floor(timeLeft*0.2)); setIsActive(true);}} className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><Coffee size={24}/></button>}
              <button onClick={handleFinish} className="p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"><CheckCircle size={24}/></button>
            </div>
            {timerType==='FLOW'&&timerMode==='WORK'&&<p className="text-xs text-zinc-500 mt-4">Clique no <Coffee size={12} className="inline"/> para pausa.</p>}
          </div>
        </Card>
        <Card><h3 className="text-lg font-semibold text-white mb-3">Diário da Sessão</h3><textarea className="w-full bg-[#0F0F12] border border-gray-800 rounded-lg p-3 text-gray-300 outline-none resize-none h-24 text-sm" placeholder="O que estudou?" value={notes} onChange={e=>setNotes(e.target.value)}/></Card>
      </div>
      
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-violet-500"/> Tarefas</h3>
          <form onSubmit={e=>{e.preventDefault(); if(newTaskText&&selectedSubjectId){addTask(newTaskText,selectedSubjectId);setNewTaskText("");}}} className="mb-4 flex gap-2"><input placeholder="Nova tarefa..." className="flex-1 bg-[#0F0F12] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)}/><button type="submit" className="bg-violet-600 rounded-lg px-3 text-white"><Plus size={18}/></button></form>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{tasks.filter(t=>t.subjectId===selectedSubjectId).map(t=>(<div key={t.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${t.completed?'bg-violet-900/10 border-violet-500/20 opacity-60':'bg-[#27272A] border-gray-700'}`}><button onClick={()=>toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${t.completed?'bg-violet-500 border-violet-500':'border-gray-500'}`}>{t.completed&&<CheckCircle size={14} className="text-white"/>}</button><span className={`text-sm flex-1 break-words ${t.completed?'text-gray-500 line-through':'text-gray-200'}`}>{t.text}</span><button onClick={()=>deleteTask(t.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>))}</div>
        </Card>
      </div>

      {/* --- BOTÃO DE REGISTRO MANUAL COM VISUAL MELHORADO --- */}
      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-800/50 pt-10">
        <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50 max-w-md w-full text-center backdrop-blur-sm">
          <Clock size={24} className="mx-auto mb-3 text-zinc-500 opacity-50" />
          <p className="text-zinc-400 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p>
          <button 
            onClick={() => { setManualSubId(subjects[0]?.id); setIsManualOpen(true); }}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl border border-violet-500/20 transition-all duration-300 font-bold text-sm shadow-lg shadow-violet-500/5"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Enviar estudo manualmente
          </button>
        </div>
      </div>

      <Modal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} title="Registro Manual">
        <form onSubmit={handleManualSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Matéria</label>
            <select required className="w-full bg-[#0F0F12] border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-colors" value={manualSubId} onChange={e => setManualSubId(e.target.value)}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tempo (minutos)</label>
            <input required type="number" min="1" placeholder="Ex: 60" className="w-full bg-[#0F0F12] border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-colors" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)}/>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Diário da Sessão</label>
            <textarea className="w-full bg-[#0F0F12] border border-zinc-800 rounded-xl p-3 text-white h-28 outline-none focus:border-violet-500 transition-colors resize-none text-sm" placeholder="Resumo..." value={manualNotes} onChange={e => setManualNotes(e.target.value)}/>
          </div>
          <Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-violet-600/20">Confirmar Registro</Button>
        </form>
      </Modal>
    </div>
  );
};

const MistakesView = () => {
  const { subjects, mistakes, addMistake, deleteMistake } = useContext(FocusContext);
  const [f, setF] = useState({ sub:"", desc:"", r:"Conceito", sol:"" });
  const sub = (e) => { e.preventDefault(); if(f.sub&&f.desc&&f.sol){ addMistake(f.sub,f.desc,f.r,f.sol); setF({ sub:"", desc:"", r:"Conceito", sol:"" }); alert("Salvo!"); }};
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header><h1 className="text-2xl font-bold text-white mb-1">Caderno de Erros</h1></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Novo Erro</h3>
          <form onSubmit={sub} className="space-y-4">
            <div><label className="text-xs text-gray-500 font-bold uppercase">Matéria</label><select required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-2.5 text-white" value={f.sub} onChange={e=>setF({...f,sub:e.target.value})}><option value="">Selecione...</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Motivo</label><div className="flex flex-wrap gap-2 mt-2">{["Falta de Atenção","Esqueci Fórmula","Erro Cálculo","Conceito","Tempo"].map(r=><button key={r} type="button" onClick={()=>setF({...f,r})} className={`text-xs px-3 py-1.5 rounded-full border ${f.r===r?'bg-violet-600 border-violet-600 text-white':'border-gray-700 text-gray-400'}`}>{r}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Erro</label><textarea required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-3 text-sm text-white h-20" value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}/></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Solução</label><textarea required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-3 text-sm text-white h-24" value={f.sol} onChange={e=>setF({...f,sol:e.target.value})}/></div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">{mistakes.length===0?<div className="text-center py-10 opacity-50"><CheckCircle size={40} className="mx-auto mb-2"/><p>Vazio.</p></div>:mistakes.map(m=><div key={m.id} className="bg-[#18181B] border border-gray-800 rounded-xl p-5 relative group hover:border-gray-700"><button onClick={()=>deleteMistake(m.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button><div className="flex items-center gap-3 mb-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{backgroundColor:subjects.find(s=>s.id===m.subjectId)?.color}}>{subjects.find(s=>s.id===m.subjectId)?.name}</span><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{m.reason}</span></div><div className="grid md:grid-cols-2 gap-6"><div className="space-y-1"><p className="text-xs text-red-400 font-bold uppercase">Erro</p><p className="text-gray-300 text-sm">{m.description}</p></div><div className="space-y-1 md:border-l md:border-gray-800 md:pl-6"><p className="text-xs text-green-400 font-bold uppercase">Solução</p><p className="text-gray-300 text-sm">{m.solution}</p></div></div></div>)}</div>
      </div>
    </div>
  );
};

const GoalsView = () => {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem } = useContext(FocusContext);
  const [viewSub, setViewSub] = useState(null); 
  const [col, setCol] = useState({});
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ name:"", goal:10, color:"#8b5cf6" });
  const [edit, setEdit] = useState({ id:null, val:"" });
  const [newTheme, setNewTheme] = useState("");

  const prog = (sId, g) => { const m = sessions.filter(s=>s.subjectId===sId).reduce((a,b)=>a+b.minutes,0); return { c:(m/60).toFixed(1), p:Math.min(100,(m/(g*60))*100) }; };
  const addS = (e) => { e.preventDefault(); if(f.name){ addSubject(f.name,f.color,f.goal); setModal(false); setF({name:"",goal:10,color:"#8b5cf6"}); }};
  const addT = () => { if(newTheme&&viewSub){ addTheme(viewSub,newTheme); setNewTheme(""); }};
  const addI = (e, tId) => { e.preventDefault(); const v=e.target.item.value; if(v){ addThemeItem(tId,v); e.target.reset(); }};
  const pasteI = (e, tId) => { const d=e.clipboardData.getData('text'); if(d.includes('\n')){ e.preventDefault(); d.split('\n').map(l=>l.trim()).filter(l=>l).forEach(l=>addThemeItem(tId,l)); }};

  if (viewSub) {
    const s = subjects.find(x => x.id === viewSub);
    if(!s) return <div onClick={()=>setViewSub(null)}>Erro. Voltar.</div>;
    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <button onClick={()=>setViewSub(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white"><ArrowLeft size={20}/> Voltar</button>
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6"><div><span className="text-xs font-bold uppercase px-2 py-1 rounded text-white mb-2 inline-block" style={{backgroundColor:s.color}}>{s.name}</span><h1 className="text-3xl font-bold text-white">Conteúdo</h1></div><div className="text-right text-2xl font-bold text-white">{s.goalHours}h</div></header>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex gap-4 items-center"><div className="flex-1"><label className="text-xs text-zinc-500 uppercase font-bold mb-1">Novo Tema</label><input className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white" value={newTheme} onChange={e=>setNewTheme(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addT()}/></div><Button onClick={addT}>Adicionar</Button></div>
        <div className="space-y-6">{themes.filter(t=>t.subjectId===s.id).map(t=>{
          const p = t.items.length ? Math.round((t.items.filter(i=>i.completed).length/t.items.length)*100) : 0;
          return (
            <Card key={t.id} className="relative group transition-all duration-300">
              <div className="flex justify-between items-start mb-4"><div className="flex gap-3 w-full"><button onClick={()=>setCol({...col,[t.id]:!col[t.id]})} className="text-zinc-500">{col[t.id]?<ChevronRight/>:<ChevronDown/>}</button><div className="flex-1"><h3 onClick={()=>setCol({...col,[t.id]:!col[t.id]})} className="text-xl font-bold text-white cursor-pointer select-none">{t.title}</h3><div className="flex items-center gap-2 mt-1"><div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-violet-500" style={{width:`${p}%`}}/></div><span className="text-xs text-zinc-500">{p}%</span></div></div></div><button onClick={()=>deleteTheme(t.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button></div>
              {!col[t.id] && <div className="space-y-2 mb-4 animate-fadeIn pl-8">{(t.items||[]).map(i=><div key={i.id} className="flex gap-3 p-2 hover:bg-zinc-800/50 rounded-lg group/item"><button onClick={()=>toggleThemeItem(t.id,i.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${i.completed?'bg-violet-600 border-violet-600':'border-zinc-600'}`}>{i.completed&&<CheckSquare size={14} className="text-white"/>}</button><span className={`text-sm flex-1 ${i.completed?'text-zinc-500 line-through':'text-zinc-200'}`}>{i.text}</span><button onClick={()=>deleteThemeItem(t.id,i.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-red-500"><X size={14}/></button></div>)}<form onSubmit={e=>addI(e,t.id)} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50"><input name="item" className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white" placeholder="Tópico (Ctrl+V para lista)..." onPaste={e=>pasteI(e,t.id)}/><button type="submit" className="p-1.5 bg-zinc-800 hover:bg-violet-600 text-white rounded"><Plus size={16}/></button></form></div>}
            </Card>
          )})}</div>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-white">Metas</h1><Button onClick={()=>setModal(true)}><Plus size={18}/> Nova</Button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{subjects.map(s=>{ const {c,p}=prog(s.id,s.goalHours); return (<Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-violet-500/50"><div onClick={()=>setViewSub(s.id)}><div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor:s.color}}/><div className="mb-4"><h3 className="text-xl font-bold text-white">{s.name}</h3>{edit.id!==s.id&&<p className="text-sm text-gray-400">Meta: {s.goalHours}h</p>}</div>{edit.id!==s.id&&(<> <div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-white">{c}h</span><span className="text-sm font-medium" style={{color:s.color}}>{Math.round(p)}%</span></div><div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{width:`${p}%`,backgroundColor:s.color}}/></div></>)}</div><div className="absolute top-4 right-4 flex gap-2">{edit.id===s.id?(<div className="flex gap-2 bg-black/80 p-1 rounded"><input type="number" className="w-16 bg-[#0F0F12] border border-gray-600 rounded px-1 text-sm text-white" value={edit.val} onChange={e=>setEdit({...edit,val:e.target.value})} autoFocus/><button onClick={()=>{updateSubject(s.id,edit.val);setEdit({id:null,val:""})}} className="text-green-400 text-xs font-bold">OK</button></div>):(<> <button onClick={e=>{e.stopPropagation();setEdit({id:s.id,val:s.goalHours})}} className="p-2 rounded bg-[#27272A]"><Settings size={16} className="text-gray-400"/></button><button onClick={e=>{e.stopPropagation();deleteSubject(s.id)}} className="p-2 rounded bg-[#27272A]"><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button></>)}</div></Card>)})}</div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Nova Matéria"><form onSubmit={addS} className="space-y-4"><div><label className="text-sm text-gray-400">Nome</label><input required className="w-full bg-[#0F0F12] border border-gray-700 rounded p-2 text-white" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div><div><label className="text-sm text-gray-400">Meta (h)</label><input required type="number" className="w-full bg-[#0F0F12] border border-gray-700 rounded p-2 text-white" value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}/></div><div><label className="text-sm text-gray-400">Cor</label><div className="flex gap-2 mt-2">{['#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444'].map(c=><div key={c} onClick={()=>setF({...f,color:c})} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${f.color===c?'border-white':'border-transparent'}`} style={{backgroundColor:c}}/>)}</div></div><Button type="submit" className="w-full mt-4">Criar</Button></form></Modal>
    </div>
  );
};

const StatsView = () => {
  const { sessions, subjects, weeklyChartData } = useContext(FocusContext);
  const ranking = useMemo(()=>subjects.map(s=>({ ...s, total:(sessions.filter(x=>x.subjectId===s.id).reduce((a,b)=>a+b.minutes,0)/60).toFixed(1) })).sort((a,b)=>b.total-a.total),[subjects,sessions]);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><h1 className="text-2xl font-bold text-white mb-6">Estatísticas</h1><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2 min-h-[300px]"><h3 className="text-white font-semibold mb-6">Semanal</h3><div className="h-[250px]"><ResponsiveContainer><BarChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#555" axisLine={false} tickLine={false}/><YAxis stroke="#555" axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#222'}} contentStyle={{backgroundColor:'#18181B',borderColor:'#333'}}/><Bar dataKey="minutos" fill="#8b5cf6" radius={[4,4,0,0]}><Cell fill="#8b5cf6"/></Bar></BarChart></ResponsiveContainer></div></Card><Card className="overflow-y-auto max-h-[350px] custom-scrollbar"><h3 className="text-white font-semibold mb-4">Ranking</h3>{ranking.map((r,i)=>(<div key={r.id} className="flex justify-between mb-3 border-b border-gray-800 pb-2"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':'bg-gray-800 text-gray-400'}`}>{i+1}</div><span className="text-white text-sm">{r.name}</span></div><span className="text-violet-400 font-bold text-sm">{r.total}h</span></div>))}</Card></div></div>
  );
};

const HistoryView = () => {
  const { sessions, setCurrentView, setSelectedHistoryDate, deleteDayHistory } = useContext(FocusContext);
  const grouped = useMemo(()=>{ const g={}; sessions.forEach(s=>{ const d=new Date(s.date).toDateString(); if(!g[d])g[d]={d:new Date(s.date),m:0,c:0}; g[d].m+=s.minutes; g[d].c++; }); return Object.values(g).sort((a,b)=>b.d-a.d); },[sessions]);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><h1 className="text-2xl font-bold text-white mb-6">Histórico</h1><div className="grid gap-4">{grouped.length===0?<p className="text-center text-gray-500 py-10">Vazio.</p>:grouped.map((g,i)=>(<Card key={i} className="flex justify-between items-center hover:bg-[#202024] cursor-pointer group"><div className="flex-1 flex gap-4 items-center" onClick={()=>{setSelectedHistoryDate(g.d);setCurrentView('report')}}><div className="w-12 h-12 bg-violet-900/20 rounded-lg flex flex-col items-center justify-center text-violet-400"><span className="font-bold text-lg">{g.d.getDate()}</span><span className="text-[10px] uppercase">{g.d.toLocaleString('pt-BR',{month:'short'})}</span></div><div><h3 className="text-white font-medium capitalize">{g.d.toLocaleString('pt-BR',{weekday:'long'})}</h3><p className="text-sm text-gray-400">{g.c} sessões • {Math.floor(g.m/60)}h {g.m%60}m</p></div></div><button onClick={()=>deleteDayHistory(g.d.toDateString())} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-900/10 rounded-full transition-colors"><Trash2 size={18}/></button></Card>))}</div></div>
  );
};

const ReportView = () => {
  const { sessions, mistakes, selectedHistoryDate, setCurrentView, subjects } = useContext(FocusContext);
  if(!selectedHistoryDate) return null;
  const dStr = selectedHistoryDate.toDateString();
  const daily = sessions.filter(s=>new Date(s.date).toDateString()===dStr).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const dailyM = mistakes.filter(m=>new Date(m.date).toDateString()===dStr);
  const t = daily.reduce((a,c)=>a+c.minutes,0);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><button onClick={()=>setCurrentView('history')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"><ArrowLeft size={18}/> Voltar</button><header className="flex flex-col md:flex-row justify-between items-center gap-6"><div><h1 className="text-2xl font-bold text-white capitalize">{selectedHistoryDate.toLocaleDateString()}</h1><p className="text-gray-400">Relatório</p></div><div className="w-32 h-32 rounded-full border-4 border-violet-500/20 flex flex-col items-center justify-center"><span className="text-2xl font-mono font-bold text-white">{Math.floor(t/60)}h {t%60}m</span><span className="text-xs uppercase text-gray-500">Total</span></div></header><div className="space-y-4">{daily.map(s=>{ const sub=subjects.find(x=>x.id===s.subjectId)||{name:'-',color:'#555'}; return (<Card key={s.id} className="relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 w-1" style={{backgroundColor:sub.color}}/><div className="flex justify-between items-start"><div className="flex-1 pl-3"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold uppercase text-white px-1.5 rounded" style={{backgroundColor:sub.color}}>{sub.name}</span><span className="text-xs text-gray-500">{new Date(s.date).toLocaleTimeString().slice(0,5)}</span></div><p className="text-sm text-gray-300">{s.notes||"Sem notas."}</p></div><span className="font-bold text-white">{s.minutes}m</span></div></Card>)})}</div>{dailyM.length>0&&(<div className="mt-8"><h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Erros</h3><div className="space-y-4">{dailyM.map(m=><Card key={m.id} className="border-red-500/20 bg-red-500/5"><p className="text-gray-300 text-sm mb-2"><strong className="text-red-400">Erro:</strong> {m.description}</p><div className="bg-zinc-900/50 p-2 rounded text-sm text-green-400 border-l-2 border-green-500"><strong className="text-green-500">Solução:</strong> {m.solution}</div></Card>)}</div></div>)}</div>
  );
};

const AppLayout = () => {
  const { currentView, setCurrentView, resetAllData } = useContext(FocusContext);
  const [menu, setMenu] = useState(false);
  const nav = [{id:'dashboard',l:'Painel',i:LayoutDashboard},{id:'focus',l:'Focar',i:Zap},{id:'mistakes',l:'Erros',i:AlertTriangle},{id:'calendar',l:'Calendário',i:Calendar},{id:'goals',l:'Metas',i:Target},{id:'stats',l:'Estatísticas',i:BarChart2},{id:'history',l:'Histórico',i:History}];
  const handleExp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('focus_')).map(k=>[k, localStorage.getItem(k)])))], {type:'application/json'})); a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); };
  const handleImp = (e) => { const f = e.target.files[0]; if(!f)return; const r = new FileReader(); r.onload=x=>{ try{const d=JSON.parse(x.target.result); if(confirm("Substituir dados?")){ Object.keys(d).forEach(k=>localStorage.setItem(k,d[k])); window.location.reload(); }}catch{alert("Erro");} }; r.readAsText(f); };

  return (
    <div className="flex h-screen bg-[#0F0F12] text-gray-300 font-sans overflow-hidden">
      <button className="md:hidden fixed top-4 right-4 z-50 p-2 bg-[#18181B] border border-gray-800 rounded-lg" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
      {menu&&<div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={()=>setMenu(false)}/>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F0F12] border-r border-gray-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${menu?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-8 flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">F</div><span className="text-xl font-bold text-white tracking-tight">Focus</span></div>
        <nav className="flex-1 px-4 space-y-2">{nav.map(i=><button key={i.id} onClick={()=>{setCurrentView(i.id);setMenu(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView===i.id?'bg-violet-600/10 text-violet-400 font-medium':'hover:bg-[#18181B] hover:text-white'}`}><i.i size={20}/>{i.l}</button>)}</nav>
        <div className="p-4 border-t border-gray-800 space-y-2"><div className="grid grid-cols-2 gap-2"><button onClick={handleExp} className="flex flex-col items-center p-2 bg-zinc-900 rounded-lg text-xs hover:text-white"><Download size={16} className="mb-1 text-violet-500"/> Exp.</button><label className="flex flex-col items-center p-2 bg-zinc-900 rounded-lg text-xs hover:text-white cursor-pointer"><Upload size={16} className="mb-1 text-emerald-500"/> Imp.<input type="file" className="hidden" onChange={handleImp}/></label></div><button onClick={resetAllData} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-900/10 rounded-lg text-xs transition-colors"><Trash2 size={14}/> Reset</button></div>
      </aside>
      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 md:ml-64 bg-[#0F0F12]">
        <div className="max-w-6xl mx-auto h-full">
           {currentView==='dashboard'&&<DashboardView/>} {currentView==='focus'&&<FocusView/>} {currentView==='calendar'&&<CalendarTab/>} {currentView==='mistakes'&&<MistakesView/>} {currentView==='goals'&&<GoalsView/>} {currentView==='stats'&&<StatsView/>} {currentView==='history'&&<HistoryView/>} {currentView==='report'&&<ReportView/>}
        </div>
      </main>
    </div>
  );
};

const App = () => ( <FocusProvider><AppLayout /><style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-thumb{background-color:#3f3f46;border-radius:20px}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn 0.4s ease-out forwards}::selection{background-color:#fff;color:#000}`}</style></FocusProvider> );
export default App;