import React, { useState, useEffect, createContext, useMemo, useRef } from 'react';
import { Crown, Scroll, Shield, Compass, Feather, Sprout } from 'lucide-react';

// --- Constantes e Helpers ---
export const POMODORO_PRESETS = {
  SHORT: { work: 30, break: 6 },
  LONG: { work: 50, break: 10 }
};

const DEFAULT_SUB = [
  { id: 1, name: 'Matemática', color: '#3b82f6', goalHours: 10, isSchool: false },
  { id: 2, name: 'Programação', color: '#8b5cf6', goalHours: 20, isSchool: false }
];

export const formatTime = (s) => {
  const safeS = Math.max(0, parseInt(s) || 0);
  return `${Math.floor(safeS / 60).toString().padStart(2, '0')}:${(safeS % 60).toString().padStart(2, '0')}`;
};

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) { 
      console.warn(`Erro ao carregar ${key}`, error);
      return defaultValue; 
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

export const TITLES = [{ l: 60, t: "Divindade do Foco" }, { l: 50, t: "Sábio do Fluxo" }, { l: 30, t: "Mestre Supremo" }, { l: 20, t: "Guardião da Disciplina" }, { l: 10, t: "Explorador" }, { l: 5, t: "Aprendiz Dedicado" }, { l: 1, t: "Novato" }];
export const RANKS = [{ m: 50, i: Crown, b: "from-blue-600 to-indigo-600", c: "text-blue-300" }, { m: 30, i: Scroll, b: "from-zinc-500 to-zinc-700", c: "text-zinc-300" }, { m: 20, i: Shield, b: "from-amber-500 to-orange-600", c: "text-amber-400" }, { m: 10, i: Compass, b: "from-cyan-500 to-blue-500", c: "text-cyan-400" }, { m: 5, i: Feather, b: "from-emerald-500 to-green-600", c: "text-emerald-400" }, { m: 1, i: Sprout, b: "from-zinc-500 to-zinc-600", c: "text-zinc-400" }];
export const getTitle = l => TITLES.find(t => l >= t.l)?.t || "Novato";
export const getRank = l => RANKS.find(s => l >= s.m) || RANKS[RANKS.length - 1];
export const getXP = l => Math.floor(500 * Math.pow(l, 1.5));

export const FocusContext = createContext();

export const FocusProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estados Persistentes
  const [userName, setUserName] = useStickyState('', 'focus_username');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [subjects, setSubjects] = useStickyState(DEFAULT_SUB, 'focus_subjects');
  const [sessions, setSessions] = useStickyState([], 'focus_sessions');
  const [tasks, setTasks] = useStickyState([], 'focus_tasks');
  const [mistakes, setMistakes] = useStickyState([], 'focus_mistakes');
  const [themes, setThemes] = useStickyState([], 'focus_themes');
  const [countdown, setCountdown] = useStickyState({ date: null, title: '' }, 'focus_countdown');
  const [userLevel, setUserLevel] = useStickyState({ level: 1, currentXP: 0, totalXP: 0, title: "Novato" }, 'focus_rpg');
  const [unlockedAchievements, setUnlockedAchievements] = useStickyState([], 'focus_unlocked_achievements');

  // Escola
  const [schoolWorks, setSchoolWorks] = useStickyState([], 'focus_school_works');
  const [schoolAbsences, setSchoolAbsences] = useStickyState([], 'focus_school_absences');
  const [schoolSchedule, setSchoolSchedule] = useStickyState({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, 'focus_school_schedule');
  const currentYear = new Date().getFullYear();
  const [schoolCalendar, setSchoolCalendar] = useStickyState({
    startDate: `${currentYear}-02-01`, endDate: `${currentYear}-12-15`, holidaysStart: `${currentYear}-07-01`, holidaysEnd: `${currentYear}-07-31`
  }, 'focus_school_calendar');
  const [schoolExceptions, setSchoolExceptions] = useStickyState([], 'focus_school_exceptions');
  const [exams, setExams] = useStickyState([], 'focus_exams');

  // Timer
  const [timerConfig, setTimerConfig] = useStickyState({ work: 30, break: 6 }, 'focus_timer_config'); // Armazena a config ativa (30/6 ou 50/10)
  const [timerState, setTimerState] = useState({ mode: 'WORK', type: 'POMODORO', active: false, cycles: 0, timeLeft: 30 * 60 });
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  
  // Flow States
  const [elapsedTime, setElapsedTime] = useState(0); // Tempo da sessão atual (ciclo atual)
  const [flowTotalTime, setFlowTotalTime] = useState(0); // Tempo ACUMULADO de todos os ciclos Flow na sessão atual (Relógio pequeno)
  const [lastFlowWorkTime, setLastFlowWorkTime] = useState(0); // Armazena quanto tempo estudou antes da pausa para calcular 20%

  const [theme, setTheme] = useStickyState('system', 'focus_theme');
  const refs = useRef({ end: null, start: null, last: 0 });

  // === EFEITOS ===
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubjectId) setSelectedSubjectId(subjects[0].id);
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    document.title = timerState.active ? `${formatTime(timerState.timeLeft)} - Focus` : "Focus App";
  }, [timerState.timeLeft, timerState.active]);

  // TIMER LOOP PRINCIPAL
  useEffect(() => {
    let interval = null;
    if (timerState.active) {
      const now = Date.now();
      
      // Setup Refs
      if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
        if (!refs.current.start) refs.current.start = now - (timerState.timeLeft * 1000);
      } else {
        if (!refs.current.end) refs.current.end = now + (timerState.timeLeft * 1000);
      }
      refs.current.last = now;

      interval = setInterval(() => {
        const curr = Date.now();
        const delta = Math.round((curr - refs.current.last) / 1000);
        refs.current.last = curr;

        // Se estiver trabalhando (qualquer modo), conta o tempo decorrido
        if (timerState.mode === 'WORK' && delta > 0) {
            setElapsedTime(p => p + delta);
            if(timerState.type === 'FLOW') setFlowTotalTime(p => p + delta);
        }

        if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
          // Flow Count Up
          const elapsed = Math.floor((curr - refs.current.start) / 1000);
          setTimerState(p => ({ ...p, timeLeft: elapsed }));
        } else {
          // Count Down (Pomodoro Work/Break ou Flow Break)
          const remaining = Math.ceil((refs.current.end - curr) / 1000);
          
          if (remaining <= 0) {
            clearInterval(interval);
            refs.current.end = null;
            try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch (e) {}

            // === FIM DO TIMER: LÓGICA DE TRANSIÇÃO ===
            
            if (timerState.type === 'POMODORO') {
                if (timerState.mode === 'WORK') {
                    // Fim do Trabalho -> Pausa
                    const newCycles = timerState.cycles + 1;
                    // Lógica do 3º Ciclo = 15 min pausa
                    const isThirdCycle = newCycles > 0 && newCycles % 3 === 0;
                    const breakTime = isThirdCycle ? 15 * 60 : timerConfig.break * 60;
                    
                    setTimerState(p => ({ ...p, active: false, mode: 'BREAK', timeLeft: breakTime, cycles: newCycles }));
                } else {
                    // Fim da Pausa -> Trabalho
                    setTimerState(p => ({ ...p, active: false, mode: 'WORK', timeLeft: timerConfig.work * 60 }));
                }
            } else if (timerState.type === 'FLOW') {
                if (timerState.mode === 'BREAK') {
                    // Fim da Pausa Flow -> Auto-Registrar e Reiniciar Ciclo
                    // Registra a sessão do ciclo anterior
                    const minutesStudied = Math.floor(lastFlowWorkTime / 60);
                    if (minutesStudied > 0) {
                         addSession(minutesStudied, "Ciclo Flow Finalizado", selectedSubjectId, 0, 0, "Flow");
                    }
                    
                    // Reinicia para modo trabalho imediatamente
                    setTimerState(p => ({ ...p, active: true, mode: 'WORK', timeLeft: 0 }));
                    setElapsedTime(0); // Reseta tempo do ciclo atual
                    refs.current.start = Date.now(); // Novo start point
                }
            }

          } else {
            setTimerState(p => ({ ...p, timeLeft: remaining }));
          }
        }
      }, 1000);
    } else {
      refs.current.start = null;
      refs.current.end = null;
    }
    return () => clearInterval(interval);
  }, [timerState.active, timerState.mode, timerState.type, timerConfig, lastFlowWorkTime, selectedSubjectId]);

  // --- Helpers Timer ---
  
  const startFlowBreak = () => {
    // Calcula 20% do tempo estudado
    const studiedSeconds = timerState.timeLeft; // No Flow Work, timeLeft é o tempo decorrido
    setLastFlowWorkTime(studiedSeconds); // Salva para registrar depois
    const breakSeconds = Math.floor(studiedSeconds * 0.20);
    
    setTimerState(p => ({
        ...p,
        active: true,
        mode: 'BREAK',
        timeLeft: breakSeconds,
        cycles: p.cycles + 1
    }));
  };

  // --- Métodos de Dados ---

  const gainXP = (amt, reason) => {
    setUserLevel(prev => {
      let { level, currentXP: cx, totalXP: tx } = prev, nx = getXP(level);
      cx += amt; tx += amt;
      while (cx >= nx) { cx -= nx; level++; nx = getXP(level); }
      return { level, currentXP: cx, totalXP: tx, title: getTitle(level) };
    });
  };

  const addSession = (mins, notes, sId, qs = 0, errs = 0, topic = null) => {
    const id = sId || selectedSubjectId;
    setSessions(p => [...(p||[]), { 
        id: Date.now(), 
        date: new Date().toISOString(), 
        minutes: mins, 
        subjectId: Number(id), 
        notes, 
        questions: Number(qs)||0, 
        errors: Number(errs)||0, 
        topic 
    }]);
    gainXP(mins * 10, "Foco");
  };

  // CRUD Matérias
  const addSubject = (n, c, g, isSchool) => setSubjects(p => [...p, { id: Date.now(), name: n, color: c, goalHours: Number(g), isSchool }]);
  const updateSubject = (id, g) => setSubjects(p => p.map(s => s.id === id ? { ...s, goalHours: Number(g) } : s));
  const deleteSubject = (id) => subjects.length > 1 && setSubjects(p => p.filter(s => s.id !== id));

  // CRUD Tarefas (Correção: topic fallback e IDs únicos)
  const addTask = (text, sId, topic) => setTasks(p => [...(p||[]), { 
      id: Date.now() + Math.random(), 
      text, 
      completed: false, 
      subjectId: Number(sId), 
      topic: topic || "Geral", 
      subTasks: [] 
  }]);
  
  const addSubTask = (pId, text) => {
      if(!text) return;
      setTasks(p => p.map(t => t.id === pId ? { ...t, subTasks: [...(t.subTasks||[]), { id: Date.now() + Math.random(), text, completed: false }] } : t));
  };
  
  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(p => p.filter(t => t.id !== id));
  const toggleSubTask = (pId, sId) => setTasks(p => p.map(t => t.id === pId ? { ...t, subTasks: t.subTasks.map(s => s.id === sId ? { ...s, completed: !s.completed } : s) } : t));
  const deleteSubTask = (pId, sId) => setTasks(p => p.map(t => t.id === pId ? { ...t, subTasks: t.subTasks.filter(s => s.id !== sId) } : t));
  const deleteAllTasks = () => setTasks([]);

  // Erros e Temas
  const addMistake = (sId, d, r, sol) => setMistakes(p => [{ id: Date.now(), subjectId: Number(sId), description: d, reason: r, solution: sol, consolidated: false }, ...(p||[])]);
  const deleteMistake = (id) => setMistakes(p => p.filter(x => x.id !== id));
  const consolidateMistake = (id, d, s) => { setMistakes(p => p.map(m => m.id === id ? { ...m, consolidated: true, diagnosis: d, strategy: s } : m)); gainXP(100); };
  
  const addTheme = (sId, t) => setThemes(p => [...(p||[]), { id: Date.now(), subjectId: Number(sId), title: t, items: [] }]);
  const deleteTheme = (id) => setThemes(p => p.filter(t => t.id !== id));
  const addThemeItem = (tId, txt) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: [...t.items, { id: Date.now(), text: txt, completed: false }] } : t));
  const toggleThemeItem = (tId, iId) => setThemes(p => p.map(x => x.id === tId ? { ...x, items: x.items.map(y => y.id === iId ? { ...y, completed: !y.completed } : y) } : x));
  const deleteThemeItem = (tId, iId) => setThemes(p => p.map(t => t.id === tId ? { ...t, items: t.items.filter(i => i.id !== iId) } : t));

  // Escola
  const addWork = (sId, t, d, desc, m) => setSchoolWorks(p => [...(p||[]), { id: Date.now(), subjectId: Number(sId), title: t, dueDate: d, description: desc, status: 'pending', maxGrade: Number(m) }]);
  const updateWork = (id, u) => setSchoolWorks(p => p.map(w => w.id === id ? { ...w, ...u } : w));
  const deleteWork = (id) => setSchoolWorks(p => p.filter(w => w.id !== id));
  const addAbsenceRecord = (d, r, l) => setSchoolAbsences(p => [...(p||[]), { id: Date.now(), date: d, reason: r, lessons: l }]);
  const deleteAbsenceRecord = (id) => setSchoolAbsences(p => p.filter(a => a.id !== id));
  const updateSchoolSchedule = (d, l) => setSchoolSchedule(p => ({ ...p, [d]: l }));
  const updateSchoolCalendar = (c) => setSchoolCalendar(p => ({ ...p, ...c }));
  const toggleSchoolException = (d) => setSchoolExceptions(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const addExam = (e) => { setExams(p => [{ ...e, id: Date.now() }, ...(p||[])]); gainXP(200); };
  const deleteExam = (id) => setExams(p => p.filter(e => e.id !== id));
  const unlockAchievement = (id) => !unlockedAchievements.includes(id) && setUnlockedAchievements(p => [...p, id]);
  
  const resetAllData = () => { localStorage.clear(); window.location.reload(); };
  const resetXPOnly = () => setUserLevel({ level: 1, currentXP: 0, totalXP: 0, title: "Novato" });
  const deleteDayHistory = (d) => setSessions(p => p.filter(s => new Date(s.date).toDateString() !== d));

  // --- Estatísticas Avançadas (Corrigidas) ---
  const advancedStats = useMemo(() => {
    const safeSessions = sessions || [];
    const now = new Date();
    
    // 1. Evolução Anual (Meses do ano atual)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const yearlyData = months.map(m => ({ name: m, minutes: 0 }));
    safeSessions.forEach(s => {
        const d = new Date(s.date);
        if (d.getFullYear() === now.getFullYear()) {
            yearlyData[d.getMonth()].minutes += s.minutes;
        }
    });

    // 2. Maior Sequência (Longest Streak)
    let longestStreak = 0;
    if (safeSessions.length > 0) {
        // Datas únicas ordenadas
        const uniqueDates = [...new Set(safeSessions.map(s => new Date(s.date).toDateString()))]
            .map(d => new Date(d))
            .sort((a, b) => a - b);
        
        let currentStreak = 1;
        let maxStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prev = uniqueDates[i - 1];
            const curr = uniqueDates[i];
            const diffTime = Math.abs(curr - prev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        }
        longestStreak = maxStreak;
    }

    // 3. Dados Semanais (Gráfico Dashboard)
    const startW = new Date(); 
    startW.setDate(startW.getDate() - startW.getDay()); startW.setHours(0,0,0,0);
    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => { 
      const d = new Date(startW); d.setDate(startW.getDate() + i); 
      return { name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i], minutos: safeSessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.minutes, 0) }; 
    });

    // 4. KPI Hoje/Total/Streak Atual
    const todayS = now.toDateString();
    const datesSet = new Set(safeSessions.map(s => new Date(s.date).toDateString()));
    let streak = 0, d = new Date();
    while (datesSet.has(d.toDateString()) || (d.toDateString()===todayS && !datesSet.has(todayS))) { if (datesSet.has(d.toDateString())) streak++; d.setDate(d.getDate() - 1); }

    const kpiData = {
        todayMinutes: safeSessions.filter(s => new Date(s.date).toDateString() === todayS).reduce((a, c) => a + c.minutes, 0),
        totalHours: (safeSessions.reduce((a, c) => a + c.minutes, 0) / 60).toFixed(1),
        streak
    };

    return { yearlyData, longestStreak, weeklyChartData, kpiData, monthlyData: yearlyData /* Alias para compatibilidade */ };
  }, [sessions]);

  return (
    <FocusContext.Provider value={{ 
        currentView, setCurrentView, userName, setUserName, selectedHistoryDate, setSelectedHistoryDate, 
        subjects, sessions, tasks, mistakes, themes, schoolWorks, schoolAbsences, schoolSchedule, schoolCalendar, schoolExceptions, exams,
        countdown, setCountdown, userLevel, unlockedAchievements, 
        
        timerState, setTimerState, timerConfig, setTimerConfig, 
        selectedSubjectId, setSelectedSubjectId, 
        elapsedTime, setElapsedTime, flowTotalTime, setFlowTotalTime, startFlowBreak,
        
        // Expondo setters individuais para facilitar uso
        setTimerType: (t) => setTimerState(p => ({ ...p, type: t })),
        setTimerMode: (m) => setTimerState(p => ({ ...p, mode: m })),
        setTimeLeft: (t) => setTimerState(p => ({ ...p, timeLeft: t })),
        setIsActive: (a) => setTimerState(p => ({ ...p, active: a })),
        setCycles: (c) => setTimerState(p => ({ ...p, cycles: c })),
        timerType: timerState.type, timerMode: timerState.mode, timeLeft: timerState.timeLeft, isActive: timerState.active, cycles: timerState.cycles,

        kpiData: advancedStats.kpiData, weeklyChartData: advancedStats.weeklyChartData, advancedStats,
        
        addSession, addSubject, updateSubject, deleteSubject, addTask, addSubTask, toggleTask, deleteTask, toggleSubTask, deleteSubTask, deleteAllTasks,
        addMistake, deleteMistake, consolidateMistake, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem,
        addWork, updateWork, deleteWork, addAbsenceRecord, deleteAbsenceRecord, updateSchoolSchedule, updateSchoolCalendar, toggleSchoolException, addExam, deleteExam, unlockAchievement,
        resetAllData, resetXPOnly, deleteDayHistory,
        theme, setTheme
    }}>
      {children}
    </FocusContext.Provider>
  );
};