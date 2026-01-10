import React, { useState, useEffect, useContext, createContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LayoutDashboard, Zap, Target, BarChart2, Play, Pause, Coffee, RotateCcw, CheckCircle, Plus, Clock, Flame, Settings, BookOpen, Quote, Trash2, Menu, X, History, ArrowLeft, Calendar, AlertTriangle, Infinity as InfinityIcon, List, CheckSquare, Download, Upload, ChevronDown, ChevronRight, ChevronLeft, Brain, Flag, FileText, Activity, Percent, Trophy, Star, Crown, Award, HardDrive, Sprout, Feather, Compass, Shield, Scroll, Layers, PieChart as PieChartIcon, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { CalendarTab } from './components/CalendarTab';

const MathRenderer = ({ text, className = "" }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!text) return;
    if (!document.getElementById('katex-css')) document.head.appendChild(Object.assign(document.createElement('link'), { id: 'katex-css', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' }));
    if (!window.katex && !document.getElementById('katex-js')) {
      const script = document.createElement('script');
      script.id = 'katex-js'; script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = renderMath; document.head.appendChild(script);
    } else renderMath();
  }, [text]);
  const renderMath = () => {
    if (ref.current && window.katex && text) {
      try {
        ref.current.innerHTML = '';
        text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).forEach(part => {
          const span = document.createElement('span');
          const isBlock = part.startsWith('$$');
          if (isBlock || part.startsWith('$')) {
            try { window.katex.render(part.slice(isBlock ? 2 : 1, isBlock ? -2 : -1), span, { displayMode: isBlock, throwOnError: false }); } catch { span.innerText = part; }
          } else span.innerText = part;
          ref.current.appendChild(span);
        });
      } catch { ref.current.innerText = text; }
    }
  };
  return <div ref={ref} className={className}>{!window.katex && text}</div>;
};

const POMODORO = { WORK: 25 * 60, SHORT: 5 * 60, LONG: 15 * 60 };
const DEFAULT_SUB = [{ id: 1, name: 'Programação', color: '#8b5cf6', goalHours: 20 }, { id: 2, name: 'Matemática', color: '#10b981', goalHours: 10 }, { id: 3, name: 'Inglês', color: '#f59e0b', goalHours: 5 }];
const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const useStickyState = (def, key) => {
  const [v, s] = useState(() => { try { const i = window.localStorage.getItem(key); return i !== null ? JSON.parse(i) : def; } catch { return def; } });
  useEffect(() => window.localStorage.setItem(key, JSON.stringify(v)), [key, v]);
  return [v, s];
};

const TITLES = [{ l: 50, t: "Sábio do Fluxo" }, { l: 30, t: "Arquivista Mestre" }, { l: 20, t: "Guardião da Disciplina" }, { l: 10, t: "Explorador do Conhecimento" }, { l: 5, t: "Aprendiz Focado" }, { l: 1, t: "Novato Curioso" }];
const RANKS = [{ m: 50, i: Crown, b: "from-[#1100ab] to-blue-500", c: "text-blue-300" }, { m: 30, i: Scroll, b: "from-slate-400 to-gray-200", c: "text-slate-300" }, { m: 20, i: Shield, b: "from-orange-500 to-amber-600", c: "text-amber-400" }, { m: 10, i: Compass, b: "from-blue-500 to-cyan-500", c: "text-cyan-400" }, { m: 5, i: Feather, b: "from-emerald-500 to-green-600", c: "text-emerald-400" }, { m: 1, i: Sprout, b: "from-gray-500 to-slate-600", c: "text-gray-400" }];
const getTitle = l => TITLES.find(t => l >= t.l)?.t || "Novato Curioso";
const getRank = l => RANKS.find(s => l >= s.m) || RANKS[RANKS.length - 1];
const getXP = l => Math.floor(500 * Math.pow(l, 1.5));

export const FocusContext = createContext();
const FocusProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [subjects, setSubjects] = useStickyState(DEFAULT_SUB, 'focus_subjects');
  const [sessions, setSessions] = useStickyState([], 'focus_sessions');
  const [tasks, setTasks] = useStickyState([], 'focus_tasks');
  const [mistakes, setMistakes] = useStickyState([], 'focus_mistakes');
  const [themes, setThemes] = useStickyState([], 'focus_themes');
  const [countdown, setCountdown] = useStickyState({ date: null, title: '' }, 'focus_countdown');
  const [userLevel, setUserLevel] = useStickyState({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" }, 'focus_rpg');
  const [timerState, setTimerState] = useState({ mode: 'WORK', type: 'POMODORO', active: false, cycles: 0, timeLeft: POMODORO.WORK });
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [flowStoredTime, setFlowStoredTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const refs = useRef({ end: null, start: null, last: 0 });

  useEffect(() => { if (subjects.length > 0 && !subjects.find(s => s.id === selectedSubjectId)) setSelectedSubjectId(subjects[0].id); }, [subjects, selectedSubjectId]);
  useEffect(() => { 
    if (themes.length > 0) {
        const healed = themes.map(t => ({ ...t, items: t.items.map((i, idx) => ({ ...i, id: i.id + (Math.random() * (idx + 1)) })) }));
        if (JSON.stringify(themes) !== JSON.stringify(healed)) setThemes(healed);
    }
  }, []);
  useEffect(() => { document.title = timerState.active ? `${formatTime(timerState.timeLeft)} - ${timerState.mode === 'WORK' ? 'Foco' : 'Pausa'}` : "Focus App"; }, [timerState.active, timerState.timeLeft, timerState.mode]);

  useEffect(() => {
    let interval = null;
    if (timerState.active) {
      const now = Date.now();
      if (timerState.type === 'FLOW' && timerState.mode === 'WORK') refs.current.start = now - (timerState.timeLeft * 1000);
      else refs.current.end = now + (timerState.timeLeft * 1000);
      refs.current.last = now;

      interval = setInterval(() => {
        const curr = Date.now();
        const delta = Math.round((curr - refs.current.last) / 1000);
        refs.current.last = curr;
        if (timerState.mode === 'WORK' && delta > 0) setElapsedTime(p => p + delta);

        if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
          setTimerState(p => ({ ...p, timeLeft: Math.floor((curr - refs.current.start) / 1000) }));
        } else {
          const rem = Math.ceil((refs.current.end - curr) / 1000);
          if (rem <= 0) {
            clearInterval(interval);
            try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch (e) {}
            if (timerState.type === 'POMODORO') {
               const nextC = timerState.cycles + (timerState.mode === 'WORK' ? 1 : 0);
               const nextMode = timerState.mode === 'WORK' ? 'BREAK' : 'WORK';
               const nextTime = nextMode === 'WORK' ? POMODORO.WORK : (nextC % 3 === 0 ? POMODORO.LONG : POMODORO.SHORT);
               setTimerState(p => ({ ...p, active: false, mode: nextMode, timeLeft: nextTime, cycles: nextC }));
            } else if (timerState.type === 'FLOW' && timerState.mode === 'BREAK') {
               setTimerState(p => ({ ...p, active: false, mode: 'WORK', timeLeft: flowStoredTime }));
            }
          } else setTimerState(p => ({ ...p, timeLeft: rem }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.active, timerState.mode, timerState.type, flowStoredTime]);

  const gainXP = (amt, reason = "") => {
    setUserLevel(prev => {
      let { level, currentXP: cx, totalXP: tx } = prev, nx = getXP(level);
      cx += amt; tx += amt;
      while (cx >= nx && amt > 0) { cx -= nx; level++; nx = getXP(level); alert(`🎉 LEVEL UP! Nível ${level}: ${getTitle(level)}`); }
      return { level, currentXP: cx, totalXP: tx, title: getTitle(level) };
    });
    if (reason) console.log(`${amt > 0 ? '+' : ''}${amt} XP: ${reason}`);
  };

  const addSession = (mins, notes, mSubId = null, qs = 0, errs = 0) => {
    const sId = mSubId ? Number(mSubId) : selectedSubjectId;
    
    // CORREÇÃO DE LÓGICA: Validação e Higienização de Dados
    // Garante que não sejam negativos e que sejam inteiros
    let cleanQs = Math.max(0, parseInt(qs) || 0);
    let cleanErrs = Math.max(0, parseInt(errs) || 0);

    // Lógica para impedir que Erros > Questões
    if (cleanErrs > cleanQs) {
        alert(`Atenção: Você informou mais erros (${cleanErrs}) do que questões feitas (${cleanQs}). Ajustando o número de erros para ser igual ao total.`);
        cleanErrs = cleanQs;
    }

    setSessions(p => [...p, { id: Date.now(), date: new Date().toISOString(), minutes: mins, subjectId: sId, notes, questions: cleanQs, errors: cleanErrs }]);
    
    // XP e Metas calculados com os valores limpos
    let xp = (Math.floor(mins / 10) * 50) + (cleanQs * 10);
    const sub = subjects.find(s => s.id === sId);
    if (sub) {
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0); // Garante comparação correta de tempo
      
      const prev = sessions.filter(s => s.subjectId === sId && new Date(s.date) >= startW).reduce((a, s) => a + s.minutes, 0);
      if (prev < sub.goalHours * 60 && (prev + mins) >= sub.goalHours * 60) { xp += 500; alert(`🏆 Meta semanal de ${sub.name} atingida! +500 XP`); }
    }
    if (xp > 0) gainXP(xp, "Sessão");
  };

  const methods = {
    addSubject: (n, c, g) => setSubjects(p => [...p, { id: Date.now(), name: n, color: c, goalHours: Math.max(0, Number(g)) }]), // Evita meta negativa
    updateSubject: (id, g) => setSubjects(p => p.map(s => s.id === id ? { ...s, goalHours: Math.max(0, Number(g)) } : s)),
    deleteSubject: (id) => { 
        if (subjects.length > 1 && window.confirm("Excluir?")) { 
            const r = subjects.filter(s => s.id !== id); 
            setSubjects(r); 
            // Correção: Garante que o selecionado mude se o atual for deletado
            if (selectedSubjectId === id) setSelectedSubjectId(r[0].id); 
        } else if(subjects.length<=1) alert("Mantenha uma matéria."); 
    },
    addTask: (t, sId) => setTasks(p => [...p, { id: Date.now(), text: t, completed: false, subjectId: sId }]),
    toggleTask: (id) => setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t)),
    deleteTask: (id) => window.confirm("Excluir?") && setTasks(p => p.filter(t => t.id !== id)),
    addMistake: (sId, d, r, sol) => setMistakes(p => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(sId), description: d, reason: r, solution: sol, consolidated: false }, ...p]),
    consolidateMistake: (id, diag, strat) => { setMistakes(p => p.map(m => m.id === id ? { ...m, consolidated: true, diagnosis: diag, strategy: strat } : m)); gainXP(100, "Erro Consolidado"); },
    deleteMistake: (id) => { if (window.confirm("Apagar?")) { const m = mistakes.find(x => x.id === id); if (m?.consolidated) { gainXP(-100); alert("-100 XP por apagar aprendizado."); } setMistakes(p => p.filter(x => x.id !== id)); } },
    addTheme: (sId, t) => setThemes(p => [...p, { id: Date.now(), subjectId: sId, title: t, items: [] }]),
    deleteTheme: (id) => window.confirm("Excluir?") && setThemes(p => p.filter(t => t.id !== id)),
    addThemeItem: (tId, txt) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: [...t.items, { id: Date.now() + Math.random(), text: txt, completed: false }] } : t)),
    toggleThemeItem: (tId, iId) => setThemes(p => { const t = p.find(x => x.id === tId), i = t?.items.find(x => x.id === iId); if(i && !i.completed) gainXP(20); return p.map(x => x.id === tId ? { ...x, items: x.items.map(y => y.id === iId ? { ...y, completed: !y.completed } : y) } : x); }),
    deleteThemeItem: (tId, iId) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: t.items.filter(i => i.id !== iId) } : t)),
    resetXPOnly: () => window.confirm("Resetar nível?") && (setUserLevel({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" }) || alert("Nível resetado.")),
    resetAllData: () => window.confirm("Apagar TUDO?") && (localStorage.clear() || window.location.reload()),
    deleteDayHistory: (d) => window.confirm(`Apagar ${d}?`) && setSessions(p => p.filter(s => new Date(s.date).toDateString() !== d))
  };

  const kpiData = useMemo(() => {
    const now = new Date(), todayS = now.toDateString();
    const dates = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0, d = new Date(now);
    while (dates.has(d.toDateString()) || (d.toDateString()===todayS && !dates.has(todayS)) || [0,6].includes(d.getDay())) { if (dates.has(d.toDateString())) streak++; d.setDate(d.getDate() - 1); if(d < new Date(now.getFullYear()-1,0,1)) break; }
    return { todayMinutes: sessions.filter(s => new Date(s.date).toDateString() === todayS).reduce((a, c) => a + c.minutes, 0), totalHours: (sessions.reduce((a, c) => a + c.minutes, 0) / 60).toFixed(1), streak };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0);
    return Array.from({ length: 7 }).map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return { name: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i], minutos: sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.minutes, 0) }; });
  }, [sessions]);

  const advancedStats = useMemo(() => {
    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const monthlyData = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => ({ name: (i + 1).toString(), minutes: sessions.reduce((acc, s) => { const sd = new Date(s.date); return (sd.getDate() === i + 1 && sd.getMonth() === m && sd.getFullYear() === y) ? acc + s.minutes : acc; }, 0) }));
    const ranked = subjects.map(s => ({ ...s, totalMins: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + c.minutes, 0) })).sort((a, b) => b.totalMins - a.totalMins);
    const dates = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].map(d => new Date(d)).sort((a, b) => a - b);
    let maxS = 0, currS = 0; dates.forEach((d, i) => { if (i === 0) currS = 1; else currS = (d - dates[i - 1] <= 86400000) ? currS + 1 : 1; maxS = Math.max(maxS, currS); });
    return { monthlyData, bestSubject: ranked[0], worstSubject: ranked[ranked.length - 1], maxStreak: maxS };
  }, [sessions, subjects]);

  return (
    <FocusContext.Provider value={{ currentView, setCurrentView, selectedHistoryDate, setSelectedHistoryDate, subjects, sessions, tasks, mistakes, themes, countdown, setCountdown, userLevel, timerMode: timerState.mode, setTimerMode: m => setTimerState(p => ({ ...p, mode: m })), timerType: timerState.type, setTimerType: t => setTimerState(p => ({ ...p, type: t })), timeLeft: timerState.timeLeft, setTimeLeft: t => setTimerState(p => ({ ...p, timeLeft: t })), isActive: timerState.active, setIsActive: a => setTimerState(p => ({ ...p, active: a })), cycles: timerState.cycles, setCycles: c => setTimerState(p => ({ ...p, cycles: c })), selectedSubjectId, setSelectedSubjectId, flowStoredTime, setFlowStoredTime, elapsedTime, setElapsedTime, kpiData, weeklyChartData, advancedStats, addSession, ...methods }}>
      {children}
    </FocusContext.Provider>
  );
};

const Card = ({ children, className = "", onClick }) => <div onClick={onClick} className={`bg-[#09090b] border border-white/5 rounded-3xl shadow-lg p-6 ${className}`}>{children}</div>;
const Button = ({ children, onClick, variant = 'primary', className = "", type="button" }) => <button type={type} onClick={onClick} className={`px-5 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${variant==='primary'?"bg-[#1100ab] hover:bg-[#0c007a] text-white shadow-[#1100ab]/30 shadow-md":variant==='secondary'?"bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700":"bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"} ${className}`}>{children}</button>;
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : 'unset'; return () => { document.body.style.overflow = 'unset'; }; }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"><div className="absolute inset-0" onClick={onClose}></div><div className="bg-[#09090b] border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar z-10"><button onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"><X size={20}/></button><h2 className="text-xl font-bold text-white mb-6 pr-8">{title}</h2>{children}</div></div>, document.body);
};

const SettingsView = () => {
  const { resetAllData, resetXPOnly } = useContext(FocusContext);
  const hExp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('focus_')).map(k => [k, localStorage.getItem(k)])))], { type: 'application/json' })); a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
  const hImp = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = x => { try { const d = JSON.parse(x.target.result); if (confirm("Substituir dados?")) { Object.keys(d).forEach(k => localStorage.setItem(k, d[k])); window.location.reload(); } } catch { alert("Erro."); } }; r.readAsText(f); };
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><header className="mb-8"><h1 className="text-2xl font-bold text-white mb-1">Configurações</h1><p className="text-zinc-400">Gerencie seus dados e preferências.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><HardDrive size={20} className="text-[#1100ab]" /> Dados do Sistema</h3><div className="space-y-4"><div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800"><p className="text-sm text-zinc-300 mb-3">Exporte seus dados para backup ou importe de outro dispositivo.</p><div className="flex gap-3"><button onClick={hExp} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"><Download size={16} /> Exportar</button><label className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"><Upload size={16} /> Importar<input type="file" className="hidden" onChange={hImp} /></label></div></div><div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10"><p className="text-sm text-red-400 mb-3 font-bold">Zona de Perigo</p><button onClick={resetAllData} className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><Trash2 size={16} /> Resetar TUDO (Fábrica)</button></div></div></Card>
        <Card><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Crown size={20} className="text-yellow-500" /> Gamificação</h3><div className="space-y-4"><div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800"><p className="text-sm text-zinc-300 mb-3">Reiniciar apenas seu progresso de níveis e XP.</p><button onClick={resetXPOnly} className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><RotateCcw size={16} /> Resetar Nível e XP</button></div></div></Card>
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { kpiData, weeklyChartData, setCurrentView, countdown, setCountdown, userLevel } = useContext(FocusContext);
  const [modal, setModal] = useState(false); const [form, setForm] = useState({ date: '', title: '' });
  const xpNext = getXP(userLevel.level), rank = getRank(userLevel.level);
  const daysLeft = countdown.date ? Math.ceil((new Date(countdown.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000) : null;
  const countStyle = daysLeft !== null ? (daysLeft < 0 ? {c:"border-l-red-500 text-red-500", b:"bg-red-500/20 text-red-500"} : daysLeft === 0 ? {c:"border-l-red-500 text-red-500", b:"bg-red-500/20 text-red-500 animate-pulse"} : daysLeft < 7 ? {c:"border-l-orange-500 text-orange-500", b:"bg-orange-500/20 text-orange-500"} : daysLeft < 30 ? {c:"border-l-blue-500 text-blue-500", b:"bg-blue-500/20 text-blue-500"} : {c:"border-l-emerald-500 text-emerald-500", b:"bg-emerald-500/20 text-emerald-500"}) : {c:"border-l-zinc-700 text-zinc-500", b:"bg-zinc-500/20 text-zinc-500"};

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <Card className="bg-gradient-to-r from-[#1100ab]/80 via-[#0a0a0a] to-[#0a0a0a] border-[#1100ab]/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1100ab]/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="flex-shrink-0 relative"><div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rank.b} p-[2px]`}><div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center flex-col"><rank.i className={`${rank.c} mb-1`} size={28} /><span className="text-2xl font-bold text-white">{userLevel.level}</span></div></div><div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400">Lvl</div></div>
          <div className="flex-1 w-full"><div className="flex justify-between items-end mb-2"><div><h2 className="text-2xl font-bold text-white">{userLevel.title}</h2><p className="text-sm text-zinc-400">Total: {userLevel.totalXP.toLocaleString()} XP</p></div><div className="hidden sm:block text-[#4d4dff] font-bold">{userLevel.currentXP} <span className="text-zinc-500">/ {xpNext} XP</span></div></div><div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 relative"><div className={`h-full bg-gradient-to-r ${rank.b} transition-all duration-1000`} style={{ width: `${(userLevel.currentXP / xpNext) * 100}%` }} /><div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]" /></div><p className="text-xs text-zinc-500 mt-2 text-right sm:hidden">{userLevel.currentXP} / {xpNext} XP</p></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ l: 'Hoje', v: `${kpiData.todayMinutes} min`, i: Zap, c: 'yellow-500' }, { l: 'Total', v: `${kpiData.totalHours} h`, i: Clock, c: '[#1100ab]', ic: '[#4d4dff]' }, { l: 'Sequência', v: `${kpiData.streak} dias`, i: Flame, c: 'orange-500' }].map((x, i) => <Card key={i} className={`flex items-center gap-4 border-l-4 border-l-${x.c}`}><div className={`p-3 bg-${x.c}/20 rounded-full text-${x.ic || x.c}`}><x.i size={24} /></div><div><p className="text-sm text-zinc-400">{x.l}</p><p className="text-2xl font-bold text-white">{x.v}</p></div></Card>)}
        <Card onClick={() => { setForm(countdown); setModal(true); }} className={`flex items-center gap-4 border-l-4 cursor-pointer hover:bg-zinc-800/80 transition-all group ${countStyle.c}`}><div className={`p-3 rounded-full transition-colors ${countStyle.b}`}><Flag size={24} /></div><div><p className="text-sm text-zinc-400 group-hover:text-white transition-colors">{daysLeft !== null ? (countdown.title || "Meta") : "Próxima Meta"}</p>{daysLeft !== null ? (<p className={`text-2xl font-bold ${daysLeft <= 7 ? 'scale-105 origin-left' : ''} transition-transform`}>{daysLeft === 0 ? "É HOJE!" : daysLeft < 0 ? "Concluído" : `${daysLeft} dias`}</p>) : <p className="text-sm font-bold text-zinc-500 italic">Definir data...</p>}</div></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]"><h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-[#1100ab]" /> Atividade Semanal</h3><div className="h-[250px] w-full"><ResponsiveContainer><LineChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} /><YAxis stroke="#71717a" tick={{ fill: '#a1a1aa' }} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px' }} /><Line type="monotone" dataKey="minutos" stroke="#1100ab" strokeWidth={3} dot={{ r: 4, fill: '#1100ab' }} /></LineChart></ResponsiveContainer></div></Card>
        <Card className="bg-gradient-to-br from-[#1100ab]/40 to-[#0a0a0a] border-[#1100ab]/30 flex flex-col justify-between relative overflow-hidden group"><div className="absolute top-0 right-0 w-32 h-32 bg-[#1100ab]/10 blur-[50px] group-hover:bg-[#1100ab]/20 transition-all duration-500"></div><div><h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Trabalho Profundo <InfinityIcon size={18} className="text-[#4d4dff]" /></h3><p className="text-zinc-300 mb-6 italic text-sm border-l-2 border-[#1100ab]/50 pl-3">"A superficialidade não constrói impérios."</p></div><Button onClick={() => setCurrentView('focus')} className="w-full py-4 text-lg shadow-lg shadow-[#1100ab]/20 hover:shadow-[#1100ab]/40 border border-white/5">Mergulhar no Foco <Zap size={20} className="fill-current" /></Button></Card>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Configurar Meta"><form onSubmit={e => { e.preventDefault(); setCountdown({ date: form.date, title: form.title || "Minha Meta" }); setModal(false); }} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Nome da Meta</label><input type="text" placeholder="Ex: ENEM..." className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Data Alvo</label><input type="date" required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => { setCountdown({ date: null, title: '' }); setModal(false); }} className="flex-1">Limpar</Button><Button type="submit" className="flex-[2]">Salvar Data</Button></div></form></Modal>
    </div>
  );
};

const FocusView = () => {
  const { timerType, setTimerType, subjects, selectedSubjectId, setSelectedSubjectId, timerMode, setTimerMode, timeLeft, setTimeLeft, isActive, setIsActive, cycles, setCycles, tasks, addTask, toggleTask, deleteTask, addSession, elapsedTime, setElapsedTime, flowStoredTime, setFlowStoredTime } = useContext(FocusContext);
  const [taskT, setTaskT] = useState(""); const [finMod, setFinMod] = useState(false); const [manMod, setManMod] = useState(false);
  const [fForm, setFForm] = useState({ n: "", q: "", e: "" }); const [mForm, setMForm] = useState({ t: "", n: "", s: "", q: "", e: "" });
  
  if (!subjects.length) return <div className="text-center mt-20 text-zinc-400">Adicione matérias em Metas.</div>;
  
  const finish = (e) => { 
      e.preventDefault(); 
      const mins = Math.round(elapsedTime / 60); 
      // Validação do tempo: só salva se tiver estudado algo
      if (mins > 0) { 
          // Chama addSession passando os valores parseados, mas o próprio addSession já valida.
          addSession(mins, fForm.n, null, fForm.q, fForm.e); 
          alert(`Sessão salva: ${mins} min.`); 
      } else {
          alert("Tempo insuficiente para salvar.");
      }
      setIsActive(false); setTimerMode('WORK'); setTimeLeft(timerType === 'FLOW' ? 0 : POMODORO.WORK); setElapsedTime(0); setCycles(0); setFinMod(false); setFForm({ n: "", q: "", e: "" }); 
  };
  
  const manual = (e) => { 
      e.preventDefault(); 
      if (!mForm.t || !mForm.s) return alert("Preencha tempo e matéria."); 
      // Garante que o tempo seja positivo e inteiro
      const tValid = Math.max(1, parseInt(mForm.t) || 0);
      addSession(tValid, mForm.n, mForm.s, mForm.q, mForm.e); 
      setMForm({ t: "", n: "", s: "", q: "", e: "" }); setManMod(false); alert("Salvo!"); 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden"><div className={`absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${isActive ? (timerMode === 'WORK' ? 'bg-[#1100ab] animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-zinc-800'}`}></div><div className="flex bg-black p-1 rounded-xl border border-zinc-800 mb-6 z-10"><button onClick={() => { setIsActive(false); setTimerType('POMODORO'); setTimeLeft(POMODORO.WORK); setTimerMode('WORK'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>Pomodoro</button><button onClick={() => { setIsActive(false); setTimerType('FLOW'); setTimeLeft(0); setTimerMode('WORK'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'FLOW' ? 'bg-[#1100ab] text-white shadow' : 'text-zinc-500'}`}>Flow</button></div>
          <div className="w-full max-w-xs mb-8 z-10 text-center"><label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Matéria</label><select disabled={isActive} value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(Number(e.target.value))} className="w-full bg-[#18181B] text-white border border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer">{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="z-10 text-center"><div className="mb-6"><span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode === 'WORK' ? 'bg-[#1100ab]/10 text-[#4d4dff] border-[#1100ab]/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{timerMode === 'WORK' ? 'Foco Total' : 'Pausa'}</span></div><div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter mb-4 tabular-nums drop-shadow-2xl">{formatTime(timeLeft)}</div><div className="text-zinc-400 mb-8 font-medium">Ciclos: <span className="text-white font-bold ml-2">{cycles}</span></div>
            <div className="flex gap-4 justify-center items-center mt-8"><button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive ? 'bg-zinc-800 text-white border border-zinc-700' : (timerMode === 'WORK' ? 'bg-[#1100ab] text-white' : 'bg-emerald-500 text-white')}`}>{isActive ? <Pause size={24} /> : <Play size={24} />} <span>{isActive ? 'Pausar' : 'Iniciar'}</span></button><button onClick={() => { setIsActive(false); setTimeLeft(timerType === 'FLOW' ? 0 : POMODORO.WORK); setElapsedTime(0); }} className="p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"><RotateCcw size={24} /></button>{timerType === 'FLOW' && timerMode === 'WORK' && <button onClick={() => { setFlowStoredTime(timeLeft); setTimerMode('BREAK'); setTimeLeft(Math.floor(timeLeft * 0.2)); setIsActive(true); }} className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><Coffee size={24} /></button>}<button onClick={() => { setIsActive(false); setFinMod(true); }} className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20"><CheckCircle size={24} /></button></div>{timerType === 'FLOW' && timerMode === 'WORK' && <p className="text-xs text-zinc-500 mt-4">Clique no <Coffee size={12} className="inline" /> para pausa.</p>}</div></Card>
      </div>
      <div className="lg:col-span-1"><Card className="h-full flex flex-col min-h-[300px]"><h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-[#1100ab]" /> Tarefas</h3><form onSubmit={e => { e.preventDefault(); if (taskT && selectedSubjectId) { addTask(taskT, selectedSubjectId); setTaskT(""); } }} className="mb-4 flex gap-2"><input placeholder="Nova tarefa..." className="flex-1 bg-black border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#1100ab]" value={taskT} onChange={e => setTaskT(e.target.value)} /><button type="submit" className="bg-[#1100ab] rounded-2xl px-3 text-white"><Plus size={18} /></button></form><div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{tasks.filter(t => t.subjectId === selectedSubjectId).map(t => (<div key={t.id} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${t.completed ? 'bg-[#1100ab]/10 border-[#1100ab]/20 opacity-60' : 'bg-[#18181B] border-zinc-800'}`}><button onClick={() => toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${t.completed ? 'bg-[#1100ab] border-[#1100ab]' : 'border-zinc-500'}`}>{t.completed && <CheckCircle size={14} className="text-white" />}</button><span className={`text-sm flex-1 break-words ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{t.text}</span><button onClick={() => deleteTask(t.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></div>))}</div></Card></div>
      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-800/50 pt-10"><div className="bg-[#09090b] p-6 rounded-3xl border border-zinc-800 max-w-md w-full text-center"><Clock size={24} className="mx-auto mb-3 text-zinc-500 opacity-50" /><p className="text-zinc-400 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p><button onClick={() => { setMForm({ ...mForm, s: subjects[0]?.id }); setManMod(true); }} className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-[#1100ab]/10 hover:bg-[#1100ab] text-[#4d4dff] hover:text-white rounded-2xl border border-[#1100ab]/20 transition-all duration-300 font-bold text-sm shadow-lg shadow-[#1100ab]/5"><Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Lançar Estudo Manual</button></div></div>
      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Resumo da Sessão"><form onSubmit={finish} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">O que você estudou?</label><textarea className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-24 outline-none focus:border-[#1100ab] resize-none" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Questões Feitas</label><input type="number" min="0" className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-blue-500" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} /></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Erradas</label><input type="number" min="0" className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-white outline-none focus:border-red-500" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} /></div></div><div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-[2]">Salvar Sessão</Button></div></form></Modal>
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual"><form onSubmit={manual} className="space-y-5"><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Matéria</label><select required className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value })}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Tempo (min)</label><input required type="number" min="1" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-[#1100ab]" value={mForm.t} onChange={e => setMForm({ ...mForm, t: e.target.value })} /></div><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Diário</label><textarea className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white h-28 outline-none focus:border-[#1100ab] resize-none text-sm" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-zinc-500 uppercase">Feitas</label><input type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-blue-500" value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} /></div><div><label className="text-xs font-bold text-zinc-500 uppercase">Erradas</label><input type="number" min="0" className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-white outline-none focus:border-red-500" value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} /></div></div><Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-[#1100ab]/20">Confirmar</Button></form></Modal>
    </div>
  );
};

const MistakesView = () => {
  const { subjects, mistakes, addMistake, deleteMistake, consolidateMistake } = useContext(FocusContext);
  const [f, setF] = useState({ sub: "", desc: "", r: "Conceito", sol: "" }); const [exp, setExp] = useState([]); const [cons, setCons] = useState({ open: false, id: null, d: "", diag: "", strat: "" });
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><header><h1 className="text-2xl font-bold text-white mb-1">Caderno de Erros</h1></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit"><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Novo Erro</h3><form onSubmit={e => { e.preventDefault(); if (f.sub && f.desc && f.sol) { addMistake(f.sub, f.desc, f.r, f.sol); setF({ sub: "", desc: "", r: "Conceito", sol: "" }); alert("Salvo!"); } }} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label><select required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-2.5 text-white" value={f.sub} onChange={e => setF({ ...f, sub: e.target.value })}><option value="">Selecione...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Motivo</label><div className="flex flex-wrap gap-2 mt-2">{["Falta de Atenção", "Esqueci Fórmula", "Erro Cálculo", "Conceito", "Tempo"].map(r => <button key={r} type="button" onClick={() => setF({ ...f, r })} className={`text-xs px-3 py-1.5 rounded-full border ${f.r === r ? 'bg-[#1100ab] border-[#1100ab] text-white' : 'border-zinc-700 text-zinc-400'}`}>{r}</button>)}</div></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Erro</label><textarea required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} /></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Solução</label><textarea required className="w-full mt-1 bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-24" value={f.sol} onChange={e => setF({ ...f, sol: e.target.value })} /></div><Button type="submit" className="w-full">Salvar</Button></form></Card>
        <div className="lg:col-span-2 space-y-4">{!mistakes.length ? <div className="text-center py-10 opacity-50"><CheckCircle size={40} className="mx-auto mb-2" /><p>Vazio.</p></div> : mistakes.map(m => <div key={m.id} className={`border rounded-3xl p-5 relative group transition-all duration-300 ${m.consolidated ? 'bg-zinc-900/50 border-zinc-800 opacity-75' : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'}`}>{m.consolidated && <div className="absolute top-4 right-12 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 flex items-center gap-1 select-none"><CheckCircle size={10} /> ERRO APRENDIDO</div>}<div className="absolute top-4 right-4 flex gap-2">{!m.consolidated && <button onClick={() => setCons({ open: true, id: m.id, d: m.description, diag: "", strat: "" })} className="text-zinc-600 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle size={18} /></button>}<button onClick={() => deleteMistake(m.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button></div><div className="flex items-center gap-3 mb-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: subjects.find(s => s.id === m.subjectId)?.color }}>{subjects.find(s => s.id === m.subjectId)?.name}</span><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{m.reason}</span></div><div className="grid md:grid-cols-2 gap-6"><div className="space-y-1"><p className="text-xs text-red-400 font-bold uppercase">Erro</p><MathRenderer className="text-zinc-300 text-sm" text={m.description} /></div><div className="space-y-1 md:border-l md:border-zinc-800 md:pl-6"><p className="text-xs text-green-400 font-bold uppercase">Solução</p><MathRenderer className="text-zinc-300 text-sm" text={m.solution} /></div></div>{m.consolidated && <div className="mt-4 pt-4 border-t border-zinc-800/50"><button onClick={() => setExp(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])} className="text-xs text-[#4d4dff] hover:text-white flex items-center gap-1 transition-colors">{exp.includes(m.id) ? 'Ocultar reflexão' : 'Ver minha reflexão'} <ChevronDown size={14} className={`transition-transform ${exp.includes(m.id) ? 'rotate-180' : ''}`} /></button>{exp.includes(m.id) && <div className="mt-3 grid md:grid-cols-2 gap-4 animate-fadeIn"><div className="bg-black/50 p-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Diagnóstico</p><p className="text-xs text-zinc-300 italic">"{m.diagnosis}"</p></div><div className="bg-black/50 p-3 rounded-2xl border border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Estratégia</p><p className="text-xs text-zinc-300 italic">"{m.strategy}"</p></div></div>}</div>}</div>)}</div>
      </div>
      <Modal isOpen={cons.open} onClose={() => setCons({ ...cons, open: false })} title="Você realmente aprendeu?"><form onSubmit={e => { e.preventDefault(); if (cons.diag && cons.strat) { consolidateMistake(cons.id, cons.diag, cons.strat); setCons({ ...cons, open: false }); alert("Erro consolidado! +100 XP"); } }} className="space-y-4"><div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 mb-4"><p className="text-xs text-zinc-500 font-bold uppercase mb-1">Erro original</p><p className="text-sm text-zinc-300 line-clamp-2">{cons.d}</p></div><div><label className="text-xs text-[#4d4dff] font-bold uppercase">Diagnóstico</label><textarea required className="w-full bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20 outline-none focus:border-[#1100ab]" value={cons.diag} onChange={e => setCons({ ...cons, diag: e.target.value })} /></div><div><label className="text-xs text-green-400 font-bold uppercase">Estratégia</label><textarea required className="w-full bg-black border border-zinc-700 rounded-2xl p-3 text-sm text-white h-20 outline-none focus:border-green-500" value={cons.strat} onChange={e => setCons({ ...cons, strat: e.target.value })} /></div><Button type="submit" className="w-full mt-2">Confirmar Aprendizado</Button></form></Modal>
    </div>
  );
};

const GoalsView = () => {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem } = useContext(FocusContext);
  const [viewSub, setViewSub] = useState(null); const [col, setCol] = useState({}); const [modal, setModal] = useState(false); const [f, setF] = useState({ name: "", goal: 60, color: "#8b5cf6" }); const [edit, setEdit] = useState({ id: null, val: "" }); const [newTheme, setNewTheme] = useState("");
  const getProg = (id, g) => { 
      // Correção de Data: Pega o domingo da semana atual com reset de horas
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0);
      
      const wM = sessions.reduce((a, s) => (s.subjectId === id && new Date(s.date) >= startW) ? a + s.minutes : a, 0); 
      const p = Math.round((wM / (g * 60)) * 100); 
      return { h: (wM / 60).toFixed(1), p: Math.min(100, p || 0) }; 
  };

  if (viewSub) {
    const s = subjects.find(x => x.id === viewSub), sTh = themes.filter(t => t.subjectId === s?.id), tot = sTh.reduce((a, t) => a + t.items.length, 0), comp = sTh.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0);
    if (!s) return <div onClick={() => setViewSub(null)}>Erro.</div>;
    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><button onClick={() => setViewSub(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white"><ArrowLeft size={20} /> Voltar</button>
        <header className="flex justify-between items-end border-b border-zinc-800 pb-6"><div><span className="text-xs font-bold uppercase px-2 py-1 rounded text-white mb-2 inline-block" style={{ backgroundColor: s.color }}>{s.name}</span><h1 className="text-3xl font-bold text-white">Conteúdo</h1><div className="flex items-center gap-4 mt-2"><div className="flex items-center gap-2 text-zinc-400 text-sm"><CheckSquare size={16} className="text-[#1100ab]" /><span>{comp} / {tot} Tópicos</span></div><div className="flex items-center gap-2 text-zinc-400 text-sm"><Percent size={16} className="text-[#1100ab]" /><span>{tot ? Math.round((comp / tot) * 100) : 0}% Concluído</span></div></div></div><div className="text-right text-2xl font-bold text-white">{s.goalHours}h <span className="text-xs text-zinc-500 block font-normal">Meta Semanal</span></div></header>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex gap-4 items-center"><div className="flex-1"><label className="text-xs text-zinc-500 uppercase font-bold mb-1">Novo Tema</label><input className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={newTheme} onChange={e => setNewTheme(e.target.value)} onKeyDown={e => e.key === 'Enter' && newTheme && addTheme(viewSub, newTheme) && setNewTheme("")} /></div><Button onClick={() => newTheme && addTheme(viewSub, newTheme) && setNewTheme("")}>Adicionar</Button></div>
        <div className="space-y-6">{sTh.map(t => { const p = t.items.length ? Math.round((t.items.filter(i => i.completed).length / t.items.length) * 100) : 0; return (<Card key={t.id} className="relative group transition-all duration-300"><div className="flex justify-between items-start mb-4"><div className="flex gap-3 w-full"><button onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-zinc-500">{col[t.id] ? <ChevronRight /> : <ChevronDown />}</button><div className="flex-1"><h3 onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-xl font-bold text-white cursor-pointer select-none">{t.title}</h3><div className="flex items-center gap-2 mt-1"><div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-[#1100ab]" style={{ width: `${p}%` }} /></div><span className="text-xs text-zinc-500">{p}%</span></div></div></div><button onClick={() => deleteTheme(t.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button></div>{!col[t.id] && <div className="space-y-2 mb-4 animate-fadeIn pl-8">{t.items.map(i => <div key={i.id} className="flex gap-3 p-2 hover:bg-zinc-800/50 rounded-2xl group/item"><button onClick={() => toggleThemeItem(t.id, i.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${i.completed ? 'bg-[#1100ab] border-[#1100ab]' : 'border-zinc-600'}`}>{i.completed && <CheckSquare size={14} className="text-white" />}</button><span className={`text-sm flex-1 ${i.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{i.text}</span><button onClick={() => deleteThemeItem(t.id, i.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-red-500"><X size={14} /></button></div>)}<form onSubmit={e => { e.preventDefault(); if (e.target.item.value) { addThemeItem(t.id, e.target.item.value); e.target.reset(); } }} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50"><input name="item" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-3 py-1.5 text-sm text-white" placeholder="Tópico (Ctrl+V para lista)..." onPaste={e => { const d = e.clipboardData.getData('text'); if (d.includes('\n')) { e.preventDefault(); d.split('\n').map(l => l.trim()).filter(l => l).forEach(l => addThemeItem(t.id, l)); } }} /><button type="submit" className="p-1.5 bg-zinc-800 hover:bg-[#1100ab] text-white rounded"><Plus size={16} /></button></form></div>}</Card>) })}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-white">Metas Semanais</h1><Button onClick={() => setModal(true)}><Plus size={18} /> Nova</Button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{subjects.map(s => { const { h, p } = getProg(s.id, s.goalHours); return (<Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-[#1100ab]/50"><div onClick={() => setViewSub(s.id)}><div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: s.color }} /><div className="mb-4"><h3 className="text-xl font-bold text-white">{s.name}</h3>{edit.id !== s.id && <p className="text-sm text-zinc-400">Meta: {s.goalHours}h</p>}</div>{edit.id !== s.id && (<><div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-white">{h}h</span><span className="text-sm font-medium" style={{ color: s.color }}>{p}%</span></div><div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p}%`, backgroundColor: s.color }} /></div></>)}</div><div className="absolute top-4 right-4 flex gap-2">{edit.id === s.id ? (<div className="flex gap-2 bg-black/80 p-1 rounded-2xl"><input type="number" className="w-16 bg-black border border-zinc-600 rounded-2xl px-1 text-sm text-white" value={edit.val} onChange={e => setEdit({ ...edit, val: e.target.value })} autoFocus /><button onClick={() => { updateSubject(s.id, edit.val / 60); setEdit({ id: null, val: "" }) }} className="text-green-400 text-xs font-bold">OK</button></div>) : (<><button onClick={e => { e.stopPropagation(); setEdit({ id: s.id, val: Math.round(s.goalHours * 60) }) }} className="p-2 rounded-2xl bg-[#18181B]"><Settings size={16} className="text-zinc-400" /></button><button onClick={e => { e.stopPropagation(); deleteSubject(s.id) }} className="p-2 rounded-2xl bg-[#18181B]"><Trash2 size={16} className="text-zinc-400 hover:text-red-500" /></button></>)}</div></Card>) })}</div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nova Matéria"><form onSubmit={e => { e.preventDefault(); addSubject(f.name, f.color, f.goal / 60); setModal(false); setF({ name: "", goal: 60, color: "#8b5cf6" }); }} className="space-y-4"><div><label className="text-sm text-zinc-400">Nome</label><input required className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div><div><label className="text-sm text-zinc-400">Meta Semanal (minutos)</label><input required type="number" className="w-full bg-black border border-zinc-700 rounded-2xl p-2 text-white" value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })} /></div><div><label className="text-sm text-zinc-400">Cor</label><div className="flex gap-2 mt-2">{['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'].map(c => <div key={c} onClick={() => setF({ ...f, color: c })} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${f.color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div></div><Button type="submit" className="w-full mt-4">Criar</Button></form></Modal>
    </div>
  );
};

const StatsView = () => {
  const { sessions, subjects, mistakes, themes, advancedStats } = useContext(FocusContext);
  const { monthlyData } = advancedStats;
  const totQ = sessions.reduce((a, s) => a + (s.questions || 0), 0), totE = sessions.reduce((a, s) => a + (s.errors || 0), 0);
  const perfData = subjects.map(s => { const ss = sessions.filter(x => x.subjectId === s.id), q = ss.reduce((a, c) => a + (c.questions || 0), 0), e = ss.reduce((a, c) => a + (c.errors || 0), 0); return { name: s.name, Questões: q, Erros: e, Acerto: q ? Math.round(((q - e) / q) * 100) : 0, color: s.color }; }).filter(d => d.Questões > 0);
  const misReasons = Object.entries(mistakes.reduce((a, m) => ({ ...a, [m.reason]: (a[m.reason] || 0) + 1 }), {})).map(([k, v]) => ({ name: k, quantidade: v }));
  const compTopics = subjects.map(s => ({ name: s.name, value: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0), color: s.color })).filter(d => d.value > 0);
  const wrnQ = subjects.map(s => ({ name: s.name, value: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + (c.errors || 0), 0), color: s.color })).filter(d => d.value > 0);
  const heat = useMemo(() => { const d = [], end = new Date(); for (let c = new Date(end.getFullYear(), 0, 1); c <= end; c.setDate(c.getDate() + 1)) d.push({ date: new Date(c), hasStudy: sessions.some(s => new Date(s.date).toDateString() === c.toDateString()) }); return d; }, [sessions]);
  
  const hi = useMemo(() => {
    if (!subjects.length) return null;
    const agg = subjects.map(s => { const ss = sessions.filter(x => x.subjectId === s.id); return { name: s.name, min: ss.reduce((a, c) => a + c.minutes, 0), q: ss.reduce((a, c) => a + (c.questions || 0), 0), e: ss.reduce((a, c) => a + (c.errors || 0), 0), t: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0) }; });
    const sMin = [...agg].sort((a, b) => b.min - a.min), sTop = [...agg].sort((a, b) => b.t - a.t), sQ = [...agg].sort((a, b) => b.q - a.q);
    return { ms: sMin[0], ls: sMin[sMin.length - 1], mt: sTop[0], lt: sTop[sTop.length - 1], mq: sQ[0], lq: sQ[sQ.length - 1], mc: [...agg].sort((a, b) => (b.q - b.e) - (a.q - a.e))[0], me: [...agg].sort((a, b) => b.e - a.e)[0] };
  }, [subjects, sessions, themes]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0"><h1 className="text-2xl font-bold text-white mb-6">Central de Dados</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{ l: 'Tempo Total', v: `${(sessions.reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1)}h`, c: '#1100ab' }, { l: 'Questões', v: totQ, c: 'blue-500' }, { l: 'Precisão Global', v: `${totQ > 0 ? Math.round(((totQ - totE) / totQ) * 100) : 0}%`, c: 'emerald-500' }, { l: 'Tópicos Feitos', v: themes.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0), c: 'yellow-500' }].map((x, i) => <Card key={i} className={`flex flex-col gap-1 border-l-4 border-l-[${x.c}]`}><span className="text-xs text-zinc-500 uppercase font-bold">{x.l}</span><span className="text-2xl font-bold text-white">{x.v}</span></Card>)}</div>
      <Card><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Destaques de Performance</h3>
        {hi ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {[ 
             { l: 'Mais Estudada', v: hi.ms.name, s: `${Math.round(hi.ms.min / 60)}h`, i: Clock, c: '#1100ab' },
             { l: 'Menos Estudada', v: hi.ls.name, s: `${Math.round(hi.ls.min / 60)}h`, i: Clock, c: 'zinc-500' },
             { l: 'Mais Tópicos', v: hi.mt.name, s: `${hi.mt.t} feitos`, i: CheckSquare, c: 'emerald-500' },
             { l: 'Menos Tópicos', v: hi.lt.name, s: `${hi.lt.t} feitos`, i: CheckSquare, c: 'zinc-500' },
             { l: 'Mais Questões', v: hi.mq.name, s: `${hi.mq.q} total`, i: Activity, c: 'blue-500' },
             { l: 'Menos Questões', v: hi.lq.name, s: `${hi.lq.q} total`, i: Activity, c: 'zinc-500' },
             { l: 'Melhor Precisão', v: hi.mc.name, s: `${hi.mc.q - hi.mc.e} certas`, i: CheckCircle, c: 'emerald-500' },
             { l: 'Mais Erros', v: hi.me.name, s: `${hi.me.e} erros`, i: AlertTriangle, c: 'red-500' }
          ].map((x, i) => <div key={i} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between h-full"><p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><x.i size={12} className={`text-${x.c.replace('#', '')}`} /> {x.l}</p><p className="text-white font-bold truncate mt-1 text-lg">{x.v}</p><p className={`text-xs text-${x.c.replace('#', '')} mt-1`}>{x.s}</p></div>)}
        </div> : <p className="text-zinc-500">Estude mais para gerar destaques.</p>}</Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><Activity size={18} className="text-[#1100ab]" /> Volume de Questões</h3><div className="h-[250px] w-full"><ResponsiveContainer><BarChart data={perfData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} axisLine={false} /><Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Bar dataKey="Questões" fill="#1100ab" radius={[4, 4, 0, 0]} name="Feitas" /><Bar dataKey="Erros" fill="#ef4444" radius={[4, 4, 0, 0]} name="Erros" /></BarChart></ResponsiveContainer></div></Card><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><Calendar size={18} className="text-blue-500" /> Atividade Mensal</h3><div className="h-[250px] w-full"><ResponsiveContainer><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} interval={2} axisLine={false} /><Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Bar dataKey="minutes" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Minutos" /></BarChart></ResponsiveContainer></div></Card></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><Layers size={18} className="text-purple-500" /> Tópicos Finalizados</h3><div className="h-[250px] w-full flex items-center justify-center">{compTopics.length ? <ResponsiveContainer><PieChart><Pie data={compTopics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{compTopics.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Legend /></PieChart></ResponsiveContainer> : <p className="text-zinc-500 text-sm">Nenhum tópico concluído.</p>}</div></Card><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Questões Erradas por Matéria</h3><div className="h-[250px] w-full flex items-center justify-center">{wrnQ.length ? <ResponsiveContainer><PieChart><Pie data={wrnQ} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">{wrnQ.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Legend /></PieChart></ResponsiveContainer> : <p className="text-zinc-500 text-sm">Sem registros de erros.</p>}</div></Card></div>
      <div className="grid grid-cols-1 gap-6"><Card className="min-h-[300px]"><h3 className="text-white font-semibold mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Ranking de Motivos de Erro</h3><div className="h-[250px] w-full"><ResponsiveContainer><BarChart data={misReasons} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} /><XAxis type="number" stroke="#555" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" stroke="#555" tick={{ fontSize: 10 }} width={100} /><Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Bar dataKey="quantidade" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div></Card></div>
      <Card><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><InfinityIcon size={18} className="text-yellow-500" /> Roadmap de Consistência</h3><div className="flex flex-wrap gap-1">{heat.map((d, i) => <div key={i} title={`${d.date.toLocaleDateString()}: ${d.hasStudy ? 'Estudou' : 'Sem registro'}`} className={`w-3 h-3 rounded-sm transition-all hover:scale-125 ${d.hasStudy ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>)}</div><p className="text-xs text-zinc-500 mt-3">Cada quadrado representa um dia deste ano.</p></Card>
    </div>
  );
};

const HistoryView = () => {
  const { sessions, subjects, deleteDayHistory } = useContext(FocusContext);
  const [openDates, setOpenDates] = useState({});

  const history = useMemo(() => {
    const grp = {};
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(s => {
      const d = new Date(s.date).toDateString();
      if (!grp[d]) grp[d] = [];
      grp[d].push(s);
    });
    return Object.entries(grp);
  }, [sessions]);

  const toggleDate = (date) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const getDaySummary = (items) => {
    const mins = items.reduce((a, b) => a + b.minutes, 0);
    const q = items.reduce((a, b) => a + (b.questions || 0), 0);
    const e = items.reduce((a, b) => a + (b.errors || 0), 0);
    return { mins, q, e };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header>
        <h1 className="text-2xl font-bold text-white mb-1">Histórico</h1>
        <p className="text-zinc-400 text-sm">Clique nos dias para ver os detalhes.</p>
      </header>
      
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-10 opacity-50">
             <History size={40} className="mx-auto mb-2" />
             <p>Nenhum histórico registrado ainda.</p>
          </div>
        ) : (
          history.map(([date, items]) => {
            const isOpen = openDates[date];
            const summary = getDaySummary(items);
            
            return (
              <Card key={date} className="transition-all duration-300">
                <div onClick={() => toggleDate(date)} className="flex justify-between items-center cursor-pointer select-none group">
                  <div>
                    <h3 className="font-bold text-white capitalize text-lg group-hover:text-[#4d4dff] transition-colors">
                      {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12}/> {summary.mins} min</span>
                      {summary.q > 0 && <span className="flex items-center gap-1 text-blue-500/70"><CheckSquare size={12}/> {summary.q}</span>}
                      {summary.e > 0 && <span className="flex items-center gap-1 text-red-500/70"><AlertTriangle size={12}/> {summary.e}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); deleteDayHistory(date); }} className="p-2 hover:bg-red-500/10 rounded-full text-zinc-600 hover:text-red-500 transition-colors" title="Apagar dia inteiro">
                      <Trash2 size={16} />
                    </button>
                    <div className={`p-2 rounded-full bg-zinc-900 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} className="text-zinc-400" />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 space-y-3 animate-fadeIn border-t border-zinc-800/50 pt-4">
                    {items.map(s => {
                      const subject = subjects.find(sub => sub.id === s.subjectId);
                      return (
                        <div key={s.id} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: subject?.color || '#555', backgroundColor: subject?.color || '#555' }}></div>
                              <span className="text-zinc-200 font-medium">{subject?.name || 'Matéria Excluída'}</span>
                            </div>

                            <div className="flex items-center gap-4 text-sm bg-black/20 p-2 rounded-xl sm:bg-transparent sm:p-0 self-start sm:self-auto">
                               <div className="flex items-center gap-1.5 text-zinc-300" title="Tempo Focado">
                                  <Clock size={14} className="text-zinc-500"/>
                                  <span>{s.minutes} min</span>
                               </div>
                               <div className="w-px h-4 bg-zinc-800"></div>
                               <div className="flex items-center gap-1.5 text-blue-400" title="Questões Realizadas">
                                  <CheckSquare size={14} />
                                  <span className="font-bold">{s.questions || 0}</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-red-400" title="Erros">
                                  <AlertTriangle size={14} />
                                  <span className="font-bold">{s.errors || 0}</span>
                               </div>
                            </div>
                          </div>
                          
                          {s.notes && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/50 w-full">
                              <p className="text-xs font-bold text-zinc-600 uppercase mb-1">Diário da Sessão</p>
                              <div className="text-sm text-zinc-300 italic whitespace-pre-wrap leading-relaxed">"{s.notes}"</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const AppLayout = () => {
  const { currentView, setCurrentView, userLevel } = useContext(FocusContext);
  const [menu, setMenu] = useState(false); const [col, setCol] = useState(false);
  const xpN = getXP(userLevel.level), xpP = Math.min(100, (userLevel.currentXP / xpN) * 100), rk = getRank(userLevel.level);
  const nav = [{ id: 'dashboard', l: 'Painel', i: LayoutDashboard }, { id: 'focus', l: 'Focar', i: Zap }, { id: 'mistakes', l: 'Erros', i: AlertTriangle }, { id: 'calendar', l: 'Calendário', i: Calendar }, { id: 'goals', l: 'Metas', i: Target }, { id: 'stats', l: 'Estatísticas', i: BarChart2 }, { id: 'history', l: 'Histórico', i: History }, { id: 'settings', l: 'Configurações', i: Settings }];

  return (
    <div className="flex h-screen bg-[#000000] text-zinc-300 font-sans font-medium overflow-hidden"><button className="md:hidden fixed top-4 right-4 z-50 p-2 bg-[#09090b] border border-zinc-800 rounded-2xl" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>{menu && <div className="fixed inset-0 bg-black/90 z-40 md:hidden" onClick={() => setMenu(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#000000] border-r border-zinc-900 flex flex-col transition-all duration-300 md:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'} ${col ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${col ? 'justify-center flex-col gap-4' : 'justify-between'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-[#1100ab] to-blue-900 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0">F</div>{!col && <span className="text-xl font-bold text-white tracking-tight">Focus</span>}</div><button onClick={() => setCol(!col)} className="p-2 hover:bg-[#09090b] rounded-xl text-zinc-500 hover:text-white transition-colors">{col ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button></div>
        <div className={`mx-4 mb-6 p-3 bg-[#09090b] border border-zinc-800 rounded-3xl ${col ? 'flex justify-center' : ''}`}><div className={`flex items-center gap-3 ${col ? 'justify-center' : 'mb-2'}`}><div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rk.b} flex items-center justify-center text-xs text-white font-bold`}>{userLevel.level}</div>{!col && <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{userLevel.title}</p><p className="text-[10px] text-zinc-500">{userLevel.currentXP}/{xpN} XP</p></div>}</div>{!col && <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${rk.b}`} style={{ width: `${xpP}%` }} /></div>}</div>
        <nav className="flex-1 px-4 space-y-2">{nav.map(i => <button key={i.id} onClick={() => { setCurrentView(i.id); setMenu(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${currentView === i.id ? 'bg-[#1100ab]/10 text-[#4d4dff] font-medium' : 'hover:bg-[#09090b] hover:text-white'} ${col ? 'justify-center' : ''}`} title={col ? i.l : ''}><i.i size={20} />{!col && i.l}</button>)}</nav>
      </aside>
      <main className={`flex-1 overflow-y-auto h-full p-4 md:p-8 bg-[#000000] transition-all duration-300 ${col ? 'md:ml-20' : 'md:ml-64'}`}><div className="max-w-6xl mx-auto h-full">{currentView === 'dashboard' && <DashboardView />} {currentView === 'focus' && <FocusView />} {currentView === 'calendar' && <CalendarTab />} {currentView === 'mistakes' && <MistakesView />} {currentView === 'goals' && <GoalsView />} {currentView === 'stats' && <StatsView />} {currentView === 'history' && <HistoryView />} {currentView === 'settings' && <SettingsView />}</div></main>
    </div>
  );
};

const App = () => (<FocusProvider><AppLayout /><style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-thumb{background-color:#222;border-radius:20px}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn 0.4s ease-out forwards}::selection{background-color:#fff;color:#000000}`}</style></FocusProvider>);
export default App;