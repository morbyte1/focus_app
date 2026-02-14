import React, { useState, useEffect, createContext, useMemo, useRef } from 'react';
import { Crown, Scroll, Shield, Compass, Feather, Sprout } from 'lucide-react';

// --- Constantes e Helpers ---
export const POMODORO = { WORK: 30 * 60, SHORT: 5 * 60, LONG: 15 * 60 };

const DEFAULT_SUB = [
  { id: 1, name: 'Programação', color: '#8b5cf6', goalHours: 20, isSchool: false }, 
  { id: 2, name: 'Matemática', color: '#10b981', goalHours: 10, isSchool: false }, 
  { id: 3, name: 'Inglês', color: '#f59e0b', goalHours: 5, isSchool: false }
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
      console.warn(`Erro ao carregar chave ${key} do localStorage`, error);
      return defaultValue; 
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar chave ${key}`, error);
    }
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
  // Views e Navegação
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Dados Persistentes com Safety Checks
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

  // Escola
  const [schoolWorks, setSchoolWorks] = useStickyState([], 'focus_school_works');
  const [schoolAbsences, setSchoolAbsences] = useStickyState([], 'focus_school_absences');
  const [schoolSchedule, setSchoolSchedule] = useStickyState({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }, 'focus_school_schedule');
  const currentYear = new Date().getFullYear();
  const [schoolCalendar, setSchoolCalendar] = useStickyState({
    startDate: `${currentYear}-02-01`, endDate: `${currentYear}-12-15`,
    holidaysStart: `${currentYear}-07-01`, holidaysEnd: `${currentYear}-07-31`
  }, 'focus_school_calendar');
  const [schoolExceptions, setSchoolExceptions] = useStickyState([], 'focus_school_exceptions');
  const [studySchedule, setStudySchedule] = useStickyState({}, 'my_study_schedule');
  const [exams, setExams] = useStickyState([], 'focus_exams');

  // Configurações do Timer
  const [timerConfig, setTimerConfig] = useStickyState({ work: 30, short: 5 }, 'focus_timer_config'); // Default 30/5
  
  // Estado Volátil do Timer
  const [timerState, setTimerState] = useState({ 
    mode: 'WORK', // WORK | BREAK
    type: 'POMODORO', // POMODORO | FLOW
    active: false, 
    cycles: 0, 
    timeLeft: timerConfig.work * 60 
  });
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [flowStoredTime, setFlowStoredTime] = useState(0); // Para controle interno do flow
  const [elapsedTime, setElapsedTime] = useState(0); // Tempo total "tickado" na sessão atual
  const [theme, setTheme] = useStickyState('system', 'focus_theme');
  
  // Refs para controle preciso de tempo (drift correction)
  const refs = useRef({ end: null, start: null, last: 0 });

  // --- Efeitos ---

  // Gerenciamento de Tema (Dark/Light)
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

  // Fallback de Matéria Selecionada
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const exists = subjects.find(s => s.id === selectedSubjectId);
      if (!exists) setSelectedSubjectId(subjects[0].id);
    } else {
      setSelectedSubjectId(null);
    }
  }, [subjects, selectedSubjectId]);

  // Title da Página
  useEffect(() => { 
    document.title = timerState.active 
      ? `${formatTime(timerState.timeLeft)} - ${timerState.mode === 'WORK' ? 'Foco' : 'Pausa'}` 
      : "Focus App"; 
  }, [timerState.active, timerState.timeLeft, timerState.mode]);

  // Lógica Principal do Timer
  useEffect(() => {
    let interval = null;
    if (timerState.active) {
      const now = Date.now();
      
      // Setup inicial dos refs se acabou de ativar
      if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
        // No FLOW, contamos a partir de um ponto (count up)
        if (!refs.current.start) refs.current.start = now - (timerState.timeLeft * 1000);
      } else {
        // No POMODORO ou BREAK, contamos até um alvo (count down)
        if (!refs.current.end) refs.current.end = now + (timerState.timeLeft * 1000);
      }
      refs.current.last = now;

      interval = setInterval(() => {
        const curr = Date.now();
        const delta = Math.round((curr - refs.current.last) / 1000);
        refs.current.last = curr;
        
        // Acumula tempo total focado APENAS se estiver em modo WORK
        if (timerState.mode === 'WORK' && delta > 0) {
          setElapsedTime(p => p + delta);
        }

        if (timerState.type === 'FLOW' && timerState.mode === 'WORK') {
          // Flow: Apenas incrementa visualmente baseado no tempo decorrido
          // A lógica real é (agora - inicio) / 1000
          const elapsedSession = Math.floor((curr - refs.current.start) / 1000);
          setTimerState(p => ({ ...p, timeLeft: elapsedSession }));
        } else {
          // Pomodoro/Break: Decrementa até o alvo
          const remaining = Math.ceil((refs.current.end - curr) / 1000);
          
          if (remaining <= 0) {
            // FIM DO TIMER
            clearInterval(interval);
            refs.current.end = null; // Reset ref
            
            try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play(); } catch (e) {}

            if (timerState.type === 'POMODORO') {
               const isWork = timerState.mode === 'WORK';
               const nextCycles = isWork ? timerState.cycles + 1 : timerState.cycles;
               const nextMode = isWork ? 'BREAK' : 'WORK';
               
               // Lógica de Pausa Longa (a cada 4 ciclos de trabalho)
               let nextTime;
               if (nextMode === 'WORK') {
                  nextTime = timerConfig.work * 60;
               } else {
                  // Se acabou de completar o 4º, 8º, 12º ciclo de trabalho -> Long Break
                  nextTime = (nextCycles > 0 && nextCycles % 4 === 0) 
                    ? POMODORO.LONG 
                    : timerConfig.short * 60;
               }

               setTimerState(p => ({ 
                 ...p, 
                 active: false, 
                 mode: nextMode, 
                 timeLeft: nextTime, 
                 cycles: nextCycles 
               }));
            } else if (timerState.type === 'FLOW' && timerState.mode === 'BREAK') {
               // Acabou a pausa do Flow, volta para o trabalho (reseta o timer visual para 0 ou continua? Geralmente reinicia ciclo)
               setTimerState(p => ({ ...p, active: false, mode: 'WORK', timeLeft: 0 }));
               refs.current.start = null; // Reset para novo count up
            }
          } else {
            setTimerState(p => ({ ...p, timeLeft: remaining }));
          }
        }
      }, 1000);
    } else {
      // Quando pausa, limpa refs para recalcular ao retomar
      refs.current.start = null;
      refs.current.end = null;
    }
    return () => clearInterval(interval);
  }, [timerState.active, timerState.mode, timerState.type, timerConfig]);

  // --- Métodos ---

  const gainXP = (amt, reason = "") => {
    if (!amt || amt <= 0) return;
    setUserLevel(prev => {
      let { level, currentXP: cx, totalXP: tx } = prev, nx = getXP(level);
      cx += amt; tx += amt;
      while (cx >= nx) { 
        cx -= nx; 
        level++; 
        nx = getXP(level); 
        // Idealmente usar um Toast aqui ao invés de alert
        console.log(`🎉 LEVEL UP! Nível ${level}`); 
      }
      return { level, currentXP: cx, totalXP: tx, title: getTitle(level) };
    });
  };

  const addSession = (mins, notes, mSubId = null, qs = 0, errs = 0, topic = null) => {
    const sId = mSubId ? Number(mSubId) : selectedSubjectId;
    let cleanQs = Math.max(0, parseInt(qs) || 0);
    let cleanErrs = Math.max(0, parseInt(errs) || 0);
    if (cleanErrs > cleanQs) cleanErrs = cleanQs;
    
    setSessions(p => [...(p || []), { id: Date.now(), date: new Date().toISOString(), minutes: mins, subjectId: sId, notes, questions: cleanQs, errors: cleanErrs, topic }]);
    
    // Cálculo de XP e Metas
    let xp = (Math.floor(mins / 10) * 50) + (cleanQs * 10);
    const sub = subjects.find(s => s.id === sId);
    if (sub && !sub.isSchool) {
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0);
      const prev = sessions.filter(s => s.subjectId === sId && new Date(s.date) >= startW).reduce((a, s) => a + s.minutes, 0);
      if (prev < sub.goalHours * 60 && (prev + mins) >= sub.goalHours * 60) { xp += 500; }
    }
    if (xp > 0) gainXP(xp, "Sessão Concluída");
  };

  const methods = {
    addSubject: (n, c, g, isSchool = false) => setSubjects(p => [...p, { id: Date.now(), name: n, color: c, goalHours: Math.max(0, Number(g)), isSchool }]),
    updateSubject: (id, g) => setSubjects(p => p.map(s => s.id === id ? { ...s, goalHours: Math.max(0, Number(g)) } : s)),
    deleteSubject: (id) => { 
        if (subjects.length > 1 && window.confirm("Excluir matéria?")) { 
            const r = subjects.filter(s => s.id !== id); 
            setSubjects(r); 
            if (selectedSubjectId === id) setSelectedSubjectId(r[0].id); 
        } else if(subjects.length <= 1) alert("Mantenha pelo menos uma matéria."); 
    },
    
    // Tarefas - Correção de ID Único
    addTask: (t, sId, topic) => setTasks(p => [...(p || []), { 
      id: Date.now(), 
      text: t, 
      completed: false, 
      subjectId: sId, 
      topic: topic || "Geral", 
      subTasks: [] 
    }]),
    
    addSubTask: (parentId, text) => setTasks(p => p.map(t => t.id === parentId ? { 
      ...t, 
      subTasks: [...(t.subTasks || []), { id: Date.now() + '-' + Math.random().toString(36).substr(2, 9), text, completed: false }] 
    } : t)),
    
    toggleTask: (id) => setTasks(p => p.map(t => t.id === id ? { ...t, completed: !t.completed } : t)),
    toggleSubTask: (parentId, subId) => setTasks(p => p.map(t => t.id === parentId ? { ...t, subTasks: t.subTasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) } : t)),
    deleteTask: (id) => window.confirm("Excluir tarefa?") && setTasks(p => p.filter(t => t.id !== id)),
    deleteSubTask: (parentId, subId) => setTasks(p => p.map(t => t.id === parentId ? { ...t, subTasks: t.subTasks.filter(s => s.id !== subId) } : t)),
    deleteAllTasks: () => setTasks([]),

    // Erros
    addMistake: (sId, d, r, sol) => setMistakes(p => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(sId), description: d, reason: r, solution: sol, consolidated: false }, ...(p||[])]),
    consolidateMistake: (id, diag, strat) => { setMistakes(p => p.map(m => m.id === id ? { ...m, consolidated: true, diagnosis: diag, strategy: strat } : m)); gainXP(100, "Erro Consolidado"); },
    deleteMistake: (id) => { if (window.confirm("Apagar erro?")) { setMistakes(p => p.filter(x => x.id !== id)); } },
    
    // Temas/Tópicos
    addTheme: (sId, t) => setThemes(p => [...(p||[]), { id: Date.now(), subjectId: sId, title: t, items: [] }]),
    deleteTheme: (id) => window.confirm("Excluir tópico?") && setThemes(p => p.filter(t => t.id !== id)),
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
    
    // Utils
    resetXPOnly: () => window.confirm("Resetar nível?") && (setUserLevel({ level: 1, currentXP: 0, totalXP: 0, title: "Novato Curioso" })),
    resetAllData: () => window.confirm("ATENÇÃO: Isso apagará TODOS os dados. Continuar?") && (localStorage.clear() || window.location.reload()),
    deleteDayHistory: (d) => window.confirm(`Apagar histórico de ${d}?`) && setSessions(p => p.filter(s => new Date(s.date).toDateString() !== d)),
    
    // Escola
    addWork: (subjectId, title, dueDate, description, maxGrade) => setSchoolWorks(p => [...(p||[]), { id: Date.now(), subjectId: Number(subjectId), title, dueDate, description, status: 'pending', grade: null, maxGrade: Number(maxGrade) || 10 }]),
    updateWork: (id, updates) => setSchoolWorks(p => p.map(w => w.id === id ? { ...w, ...updates } : w)),
    deleteWork: (id) => window.confirm("Excluir trabalho?") && setSchoolWorks(p => p.filter(w => w.id !== id)),
    
    addAbsenceRecord: (date, reason, lessonsMap) => {
        setSchoolAbsences(prev => {
            const safePrev = prev || [];
            const existingIndex = safePrev.findIndex(a => a.date === date);
            if (existingIndex >= 0) {
                const updated = [...safePrev];
                const oldRecord = updated[existingIndex];
                const newLessons = { ...oldRecord.lessons };
                Object.entries(lessonsMap).forEach(([subId, count]) => { newLessons[subId] = (newLessons[subId] || 0) + count; });
                let newReason = oldRecord.reason;
                if (reason && !oldRecord.reason.includes(reason)) { newReason = `${oldRecord.reason} + ${reason}`; }
                updated[existingIndex] = { ...oldRecord, lessons: newLessons, reason: newReason };
                return updated;
            } else {
                return [...safePrev, { id: Date.now(), date, reason, lessons: lessonsMap }];
            }
        });
    },
    deleteAbsenceRecord: (id) => window.confirm("Excluir registro?") && setSchoolAbsences(p => p.filter(a => a.id !== id)),
    updateSchoolSchedule: (dayId, lessonsArray) => setSchoolSchedule(p => ({ ...p, [dayId]: lessonsArray })),
    updateSchoolCalendar: (newConfig) => setSchoolCalendar(prev => ({ ...prev, ...newConfig })),
    toggleSchoolException: (dateStr) => setSchoolExceptions(prev => (prev||[]).includes(dateStr) ? prev.filter(d => d !== dateStr) : [...(prev||[]), dateStr]),

    unlockAchievement: (id, xpAmount, title) => {
        setUnlockedAchievements(prev => {
            const safePrev = prev || [];
            if (safePrev.includes(id)) return safePrev;
            gainXP(xpAmount, `Conquista: ${title}`);
            alert(`🏆 CONQUISTA: ${title}\n+${xpAmount} XP`);
            return [...safePrev, id];
        });
    },

    addExam: (examData) => { setExams(prev => [{ ...examData, id: Date.now() }, ...(prev||[])]); gainXP(200, "Prova Registrada"); },
    deleteExam: (id) => window.confirm("Apagar histórico de prova?") && setExams(prev => prev.filter(e => e.id !== id))
  };

  // --- KPIs / Estatísticas ---
  const kpiData = useMemo(() => {
    const safeSessions = sessions || [];
    const now = new Date(), todayS = now.toDateString();
    const dates = new Set(safeSessions.map(s => new Date(s.date).toDateString()));
    let streak = 0, d = new Date(now);
    
    // Cálculo de Streak (Dias consecutivos)
    // Limite de 365 dias para evitar loop infinito em bugs de data
    let safetyLoop = 0;
    while (safetyLoop < 365) {
      const dString = d.toDateString();
      const hasSession = dates.has(dString);
      const isWeekend = [0, 6].includes(d.getDay());
      const isToday = dString === todayS;

      if (hasSession) {
        streak++;
      } else if (isToday && !hasSession) {
        // Se for hoje e não fez nada, não quebra o streak ainda
      } else if (isWeekend) {
        // Fim de semana não quebra streak (regra opcional, mantida do original)
      } else {
        break; // Quebrou
      }
      d.setDate(d.getDate() - 1);
      safetyLoop++;
    }
    
    return { 
      todayMinutes: safeSessions.filter(s => new Date(s.date).toDateString() === todayS).reduce((a, c) => a + c.minutes, 0), 
      totalHours: (safeSessions.reduce((a, c) => a + c.minutes, 0) / 60).toFixed(1), 
      streak 
    };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const safeSessions = sessions || [];
    const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0);
    return Array.from({ length: 7 }).map((_, i) => { 
      const d = new Date(start); 
      d.setDate(start.getDate() + i); 
      return { 
        name: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i], 
        minutos: safeSessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.minutes, 0) 
      }; 
    });
  }, [sessions]);

  const advancedStats = useMemo(() => {
    const safeSessions = sessions || [];
    const activeSubjects = (subjects || []).filter(s => !s.isSchool);
    const ranked = activeSubjects.map(s => ({ 
      ...s, 
      totalMins: safeSessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + c.minutes, 0) 
    })).sort((a, b) => b.totalMins - a.totalMins);

    return { 
      bestSubject: ranked[0], 
      worstSubject: ranked[ranked.length - 1] 
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
        userLevel, unlockedAchievements, exams, 
        
        // Timer State & Setters encapsulados
        timerMode: timerState.mode, 
        timerType: timerState.type, 
        timeLeft: timerState.timeLeft, 
        isActive: timerState.active, 
        cycles: timerState.cycles,
        
        setTimerMode: m => setTimerState(p => ({ ...p, mode: m })),
        setTimerType: t => setTimerState(p => ({ ...p, type: t })),
        setTimeLeft: t => setTimerState(p => ({ ...p, timeLeft: t })),
        setIsActive: a => setTimerState(p => ({ ...p, active: a })),
        setCycles: c => setTimerState(p => ({ ...p, cycles: c })),
        
        timerConfig, setTimerConfig, 

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