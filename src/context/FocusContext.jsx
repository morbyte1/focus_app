import React, { useState, useEffect, createContext, useMemo, useRef } from 'react';
import { Crown, Scroll, Shield, Compass, Feather, Sprout } from 'lucide-react';

// --- Constantes e Helpers ---
export const POMODORO = { WORK: 1 * 60, SHORT: 1 * 60, LONG: 15 * 60 };

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

export const TITLES = [{ l: 60, t: "Divindade do Foco" }, { l: 50, t: "Sábio do Fluxo" }, { l: 30, t: "Arquivista Mestre" }, { l: 20, t: "Guardião da Disciplina" }, { l: 10, t: "Explorador do Conhecimento" }, { l: 5, t: "Aprendiz Focado" }, { l: 1, t: "Novato Curioso" }];
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

  const [unlockedAchievements, setUnlockedAchievements] = useStickyState([], 'focus_unlocked_achievements');

  // === ESTADO: ESCOLA ===
  const [schoolWorks, setSchoolWorks] = useStickyState([], 'focus_school_works');
  const [schoolAbsences, setSchoolAbsences] = useStickyState([], 'focus_school_absences');
  const [schoolSchedule, setSchoolSchedule] = useStickyState({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, 'focus_school_schedule');

  const currentYear = new Date().getFullYear();
  const [schoolCalendar, setSchoolCalendar] = useStickyState({
    startDate: `${currentYear}-02-01`,
    endDate: `${currentYear}-12-15`,
    holidaysStart: `${currentYear}-07-01`,
    holidaysEnd: `${currentYear}-07-31`
  }, 'focus_school_calendar');

  const [schoolExceptions, setSchoolExceptions] = useStickyState([], 'focus_school_exceptions');
  const [studySchedule, setStudySchedule] = useStickyState({}, 'my_study_schedule');
  const [exams, setExams] = useStickyState([], 'focus_exams');

  // CONFIGURAÇÃO PADRÃO ATUALIZADA: WORK 30, SHORT 6
  const [timerConfig, setTimerConfig] = useStickyState({ work: 1, short: 1 }, 'focus_timer_config');

  const [timerState, setTimerState] = useState({ mode: 'WORK', type: 'POMODORO', active: false, cycles: 0, timeLeft: timerConfig.work * 60 });
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  
  // NOVO: Tempo acumulado de ciclos anteriores (em segundos)
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  
  const [flowStoredTime, setFlowStoredTime] = useState(0); // Mantido para compatibilidade, mas o accumulatedTime é o principal
  const [elapsedTime, setElapsedTime] = useState(0); // Tempo do ciclo ATUAL
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
      // Flow mode: Start reset logic handled in view/state change
      if (timerState.type === 'FLOW' && timerState.mode === 'WORK' && !refs.current.start) {
         refs.current.start = now - (timerState.timeLeft * 1000);
      } else if (timerState.type !== 'FLOW' || timerState.mode !== 'WORK') {
         if(!refs.current.end) refs.current.end = now + (timerState.timeLeft * 1000);
      }
      
      // Update refs if switching modes/types suddenly
      if (timerState.type === 'FLOW' && timerState.mode === 'WORK') refs.current.end = null;
      else refs.current.start = null;

      refs.current.last = now;

      interval = setInterval(() => {
        const curr = Date.now();
        const delta = Math.round((curr - refs.current.last) / 1000);
        refs.current.last = curr;
        
        // Elapsed time counts ONLY current working cycle
        if (timerState.mode === 'WORK' && delta > 0) setElapsedTime(p => p + delta);

        if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
          // Flow: Count UP
          const currentFlowTime = Math.floor((curr - refs.current.start) / 1000);
          setTimerState(p => ({ ...p, timeLeft: currentFlowTime }));
        } else {
          // Pomodoro or Break: Count DOWN
          const rem = Math.ceil((refs.current.end - curr) / 1000);
          if (rem <= 0) {
            clearInterval(interval);
            refs.current.end = null; // Reset end ref
            try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch (e) {}
            
            if (timerState.type === 'POMODORO') {
               const nextC = timerState.cycles + (timerState.mode === 'WORK' ? 1 : 0);
               const nextMode = timerState.mode === 'WORK' ? 'BREAK' : 'WORK';

               // --- BUG FIX: Persist Work Time ---
               // Se o modo que acabou foi WORK, precisamos salvar o tempo desse ciclo
               // no acumulado geral antes de resetar o elapsedTime para a pausa.
               if (timerState.mode === 'WORK') {
                  setAccumulatedTime(prev => prev + (timerConfig.work * 60));
               }
               // ---------------------------------

               const nextTime = nextMode === 'WORK' 
                  ? timerConfig.work * 60 
                  : (nextC % 4 === 0 && nextC > 0 ? POMODORO.LONG : timerConfig.short * 60);

               setTimerState(p => ({ ...p, active: false, mode: nextMode, timeLeft: nextTime, cycles: nextC }));
               setElapsedTime(0); // Reset visual cycle time for Pomodoro
            } else if (timerState.type === 'FLOW' && timerState.mode === 'BREAK') {
               // End of Flow Break -> Back to Work (New Cycle)
               setTimerState(p => ({ ...p, active: false, mode: 'WORK', timeLeft: 0 }));
               setElapsedTime(0);
               refs.current.start = Date.now(); // Reset start for new flow cycle
            }
          } else setTimerState(p => ({ ...p, timeLeft: rem }));
        }
      }, 1000);
    } else {
        // Paused: Clear refs so they reset on resume
        refs.current.start = null;
        refs.current.end = null;
    }
    return () => clearInterval(interval);
  }, [timerState.active, timerState.mode, timerState.type, timerConfig]);

  const gainXP = (amt, reason = "") => {
    setUserLevel(prev => {
      let { level, currentXP: cx, totalXP: tx } = prev, nx = getXP(level);
      cx += amt; tx += amt;
      while (cx >= nx && amt > 0) { cx -= nx; level++; nx = getXP(level); alert(`🎉 LEVEL UP! Nível ${level}: ${getTitle(level)}`); }
      return { level, currentXP: cx, totalXP: tx, title: getTitle(level) };
    });
    if (reason) console.log(`${amt > 0 ? '+' : ''}${amt} XP: ${reason}`);
  };

  const addSession = (mins, notes, mSubId = null, qs = 0, errs = 0, topic = null) => {
    const sId = mSubId ? Number(mSubId) : selectedSubjectId;
    let cleanQs = Math.max(0, parseInt(qs) || 0);
    let cleanErrs = Math.max(0, parseInt(errs) || 0);
    if (cleanErrs > cleanQs) {
        alert(`Atenção: Você informou mais erros (${cleanErrs}) do que questões feitas (${cleanQs}). Ajustando o número de erros para ser igual ao total.`);
        cleanErrs = cleanQs;
    }
    setSessions(p => [...p, { id: Date.now(), date: new Date().toISOString(), minutes: mins, subjectId: sId, notes, questions: cleanQs, errors: cleanErrs, topic }]);

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
    
    // Reset accumulated time after save
    setAccumulatedTime(0);
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
    
    addTask: (t, sId, topic) => setTasks(p => [...p, { id: Date.now(), text: t, completed: false, subjectId: sId, topic, subTasks: [] }]),
    addSubTask: (parentId, text) => setTasks(p => p.map(t => t.id === parentId ? { ...t, subTasks: [...(t.subTasks || []), { id: Date.now() + Math.random(), text, completed: false }] } : t)),
    toggleTask: (id) => setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t)),
    toggleSubTask: (parentId, subId) => setTasks(p => p.map(t => t.id === parentId ? { ...t, subTasks: t.subTasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) } : t)),
    deleteTask: (id) => window.confirm("Excluir tarefa?") && setTasks(p => p.filter(t => t.id !== id)),
    deleteSubTask: (parentId, subId) => setTasks(p => p.map(t => t.id === parentId ? { ...t, subTasks: t.subTasks.filter(s => s.id !== subId) } : t)),
    deleteAllTasks: () => setTasks([]),

    addMistake: (sId, d, r, sol) => setMistakes(p => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(sId), description: d, reason: r, solution: sol, consolidated: false }, ...p]),
    consolidateMistake: (id, diag, strat) => { setMistakes(p => p.map(m => m.id === id ? { ...m, consolidated: true, diagnosis: diag, strategy: strat } : m)); gainXP(100, "Erro Consolidado"); },
    deleteMistake: (id) => { if (window.confirm("Apagar?")) { const m = mistakes.find(x => x.id === id); if (m?.consolidated) { gainXP(-100); alert("-100 XP por apagar aprendizado."); } setMistakes(p => p.filter(x => x.id !== id)); } },
    
    addTheme: (sId, t) => setThemes(p => [...p, { id: Date.now(), subjectId: sId, title: t, items: [] }]),
    deleteTheme: (id) => window.confirm("Excluir?") && setThemes(p => p.filter(t => t.id !== id)),
    addThemeItem: (tId, txt) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: [...t.items, { id: Date.now() + Math.random(), text: txt, completed: false }] } : t)),
    toggleThemeItem: (tId, iId) => {
        const theme = themes.find(x => x.id === tId);
        const item = theme?.items.find(x => x.id === iId);
        if (item) {
            const isCompleting = !item.completed;
            if(isCompleting) gainXP(20);
            if (isCompleting) setTasks(prevTasks => prevTasks.filter(t => t.topic !== item.text));
            setThemes(p => p.map(x => x.id === tId ? { ...x, items: x.items.map(y => y.id === iId ? { ...y, completed: !y.completed } : y) } : x)); 
        }
    },
    deleteThemeItem: (tId, iId) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: t.items.filter(i => i.id !== iId) } : t)),
    
    resetXPOnly: () => window.confirm("Resetar nível?") && (setUserLevel({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" }) || alert("Nível resetado.")),
    resetAllData: () => window.confirm("Apagar TUDO?") && (localStorage.clear() || window.location.reload()),
    deleteDayHistory: (d) => window.confirm(`Apagar ${d}?`) && setSessions(p => p.filter(s => new Date(s.date).toDateString() !== d)),

    addWork: (subjectId, title, dueDate, description, maxGrade) => setSchoolWorks(p => [...p, { id: Date.now(), subjectId: Number(subjectId), title, dueDate, description, status: 'pending', grade: null, maxGrade: Number(maxGrade) || 10 }]),
    updateWork: (id, updates) => setSchoolWorks(p => p.map(w => w.id === id ? { ...w, ...updates } : w)),
    deleteWork: (id) => window.confirm("Excluir trabalho?") && setSchoolWorks(p => p.filter(w => w.id !== id)),

    addAbsenceRecord: (date, reason, lessonsMap) => {
        setSchoolAbsences(prev => {
            const existingIndex = prev.findIndex(a => a.date === date);
            if (existingIndex >= 0) {
                const updated = [...prev];
                const oldRecord = updated[existingIndex];
                const newLessons = { ...oldRecord.lessons };
                Object.entries(lessonsMap).forEach(([subId, count]) => { newLessons[subId] = (newLessons[subId] || 0) + count; });
                let newReason = oldRecord.reason;
                if (reason && !oldRecord.reason.includes(reason)) { newReason = `${oldRecord.reason} + ${reason}`; }
                updated[existingIndex] = { ...oldRecord, lessons: newLessons, reason: newReason };
                return updated;
            } else {
                return [...prev, { id: Date.now(), date, reason, lessons: lessonsMap }];
            }
        });
    },
    deleteAbsenceRecord: (id) => window.confirm("Excluir registro de falta?") && setSchoolAbsences(p => p.filter(a => a.id !== id)),
    updateSchoolSchedule: (dayId, lessonsArray) => setSchoolSchedule(p => ({ ...p, [dayId]: lessonsArray })),
    updateSchoolCalendar: (newConfig) => setSchoolCalendar(prev => ({ ...prev, ...newConfig })),
    toggleSchoolException: (dateStr) => {
        setSchoolExceptions(prev => {
            if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
            return [...prev, dateStr];
        });
    },

    unlockAchievement: (id, xpAmount, title) => {
        setUnlockedAchievements(prev => {
            if (prev.includes(id)) return prev;
            gainXP(xpAmount, `Conquista: ${title}`);
            alert(`🏆 CONQUISTA DESBLOQUEADA: ${title}\n+${xpAmount} XP`);
            return [...prev, id];
        });
    },
    addExam: (examData) => { setExams(prev => [{ ...examData, id: Date.now() }, ...prev]); gainXP(200, "Prova Registrada"); },
    deleteExam: (id) => { if (window.confirm("Apagar histórico desta prova?")) { setExams(prev => prev.filter(e => e.id !== id)); } }
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

  // --- STATS AVANÇADOS REPARADOS ---
  const advancedStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
        return { 
            monthlyData: [], 
            yearlyData: Array(12).fill(0).map((_, i) => ({ name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }), minutes: 0 })), 
            bestSubject: null, 
            worstSubject: null, 
            maxStreak: 0,
            longestStreak: 0 
        };
    }

    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    
    // Dados Mensais (Dias do Mês atual)
    const monthlyData = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => ({ 
        name: (i + 1).toString(), 
        minutes: sessions.reduce((acc, s) => { 
            const sd = new Date(s.date); 
            return (sd.getDate() === i + 1 && sd.getMonth() === m && sd.getFullYear() === y) ? acc + s.minutes : acc; 
        }, 0) 
    }));

    // Dados Anuais (12 Meses)
    const yearlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
        minutes: sessions.reduce((acc, s) => {
            const sd = new Date(s.date);
            return (sd.getMonth() === i && sd.getFullYear() === y) ? acc + s.minutes : acc;
        }, 0)
    }));

    const activeSubjects = subjects.filter(s => !s.isSchool);
    const ranked = activeSubjects.map(s => ({ ...s, totalMins: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + c.minutes, 0) })).sort((a, b) => b.totalMins - a.totalMins);

    const dates = [...new Set(sessions.map(s => new Date(s.date).toDateString()))]
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

    let maxS = 0, currS = 0; 
    dates.forEach((d, i) => { 
        if (i === 0) currS = 1; 
        else {
            const diffTime = Math.abs(d.getTime() - dates[i - 1].getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            currS = (diffDays <= 1) ? currS + 1 : 1; 
        }
        maxS = Math.max(maxS, currS); 
    });

    return { 
        monthlyData, 
        yearlyData,
        bestSubject: ranked[0], 
        worstSubject: ranked[ranked.length - 1], 
        maxStreak: maxS,
        longestStreak: maxS 
    };
  }, [sessions, subjects]);

  return (
    <FocusContext.Provider value={{ 
        currentView, setCurrentView, 
        userName, setUserName, 
        selectedHistoryDate, setSelectedHistoryDate, 
        subjects, sessions, tasks, mistakes, themes, 
        schoolWorks, schoolAbsences, schoolSchedule, schoolCalendar, schoolExceptions,
        countdown, setCountdown, 
        userLevel, 
        unlockedAchievements,
        exams, 

        timerMode: timerState.mode, setTimerMode: m => setTimerState(p => ({ ...p, mode: m })), 
        timerType: timerState.type, setTimerType: t => setTimerState(p => ({ ...p, type: t })), 
        timeLeft: timerState.timeLeft, setTimeLeft: t => setTimerState(p => ({ ...p, timeLeft: t })), 
        isActive: timerState.active, setIsActive: a => setTimerState(p => ({ ...p, active: a })), 
        cycles: timerState.cycles, setCycles: c => setTimerState(p => ({ ...p, cycles: c })), 

        timerConfig, setTimerConfig, 

        selectedSubjectId, setSelectedSubjectId, 
        accumulatedTime, setAccumulatedTime, // Exportando para uso na View
        flowStoredTime, setFlowStoredTime, 
        elapsedTime, setElapsedTime, 
        kpiData, weeklyChartData, advancedStats, 
        addSession, 
        theme, setTheme, 
        ...methods 
    }}>
      {children}
    </FocusContext.Provider>
  )};