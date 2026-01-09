import React, { useState, useEffect, useContext, createContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Zap, Target, BarChart2, Play, Pause, Coffee, RotateCcw, 
  CheckCircle, Plus, Clock, Flame, Settings, BookOpen, Quote, Trash2, Menu, X, 
  History, ArrowLeft, Calendar, AlertTriangle, Infinity as InfinityIcon, List, 
  CheckSquare, Download, Upload, ChevronDown, ChevronRight, Brain, Flag,
  FileText, Activity, Percent, Trophy, Star, Crown, Award, HardDrive,
  Sprout, Feather, Compass, Shield, Scroll
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarTab } from './components/CalendarTab';

/**
 * --- CONFIGURAÇÕES ---
 */
const POMODORO_WORK = 25 * 60; 
const POMODORO_SHORT_BREAK = 5 * 60; 
const POMODORO_LONG_BREAK = 15 * 60; 

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
 * --- LÓGICA RPG (GAMIFICAÇÃO) ---
 */
const TITLES = [
  { level: 50, title: "Sábio do Fluxo" },
  { level: 30, title: "Arquivista Mestre" },
  { level: 20, title: "Guardião da Disciplina" },
  { level: 10, title: "Explorador do Conhecimento" },
  { level: 5, title: "Aprendiz Focado" },
  { level: 1, title: "Novato Curioso" }
];

// Configuração Visual dos Ranks (Atualizado para o tema Azul onde apropriado)
const RANK_STYLES = [
  { min: 50, icon: Crown, bg: "from-[#1100ab] to-blue-500", color: "text-blue-300" }, // Top Rank agora é Azul Real
  { min: 30, icon: Scroll, bg: "from-slate-400 to-gray-200", color: "text-slate-300" },
  { min: 20, icon: Shield, bg: "from-orange-500 to-amber-600", color: "text-amber-400" },
  { min: 10, icon: Compass, bg: "from-blue-500 to-cyan-500", color: "text-cyan-400" },
  { min: 5, icon: Feather, bg: "from-emerald-500 to-green-600", color: "text-emerald-400" },
  { min: 1, icon: Sprout, bg: "from-gray-500 to-slate-600", color: "text-gray-400" }
];

const getTitleByLevel = (level) => TITLES.find(t => level >= t.level)?.title || "Novato Curioso";
const getRankStyle = (level) => RANK_STYLES.find(s => level >= s.min) || RANK_STYLES[RANK_STYLES.length - 1];

const getXPForNextLevel = (level) => Math.floor(500 * Math.pow(level, 1.5));

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
  const [countdown, setCountdown] = useStickyState({ date: null, title: '' }, 'focus_countdown');

  const [userLevel, setUserLevel] = useStickyState({
    level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso"
  }, 'focus_rpg');

  const [timerMode, setTimerMode] = useState('WORK'); 
  const [timerType, setTimerType] = useState('POMODORO'); 
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [flowStoredTime, setFlowStoredTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerEndRef = useRef(null);
  const timerStartRef = useRef(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.find(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

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

  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (timerType === 'FLOW' && timerMode === 'WORK') {
        timerStartRef.current = Date.now() - (timeLeft * 1000);
      } else {
        timerEndRef.current = Date.now() + (timeLeft * 1000);
      }
      lastTickRef.current = Date.now();

      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.round((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;

        if (timerMode === 'WORK' && deltaSeconds > 0) {
           setElapsedTime(prev => prev + deltaSeconds);
        }

        if (timerType === 'FLOW' && timerMode === 'WORK') {
           const secondsPassed = Math.floor((now - timerStartRef.current) / 1000);
           setTimeLeft(secondsPassed);
        } else {
           const remaining = Math.ceil((timerEndRef.current - now) / 1000);
           if (remaining <= 0) {
             setTimeLeft(0);
             clearInterval(interval);
             setIsActive(false);
             try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch(e){}
             if (timerType === 'POMODORO') {
                if (timerMode === 'WORK') {
                   const nextCycle = cycles + 1;
                   setCycles(nextCycle);
                   setTimerMode('BREAK');
                   setTimeLeft(nextCycle % 3 === 0 ? POMODORO_LONG_BREAK : POMODORO_SHORT_BREAK);
                } else {
                   setTimerMode('WORK');
                   setTimeLeft(POMODORO_WORK);
                }
             } else if (timerType === 'FLOW' && timerMode === 'BREAK') {
                setTimerMode('WORK');
                setTimeLeft(flowStoredTime);
             }
           } else {
             setTimeLeft(remaining);
           }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timerMode, timerType, cycles, flowStoredTime]); 

  const gainXP = (amount, reason = "") => {
    setUserLevel(prev => {
      let { level, currentXP, totalXP } = prev;
      let newCurrentXP = currentXP + amount;
      let newTotalXP = totalXP + amount;
      let newLevel = level;
      if (amount > 0) {
          let xpNeeded = getXPForNextLevel(newLevel);
          while (newCurrentXP >= xpNeeded) {
            newCurrentXP -= xpNeeded;
            newLevel++;
            xpNeeded = getXPForNextLevel(newLevel);
            alert(`🎉 LEVEL UP! Você alcançou o nível ${newLevel}: ${getTitleByLevel(newLevel)}`);
          }
      } 
      return { level: newLevel, currentXP: newCurrentXP, totalXP: newTotalXP, title: getTitleByLevel(newLevel) };
    });
    if (reason) console.log(`${amount > 0 ? '+' : ''}${amount} XP: ${reason}`);
  };

  const addSession = (minutes, notes, manualSubId = null, questions = 0, errors = 0) => {
    const sId = manualSubId ? Number(manualSubId) : selectedSubjectId;
    setSessions(prev => [...prev, { id: Date.now(), date: new Date().toISOString(), minutes, subjectId: sId, notes, questions: Number(questions) || 0, errors: Number(errors) || 0 }]);
    let totalXPGain = 0;
    const timeXP = Math.floor(minutes / 10) * 50;
    if (timeXP > 0) totalXPGain += timeXP;
    const questXP = (Number(questions) || 0) * 10;
    if (questXP > 0) totalXPGain += questXP;
    const subject = subjects.find(s => s.id === sId);
    if (subject) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        const previousWeeklyMins = sessions.reduce((acc, s) => {
            const sDate = new Date(s.date);
            if (s.subjectId === sId && sDate >= startOfWeek) return acc + s.minutes;
            return acc;
        }, 0);
        const goalMins = subject.goalHours * 60;
        const currentMins = previousWeeklyMins + minutes;
        if (previousWeeklyMins < goalMins && currentMins >= goalMins) {
            totalXPGain += 500;
            alert(`🏆 GOAL HUNTER! Você atingiu a meta semanal de ${subject.name}! +500 XP`);
        }
    }
    if (totalXPGain > 0) gainXP(totalXPGain, "Sessão de Estudo");
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
  
  const addMistake = (subId, desc, reason, sol) => setMistakes(prev => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(subId), description: desc, reason, solution: sol, consolidated: false }, ...prev]);
  
  const consolidateMistake = (id, diagnosis, strategy) => {
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, consolidated: true, diagnosis, strategy } : m));
    gainXP(100, "Erro Consolidado");
  };

  const deleteMistake = (id) => { 
    if (window.confirm("Apagar erro?")) {
        const mistake = mistakes.find(m => m.id === id);
        if (mistake && mistake.consolidated) {
            gainXP(-100, "Erro consolidado apagado");
            alert("Atenção: Você perdeu 100 XP por apagar um erro já aprendido.");
        }
        setMistakes(prev => prev.filter(m => m.id !== id)); 
    }
  };

  const addTheme = (subId, title) => setThemes(prev => [...prev, { id: Date.now(), subjectId: subId, title, items: [] }]);
  const deleteTheme = (id) => { if(window.confirm("Excluir tema?")) setThemes(prev => prev.filter(t => t.id !== id)); };
  const addThemeItem = (themeId, text) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: [...t.items, { id: Date.now() + Math.random(), text, completed: false }] } : t));
  const toggleThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) } : t));
  const deleteThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.filter(i => i.id !== itemId) } : t));

  const resetXPOnly = () => {
    if(window.confirm("Tem certeza? Seu nível voltará para 1.")) {
        setUserLevel({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" });
        alert("Nível resetado.");
    }
  };

  const kpiData = useMemo(() => {
    const dates = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0; let curr = new Date(); const hasToday = dates.has(curr.toDateString());
    while (true) {
      const dateStr = curr.toDateString(); const dayOfWeek = curr.getDay(); 
      if (dates.has(dateStr)) { streak++; curr.setDate(curr.getDate() - 1); } 
      else {
        if (dateStr === new Date().toDateString() && !hasToday) { curr.setDate(curr.getDate() - 1); continue; }
        if (dayOfWeek === 0 || dayOfWeek === 6) { curr.setDate(curr.getDate() - 1); continue; }
        break; 
      }
    }
    const todayMins = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((a, c) => a + c.minutes, 0);
    return { todayMinutes: todayMins, totalHours: (sessions.reduce((a,c)=>a+c.minutes,0)/60).toFixed(1), streak };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0);
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const mins = sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.minutes, 0);
      return { name: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i], minutos: mins };
    });
  }, [sessions]);

  const advancedStats = useMemo(() => {
    const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear(); const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const mins = sessions.reduce((acc, s) => {
        const sDate = new Date(s.date);
        if (sDate.getDate() === day && sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) { return acc + s.minutes; }
        return acc;
      }, 0);
      return { name: day.toString(), minutes: mins };
    });
    const subjectRanking = subjects.map(s => {
      const totalMins = sessions.filter(session => session.subjectId === s.id).reduce((acc, curr) => acc + curr.minutes, 0);
      return { ...s, totalMins };
    });
    subjectRanking.sort((a, b) => b.totalMins - a.totalMins);
    const bestSubject = subjectRanking[0] || null;
    const worstSubject = subjectRanking.length > 0 ? subjectRanking[subjectRanking.length - 1] : null;
    const datesStudied = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].map(dateStr => new Date(dateStr)).sort((a, b) => a - b);
    let maxStreak = 0; let currentStreak = 0;
    for (let i = 0; i < datesStudied.length; i++) {
      if (i === 0) currentStreak = 1;
      else {
        const diffTime = Math.abs(datesStudied[i] - datesStudied[i - 1]);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) currentStreak++; else currentStreak = 1;
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    }
    return { monthlyData, bestSubject, worstSubject, maxStreak };
  }, [sessions, subjects]);

  return (
    <FocusContext.Provider value={{
      currentView, setCurrentView, selectedHistoryDate, setSelectedHistoryDate,
      subjects, addSubject, updateSubject, deleteSubject, sessions, addSession, 
      tasks, addTask, toggleTask, deleteTask, mistakes, addMistake, consolidateMistake, deleteMistake,
      themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem, 
      timerMode, setTimerMode, timerType, setTimerType, timeLeft, setTimeLeft, isActive, setIsActive, 
      cycles, setCycles, selectedSubjectId, setSelectedSubjectId, flowStoredTime, setFlowStoredTime,
      elapsedTime, setElapsedTime, kpiData, weeklyChartData, advancedStats,
      countdown, setCountdown, userLevel, resetXPOnly,
      resetAllData: () => { if(window.confirm("ATENÇÃO: Isso apagará TODOS os seus dados. Deseja continuar?")) { localStorage.clear(); window.location.reload(); } },
      deleteDayHistory: (d) => { if(window.confirm(`Apagar ${d}?`)) setSessions(prev => prev.filter(s => new Date(s.date).toDateString() !== d)); }
    }}>
      {children}
    </FocusContext.Provider>
  );
};

/**
 * --- COMPONENTES UI (Visuais Atualizados) ---
 */
// Card agora é #09090b (Preto suave) e rounded-3xl
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-[#09090b] border border-white/5 rounded-3xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

// Botões agora usam a cor #1100ab e são mais arredondados (rounded-2xl)
const Button = ({ children, onClick, variant = 'primary', className = "" }) => {
  const variants = {
    primary: "bg-[#1100ab] hover:bg-[#0c007a] text-white shadow-[#1100ab]/30 shadow-md",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
  };
  return <button onClick={onClick} className={`px-5 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}>{children}</button>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-[#09090b] border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar z-10">
        <button onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
        <h2 className="text-xl font-bold text-white mb-6 pr-8">{title}</h2>
        {children}
      </div>
    </div>, document.body
  );
};

/**
 * --- VIEWS ---
 */

const SettingsView = () => {
  const { resetAllData, resetXPOnly } = useContext(FocusContext);
  
  const handleExp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('focus_')).map(k=>[k, localStorage.getItem(k)])))], {type:'application/json'})); a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); };
  const handleImp = (e) => { const f = e.target.files[0]; if(!f)return; const r = new FileReader(); r.onload=x=>{ try{const d=JSON.parse(x.target.result); if(confirm("Isso substituirá seus dados atuais. Continuar?")){ Object.keys(d).forEach(k=>localStorage.setItem(k,d[k])); window.location.reload(); }}catch{alert("Erro ao importar arquivo.");} }; r.readAsText(f); };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="mb-8"><h1 className="text-2xl font-bold text-white mb-1">Configurações</h1><p className="text-zinc-400">Gerencie seus dados e preferências.</p></header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><HardDrive size={20} className="text-[#1100ab]"/> Dados do Sistema</h3>
          <div className="space-y-4">
             <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <p className="text-sm text-zinc-300 mb-3">Exporte seus dados para backup ou importe de outro dispositivo.</p>
                <div className="flex gap-3">
                  <button onClick={handleExp} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"><Download size={16}/> Exportar</button>
                  <label className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"><Upload size={16}/> Importar<input type="file" className="hidden" onChange={handleImp}/></label>
                </div>
             </div>
             
             <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                <p className="text-sm text-red-400 mb-3 font-bold">Zona de Perigo</p>
                <button onClick={resetAllData} className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><Trash2 size={16}/> Resetar TUDO (Fábrica)</button>
             </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Crown size={20} className="text-yellow-500"/> Gamificação</h3>
          <div className="space-y-4">
             <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <p className="text-sm text-zinc-300 mb-3">Reiniciar apenas seu progresso de níveis e XP, mantendo seu histórico de estudos.</p>
                <button onClick={resetXPOnly} className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><RotateCcw size={16}/> Resetar Nível e XP</button>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { kpiData, weeklyChartData, setCurrentView, countdown, setCountdown, userLevel } = useContext(FocusContext);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [countForm, setCountForm] = useState({ date: '', title: '' });

  const xpNext = getXPForNextLevel(userLevel.level);
  const xpProgress = (userLevel.currentXP / xpNext) * 100;
  
  const rankStyle = getRankStyle(userLevel.level);

  const getDaysLeft = (targetDate) => {
    if (!targetDate) return null;
    const now = new Date(); const target = new Date(targetDate); now.setHours(0,0,0,0); target.setHours(0,0,0,0);
    const diffTime = target - now; return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };
  const daysLeft = getDaysLeft(countdown.date);

  let countColorClass = "border-l-zinc-700 text-zinc-500"; let countIconBg = "bg-zinc-500/20 text-zinc-500";
  if (daysLeft !== null) {
    if (daysLeft < 0) { countColorClass = "border-l-red-500 text-red-500"; countIconBg = "bg-red-500/20 text-red-500"; }
    else if (daysLeft === 0) { countColorClass = "border-l-red-500 text-red-500"; countIconBg = "bg-red-500/20 text-red-500 animate-pulse"; }
    else if (daysLeft < 7) { countColorClass = "border-l-orange-500 text-orange-500"; countIconBg = "bg-orange-500/20 text-orange-500"; }
    else if (daysLeft < 30) { countColorClass = "border-l-blue-500 text-blue-500"; countIconBg = "bg-blue-500/20 text-blue-500"; }
    else { countColorClass = "border-l-emerald-500 text-emerald-500"; countIconBg = "bg-emerald-500/20 text-emerald-500"; }
  }

  const handleSaveCountdown = (e) => { e.preventDefault(); setCountdown({ date: countForm.date, title: countForm.title || "Minha Meta" }); setIsCountModalOpen(false); };
  useEffect(() => { if (isCountModalOpen) setCountForm({ date: countdown.date || '', title: countdown.title || '' }); }, [isCountModalOpen, countdown]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <Card className="bg-gradient-to-r from-[#1100ab]/80 via-[#0a0a0a] to-[#0a0a0a] border-[#1100ab]/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1100ab]/20 blur-[80px] rounded-full pointer-events-none"/>
        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="flex-shrink-0 relative">
             <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rankStyle.bg} p-[2px]`}>
               <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center flex-col">
                 <rankStyle.icon className={`${rankStyle.color} mb-1`} size={28}/>
                 <span className="text-2xl font-bold text-white">{userLevel.level}</span>
               </div>
             </div>
             <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400">Lvl</div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
               <div><h2 className="text-2xl font-bold text-white">{userLevel.title}</h2><p className="text-sm text-zinc-400">Total acumulado: {userLevel.totalXP.toLocaleString()} XP</p></div>
               <div className="text-right hidden sm:block"><p className="text-[#4d4dff] font-bold">{userLevel.currentXP} <span className="text-zinc-500">/ {xpNext} XP</span></p></div>
            </div>
            <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 relative">
               <div className={`h-full bg-gradient-to-r ${rankStyle.bg} transition-all duration-1000`} style={{width: `${xpProgress}%`}}><div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]"/></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2 text-right sm:hidden">{userLevel.currentXP} / {xpNext} XP</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500"><div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500"><Zap size={24}/></div><div><p className="text-sm text-zinc-400">Hoje</p><p className="text-2xl font-bold text-white">{kpiData.todayMinutes} min</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-[#1100ab]"><div className="p-3 bg-[#1100ab]/20 rounded-full text-[#4d4dff]"><Clock size={24}/></div><div><p className="text-sm text-zinc-400">Total</p><p className="text-2xl font-bold text-white">{kpiData.totalHours} h</p></div></Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-orange-500"><div className="p-3 bg-orange-500/20 rounded-full text-orange-500"><Flame size={24}/></div><div><p className="text-sm text-zinc-400">Sequência</p><p className="text-2xl font-bold text-white">{kpiData.streak} dias</p></div></Card>
        <Card onClick={() => setIsCountModalOpen(true)} className={`flex items-center gap-4 border-l-4 cursor-pointer hover:bg-zinc-800/80 transition-all group ${countColorClass}`}>
          <div className={`p-3 rounded-full transition-colors ${countIconBg}`}><Flag size={24}/></div>
          <div><p className="text-sm text-zinc-400 group-hover:text-white transition-colors">{daysLeft !== null ? (countdown.title || "Meta") : "Próxima Meta"}</p>{daysLeft !== null ? (<p className={`text-2xl font-bold ${daysLeft <= 7 ? 'scale-105 origin-left' : ''} transition-transform`}>{daysLeft === 0 ? "É HOJE!" : daysLeft < 0 ? "Concluído" : `${daysLeft} dias`}</p>) : (<p className="text-sm font-bold text-zinc-500 italic">Definir data...</p>)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-[#1100ab]"/> Atividade Semanal</h3>
          <div className="h-[250px] w-full"><ResponsiveContainer><LineChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#71717a" tick={{fill:'#a1a1aa',fontSize:12}} axisLine={false}/><YAxis stroke="#71717a" tick={{fill:'#a1a1aa'}} axisLine={false}/><Tooltip contentStyle={{backgroundColor:'#09090b',borderColor:'#27272a',color:'#fff', borderRadius: '12px'}}/><Line type="monotone" dataKey="minutos" stroke="#1100ab" strokeWidth={3} dot={{r:4,fill:'#1100ab'}}/></LineChart></ResponsiveContainer></div>
        </Card>
        <Card className="bg-gradient-to-br from-[#1100ab]/40 to-[#0a0a0a] border-[#1100ab]/30 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1100ab]/10 blur-[50px] group-hover:bg-[#1100ab]/20 transition-all duration-500"></div>
          <div><h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Trabalho Profundo <InfinityIcon size={18} className="text-[#4d4dff]"/></h3><p className="text-zinc-300 mb-6 italic text-sm border-l-2 border-[#1100ab]/50 pl-3">"A superficialidade não constrói impérios."</p></div>
          <Button onClick={() => setCurrentView('focus')} className="w-full py-4 text-lg shadow-lg shadow-[#1100ab]/20 hover:shadow-[#1100ab]/40 border border-white/5">Mergulhar no Foco <Zap size={20} className="fill-current"/></Button>
        </Card>
      </div>

      <Modal isOpen={isCountModalOpen} onClose={() => setIsCountModalOpen(false)} title="Configurar Meta"><form onSubmit={handleSaveCountdown} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Nome da Meta</label><input type="text" placeholder="Ex: ENEM, Prova de Inglês..." className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={countForm.title} onChange={e => setCountForm({...countForm, title: e.target.value})}/></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Data Alvo</label><input type="date" required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={countForm.date} onChange={e => setCountForm({...countForm, date: e.target.value})}/></div><div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => { setCountdown({date: null, title: ''}); setIsCountModalOpen(false); }} className="flex-1">Limpar</Button><Button type="submit" className="flex-[2]">Salvar Data</Button></div></form></Modal>
    </div>
  );
};

const FocusView = () => {
  const { timerType, setTimerType, subjects, selectedSubjectId, setSelectedSubjectId, timerMode, setTimerMode, timeLeft, setTimeLeft, isActive, setIsActive, cycles, setCycles, tasks, addTask, toggleTask, deleteTask, addSession, elapsedTime, setElapsedTime, flowStoredTime, setFlowStoredTime } = useContext(FocusContext);
  const [newTaskText, setNewTaskText] = useState("");
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishForm, setFinishForm] = useState({ notes: "", questions: "", errors: "" });
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualSubId, setManualSubId] = useState("");

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualMinutes || !manualSubId) return alert("Preencha o tempo e a matéria.");
    addSession(parseInt(manualMinutes), manualNotes, manualSubId, 0, 0);
    setManualMinutes(""); setManualNotes(""); setIsManualOpen(false);
    alert("Estudo registrado manualmente!");
  };

  const openFinishModal = () => { setIsActive(false); setIsFinishModalOpen(true); };

  const handleConfirmSession = (e) => {
    e.preventDefault();
    const q = Number(finishForm.questions) || 0;
    const err = Number(finishForm.errors) || 0;
    if (err > q) { alert("O número de erros não pode ser maior que o de questões feitas!"); return; }
    const mins = Math.round(elapsedTime / 60);
    if (mins > 0) { 
      addSession(mins, finishForm.notes, null, q, err); 
      setFinishForm({ notes: "", questions: "", errors: "" });
      alert(`Sessão salva: ${mins} min.`); 
    } else { alert("Tempo insuficiente para salvar."); }
    setIsActive(false); setTimerMode('WORK'); setTimeLeft(timerType==='FLOW'?0:POMODORO_WORK); setElapsedTime(0); setCycles(0); setIsFinishModalOpen(false);
  };

  if(!subjects.length) return <div className="text-center mt-20 text-zinc-400">Adicione matérias em Metas.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${isActive ? (timerMode==='WORK'?'bg-[#1100ab] animate-pulse':'bg-emerald-500 animate-pulse'):'bg-zinc-800'}`}></div>
          <div className="flex bg-black p-1 rounded-xl border border-zinc-800 mb-6 z-10">
            <button onClick={()=> {setIsActive(false); setTimerType('POMODORO'); setTimeLeft(POMODORO_WORK); setTimerMode('WORK');}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType==='POMODORO'?'bg-zinc-800 text-white shadow':'text-zinc-500'}`}>Pomodoro</button>
            <button onClick={()=> {setIsActive(false); setTimerType('FLOW'); setTimeLeft(0); setTimerMode('WORK');}} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType==='FLOW'?'bg-[#1100ab] text-white shadow':'text-zinc-500'}`}>Flow</button>
          </div>
          <div className="w-full max-w-xs mb-8 z-10 text-center">
            <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Matéria</label>
            <select disabled={isActive} value={selectedSubjectId||''} onChange={(e)=>setSelectedSubjectId(Number(e.target.value))} className="w-full bg-[#18181B] text-white border border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer">
              {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="z-10 text-center">
            <div className="mb-6"><span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode==='WORK'?'bg-[#1100ab]/10 text-[#4d4dff] border-[#1100ab]/20':'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{timerMode==='WORK'?'Foco Total':'Pausa'}</span></div>
            <div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter mb-4 tabular-nums drop-shadow-2xl">{formatTime(timeLeft)}</div>
            <div className="text-zinc-400 mb-8 font-medium">Ciclos: <span className="text-white font-bold ml-2">{cycles}</span></div>
            <div className="flex gap-4 justify-center items-center mt-8">
              <button onClick={()=>setIsActive(!isActive)} className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive?'bg-zinc-800 text-white border border-zinc-700':(timerMode==='WORK'?'bg-[#1100ab] text-white':'bg-emerald-500 text-white')}`}>{isActive ? <Pause size={24}/> : <Play size={24}/>} <span>{isActive ? 'Pausar' : 'Iniciar'}</span></button>
              <button onClick={()=> {setIsActive(false); setTimeLeft(timerType==='FLOW'?0:POMODORO_WORK); setElapsedTime(0);}} className="p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"><RotateCcw size={24}/></button>
              {timerType==='FLOW' && timerMode==='WORK' && <button onClick={()=> {setFlowStoredTime(timeLeft); setTimerMode('BREAK'); setTimeLeft(Math.floor(timeLeft*0.2)); setIsActive(true);}} className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><Coffee size={24}/></button>}
              <button onClick={openFinishModal} className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20"><CheckCircle size={24}/></button>
            </div>
            {timerType==='FLOW'&&timerMode==='WORK'&&<p className="text-xs text-zinc-500 mt-4">Clique no <Coffee size={12} className="inline"/> para pausa.</p>}
          </div>
        </Card>
      </div>
      
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-[#1100ab]"/> Tarefas</h3>
          <form onSubmit={e=>{e.preventDefault(); if(newTaskText&&selectedSubjectId){addTask(newTaskText,selectedSubjectId);setNewTaskText("");}}} className="mb-4 flex gap-2"><input placeholder="Nova tarefa..." className="flex-1 bg-black border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1100ab]" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)}/><button type="submit" className="bg-[#1100ab] rounded-2xl px-3 text-white"><Plus size={18}/></button></form>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{tasks.filter(t=>t.subjectId===selectedSubjectId).map(t=>(<div key={t.id} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${t.completed?'bg-[#1100ab]/10 border-[#1100ab]/20 opacity-60':'bg-[#18181B] border-zinc-800'}`}><button onClick={()=>toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${t.completed?'bg-[#1100ab] border-[#1100ab]':'border-zinc-500'}`}>{t.completed&&<CheckCircle size={14} className="text-white"/>}</button><span className={`text-sm flex-1 break-words ${t.completed?'text-zinc-500 line-through':'text-zinc-200'}`}>{t.text}</span><button onClick={()=>deleteTask(t.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>))}</div>
        </Card>
      </div>

      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-800/50 pt-10">
        <div className="bg-[#09090b] p-6 rounded-3xl border border-zinc-800 max-w-md w-full text-center">
          <Clock size={24} className="mx-auto mb-3 text-zinc-500 opacity-50" />
          <p className="text-zinc-400 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p>
          <button onClick={() => { setManualSubId(subjects[0]?.id); setIsManualOpen(true); }} className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-[#1100ab]/10 hover:bg-[#1100ab] text-[#4d4dff] hover:text-white rounded-2xl border border-[#1100ab]/20 transition-all duration-300 font-bold text-sm shadow-lg shadow-[#1100ab]/5"><Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Lançar Estudo Manual</button>
        </div>
      </div>

      <Modal isOpen={isFinishModalOpen} onClose={() => setIsFinishModalOpen(false)} title="Resumo da Sessão">
        <form onSubmit={handleConfirmSession} className="space-y-4">
          <div><label className="text-xs text-zinc-500 font-bold uppercase flex items-center gap-2"><FileText size={14}/> O que você estudou?</label><textarea className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-24 outline-none focus:border-[#1100ab] transition-colors resize-none" placeholder="Descreva seu estudo..." value={finishForm.notes} onChange={e => setFinishForm({...finishForm, notes: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 font-bold uppercase flex items-center gap-2"><Activity size={14}/> Questões Feitas</label><input type="number" min="0" className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-blue-500" value={finishForm.questions} onChange={e => setFinishForm({...finishForm, questions: e.target.value})}/></div><div><label className="text-xs text-zinc-500 font-bold uppercase flex items-center gap-2"><AlertTriangle size={14}/> Questões Erradas</label><input type="number" min="0" className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-red-500" value={finishForm.errors} onChange={e => setFinishForm({...finishForm, errors: e.target.value})}/></div></div>
          <div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => setIsFinishModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-[2]">Salvar Sessão</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} title="Registro Manual">
        <form onSubmit={handleManualSubmit} className="space-y-5">
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Matéria</label><select required className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab] transition-colors" value={manualSubId} onChange={e => setManualSubId(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tempo (minutos)</label><input required type="number" min="1" placeholder="Ex: 60" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab] transition-colors" value={manualMinutes} onChange={e => setManualMinutes(e.target.value)}/></div>
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Diário da Sessão</label><textarea className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white h-28 outline-none focus:border-[#1100ab] transition-colors resize-none text-sm" placeholder="Resumo..." value={manualNotes} onChange={e => setManualNotes(e.target.value)}/></div>
          <Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-[#1100ab]/20">Confirmar Registro</Button>
        </form>
      </Modal>
    </div>
  );
};

const MistakesView = () => {
  const { subjects, mistakes, addMistake, deleteMistake, consolidateMistake } = useContext(FocusContext);
  const [f, setF] = useState({ sub:"", desc:"", r:"Conceito", sol:"" });
  const [expandedIds, setExpandedIds] = useState([]);
  const [consModal, setConsModal] = useState({ isOpen: false, mId: null, mDesc: "" });
  const [consForm, setConsForm] = useState({ diag: "", strat: "" });

  const sub = (e) => { e.preventDefault(); if(f.sub&&f.desc&&f.sol){ addMistake(f.sub,f.desc,f.r,f.sol); setF({ sub:"", desc:"", r:"Conceito", sol:"" }); alert("Salvo!"); }};
  const openConsolidation = (mistake) => { setConsModal({ isOpen: true, mId: mistake.id, mDesc: mistake.description }); setConsForm({ diag: "", strat: "" }); };
  const handleConsolidate = (e) => { e.preventDefault(); if(consForm.diag && consForm.strat) { consolidateMistake(consModal.mId, consForm.diag, consForm.strat); setConsModal({ isOpen: false, mId: null, mDesc: "" }); alert("Erro consolidado! +100 XP"); }};
  const toggleExpand = (id) => { setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header><h1 className="text-2xl font-bold text-white mb-1">Caderno de Erros</h1></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Novo Erro</h3>
          <form onSubmit={sub} className="space-y-4">
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label><select required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-2.5 text-white" value={f.sub} onChange={e=>setF({...f,sub:e.target.value})}><option value="">Selecione...</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Motivo</label><div className="flex flex-wrap gap-2 mt-2">{["Falta de Atenção","Esqueci Fórmula","Erro Cálculo","Conceito","Tempo"].map(r=><button key={r} type="button" onClick={()=>setF({...f,r})} className={`text-xs px-3 py-1.5 rounded-full border ${f.r===r?'bg-[#1100ab] border-[#1100ab] text-white':'border-zinc-700 text-zinc-400'}`}>{r}</button>)}</div></div>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Erro</label><textarea required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20" value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}/></div>
            <div><label className="text-xs text-zinc-500 font-bold uppercase">Solução</label><textarea required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-24" value={f.sol} onChange={e=>setF({...f,sol:e.target.value})}/></div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">{mistakes.length === 0 ? (<div className="text-center py-10 opacity-50"><CheckCircle size={40} className="mx-auto mb-2"/><p>Vazio.</p></div>) : (mistakes.map(m => (<div key={m.id} className={`border rounded-3xl p-5 relative group transition-all duration-300 ${m.consolidated ? 'bg-zinc-900/50 border-zinc-800 opacity-75' : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'}`}>{m.consolidated && (<div className="absolute top-4 right-12 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 flex items-center gap-1 select-none"><CheckCircle size={10} /> ERRO APRENDIDO</div>)}<div className="absolute top-4 right-4 flex gap-2">{!m.consolidated && (<button onClick={() => openConsolidation(m)} title="Marcar como aprendido" className="text-zinc-600 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle size={18}/></button>)}<button onClick={() => deleteMistake(m.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button></div><div className="flex items-center gap-3 mb-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{backgroundColor: subjects.find(s => s.id === m.subjectId)?.color}}>{subjects.find(s => s.id === m.subjectId)?.name}</span><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{m.reason}</span></div><div className="grid md:grid-cols-2 gap-6"><div className="space-y-1"><p className="text-xs text-red-400 font-bold uppercase">Erro</p><p className="text-zinc-300 text-sm">{m.description}</p></div><div className="space-y-1 md:border-l md:border-zinc-800 md:pl-6"><p className="text-xs text-green-400 font-bold uppercase">Solução</p><p className="text-zinc-300 text-sm">{m.solution}</p></div></div>{m.consolidated && (<div className="mt-4 pt-4 border-t border-zinc-800/50"><button onClick={() => toggleExpand(m.id)} className="text-xs text-[#4d4dff] hover:text-white flex items-center gap-1 transition-colors">{expandedIds.includes(m.id) ? 'Ocultar reflexão' : 'Ver minha reflexão'} <ChevronDown size={14} className={`transition-transform ${expandedIds.includes(m.id) ? 'rotate-180' : ''}`}/></button>{expandedIds.includes(m.id) && (<div className="mt-3 grid md:grid-cols-2 gap-4 animate-fadeIn"><div className="bg-black/50 p-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Diagnóstico</p><p className="text-xs text-zinc-300 italic">"{m.diagnosis}"</p></div><div className="bg-black/50 p-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Estratégia</p><p className="text-xs text-zinc-300 italic">"{m.strategy}"</p></div></div>)}</div>)}</div>)))}</div>
      </div>
      <Modal isOpen={consModal.isOpen} onClose={() => setConsModal({...consModal, isOpen: false})} title="Você realmente aprendeu?"><form onSubmit={handleConsolidate} className="space-y-4"><div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 mb-4"><p className="text-xs text-zinc-500 font-bold uppercase mb-1">Erro original</p><p className="text-sm text-zinc-300 line-clamp-2">{consModal.mDesc}</p></div><div><label className="text-xs text-[#4d4dff] font-bold uppercase">Diagnóstico</label><p className="text-[10px] text-zinc-500 mb-2">Por que eu errei antes? (Ex: Falta de atenção, pegadinha)</p><textarea required className="w-full bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20 outline-none focus:border-[#1100ab] transition-colors" value={consForm.diag} onChange={e => setConsForm({...consForm, diag: e.target.value})}/></div><div><label className="text-xs text-green-400 font-bold uppercase">Estratégia</label><p className="text-[10px] text-zinc-500 mb-2">Como não vou errar mais? (Ex: Mnemônico, regra)</p><textarea required className="w-full bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20 outline-none focus:border-green-500 transition-colors" value={consForm.strat} onChange={e => setConsForm({...consForm, strat: e.target.value})}/></div><Button type="submit" className="w-full mt-2">Confirmar Aprendizado</Button></form></Modal>
    </div>
  );
};

const GoalsView = () => {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem } = useContext(FocusContext);
  const [viewSub, setViewSub] = useState(null); const [col, setCol] = useState({}); const [modal, setModal] = useState(false); const [f, setF] = useState({ name:"", goal:10, color:"#8b5cf6" }); const [edit, setEdit] = useState({ id:null, val:"" }); const [newTheme, setNewTheme] = useState("");
  const getProgress = (subjId, goalH) => { const safeGoal = Number(goalH) || 1; const now = new Date(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0); const weeklyMins = sessions.reduce((acc, s) => { const sDate = new Date(s.date); if (s.subjectId === subjId && sDate >= startOfWeek) { return acc + (Number(s.minutes) || 0); } return acc; }, 0); const percent = Math.round((weeklyMins / (safeGoal * 60)) * 100); return { hours: (weeklyMins / 60).toFixed(1) || "0.0", percent: isNaN(percent) ? 0 : Math.min(100, percent) }; };
  const addS = (e) => { e.preventDefault(); if(f.name){ addSubject(f.name,f.color,f.goal); setModal(false); setF({name:"",goal:10,color:"#8b5cf6"}); }}; const addT = () => { if(newTheme&&viewSub){ addTheme(viewSub,newTheme); setNewTheme(""); }}; const addI = (e, tId) => { e.preventDefault(); const v=e.target.item.value; if(v){ addThemeItem(tId,v); e.target.reset(); }}; const pasteI = (e, tId) => { const d=e.clipboardData.getData('text'); if(d.includes('\n')){ e.preventDefault(); d.split('\n').map(l=>l.trim()).filter(l=>l).forEach(l=>addThemeItem(tId,l)); }};

  if (viewSub) { const s = subjects.find(x => x.id === viewSub); if(!s) return <div onClick={()=>setViewSub(null)}>Erro. Voltar.</div>; return ( <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><button onClick={()=>setViewSub(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white"><ArrowLeft size={20}/> Voltar</button><header className="flex justify-between items-end border-b border-zinc-800 pb-6"><div><span className="text-xs font-bold uppercase px-2 py-1 rounded text-white mb-2 inline-block" style={{backgroundColor:s.color}}>{s.name}</span><h1 className="text-3xl font-bold text-white">Conteúdo</h1></div><div className="text-right text-2xl font-bold text-white">{s.goalHours}h</div></header><div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex gap-4 items-center"><div className="flex-1"><label className="text-xs text-zinc-500 uppercase font-bold mb-1">Novo Tema</label><input className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={newTheme} onChange={e=>setNewTheme(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addT()}/></div><Button onClick={addT}>Adicionar</Button></div><div className="space-y-6">{themes.filter(t=>t.subjectId===s.id).map(t=>{ const p = t.items.length ? Math.round((t.items.filter(i=>i.completed).length/t.items.length)*100) : 0; return ( <Card key={t.id} className="relative group transition-all duration-300"><div className="flex justify-between items-start mb-4"><div className="flex gap-3 w-full"><button onClick={()=>setCol({...col,[t.id]:!col[t.id]})} className="text-zinc-500">{col[t.id]?<ChevronRight/>:<ChevronDown/>}</button><div className="flex-1"><h3 onClick={()=>setCol({...col,[t.id]:!col[t.id]})} className="text-xl font-bold text-white cursor-pointer select-none">{t.title}</h3><div className="flex items-center gap-2 mt-1"><div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-[#1100ab]" style={{width:`${p}%`}}/></div><span className="text-xs text-zinc-500">{p}%</span></div></div></div><button onClick={()=>deleteTheme(t.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16}/></button></div>{!col[t.id] && <div className="space-y-2 mb-4 animate-fadeIn pl-8">{(t.items||[]).map(i=><div key={i.id} className="flex gap-3 p-2 hover:bg-zinc-800/50 rounded-2xl group/item"><button onClick={()=>toggleThemeItem(t.id,i.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${i.completed?'bg-[#1100ab] border-[#1100ab]':'border-zinc-600'}`}>{i.completed&&<CheckSquare size={14} className="text-white"/>}</button><span className={`text-sm flex-1 ${i.completed?'text-zinc-500 line-through':'text-zinc-200'}`}>{i.text}</span><button onClick={()=>deleteThemeItem(t.id,i.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-red-500"><X size={14}/></button></div>)}<form onSubmit={e=>addI(e,t.id)} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50"><input name="item" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-3 py-1.5 text-sm text-white" placeholder="Tópico (Ctrl+V para lista)..." onPaste={e=>pasteI(e,t.id)}/><button type="submit" className="p-1.5 bg-zinc-800 hover:bg-[#1100ab] text-white rounded"><Plus size={16}/></button></form></div>}</Card> )})}</div></div> ); }
  return ( <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-white">Metas Semanais</h1><Button onClick={()=>setModal(true)}><Plus size={18}/> Nova</Button></header><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{subjects.map(s=>{ const {hours, percent} = getProgress(s.id, s.goalHours); return ( <Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-[#1100ab]/50"><div onClick={()=>setViewSub(s.id)}><div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor:s.color}}/><div className="mb-4"><h3 className="text-xl font-bold text-white">{s.name}</h3>{edit.id!==s.id&&<p className="text-sm text-zinc-400">Meta: {s.goalHours}h</p>}</div>{edit.id!==s.id&&(<> <div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-white">{hours}h</span><span className="text-sm font-medium" style={{color:s.color}}>{percent}%</span></div><div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{width:`${percent}%`,backgroundColor:s.color}}/></div></>)}</div><div className="absolute top-4 right-4 flex gap-2">{edit.id===s.id?(<div className="flex gap-2 bg-black/80 p-1 rounded-2xl"><input type="number" className="w-16 bg-black border border-zinc-600 rounded-2xl px-1 text-sm text-white" value={edit.val} onChange={e=>setEdit({...edit,val:e.target.value})} autoFocus/><button onClick={()=>{updateSubject(s.id,edit.val);setEdit({id:null,val:""})}} className="text-green-400 text-xs font-bold">OK</button></div>):(<> <button onClick={e=>{e.stopPropagation();setEdit({id:s.id,val:s.goalHours})}} className="p-2 rounded-2xl bg-[#18181B]"><Settings size={16} className="text-zinc-400"/></button><button onClick={e=>{e.stopPropagation();deleteSubject(s.id)}} className="p-2 rounded-2xl bg-[#18181B]"><Trash2 size={16} className="text-zinc-400 hover:text-red-500"/></button></>)}</div></Card> )})}</div><Modal isOpen={modal} onClose={()=>setModal(false)} title="Nova Matéria"><form onSubmit={addS} className="space-y-4"><div><label className="text-sm text-zinc-400">Nome</label><input required className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div><div><label className="text-sm text-zinc-400">Meta (h)</label><input required type="number" className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}/></div><div><label className="text-sm text-zinc-400">Cor</label><div className="flex gap-2 mt-2">{['#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444'].map(c=><div key={c} onClick={()=>setF({...f,color:c})} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${f.color===c?'border-white':'border-transparent'}`} style={{backgroundColor:c}}/>)}</div></div><Button type="submit" className="w-full mt-4">Criar</Button></form></Modal></div> );
};

const StatsView = () => {
  const { sessions, weeklyChartData, advancedStats } = useContext(FocusContext);
  const { monthlyData, bestSubject, worstSubject, maxStreak } = advancedStats;
  const heatmapData = useMemo(() => { const today = new Date(); const currentYear = today.getFullYear(); const startOfYear = new Date(currentYear, 0, 1); const days = []; for (let d = new Date(startOfYear); d <= today; d.setDate(d.getDate() + 1)) { const dateStr = d.toDateString(); const hasStudy = sessions.some(s => new Date(s.date).toDateString() === dateStr); days.push({ date: new Date(d), hasStudy }); } return days; }, [sessions]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <h1 className="text-2xl font-bold text-white mb-6">Central de Dados</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card className="bg-gradient-to-br from-orange-500/10 to-[#0a0a0a] border-orange-500/20"><div className="flex items-center gap-3 mb-2"><Flame className="text-orange-500" size={20} /><h3 className="text-zinc-400 text-xs font-bold uppercase">Recorde Histórico</h3></div><p className="text-3xl font-bold text-white">{maxStreak} <span className="text-sm font-normal text-zinc-500">dias seguidos</span></p></Card><Card className="bg-gradient-to-br from-emerald-500/10 to-[#0a0a0a] border-emerald-500/20"><div className="flex items-center gap-3 mb-2"><Target className="text-emerald-500" size={20} /><h3 className="text-zinc-400 text-xs font-bold uppercase">Mais Estudada</h3></div><p className="text-xl font-bold text-white truncate">{bestSubject ? bestSubject.name : "---"}</p><p className="text-xs text-emerald-400">{bestSubject ? (bestSubject.totalMins / 60).toFixed(1) : 0} horas totais</p></Card><Card className="bg-gradient-to-br from-red-500/10 to-[#0a0a0a] border-red-500/20"><div className="flex items-center gap-3 mb-2"><AlertTriangle className="text-red-500" size={20} /><h3 className="text-zinc-400 text-xs font-bold uppercase">Atenção Necessária</h3></div><p className="text-xl font-bold text-white truncate">{worstSubject ? worstSubject.name : "---"}</p><p className="text-xs text-red-400">{worstSubject ? (worstSubject.totalMins / 60).toFixed(1) : 0} horas totais</p></Card></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-[#1100ab]"/> Performance Semanal</h3><div className="h-[200px] w-full"><ResponsiveContainer><BarChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#555" tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#222'}} contentStyle={{backgroundColor:'#09090b',borderColor:'#333', color:'#fff'}}/><Bar dataKey="minutos" fill="#1100ab" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></Card><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><Calendar size={18} className="text-blue-500"/> Visão Mensal</h3><div className="h-[200px] w-full"><ResponsiveContainer><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#555" tick={{fontSize:10}} interval={2} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#222'}} contentStyle={{backgroundColor:'#09090b',borderColor:'#333', color:'#fff'}}/><Bar dataKey="minutos" fill="#3b82f6" radius={[2,2,0,0]} /></BarChart></ResponsiveContainer></div></Card></div>
      <Card><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><InfinityIcon size={18} className="text-yellow-500"/> Roadmap de Consistência</h3><div className="flex flex-wrap gap-1">{heatmapData.map((day, index) => (<div key={index} title={`${day.date.toLocaleDateString()}: ${day.hasStudy ? 'Estudou' : 'Sem registro'}`} className={`w-3 h-3 rounded-sm transition-all hover:scale-125 ${day.hasStudy ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>))}</div><p className="text-xs text-zinc-500 mt-3">Cada quadrado representa um dia deste ano. Quadrados acesos indicam dias com estudo registrado.</p></Card>
    </div>
  );
};

const HistoryView = () => {
  const { sessions, setCurrentView, setSelectedHistoryDate, deleteDayHistory } = useContext(FocusContext);
  const grouped = useMemo(()=>{ const g={}; sessions.forEach(s=>{ const d=new Date(s.date).toDateString(); if(!g[d])g[d]={d:new Date(s.date),m:0,c:0}; g[d].m+=s.minutes; g[d].c++; }); return Object.values(g).sort((a,b)=>b.d-a.d); },[sessions]);
  return ( <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><h1 className="text-2xl font-bold text-white mb-6">Histórico</h1><div className="grid gap-4">{grouped.length===0?<p className="text-center text-zinc-500 py-10">Vazio.</p>:grouped.map((g,i)=>(<Card key={i} className="flex justify-between items-center hover:bg-[#121214] cursor-pointer group"><div className="flex-1 flex gap-4 items-center" onClick={()=>{setSelectedHistoryDate(g.d);setCurrentView('report')}}><div className="w-12 h-12 bg-[#1100ab]/20 rounded-2xl flex flex-col items-center justify-center text-[#4d4dff]"><span className="font-bold text-lg">{g.d.getDate()}</span><span className="text-[10px] uppercase">{g.d.toLocaleString('pt-BR',{month:'short'})}</span></div><div><h3 className="text-white font-medium capitalize">{g.d.toLocaleString('pt-BR',{weekday:'long'})}</h3><p className="text-sm text-zinc-400">{g.c} sessões • {Math.floor(g.m/60)}h {g.m%60}m</p></div></div><button onClick={()=>deleteDayHistory(g.d.toDateString())} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-900/10 rounded-full transition-colors"><Trash2 size={18}/></button></Card>))}</div></div> );
};

const ReportView = () => {
  const { sessions, mistakes, selectedHistoryDate, setCurrentView, subjects } = useContext(FocusContext);
  if(!selectedHistoryDate) return null; const dStr = selectedHistoryDate.toDateString(); const daily = sessions.filter(s=>new Date(s.date).toDateString()===dStr).sort((a,b)=>new Date(b.date)-new Date(a.date)); const dailyM = mistakes.filter(m=>new Date(m.date).toDateString()===dStr); const t = daily.reduce((a,c)=>a+c.minutes,0);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><button onClick={()=>setCurrentView('history')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-2"><ArrowLeft size={18}/> Voltar</button><header className="flex flex-col md:flex-row justify-between items-center gap-6"><div><h1 className="text-2xl font-bold text-white capitalize">{selectedHistoryDate.toLocaleDateString()}</h1><p className="text-zinc-400">Relatório</p></div><div className="w-32 h-32 rounded-full border-4 border-[#1100ab]/20 flex flex-col items-center justify-center"><span className="text-2xl font-mono font-bold text-white">{Math.floor(t/60)}h {t%60}m</span><span className="text-xs uppercase text-zinc-500">Total</span></div></header>
      <div className="space-y-4">{daily.map(s=>{ const sub=subjects.find(x=>x.id===s.subjectId)||{name:'-',color:'#555'}; const accuracy = s.questions > 0 ? Math.round(((s.questions - s.errors) / s.questions) * 100) : 0; return ( <Card key={s.id} className="relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 w-1" style={{backgroundColor:sub.color}}/><div className="flex justify-between items-start"><div className="flex-1 pl-3"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold uppercase text-white px-1.5 rounded" style={{backgroundColor:sub.color}}>{sub.name}</span><span className="text-xs text-zinc-500">{new Date(s.date).toLocaleTimeString().slice(0,5)}</span></div><p className="text-sm text-zinc-300">{s.notes||"Sem notas."}</p>{s.questions > 0 && (<div className="mt-3 flex gap-3 text-xs"><span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-bold"><Activity size={12}/> {s.questions} Questões</span><span className={`flex items-center gap-1 px-2 py-1 rounded border font-bold ${s.errors > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{s.errors > 0 ? <AlertTriangle size={12}/> : <CheckCircle size={12}/>} {s.errors} Erros</span><span className="flex items-center gap-1 bg-[#1100ab]/10 text-[#4d4dff] px-2 py-1 rounded border border-[#1100ab]/20 font-bold"><Percent size={12}/> {accuracy}% Acerto</span></div>)}</div><span className="font-bold text-white">{s.minutes}m</span></div></Card> )})}</div>
      {dailyM.length>0&&(<div className="mt-8"><h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Erros</h3><div className="space-y-4">{dailyM.map(m=><Card key={m.id} className="border-red-500/20 bg-red-500/5"><p className="text-zinc-300 text-sm mb-2"><strong className="text-red-400">Erro:</strong> {m.description}</p><div className="bg-zinc-900/50 p-2 rounded text-sm text-green-400 border-l-2 border-green-500"><strong className="text-green-500">Solução:</strong> {m.solution}</div></Card>)}</div></div>)}
    </div>
  );
};

const AppLayout = () => {
  const { currentView, setCurrentView, userLevel } = useContext(FocusContext);
  const [menu, setMenu] = useState(false);
  const nav = [
    {id:'dashboard',l:'Painel',i:LayoutDashboard},
    {id:'focus',l:'Focar',i:Zap},
    {id:'mistakes',l:'Erros',i:AlertTriangle},
    {id:'calendar',l:'Calendário',i:Calendar},
    {id:'goals',l:'Metas',i:Target},
    {id:'stats',l:'Estatísticas',i:BarChart2},
    {id:'history',l:'Histórico',i:History},
    {id:'settings',l:'Configurações',i:Settings}
  ];
  const xpNext = getXPForNextLevel(userLevel.level);
  const xpPercent = Math.min(100, (userLevel.currentXP / xpNext) * 100);
  
  const rankStyle = getRankStyle(userLevel.level);

  return (
    <div className="flex h-screen bg-[#000000] text-zinc-300 font-sans font-medium overflow-hidden">
      <button className="md:hidden fixed top-4 right-4 z-50 p-2 bg-[#09090b] border border-zinc-800 rounded-2xl" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
      {menu&&<div className="fixed inset-0 bg-black/90 z-40 md:hidden" onClick={()=>setMenu(false)}/>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#000000] border-r border-zinc-900 flex flex-col transition-transform duration-300 md:translate-x-0 ${menu?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-8 pb-4 flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-[#1100ab] to-blue-900 rounded-2xl flex items-center justify-center text-white font-bold">F</div><span className="text-xl font-bold text-white tracking-tight">Focus</span></div>
        <div className="mx-6 mb-6 p-3 bg-[#09090b] border border-zinc-800 rounded-3xl">
           <div className="flex items-center gap-3 mb-2"><div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankStyle.bg} flex items-center justify-center text-xs text-white font-bold`}>{userLevel.level}</div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{userLevel.title}</p><p className="text-[10px] text-zinc-500">{userLevel.currentXP}/{xpNext} XP</p></div></div>
           <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${rankStyle.bg}`} style={{width:`${xpPercent}%`}}/></div>
        </div>
        <nav className="flex-1 px-4 space-y-2">{nav.map(i=><button key={i.id} onClick={()=>{setCurrentView(i.id);setMenu(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${currentView===i.id?'bg-[#1100ab]/10 text-[#4d4dff] font-medium':'hover:bg-[#09090b] hover:text-white'}`}><i.i size={20}/>{i.l}</button>)}</nav>
      </aside>
      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 md:ml-64 bg-[#000000]">
        <div className="max-w-6xl mx-auto h-full">
           {currentView==='dashboard'&&<DashboardView/>} {currentView==='focus'&&<FocusView/>} {currentView==='calendar'&&<CalendarTab/>} {currentView==='mistakes'&&<MistakesView/>} {currentView==='goals'&&<GoalsView/>} {currentView==='stats'&&<StatsView/>} {currentView==='history'&&<HistoryView/>} {currentView==='report'&&<ReportView/>} {currentView==='settings'&&<SettingsView/>}
        </div>
      </main>
    </div>
  );
};

const App = () => ( <FocusProvider><AppLayout /><style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-thumb{background-color:#222;border-radius:20px}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn 0.4s ease-out forwards}::selection{background-color:#fff;color:#000000}`}</style></FocusProvider> );
export default App;