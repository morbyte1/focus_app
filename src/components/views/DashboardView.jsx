import React, { useContext, useState, useEffect, useMemo } from 'react';
import { 
  Zap, Clock, Flame, Flag, BarChart2, 
  Infinity as InfinityIcon, ArrowRight, CheckCircle, 
  Trophy, Calendar, Target, Sparkles, ChevronRight, BookOpen 
} from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FocusContext, getXP, getRank, RANKS } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// Banco de Frases Motivacionais
const QUOTES = [
  "A dor da disciplina é menor que a dor do arrependimento.",
  "Não espere por inspiração. Torne-se disciplinado.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Aja como a pessoa que você quer se tornar.",
  "Sorte é o que acontece quando a preparação encontra a oportunidade.",
  "Não diminua seus sonhos. Aumente seu esforço.",
  "O único dia fácil foi ontem.",
  "Concentre-se no processo, não no resultado."
];

export const DashboardView = () => {
  const { 
    kpiData, weeklyChartData, setCurrentView, 
    countdown, setCountdown, userLevel, userName,
    tasks, subjects, sessions, schoolSchedule 
  } = useContext(FocusContext);

  const [quote, setQuote] = useState("");
  const [modalType, setModalType] = useState(null); 
  const [form, setForm] = useState({ date: '', title: '' });
  const [timeDiff, setTimeDiff] = useState(null);

  // Inicializa frase
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // --- LÓGICA DE RANK CORRIGIDA ---
  const currentRank = getRank(userLevel.level);
  const xpNext = getXP(userLevel.level);
  const progressPercent = Math.min(100, (userLevel.currentXP / xpNext) * 100);
  
  // Encontrar o próximo rank na lista
  // RANKS é ordenado do maior nível para o menor (ex: 50, 30, 20...)
  const currentRankIndex = RANKS.findIndex(r => r.m === currentRank.m);
  const nextRankObj = currentRankIndex > 0 ? RANKS[currentRankIndex - 1] : null;
  
  // --- LÓGICA DE TEMPO PARA META (Com Horas/Minutos) ---
  useEffect(() => {
    if (countdown.date) {
      const target = new Date(countdown.date).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff > 0) {
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const months = Math.floor(days / 30);
        
        setTimeDiff({ months, days: days % 30, hours, minutes, totalDays: days });
      } else {
        setTimeDiff(null);
      }
    }
  }, [countdown.date, modalType]);

  const handleGoalClick = () => {
    if (!countdown.date) {
      setForm({ date: '', title: '' });
      setModalType('EDIT_GOAL');
    } else {
      setModalType('VIEW_GOAL');
    }
  };

  // --- PROXIMAS TAREFAS ---
  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => !t.completed).slice(0, 3);
  }, [tasks]);

  // --- HEATMAP (CONSISTÊNCIA) ---
  const heatMapData = useMemo(() => { 
      const d = []; 
      const end = new Date(); 
      // Pega os últimos 35 dias para caber no card pequeno
      const start = new Date();
      start.setDate(end.getDate() - 34);

      for (let c = new Date(start); c <= end; c.setDate(c.getDate() + 1)) {
          d.push({ 
            date: new Date(c), 
            hasStudy: sessions.some(s => new Date(s.date).toDateString() === c.toDateString()) 
          }); 
      }
      return d; 
  }, [sessions]);

  // --- AULAS DO DIA (SCHOOL SCHEDULE) ---
  const todaysClasses = useMemo(() => {
    const dayOfWeek = new Date().getDay(); // 0 = Domingo, 1 = Segunda...
    // O schoolSchedule usa chaves 1..6 (Segunda..Sábado) ou similar. 
    // Ajuste: Se for Domingo (0), não tem aula geralmente.
    if (dayOfWeek === 0) return [];
    
    const lessons = schoolSchedule[dayOfWeek] || [];
    
    // Mapeia IDs ou objetos para a matéria completa
    return lessons.map((lesson, index) => {
        const subId = typeof lesson === 'object' ? lesson.subjectId : lesson;
        const subject = subjects.find(s => s.id === Number(subId));
        return subject ? { ...subject, period: index + 1 } : null;
    }).filter(Boolean);
  }, [schoolSchedule, subjects]);

  return (
    <div className="animate-fadeIn pb-24 md:pb-0">
      
      {/* === HEADER === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {userName ? `Olá, ${userName}!` : 'Bem-vindo ao Focus'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            "{quote}"
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* === BENTO GRID LAYOUT === */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. PLAYER CARD (RANK & XP) - Design Limpo */}
        <div className="md:col-span-8 group relative">
          <Card className="h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden relative shadow-lg">
             {/* Gradient Background Suave */}
            <div className={`absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br ${currentRank.b} opacity-10 blur-[80px] rounded-full pointer-events-none`} />
            
            <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 h-full">
              {/* Avatar do Rank */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentRank.b} p-[2px] shadow-lg`}>
                  <div className="w-full h-full rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                    <currentRank.i size={36} className={`${currentRank.c}`} />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  Lvl. {userLevel.level}
                </div>
              </div>

              {/* Status e Barra */}
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{userLevel.title}</h2>
                    <p className="text-zinc-500 text-sm">Próximo Rank: <span className="text-primary font-bold">{nextRankObj ? `Nível ${nextRankObj.m}` : 'Máximo Alcançado'}</span></p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">{userLevel.currentXP} <span className="text-sm text-zinc-400 font-medium">/ {xpNext} XP</span></p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full bg-gradient-to-r ${currentRank.b} transition-all duration-1000 relative`} 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2 sm:hidden">{userLevel.currentXP} / {xpNext} XP</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 2. BOTÃO FOCAR (CTA) */}
        <div className="md:col-span-4">
          <button 
            onClick={() => setCurrentView('focus')}
            className="w-full h-full min-h-[180px] relative overflow-hidden rounded-3xl group transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl shadow-primary/20 hover:shadow-primary/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[50px] rounded-full group-hover:bg-white/30 transition-all" />
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white">
              <div className="p-4 bg-white/20 rounded-full mb-4 backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform duration-300">
                <Zap size={40} className="fill-current" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Modo Foco</h2>
              <p className="text-primary-light/90 text-sm font-medium">Iniciar Sessão Profunda</p>
            </div>
          </button>
        </div>

        {/* 3. KPI CARDS */}
        <div className="md:col-span-4">
          <Card className="h-full flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-colors border-l-4 border-l-primary">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tempo Hoje</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{kpiData.todayMinutes} <span className="text-sm font-medium text-zinc-500">min</span></p>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-4">
           <Card className="h-full flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-colors border-l-4 border-l-orange-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                <Flame size={24} className={kpiData.streak > 0 ? "animate-pulse" : ""} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sequência</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{kpiData.streak} <span className="text-sm font-medium text-zinc-500">dias</span></p>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-4">
           <Card className="h-full flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-colors border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <InfinityIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Geral</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{kpiData.totalHours} <span className="text-sm font-medium text-zinc-500">horas</span></p>
              </div>
            </div>
          </Card>
        </div>

        {/* 4. GRÁFICO SEMANAL */}
        <div className="md:col-span-8">
          <Card className="h-full min-h-[320px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-primary"/> Performance Semanal
              </h3>
            </div>
            <div className="flex-1 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1100ab" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1100ab" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="minutos" 
                    stroke="#1100ab" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorMin)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 5. SIDEBAR DIREITA */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Card de Meta (Design Clean & Tempo Preciso) */}
          <Card 
            onClick={handleGoalClick}
            className={`cursor-pointer group hover:border-primary/50 transition-all relative overflow-hidden bg-white dark:bg-zinc-900 ${!countdown.date ? 'border-dashed border-2' : ''}`}
          >
            {!countdown.date ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Flag size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">Definir Meta Principal</p>
              </div>
            ) : (
              <div className="relative z-10 p-2">
                 <div className="flex justify-between items-start mb-4">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-zinc-900 dark:text-white">
                        <Flag size={20} />
                    </div>
                    <ArrowRight size={18} className="text-zinc-400 group-hover:text-primary transition-colors" />
                 </div>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Próximo Marco</p>
                 <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate mb-2">{countdown.title}</h3>
                 
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{timeDiff ? timeDiff.totalDays : 0}</span>
                    <span className="text-sm text-zinc-500">dias restantes</span>
                 </div>
                 {timeDiff && (
                   <p className="text-xs text-zinc-400 mt-1">
                      {timeDiff.hours}h {timeDiff.minutes}m para o fim
                   </p>
                 )}
              </div>
            )}
          </Card>

          {/* ROADMAP DE CONSISTÊNCIA (Substituindo Foco Principal) */}
          <Card className="flex-1 min-h-[180px]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                 <Calendar size={16} className="text-green-500" /> Consistência
               </h3>
               <span className="text-xs font-bold text-zinc-400">Últimos 35 dias</span>
             </div>
             <div className="grid grid-cols-7 gap-2">
                {heatMapData.map((d, i) => (
                    <div 
                      key={i} 
                      title={`${d.date.toLocaleDateString()}: ${d.hasStudy ? 'Estudou' : 'Sem registro'}`} 
                      className={`aspect-square rounded-md transition-all ${d.hasStudy ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                    />
                ))}
             </div>
             <p className="text-xs text-zinc-400 mt-4 text-center">Mantenha os quadrados verdes!</p>
          </Card>

          {/* NOVA SEÇÃO: Aulas de Hoje (Grade) */}
          <Card className="flex-1">
             <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
               <BookOpen size={16} className="text-blue-500" /> Aulas de Hoje
             </h3>
             <div className="space-y-2">
               {todaysClasses.length > 0 ? (
                 todaysClasses.map((sub, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <span className="text-xs font-bold text-zinc-400 w-4">{sub.period}º</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">{sub.name}</span>
                    </div>
                 ))
               ) : (
                 <div className="text-center py-4 text-zinc-500 text-xs italic">
                    Sem aulas registradas para hoje.
                 </div>
               )}
               {todaysClasses.length > 0 && (
                 <button onClick={() => setCurrentView('school')} className="w-full mt-2 text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1">
                    Ver Grade Completa <ChevronRight size={12}/>
                 </button>
               )}
             </div>
          </Card>

          {/* Próximas Tarefas */}
          <Card>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <CheckCircle size={16} className="text-emerald-500" /> Pendências
            </h3>
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => {
                    const sub = subjects.find(s => s.id === task.subjectId);
                    return (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub?.color || '#555' }} />
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate flex-1">{task.text}</p>
                        </div>
                    )
                })
              ) : (
                <p className="text-xs text-zinc-500 italic py-4 text-center">Tudo feito! Adicione tarefas no Foco.</p>
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* === MODAL DETALHES DA META === */}
      <Modal isOpen={modalType === 'VIEW_GOAL'} onClose={() => setModalType(null)} title="Contagem Regressiva">
        <div className="text-center space-y-6 py-4">
            <div>
                <p className="text-zinc-500 text-sm font-bold uppercase mb-2">Seu objetivo</p>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    {countdown.title}
                </h2>
                <p className="text-zinc-400 text-sm mt-2">{new Date(countdown.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-4">
                {[
                    { l: 'Meses', v: timeDiff?.months || 0 },
                    { l: 'Dias', v: timeDiff?.days || 0 },
                    { l: 'Horas', v: timeDiff?.hours || 0 },
                    { l: 'Min', v: timeDiff?.minutes || 0 },
                ].map((item, i) => (
                    <div key={i} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">{item.v}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{item.l}</span>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                <Button variant="secondary" onClick={() => { setModalType('EDIT_GOAL'); setForm(countdown); }} className="flex-1">Editar</Button>
                <Button onClick={() => setModalType(null)} className="flex-1">Fechar</Button>
            </div>
        </div>
      </Modal>

      {/* === MODAL EDITAR META (Com Time Input) === */}
      <Modal isOpen={modalType === 'EDIT_GOAL'} onClose={() => setModalType(null)} title="Configurar Meta">
         <form onSubmit={e => { e.preventDefault(); setCountdown({ date: form.date, title: form.title || "Minha Meta" }); setModalType(null); }} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Nome da Meta</label>
            <input type="text" placeholder="Ex: Vestibular, Concurso..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Data e Hora Alvo</label>
            <input 
                type="datetime-local" 
                required 
                className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" 
                value={form.date} 
                onChange={e => setForm({ ...form, date: e.target.value })} 
            />
            <p className="text-[10px] text-zinc-500 mt-1">Defina o dia e a hora exata da entrega ou prova.</p>
          </div>
          <div className="pt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setCountdown({ date: null, title: '' }); setModalType(null); }} className="flex-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Remover Meta</Button>
            <Button type="submit" className="flex-[2]">Salvar Meta</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};