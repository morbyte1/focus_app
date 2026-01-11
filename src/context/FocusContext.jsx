import React, { useState, useEffect, createContext, useMemo, useRef } from 'react';
import { Crown, Scroll, Shield, Compass, Feather, Sprout } from 'lucide-react';

// --- Constantes e Helpers ---
export const POMODORO = { WORK: 25 * 60, SHORT: 5 * 60, LONG: 15 * 60 };

const DEFAULT_SUB = [
  { id: 1, name: 'Programação', color: '#8b5cf6', goalHours: 20, isSchool: false }, 
  { id: 2, name: 'Matemática', color: '#10b981', goalHours: 10, isSchool: false }, 
  { id: 3, name: 'Inglês', color: '#f59e0b', goalHours: 5, isSchool: false }
];

export const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) { return defaultValue; }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export const TITLES = [{ l: 50, t: "Sábio do Fluxo" }, { l: 30, t: "Arquivista Mestre" }, { l: 20, t: "Guardião da Disciplina" }, { l: 10, t: "Explorador do Conhecimento" }, { l: 5, t: "Aprendiz Focado" }, { l: 1, t: "Novato Curioso" }];
export const RANKS = [{ m: 50, i: Crown, b: "from-primary to-blue-500", c: "text-blue-300" }, { m: 30, i: Scroll, b: "from-slate-400 to-gray-200", c: "text-slate-300" }, { m: 20, i: Shield, b: "from-orange-500 to-amber-600", c: "text-amber-400" }, { m: 10, i: Compass, b: "from-blue-500 to-cyan-500", c: "text-cyan-400" }, { m: 5, i: Feather, b: "from-emerald-500 to-green-600", c: "text-emerald-400" }, { m: 1, i: Sprout, b: "from-gray-500 to-slate-600", c: "text-gray-400" }];
export const getTitle = l => TITLES.find(t => l >= t.l)?.t || "Novato Curioso";
export const getRank = l => RANKS.find(s => l >= s.m) || RANKS[RANKS.length - 1];
export const getXP = l => Math.floor(500 * Math.pow(l, 1.5));


// --- Contexto ---
export const FocusContext = createContext();

export const FocusProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userName, setUserName] = useStickyState('', 'focus_username');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [subjects, setSubjects] = useStickyState(DEFAULT_SUB, 'focus_subjects');
  const [sessions, setSessions] = useStickyState([], 'focus_sessions');
  const [tasks, setTasks] = useStickyState([], 'focus_tasks');
  const [mistakes, setMistakes] = useStickyState([], 'focus_mistakes');
  const [themes, setThemes] = useStickyState([], 'focus_themes');
  const [countdown, setCountdown] = useStickyState({ date: null, title: '' }, 'focus_countdown');
  const [userLevel, setUserLevel] = useStickyState({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" }, 'focus_rpg');
  
  // === ESTADO: ESCOLA (Trabalhos, Faltas e Grade) ===
  const [schoolWorks, setSchoolWorks] = useStickyState([], 'focus_school_works');
  const [schoolAbsences, setSchoolAbsences] = useStickyState([], 'focus_school_absences');
  // NOVO: Grade Horária (1=Seg, 2=Ter, ..., 5=Sex). Valor: Array de IDs de matérias
  const [schoolSchedule, setSchoolSchedule] = useStickyState({ 1: [], 2: [], 3: [], 4: [], 5: [] }, 'focus_school_schedule');

  const [timerState, setTimerState] = useState({ mode: 'WORK', type: 'POMODORO', active: false, cycles: 0, timeLeft: POMODORO.WORK });
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [flowStoredTime, setFlowStoredTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [theme, setTheme] = useStickyState('system', 'focus_theme');
  const refs = useRef({ end: null, start: null, last: 0 });

  // --- Lógica do Tema ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark'); 

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('focus_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
       const root = window.document.documentElement;
       root.classList.remove('light', 'dark');
       root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  useEffect(() => { if (subjects.length > 0 && !subjects.find(s => s.id === selectedSubjectId)) setSelectedSubjectId(subjects[0].id); }, [subjects, selectedSubjectId]);
  
  useEffect(() => { 
    if (themes.length > 0) {
        const healed = themes.map(t => ({ ...t, items: t.items.map((i, idx) => ({ ...i, id: i.id + (Math.random() * (idx + 1)) })) }));
        if (JSON.stringify(themes) !== JSON.stringify(healed)) setThemes(healed);
    }
  }, []);

  useEffect(() => { document.title = timerState.active ? `${formatTime(timerState.timeLeft)} - ${timerState.mode === 'WORK' ? 'Foco' : 'Pausa'}` : "Focus App - Estudos & Produtividade"; }, [timerState.active, timerState.timeLeft, timerState.mode]);

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
    let cleanQs = Math.max(0, parseInt(qs) || 0);
    let cleanErrs = Math.max(0, parseInt(errs) || 0);
    if (cleanErrs > cleanQs) {
        alert(`Atenção: Você informou mais erros (${cleanErrs}) do que questões feitas (${cleanQs}). Ajustando o número de erros para ser igual ao total.`);
        cleanErrs = cleanQs;
    }
    setSessions(p => [...p, { id: Date.now(), date: new Date().toISOString(), minutes: mins, subjectId: sId, notes, questions: cleanQs, errors: cleanErrs }]);
    let xp = (Math.floor(mins / 10) * 50) + (cleanQs * 10);
    
    const sub = subjects.find(s => s.id === sId);
    if (sub && !sub.isSchool) {
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0);
      const prev = sessions.filter(s => s.subjectId === sId && new Date(s.date) >= startW).reduce((a, s) => a + s.minutes, 0);
      if (prev < sub.goalHours * 60 && (prev + mins) >= sub.goalHours * 60) { xp += 500; alert(`🏆 Meta semanal de ${sub.name} atingida! +500 XP`); }
    }
    
    if (xp > 0) gainXP(xp, "Sessão");
  };

  const addWork = (subjectId, title, dueDate, description) => {
    setSchoolWorks(prev => [...prev, {
      id: Date.now(),
      subjectId: Number(subjectId),
      title,
      dueDate,
      description,
      status: 'pending',
      grade: null
    }]);
  };

  const updateWork = (id, updates) => {
    setSchoolWorks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWork = (id) => {
    if (window.confirm("Remover este trabalho?")) {
      setSchoolWorks(prev => prev.filter(w => w.id !== id));
    }
  };

  // === MÉTODOS PARA FALTAS E GRADE ===
  const addAbsenceRecord = (date, reason, lessonsMap) => {
    setSchoolAbsences(prev => [...prev, {
        id: Date.now(),
        date,
        reason,
        lessons: lessonsMap 
    }]);
  };

  const deleteAbsenceRecord = (id) => {
    if (window.confirm("Remover este registro de falta?")) {
        setSchoolAbsences(prev => prev.filter(a => a.id !== id));
    }
  };

  // Método para atualizar a grade (recebe dia 1-5 e array de ids de matérias)
  const updateSchoolSchedule = (dayIndex, lessonsArray) => {
    setSchoolSchedule(prev => ({ ...prev, [dayIndex]: lessonsArray }));
  };

  const methods = {
    addSubject: (n, c, g, isSchool = false) => setSubjects(p => [...p, { id: Date.now(), name: n, color: c, goalHours: Math.max(0, Number(g)), isSchool }]),
    updateSubject: (id, g) => setSubjects(p => p.map(s => s.id === id ? { ...s, goalHours: Math.max(0, Number(g)) } : s)),
    deleteSubject: (id) => { 
        if (subjects.length > 1 && window.confirm("Excluir?")) { 
            const r = subjects.filter(s => s.id !== id); 
            setSubjects(r); 
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
    
    const activeSubjects = subjects.filter(s => !s.isSchool);
    const ranked = activeSubjects.map(s => ({ ...s, totalMins: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + c.minutes, 0) })).sort((a, b) => b.totalMins - a.totalMins);
    
    const dates = [...new Set(sessions.map(s => new Date(s.date).toDateString()))].map(d => new Date(d)).sort((a, b) => a - b);
    let maxS = 0, currS = 0; dates.forEach((d, i) => { if (i === 0) currS = 1; else currS = (d - dates[i - 1] <= 86400000) ? currS + 1 : 1; maxS = Math.max(maxS, currS); });
    
    return { monthlyData, bestSubject: ranked[0], worstSubject: ranked[ranked.length - 1], maxStreak: maxS };
  }, [sessions, subjects]);

  return (
    <FocusContext.Provider value={{ 
        currentView, setCurrentView, 
        userName, setUserName, 
        selectedHistoryDate, setSelectedHistoryDate, 
        subjects, sessions, tasks, mistakes, themes, 
        schoolWorks, addWork, updateWork, deleteWork, 
        schoolAbsences, addAbsenceRecord, deleteAbsenceRecord, 
        schoolSchedule, updateSchoolSchedule, // Exportando Grade Horária
        countdown, setCountdown, 
        userLevel, 
        timerMode: timerState.mode, setTimerMode: m => setTimerState(p => ({ ...p, mode: m })), 
        timerType: timerState.type, setTimerType: t => setTimerState(p => ({ ...p, type: t })), 
        timeLeft: timerState.timeLeft, setTimeLeft: t => setTimerState(p => ({ ...p, timeLeft: t })), 
        isActive: timerState.active, setIsActive: a => setTimerState(p => ({ ...p, active: a })), 
        cycles: timerState.cycles, setCycles: c => setTimerState(p => ({ ...p, cycles: c })), 
        selectedSubjectId, setSelectedSubjectId, 
        flowStoredTime, setFlowStoredTime, 
        elapsedTime, setElapsedTime, 
        kpiData, weeklyChartData, advancedStats, 
        addSession, 
        theme, setTheme, 
        ...methods 
    }}>
      {children}
    </FocusContext.Provider>
  );
};