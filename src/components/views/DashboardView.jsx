import React, { useContext, useState, useEffect, useMemo } from 'react';
import { 
  Zap, Clock, Flame, Flag, BarChart2, 
  Infinity as InfinityIcon, ArrowRight, CheckCircle, 
  Trophy, Calendar, Target, Sparkles, ChevronRight 
} from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FocusContext, getXP, getRank } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// Banco de Frases Motivacionais (Estoicismo & Disciplina)
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
    tasks, subjects, advancedStats 
  } = useContext(FocusContext);

  const [quote, setQuote] = useState("");
  const [modalType, setModalType] = useState(null); // 'EDIT_GOAL' or 'VIEW_GOAL'
  const [form, setForm] = useState({ date: '', title: '' });
  const [timeDiff, setTimeDiff] = useState(null);

  const xpNext = getXP(userLevel.level);
  const rank = getRank(userLevel.level);
  const progressPercent = Math.min(100, (userLevel.currentXP / xpNext) * 100);

  // Inicializa frase aleatória
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // Cálculo detalhado do tempo para a meta
  useEffect(() => {
    if (countdown.date) {
      const target = new Date(countdown.date).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff > 0) {
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

  // Handler para clique no card de meta
  const handleGoalClick = () => {
    if (!countdown.date) {
      setForm({ date: '', title: '' });
      setModalType('EDIT_GOAL');
    } else {
      setModalType('VIEW_GOAL');
    }
  };

  // Filtra as próximas 3 tarefas pendentes
  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => !t.completed).slice(0, 3);
  }, [tasks]);

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

        {/* 1. PLAYER CARD (RANK & XP) - Coluna Larga */}
        <div className="md:col-span-8 group relative">
          <Card className="h-full bg-zinc-900 dark:bg-black border-zinc-800 p-0 overflow-hidden relative border-0 shadow-2xl">
            {/* Background Effects */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br ${rank.b} opacity-20 blur-[100px] rounded-full pointer-events-none group-hover:opacity-30 transition-opacity duration-700`} />
            
            <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center gap-8 h-full">
              {/* Avatar do Rank */}
              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${rank.b} p-[3px] shadow-lg shadow-black/50`}>
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                    <rank.i size={40} className={`${rank.c} relative z-10`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-zinc-800 text-white text-xs font-bold px-3 py-1 rounded-full border border-zinc-700 shadow-lg">
                  Lvl. {userLevel.level}
                </div>
              </div>

              {/* Status e Barra */}
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{userLevel.title}</h2>
                    <p className="text-zinc-400 text-sm">Próximo Rank: <span className="text-zinc-300 font-bold">{rank.m ? 'Em breve' : 'Máximo'}</span></p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-3xl font-black text-white tracking-tighter">{userLevel.currentXP} <span className="text-lg text-zinc-500 font-medium">/ {xpNext} XP</span></p>
                  </div>
                </div>

                {/* Barra de Progresso Customizada */}
                <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/5 relative backdrop-blur-sm">
                  <div 
                    className={`h-full bg-gradient-to-r ${rank.b} transition-all duration-1000 relative`} 
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-1 bg-white/50 shadow-[0_0_10px_white]" />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2 sm:hidden">{userLevel.currentXP} / {xpNext} XP</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 2. BOTÃO FOCAR (CTA) - Destaque */}
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

        {/* 3. KPI CARDS - Modernizados */}
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

        {/* 4. GRÁFICO SEMANAL - Mais limpo */}
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

        {/* 5. SIDEBAR DIREITA (Metas e Novas Seções) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Card de Meta (Interativo) */}
          <Card 
            onClick={handleGoalClick}
            className={`cursor-pointer group hover:border-primary/50 transition-all relative overflow-hidden ${!countdown.date ? 'border-dashed border-2 bg-transparent' : 'bg-gradient-to-br from-zinc-900 to-black border-zinc-800'}`}
          >
            {!countdown.date ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Flag size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">Definir Meta Principal</p>
              </div>
            ) : (
              <div className="relative z-10 text-white p-2">
                 <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                        <Flag size={20} className="text-white" />
                    </div>
                    <ArrowRight size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                 </div>
                 <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Próximo Marco</p>
                 <h3 className="text-xl font-bold truncate mb-2">{countdown.title}</h3>
                 
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{timeDiff ? timeDiff.totalDays : 0}</span>
                    <span className="text-sm text-zinc-400">dias restantes</span>
                 </div>
              </div>
            )}
          </Card>

          {/* NOVA SEÇÃO: Próximas Tarefas */}
          <Card className="flex-1 min-h-[200px]">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <CheckCircle size={16} className="text-emerald-500" /> A fazer agora
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
              {upcomingTasks.length > 0 && (
                <button onClick={() => setCurrentView('focus')} className="w-full mt-2 text-xs font-bold text-primary hover:text-primary-dark flex items-center justify-center gap-1">
                    Ver todas <ChevronRight size={12}/>
                </button>
              )}
            </div>
          </Card>

          {/* NOVA SEÇÃO: Foco Principal (Assunto mais estudado) */}
          {advancedStats.bestSubject && (
             <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                        <Trophy size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-indigo-500/80 uppercase">Foco Principal</p>
                        <p className="text-lg font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{advancedStats.bestSubject.name}</p>
                        <p className="text-xs text-zinc-500">{Math.round(advancedStats.bestSubject.totalMins / 60)}h dedicadas</p>
                    </div>
                </div>
             </Card>
          )}

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
                <p className="text-zinc-400 text-sm mt-2">{new Date(countdown.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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

      {/* === MODAL EDITAR META === */}
      <Modal isOpen={modalType === 'EDIT_GOAL'} onClose={() => setModalType(null)} title="Configurar Meta">
         <form onSubmit={e => { e.preventDefault(); setCountdown({ date: form.date, title: form.title || "Minha Meta" }); setModalType(null); }} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Nome da Meta</label>
            <input type="text" placeholder="Ex: Vestibular, Concurso..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Data Alvo</label>
            <input type="date" required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="pt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setCountdown({ date: null, title: '' }); setModalType(null); }} className="flex-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Remover Meta</Button>
            <Button type="submit" className="flex-[2]">Salvar Data</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};