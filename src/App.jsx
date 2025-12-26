import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Target, 
  BarChart2, 
  Play, 
  Pause, 
  Coffee,
  RotateCcw, 
  CheckCircle, 
  Plus, 
  Clock, 
  Flame, 
  Settings, 
  BookOpen, 
  Quote, 
  Trash2, 
  Menu, 
  X, 
  History, 
  ArrowLeft, 
  Calendar,
  FileText,
  AlertTriangle,
  Infinity as InfinityIcon,
  List,
  CheckSquare,
  Download,
  Upload,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

// Importação do Calendário
import { CalendarTab } from './components/CalendarTab';

/**
 * --- UTILITÁRIOS & CONFIGURAÇÕES ---
 */

// CONSTANTES DE TEMPO (Centralizadas para evitar erros de duplicidade)
const POMODORO_WORK = 25 * 60; 
const POMODORO_SHORT_BREAK = 5 * 60; // 5 minutos
const POMODORO_LONG_BREAK = 15 * 60; // 15 minutos
const POMODORO_BREAK = 5 * 60; // Usado no reset padrão

const QUOTES = [
  "A persistência é o caminho do êxito.",
  "Foco é dizer não.",
  "O sucesso é a soma de pequenos esforços.",
  "Feito é melhor que perfeito.",
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

// Hook para persistência no LocalStorage
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error(`Erro ao ler ${key}:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
    }
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

  // --- DADOS PERSISTENTES ---
  const [subjects, setSubjects] = useStickyState(DEFAULT_SUBJECTS, 'focus_subjects');
  const [sessions, setSessions] = useStickyState([], 'focus_sessions');
  const [tasks, setTasks] = useStickyState([], 'focus_tasks');
  const [mistakes, setMistakes] = useStickyState([], 'focus_mistakes');
  const [themes, setThemes] = useStickyState([], 'focus_themes'); 

  // --- ESTADOS DO TIMER ---
  const [timerMode, setTimerMode] = useState('WORK'); 
  const [timerType, setTimerType] = useState('POMODORO'); 
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  
  // Estado para memorizar o tempo do Flow durante a pausa
  const [flowStoredTime, setFlowStoredTime] = useState(0);

  useEffect(() => {
    if (subjects.length > 0) {
      if (!selectedSubjectId || !subjects.find(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [subjects, selectedSubjectId]);

  // Função para tocar som
  const playNotificationSound = () => {
    try { new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play().catch(() => {}); } catch(e){}
  };

  // --- LÓGICA DO TIMER (CORRIGIDA) ---
  useEffect(() => {
    let interval = null;

    if (isActive) {
      // 1. MODO FLOW - TRABALHO (Conta pra cima)
      if (timerType === 'FLOW' && timerMode === 'WORK') {
        interval = setInterval(() => setTimeLeft((t) => t + 1), 1000);
      } 
      // 2. CONTAGEM REGRESSIVA (Todo o resto)
      else if (timeLeft > 0) {
        interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      } 
      // 3. TEMPO ACABOU
      else if (timeLeft === 0 && !(timerType === 'FLOW' && timerMode === 'WORK')) {
        clearInterval(interval);
        playNotificationSound(); // Toca som ao fim de qualquer ciclo

        // --- LÓGICA POMODORO ---
        if (timerType === 'POMODORO') {
          if (timerMode === 'WORK') {
            const newCycleCount = cycles + 1;
            setCycles(c => c + 1); // Atualização funcional para evitar dependência direta
            setTimerMode('BREAK');
            // Ciclo 3, 6, 9... = Pausa Longa (15min), Outros = Pausa Curta (5min)
            setTimeLeft(newCycleCount % 3 === 0 ? POMODORO_LONG_BREAK : POMODORO_SHORT_BREAK);
          } else {
            setTimerMode('WORK');
            setTimeLeft(POMODORO_WORK);
            setIsActive(false); // Pausa para o usuário iniciar manualmente
          }
        } 
        // --- LÓGICA FLOW ---
        else if (timerType === 'FLOW') {
          if (timerMode === 'BREAK') {
            // Fim da pausa Flow -> Restaura o tempo de onde parou e volta a contar
            setTimerMode('WORK');
            setTimeLeft(flowStoredTime); // <--- RESTAURA O TEMPO ANTIGO
            setIsActive(true); // Continua contando sozinho
          }
        }
      }
    }
    return () => clearInterval(interval);
    
    // IMPORTANTE: Removido 'cycles' da dependência para evitar loop infinito
  }, [isActive, timeLeft, timerMode, timerType, flowStoredTime]);

  // Título da aba
  useEffect(() => {
    if (isActive) {
      const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      const mode = timerMode === 'WORK' ? 'Foco' : 'Pausa';
      document.title = `${mins}:${secs} - ${mode}`;
    } else {
      document.title = "Focus App";
    }
  }, [isActive, timeLeft, timerMode]);

  // Ações
  const addSession = (minutes, notes) => setSessions(prev => [...prev, { id: Date.now(), date: new Date().toISOString(), minutes, subjectId: selectedSubjectId, notes }]);
  const addMistake = (subjectId, description, reason, solution) => setMistakes(prev => [{ id: Date.now(), date: new Date().toISOString(), subjectId: Number(subjectId), description, reason, solution }, ...prev]);
  const deleteMistake = (id) => { if (window.confirm("Apagar erro?")) setMistakes(prev => prev.filter(m => m.id !== id)); };
  const addSubject = (name, color, goalHours) => setSubjects(prev => [...prev, { id: Date.now(), name, color, goalHours: Number(goalHours) }]);
  const updateSubject = (id, newGoal) => setSubjects(prev => prev.map(s => s.id === id ? { ...s, goalHours: Number(newGoal) } : s));
  const deleteSubject = (id) => { if (subjects.length <= 1) return alert("Mantenha uma matéria."); if (window.confirm("Excluir matéria?")) { const rem = subjects.filter(s => s.id !== id); setSubjects(rem); if (selectedSubjectId === id) setSelectedSubjectId(rem[0].id); } };
  const addTask = (text, subjectId) => setTasks(prev => [...prev, { id: Date.now(), text, completed: false, subjectId }]);
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => { if (window.confirm("Excluir tarefa?")) setTasks(prev => prev.filter(t => t.id !== id)); };
  const deleteDayHistory = (dateStr) => { if (window.confirm(`Apagar histórico de ${dateStr}?`)) setSessions(prev => prev.filter(s => new Date(s.date).toDateString() !== dateStr)); };
  const resetAllData = () => { if (window.confirm("Resetar TUDO?")) { localStorage.clear(); window.location.reload(); } };
  const addTheme = (subjectId, title) => setThemes(prev => [...prev, { id: Date.now(), subjectId, title, items: [] }]);
  const deleteTheme = (themeId) => { if(window.confirm("Excluir tema?")) setThemes(prev => prev.filter(t => t.id !== themeId)); };
  const addThemeItem = (themeId, text) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: [...t.items, { id: Date.now(), text, completed: false }] } : t));
  const toggleThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) } : t));
  const deleteThemeItem = (themeId, itemId) => setThemes(prev => prev.map(t => t.id === themeId ? { ...t, items: t.items.filter(i => i.id !== itemId) } : t));

  const kpiData = useMemo(() => {
    const todayStr = new Date().toDateString();
    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.minutes, 0);
    const todayMinutes = sessions.filter(s => new Date(s.date).toDateString() === todayStr).reduce((acc, curr) => acc + curr.minutes, 0);
    const uniqueDays = new Set(sessions.map(s => new Date(s.date).toDateString())).size;
    return { todayMinutes, totalHours: (totalMinutes / 60).toFixed(1), streak: uniqueDays };
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0,0,0,0);
    const data = [];
    for(let i=0; i<7; i++){
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate()+i);
      const dStr = d.toDateString();
      const mins = sessions.filter(s => new Date(s.date).toDateString() === dStr).reduce((acc,c) => acc + c.minutes, 0);
      data.push({ name: `${days[i]} ${d.getDate()}`, minutos: mins });
    }
    return data;
  }, [sessions]);

  return (
    <FocusContext.Provider value={{
      currentView, setCurrentView, selectedHistoryDate, setSelectedHistoryDate,
      subjects, addSubject, updateSubject, deleteSubject,
      sessions, addSession, deleteDayHistory,
      tasks, addTask, toggleTask, deleteTask,
      mistakes, addMistake, deleteMistake,
      themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem, 
      timerMode, setTimerMode, timerType, setTimerType,
      timeLeft, setTimeLeft, isActive, setIsActive, cycles, setCycles,
      selectedSubjectId, setSelectedSubjectId,
      flowStoredTime, setFlowStoredTime, // Exportando o novo estado
      resetAllData, kpiData, weeklyChartData
    }}>
      {children}
    </FocusContext.Provider>
  );
};

/**
 * --- COMPONENTES UI ---
 */
const Card = ({ children, className = "" }) => (
  <div className={`bg-[#18181B] border border-gray-800 rounded-xl shadow-lg p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
  };
  return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#18181B] border border-gray-700 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

/**
 * --- VIEWS (TELAS) ---
 */

const DashboardView = () => {
  const { kpiData, weeklyChartData, setCurrentView } = useContext(FocusContext);
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Seja bem-vindo de volta, Arthur! </h1>
        <p className="text-gray-400">Visão geral e detalhada do seu progresso.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500">
          <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500"><Zap size={24}/></div>
          <div><p className="text-sm text-gray-400">Hoje</p><p className="text-2xl font-bold text-white">{kpiData.todayMinutes} min</p></div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="p-3 bg-violet-500/20 rounded-full text-violet-500"><Clock size={24}/></div>
          <div><p className="text-sm text-gray-400">Total</p><p className="text-2xl font-bold text-white">{kpiData.totalHours} h</p></div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 bg-orange-500/20 rounded-full text-orange-500"><Flame size={24}/></div>
          <div><p className="text-sm text-gray-400">Sequência</p><p className="text-2xl font-bold text-white">{kpiData.streak} dias</p></div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-violet-500"/> Atividade Semanal</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{fill:'#a1a1aa', fontSize:12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" tick={{fill:'#a1a1aa'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{backgroundColor:'#18181B', borderColor:'#3f3f46', color:'#fff'}} />
                <Line type="monotone" dataKey="minutos" stroke="#8b5cf6" strokeWidth={3} dot={{r:4, fill:'#8b5cf6'}} activeDot={{r:6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-violet-900/40 to-[#18181B] border-violet-500/30 flex flex-col justify-between">
          <div><h3 className="text-xl font-bold text-white mb-2">Focar Agora</h3><p className="text-gray-300 mb-6">Comece um ciclo de produtividade.</p></div>
          <Button onClick={() => setCurrentView('focus')} className="w-full py-4 text-lg">Ir para o Timer <Zap size={20}/></Button>
        </Card>
      </div>
    </div>
  );
};

const FocusView = () => {
  const { 
    timerType, setTimerType,
    subjects, selectedSubjectId, setSelectedSubjectId,
    timerMode, setTimerMode, timeLeft, setTimeLeft, 
    isActive, setIsActive, cycles, 
    tasks, addTask, toggleTask, deleteTask, addSession,
    flowStoredTime, setFlowStoredTime // Pegando do contexto
  } = useContext(FocusContext);

  const [notes, setNotes] = useState("");
  const [newTaskText, setNewTaskText] = useState("");

  const toggleTimerType = (type) => {
    setIsActive(false);
    setTimerType(type);
    setTimerMode('WORK');
    setTimeLeft(type === 'FLOW' ? 0 : POMODORO_WORK);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(timerType === 'FLOW' ? 0 : (timerMode === 'WORK' ? POMODORO_WORK : POMODORO_BREAK));
  };

  // --- BOTÃO DE PAUSA DO FLOW (CAFÉ) ---
  const handleFlowBreak = () => {
    if (timerType === 'FLOW' && timerMode === 'WORK') {
      const currentWorkTime = timeLeft; 
      const minutesStudied = Math.round(currentWorkTime / 60);

      if (minutesStudied > 0) {
        // NÃO SALVA SESSÃO AINDA, APENAS MEMORIZA O TEMPO
        setFlowStoredTime(currentWorkTime); 
        
        // Cálculo 20%
        const calculatedBreakSeconds = Math.floor(currentWorkTime * 0.20); 
        const breakMinutes = Math.ceil(calculatedBreakSeconds / 60);
        
        alert(`Pausa no Flow! Trabalho até agora: ${minutesStudied} min.\nIniciando pausa de ${breakMinutes} min.`);
        
        // Inicia o descanso
        setTimerMode('BREAK');
        setTimeLeft(calculatedBreakSeconds);
        setIsActive(true); 
      } else {
        alert("Trabalhe um pouco mais antes de pausar.");
      }
    }
  };

  // --- BOTÃO DE ENCERRAR/SALVAR (VERMELHO) ---
  const handleFinish = () => {
    let timeSpentSeconds = 0;
    
    if (timerType === 'FLOW') {
      // Se estiver no meio do descanso, o tempo trabalhado é o que estava memorizado
      if (timerMode === 'BREAK') {
        timeSpentSeconds = flowStoredTime;
      } else {
        timeSpentSeconds = timeLeft;
      }
    } else {
      // Lógica Pomodoro
      const totalDuration = timerMode === 'WORK' ? POMODORO_WORK : POMODORO_BREAK;
      timeSpentSeconds = totalDuration - timeLeft;
    }

    const minutesStudied = Math.round(timeSpentSeconds / 60);

    if (minutesStudied > 0) {
      addSession(minutesStudied, notes);
      setNotes("");
      alert(`Sessão finalizada e salva: ${minutesStudied} min.`);
    }

    // Reseta tudo
    setIsActive(false);
    setTimerMode('WORK');
    setTimeLeft(timerType === 'FLOW' ? 0 : POMODORO_WORK);
    setFlowStoredTime(0); // Limpa a memória
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if(newTaskText && selectedSubjectId) { addTask(newTaskText, selectedSubjectId); setNewTaskText(""); }
  };

  if(subjects.length === 0) return <div className="text-center mt-20 text-gray-400">Adicione matérias em "Metas".</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      <div className="lg:col-span-2 space-y-6">
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${isActive ? (timerMode==='WORK'?'bg-violet-600 animate-pulse':'bg-emerald-500 animate-pulse'):'bg-gray-700'}`}></div>
          
          {/* Switch */}
          <div className="flex bg-[#0F0F12] p-1 rounded-lg border border-gray-800 mb-6 z-10">
            <button onClick={() => toggleTimerType('POMODORO')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timerType === 'POMODORO' ? 'bg-zinc-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>Pomodoro</button>
            <button onClick={() => toggleTimerType('FLOW')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${timerType === 'FLOW' ? 'bg-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}><InfinityIcon size={12}/> Flow</button>
          </div>

          {/* Matéria */}
          <div className="w-full max-w-xs mb-8 z-10">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Matéria</label>
            <div className="relative">
              <select disabled={isActive} value={selectedSubjectId||''} onChange={(e)=>setSelectedSubjectId(Number(e.target.value))} className="w-full bg-[#27272A] disabled:opacity-50 text-white border border-gray-700 rounded-lg py-2 px-4 appearance-none outline-none cursor-pointer">
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <BookOpen size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          {/* Relógio */}
          <div className="z-10 text-center">
            <div className="mb-6"><span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border ${timerMode==='WORK'?'bg-violet-500/10 text-violet-400 border-violet-500/20':'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{timerMode==='WORK'?'Foco Total':'Pausa'}</span></div>
            <div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter mb-4 tabular-nums drop-shadow-2xl">{formatTime(timeLeft)}</div>
            <div className="text-gray-400 mb-8 font-medium">Ciclos: <span className="text-white font-bold ml-2">{cycles}</span></div>
            
            {/* Botões */}
            <div className="flex gap-4 justify-center items-center mt-8">
              <button onClick={()=>setIsActive(!isActive)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive?'bg-zinc-800 text-white border border-zinc-700':(timerMode==='WORK'?'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30':'bg-emerald-500 hover:bg-emerald-600 text-white')}`}>
                {isActive ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
                <span className="text-lg">{isActive ? 'Pausar' : 'Iniciar'}</span>
              </button>
              <button onClick={handleReset} className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors" title="Resetar"><RotateCcw size={24}/></button>
              
              {/* Botão Café (Flow) */}
              {timerType === 'FLOW' && timerMode === 'WORK' && (
                <button onClick={handleFlowBreak} className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-colors" title="Pausa (20%)">
                  <Coffee size={24}/>
                </button>
              )}

              {/* Botão Salvar */}
              <button onClick={handleFinish} className="p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors" title="Encerrar Sessão"><CheckCircle size={24}/></button>
            </div>
            {timerType === 'FLOW' && timerMode === 'WORK' && <p className="text-xs text-zinc-500 mt-4">Clique no <Coffee size={12} className="inline"/> para calcular pausa.</p>}
          </div>
        </Card>
        
        <Card><h3 className="text-lg font-semibold text-white mb-3">Diário da Sessão</h3><textarea className="w-full bg-[#0F0F12] border border-gray-800 rounded-lg p-3 text-gray-300 outline-none resize-none h-24 text-sm" placeholder="O que você estudou?" value={notes} onChange={(e)=>setNotes(e.target.value)}></textarea></Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col min-h-[300px]"><h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-violet-500"/> Tarefas</h3><form onSubmit={handleTaskSubmit} className="mb-4 flex gap-2"><input type="text" placeholder="Nova tarefa..." className="flex-1 bg-[#0F0F12] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)}/><button type="submit" className="bg-violet-600 rounded-lg px-3 text-white"><Plus size={18}/></button></form><div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{tasks.filter(t=>t.subjectId===selectedSubjectId).length===0 && <p className="text-sm text-gray-600 text-center mt-4">Sem tarefas.</p>}{tasks.filter(t=>t.subjectId===selectedSubjectId).map(task=>(<div key={task.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completed?'bg-violet-900/10 border-violet-500/20 opacity-60':'bg-[#27272A] border-gray-700'}`}><button onClick={()=>toggleTask(task.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${task.completed?'bg-violet-500 border-violet-500':'border-gray-500'}`}>{task.completed&&<CheckCircle size={14} className="text-white"/>}</button><span className={`text-sm flex-1 break-words ${task.completed?'text-gray-500 line-through':'text-gray-200'}`}>{task.text}</span><button onClick={(e)=>{e.stopPropagation();deleteTask(task.id)}} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></div>))}</div></Card>
      </div>
    </div>
  );
};

const MistakesView = () => {
  const { subjects, mistakes, addMistake, deleteMistake } = useContext(FocusContext);
  const [selSubject, setSelSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [reason, setReason] = useState("Conceito");
  const [solution, setSolution] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if(selSubject && desc && solution) {
      addMistake(selSubject, desc, reason, solution);
      setDesc(""); setSolution(""); alert("Erro registrado!");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header><h1 className="text-2xl font-bold text-white mb-1">Caderno de Erros</h1><p className="text-gray-400">Aprenda com suas falhas.</p></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Novo Erro</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs text-gray-500 font-bold uppercase">Matéria</label><select required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-2.5 text-white outline-none" value={selSubject} onChange={e=>setSelSubject(e.target.value)}><option value="">Selecione...</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Motivo</label><div className="flex flex-wrap gap-2 mt-2">{["Falta de Atenção","Esqueci Fórmula","Erro Cálculo","Conceito","Tempo","Interpretação"].map(r=><button key={r} type="button" onClick={()=>setReason(r)} className={`text-xs px-3 py-1.5 rounded-full border ${reason===r?'bg-violet-600 border-violet-600 text-white':'border-gray-700 text-gray-400'}`}>{r}</button>)}</div></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Erro</label><textarea required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-3 text-sm text-white outline-none h-20" placeholder="O que você errou?" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
            <div><label className="text-xs text-gray-500 font-bold uppercase">Solução</label><textarea required className="w-full mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg p-3 text-sm text-white outline-none h-24" placeholder="Como resolver?" value={solution} onChange={e=>setSolution(e.target.value)}/></div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
           {mistakes.length===0 && <div className="text-center py-10 opacity-50"><CheckCircle size={40} className="mx-auto mb-2"/><p>Sem erros registrados.</p></div>}
           {mistakes.map(m=>{
             const subj = subjects.find(s=>s.id===m.subjectId)||{name:'?',color:'#666'};
             return (
               <div key={m.id} className="bg-[#18181B] border border-gray-800 rounded-xl p-5 relative group hover:border-gray-700">
                 <button onClick={()=>deleteMistake(m.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                 <div className="flex items-center gap-3 mb-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{backgroundColor:subj.color}}>{subj.name}</span><span className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</span><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{m.reason}</span></div>
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-1"><p className="text-xs text-red-400 font-bold uppercase">Erro</p><p className="text-gray-300 text-sm">{m.description}</p></div>
                   <div className="space-y-1 md:border-l md:border-gray-800 md:pl-6"><p className="text-xs text-green-400 font-bold uppercase">Solução</p><p className="text-gray-300 text-sm">{m.solution}</p></div>
                 </div>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
};

// 1. GARANTA QUE LÁ NO TOPO OS IMPORTS ESTEJAM ASSIM:
// import { ..., ChevronDown, ChevronRight, ... } from 'lucide-react';

const GoalsView = () => {
  const { 
    subjects, sessions, addSubject, updateSubject, deleteSubject,
    themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem 
  } = useContext(FocusContext);

  const [viewingSubject, setViewingSubject] = useState(null); 
  
  // --- NOVO: Estado para saber quais temas estão fechados ---
  const [collapsedThemes, setCollapsedThemes] = useState({});

  // States para criação de matéria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState(10);
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [editId, setEditId] = useState(null);
  const [editGoalVal, setEditGoalVal] = useState("");

  // States para criação de TEMA
  const [newThemeTitle, setNewThemeTitle] = useState("");

  const getProgress = (subjId, goalH) => {
    const mins = sessions.filter(s => s.subjectId === subjId).reduce((a, b) => a + b.minutes, 0);
    return { current: (mins/60).toFixed(1), percent: Math.min(100, (mins/(goalH*60))*100) };
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if(newName) { addSubject(newName, newColor, newGoal); setIsModalOpen(false); setNewName(""); setNewGoal(10); }
  };

  const handleAddTheme = (e) => {
    e.preventDefault();
    if(newThemeTitle && viewingSubject) {
      addTheme(viewingSubject, newThemeTitle);
      setNewThemeTitle("");
    }
  };

const handleAddItem = (e, themeId) => {
    e.preventDefault();
    const val = e.target.elements.itemText.value;
    if(val) {
      addThemeItem(themeId, val);
      e.target.reset(); // Limpa o input após o Enter
    }
  };

  // --- NOVA FUNÇÃO MÁGICA: DETECTAR O CTRL+V ---
  const handlePasteItems = (e, themeId) => {
    const pasteData = e.clipboardData.getData('text');

    // Verifica se o texto colado tem quebra de linha (significa que é uma lista)
    if (pasteData.includes('\n')) {
      e.preventDefault(); // Impede que o texto fique "linguição" no input
      
      // Separa por linha, limpa espaços e remove linhas vazias
      const lines = pasteData.split('\n').map(line => line.trim()).filter(line => line !== "");

      // Adiciona cada linha como um item novo
      lines.forEach((line) => {
        addThemeItem(themeId, line);
      });
      
      // Feedback visual opcional (pode remover se quiser)
      console.log(`Adicionados ${lines.length} itens via colar.`);
    }
  };

  // --- NOVA FUNÇÃO: Alternar entre abrir/fechar tema ---
  const toggleThemeCollapse = (themeId) => {
    setCollapsedThemes(prev => ({
      ...prev,
      [themeId]: !prev[themeId]
    }));
  };

  // MODO DETALHES DA MATÉRIA
  if (viewingSubject) {
    const subject = subjects.find(s => s.id === viewingSubject);
    if(!subject) return <div className="p-8 text-center text-gray-500 cursor-pointer" onClick={()=>setViewingSubject(null)}>Matéria não encontrada. Clique para voltar.</div>;

    const subjectThemes = themes.filter(t => t.subjectId === subject.id);

    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <button onClick={() => setViewingSubject(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Voltar para Metas
        </button>

        <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
             <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded text-white mb-2 inline-block" style={{backgroundColor: subject.color}}>
               {subject.name}
             </span>
             <h1 className="text-3xl font-bold text-white">Conteúdo Programático</h1>
             <p className="text-zinc-400 mt-1">Organize seus estudos por temas e tópicos.</p>
          </div>
          <div className="text-right">
             <div className="text-zinc-500 text-sm">Meta de Horas</div>
             <div className="text-2xl font-bold text-white">{subject.goalHours}h <span className="text-sm font-normal text-zinc-500">/semanais</span></div>
          </div>
        </header>

        {/* Criar Novo Tema */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full">
            <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Novo Tema</label>
            <input 
              className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white outline-none focus:border-violet-500"
              placeholder="Digite o título do tema..."
              value={newThemeTitle} onChange={e => setNewThemeTitle(e.target.value)}
            />
          </div>
          <Button onClick={handleAddTheme} className="w-full md:w-auto h-10">Adicionar Tema</Button>
        </div>

        {/* Lista de Temas */}
        <div className="space-y-6">
          {subjectThemes.length === 0 && (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <List size={48} className="mx-auto mb-2 opacity-20"/>
              <p>Nenhum tema criado ainda.</p>
            </div>
          )}

          {subjectThemes.map(theme => {
            const completedCount = theme.items ? theme.items.filter(i => i.completed).length : 0;
            const totalCount = theme.items ? theme.items.length : 0;
            const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
            
            // Verifica se está fechado
            const isCollapsed = collapsedThemes[theme.id];

            return (
              <Card key={theme.id} className="relative group/theme transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-start w-full">
                    {/* Botão de Minimizar */}
                    <button 
                      onClick={() => toggleThemeCollapse(theme.id)}
                      className="mt-1 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                    >
                      {isCollapsed ? <ChevronRight size={20}/> : <ChevronDown size={20}/>}
                    </button>

                    <div className="flex-1">
                      {/* Título Clicável */}
                      <h3 
                        className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:text-violet-400 transition-colors select-none"
                        onClick={() => toggleThemeCollapse(theme.id)}
                      >
                        <BookOpen size={20} className="text-violet-500" /> {theme.title}
                      </h3>
                      
                      {/* Barra de Progresso (Sempre visível) */}
                      <div className="flex items-center gap-2 mt-1">
                         <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                           <div className="h-full bg-violet-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                         </div>
                         <span className="text-xs text-zinc-500">{progress}% concluído</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Excluir Tema */}
                  <button onClick={() => deleteTheme(theme.id)} className="text-zinc-600 hover:text-red-500 transition-colors ml-4">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Conteúdo do Tema (Checklists) - Só aparece se NÃO estiver colapsado */}
                {!isCollapsed && (
                  <div className="space-y-2 mb-4 animate-fadeIn pl-8">
                    {(theme.items || []).map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group/item">
                        <button 
                          onClick={() => toggleThemeItem(theme.id, item.id)}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${item.completed ? 'bg-violet-600 border-violet-600' : 'border-zinc-600 hover:border-violet-500'}`}
                        >
                          {item.completed && <CheckSquare size={14} className="text-white" />}
                        </button>
                        <span className={`text-sm flex-1 ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                          {item.text}
                        </span>
                        <button onClick={() => deleteThemeItem(theme.id, item.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Input de Novo Item */}
                    <form onSubmit={(e) => handleAddItem(e, theme.id)} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                       <input 
                         name="itemText"
                         className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-violet-500"
                         placeholder="Adicionar tópico..."
                         autoComplete="off"
                       />
                       <button type="submit" className="p-1.5 bg-zinc-800 hover:bg-violet-600 text-white rounded transition-colors">
                         <Plus size={16} />
                       </button>
                    </form>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // MODO LISTA DE MATÉRIAS (GRID PRINCIPAL)
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-white">Metas & Matérias</h1><Button onClick={()=>setIsModalOpen(true)}><Plus size={18}/> Nova Matéria</Button></header>
      {(!subjects || subjects.length === 0) && <div className="text-center py-10 text-zinc-500">Nenhuma matéria cadastrada.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(s => {
          const { current, percent } = getProgress(s.id, s.goalHours);
          return (
            <Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-violet-500/50 transition-all">
              <div onClick={() => setViewingSubject(s.id)}>
                <div className="absolute top-0 left-0 w-full h-1" style={{backgroundColor:s.color}}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">{s.name}</h3>
                    {editId!==s.id && <p className="text-sm text-gray-400">Meta: {s.goalHours}h</p>}
                  </div>
                </div>
                {editId!==s.id && (
                  <>
                    <div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-white">{current}h</span><span className="text-sm font-medium" style={{color:s.color}}>{Math.round(percent)}%</span></div>
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000 ease-out" style={{width:`${percent}%`, backgroundColor:s.color}}></div></div>
                    <p className="text-xs text-zinc-500 mt-4 text-center">Clique para ver conteúdo programático</p>
                  </>
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                 {editId===s.id ? (
                   <div className="flex gap-2 items-center bg-black/80 p-1 rounded">
                     <input type="number" className="w-16 bg-[#0F0F12] border border-gray-600 rounded px-1 text-sm text-white" value={editGoalVal} onChange={e=>setEditGoalVal(e.target.value)} autoFocus/>
                     <button onClick={()=>{updateSubject(s.id,editGoalVal);setEditId(null)}} className="text-green-400 text-xs font-bold">OK</button>
                   </div>
                 ) : (
                   <>
                     <button onClick={(e)=>{e.stopPropagation();setEditId(s.id);setEditGoalVal(s.goalHours)}} className="p-2 rounded bg-[#27272A] hover:bg-[#323236] z-10"><Settings size={16} className="text-gray-400"/></button>
                     <button onClick={(e)=>{e.stopPropagation();deleteSubject(s.id)}} className="p-2 rounded bg-[#27272A] hover:bg-red-900/20 group/trash z-10"><Trash2 size={16} className="text-gray-400 group-hover/trash:text-red-500"/></button>
                   </>
                 )}
              </div>
            </Card>
          );
        })}
      </div>
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Nova Matéria">
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div><label className="text-sm text-gray-400">Nome</label><input required className="w-full bg-[#0F0F12] border border-gray-700 rounded p-2 text-white outline-none" value={newName} onChange={e=>setNewName(e.target.value)}/></div>
          <div><label className="text-sm text-gray-400">Meta (h)</label><input required type="number" className="w-full bg-[#0F0F12] border border-gray-700 rounded p-2 text-white outline-none" value={newGoal} onChange={e=>setNewGoal(e.target.value)}/></div>
          <div><label className="text-sm text-gray-400">Cor</label><div className="flex gap-2 mt-2">{['#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444'].map(c=><div key={c} onClick={()=>setNewColor(c)} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${newColor===c?'border-white':'border-transparent'}`} style={{backgroundColor:c}}></div>)}</div></div>
          <Button type="submit" className="w-full mt-4">Criar</Button>
        </form>
      </Modal>
    </div>
  );
};

const StatsView = () => {
  const { sessions, subjects, weeklyChartData } = useContext(FocusContext);
  const ranking = useMemo(()=>subjects.map(s=>{
    const mins = sessions.filter(x=>x.subjectId===s.id).reduce((a,b)=>a+b.minutes,0);
    return {...s, total:(mins/60).toFixed(1), raw:mins};
  }).sort((a,b)=>b.raw-a.raw),[subjects,sessions]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <h1 className="text-2xl font-bold text-white mb-6">Estatísticas</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]">
          <h3 className="text-white font-semibold mb-6">Performance Semanal</h3>
          <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyChartData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false}/><XAxis dataKey="name" stroke="#555" axisLine={false} tickLine={false}/><YAxis stroke="#555" axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#222'}} contentStyle={{backgroundColor:'#18181B', borderColor:'#333'}}/><Bar dataKey="minutos" fill="#8b5cf6" radius={[4,4,0,0]}><Cell fill="#8b5cf6"/></Bar></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="overflow-y-auto max-h-[350px] custom-scrollbar">
          <h3 className="text-white font-semibold mb-4">Ranking</h3>
          {ranking.map((r,i)=>(<div key={r.id} className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2 last:border-0"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i===0?'bg-yellow-500 text-black':'bg-gray-800 text-gray-400'}`}>{i+1}</div><span className="text-white text-sm">{r.name}</span></div><span className="text-violet-400 font-bold text-sm">{r.total}h</span></div>))}
        </Card>
      </div>
    </div>
  );
};

const HistoryView = () => {
  const { sessions, setCurrentView, setSelectedHistoryDate, deleteDayHistory } = useContext(FocusContext);
  const grouped = useMemo(()=>{
    const g={};
    sessions.forEach(s=>{
      const d=new Date(s.date).toDateString();
      if(!g[d])g[d]={date:new Date(s.date),mins:0,count:0};
      g[d].mins+=s.minutes; g[d].count++;
    });
    return Object.values(g).sort((a,b)=>b.date-a.date);
  },[sessions]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <h1 className="text-2xl font-bold text-white mb-6">Histórico</h1>
      <div className="grid gap-4">
        {grouped.length===0 && <p className="text-center text-gray-500 py-10">Nenhum estudo foi registrado até o momento.</p>}
        {grouped.map((g,i)=>(
          <Card key={i} className="flex justify-between items-center hover:bg-[#202024] cursor-pointer group">
             <div className="flex-1 flex gap-4 items-center" onClick={()=>{setSelectedHistoryDate(g.date);setCurrentView('report')}}>
               <div className="w-12 h-12 bg-violet-900/20 rounded-lg flex flex-col items-center justify-center text-violet-400"><span className="font-bold text-lg">{g.date.getDate()}</span><span className="text-[10px] uppercase">{g.date.toLocaleString('pt-BR',{month:'short'}).replace('.','')}</span></div>
               <div><h3 className="text-white font-medium capitalize">{g.date.toLocaleString('pt-BR',{weekday:'long'})}</h3><p className="text-sm text-gray-400">{g.count} sessões • {Math.floor(g.mins/60)}h {g.mins%60}m</p></div>
             </div>
             <button onClick={(e)=>{e.stopPropagation();deleteDayHistory(g.date.toDateString())}} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-900/10 rounded-full transition-colors"><Trash2 size={18}/></button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ReportView = () => {
  const { sessions, mistakes, selectedHistoryDate, setCurrentView, subjects } = useContext(FocusContext);
  if(!selectedHistoryDate) return null;
  const dateStr = selectedHistoryDate.toDateString();
  const daily = sessions.filter(s=>new Date(s.date).toDateString()===dateStr).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const dailyMistakes = mistakes.filter(m => new Date(m.date).toDateString() === dateStr);
  const total = daily.reduce((acc,c)=>acc+c.minutes,0);
  const getSubj = (id)=>subjects.find(s=>s.id===id)||{name:'-',color:'#555'};

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <button onClick={()=>setCurrentView('history')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"><ArrowLeft size={18}/> Voltar</button>
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div><h1 className="text-2xl font-bold text-white capitalize">{selectedHistoryDate.toLocaleString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</h1><p className="text-gray-400">Relatório do dia</p></div>
        <div className="w-32 h-32 rounded-full border-4 border-violet-500/20 flex flex-col items-center justify-center"><span className="text-2xl font-mono font-bold text-white">{Math.floor(total/60)}h {total%60}m</span><span className="text-xs uppercase text-gray-500">Total</span></div>
      </header>
      <div className="space-y-4">
        {daily.map(s=>{
          const subj=getSubj(s.subjectId);
          return (
            <Card key={s.id} className="relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1" style={{backgroundColor:subj.color}}></div>
               <div className="flex justify-between items-start">
                  <div className="flex-1 pl-3">
                     <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold uppercase text-white px-1.5 rounded" style={{backgroundColor:subj.color}}>{subj.name}</span><span className="text-xs text-gray-500">{new Date(s.date).toLocaleTimeString().slice(0,5)}</span></div>
                     <p className="text-sm text-gray-300">{s.notes||"Sem notas."}</p>
                  </div>
                  <span className="font-bold text-white">{s.minutes}m</span>
               </div>
            </Card>
          )
        })}
      </div>
      {dailyMistakes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Erros do Dia</h3>
          <div className="space-y-4">
            {dailyMistakes.map(m => {
              const subj = getSubj(m.subjectId);
              return (
                <Card key={m.id} className="border-red-500/20 bg-red-500/5">
                  <div className="flex justify-between mb-2"><span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-white">{subj.name}</span><span className="text-xs text-red-300 border border-red-500/30 px-2 rounded-full">{m.reason}</span></div>
                  <p className="text-gray-300 text-sm mb-2"><strong className="text-red-400">Erro:</strong> {m.description}</p>
                  <div className="bg-zinc-900/50 p-2 rounded text-sm text-green-400 border-l-2 border-green-500"><strong className="text-green-500">Solução:</strong> {m.solution}</div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const AppLayout = () => {
  const { currentView, setCurrentView, resetAllData } = useContext(FocusContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const quote = useMemo(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)],[]);

  // --- FUNÇÃO DE EXPORTAR (BACKUP COMPLETO) ---
  const handleExport = () => {
    const data = {
      focus_subjects: localStorage.getItem('focus_subjects'),
      focus_sessions: localStorage.getItem('focus_sessions'),
      focus_tasks: localStorage.getItem('focus_tasks'),
      focus_mistakes: localStorage.getItem('focus_mistakes'),
      focus_themes: localStorage.getItem('focus_themes'),
      my_study_schedule: localStorage.getItem('my_study_schedule'), // Adicionado cronograma
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-focus-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- FUNÇÃO DE IMPORTAR (RESTAURAR INTELIGENTE) ---
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validação mais flexível: restaura qualquer chave válida encontrada
        const keysToImport = ['focus_subjects', 'focus_sessions', 'focus_tasks', 'focus_mistakes', 'focus_themes', 'my_study_schedule'];
        let importedCount = 0;
        
        if(window.confirm("Isso irá substituir seus dados atuais pelos do backup. Deseja continuar?")) {
          keysToImport.forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
              localStorage.setItem(key, data[key]);
              importedCount++;
            }
          });

          if (importedCount > 0) {
             alert("Backup restaurado com sucesso! A página será recarregada.");
             window.location.reload();
          } else {
             alert("O arquivo parece não conter dados válidos do Focus App.");
          }
        }
      } catch (err) {
        alert("Erro ao ler o arquivo. Verifique se é um JSON válido.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'focus', label: 'Focar', icon: Zap },
    { id: 'mistakes', label: 'Erros', icon: AlertTriangle },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'stats', label: 'Estatísticas', icon: BarChart2 },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="flex h-screen bg-[#0F0F12] text-gray-300 font-sans overflow-hidden">
      <button className="md:hidden fixed top-4 right-4 z-50 p-2 bg-[#18181B] border border-gray-800 rounded-lg text-white shadow-lg" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button>
      {menuOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={()=>setMenuOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F0F12] border-r border-gray-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${menuOpen?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-8 flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">F</div><span className="text-xl font-bold text-white tracking-tight">Focus</span></div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const isActive = currentView===item.id || (item.id==='history' && currentView==='report');
            return <button key={item.id} onClick={()=>{setCurrentView(item.id);setMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive?'bg-violet-600/10 text-violet-400 font-medium':'hover:bg-[#18181B] hover:text-white'}`}><item.icon size={20} className={isActive?'text-violet-500':'text-gray-500 group-hover:text-white'}/>{item.label}</button>
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="mb-4 bg-[#18181B] p-3 rounded-lg border border-gray-800"><Quote size={12} className="text-violet-500 mb-1 rotate-180"/><p className="text-[10px] text-gray-400 italic">"{quote}"</p></div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleExport} className="flex flex-col items-center justify-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all text-xs text-gray-400 hover:text-white" title="Baixar Backup"><Download size={16} className="mb-1 text-violet-500"/> Exportar</button>
            <label className="flex flex-col items-center justify-center p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-lg transition-all text-xs text-gray-400 hover:text-white cursor-pointer" title="Carregar Backup"><Upload size={16} className="mb-1 text-emerald-500"/> Importar<input type="file" accept=".json" className="hidden" onChange={handleImport} /></label>
          </div>
          <button onClick={resetAllData} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-900/10 rounded-lg text-xs transition-colors border border-transparent hover:border-red-900/20 mt-2"><Trash2 size={14}/> Resetar App</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 relative bg-[#0F0F12] md:ml-64 transition-all duration-300">
        <div className="max-w-6xl mx-auto h-full">
           {currentView==='dashboard' && <DashboardView/>}
           {currentView==='focus' && <FocusView/>}
           {currentView==='calendar' && <CalendarTab/>}
           {currentView==='mistakes' && <MistakesView/>}
           {currentView==='goals' && <GoalsView/>}
           {currentView==='stats' && <StatsView/>}
           {currentView==='history' && <HistoryView/>}
           {currentView==='report' && <ReportView/>}
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <FocusProvider>
    <AppLayout />
    <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 20px; } 
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } 
      .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      ::selection {
        background-color: #ffffffff; /* Cor Violeta (combinando com seu tema) */
        color: #000000ff;            /* Texto Branco */
      }
    `}</style>
  </FocusProvider>
);

export default App;