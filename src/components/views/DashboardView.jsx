import React, { useContext, useState } from 'react';
import { Zap, Clock, Flame, Flag, BarChart2, Infinity as InfinityIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FocusContext, getXP, getRank } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const DashboardView = () => {
  const { kpiData, weeklyChartData, setCurrentView, countdown, setCountdown, userLevel } = useContext(FocusContext);
  const [modal, setModal] = useState(false); 
  const [form, setForm] = useState({ date: '', title: '' });
  
  const xpNext = getXP(userLevel.level);
  const rank = getRank(userLevel.level);
  
  const daysLeft = countdown.date ? Math.ceil((new Date(countdown.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000) : null;
  const countStyle = daysLeft !== null ? (daysLeft < 0 ? {c:"border-l-red-500 text-red-500", b:"bg-red-500/20 text-red-500"} : daysLeft === 0 ? {c:"border-l-red-500 text-red-500", b:"bg-red-500/20 text-red-500 animate-pulse"} : daysLeft < 7 ? {c:"border-l-orange-500 text-orange-500", b:"bg-orange-500/20 text-orange-500"} : daysLeft < 30 ? {c:"border-l-blue-500 text-blue-500", b:"bg-blue-500/20 text-blue-500"} : {c:"border-l-emerald-500 text-emerald-500", b:"bg-emerald-500/20 text-emerald-500"}) : {c:"border-l-zinc-300 dark:border-l-zinc-700 text-zinc-400 dark:text-zinc-500", b:"bg-zinc-100 dark:bg-zinc-500/20 text-zinc-400 dark:text-zinc-500"};

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      {/* CARTÃO DE NÍVEL / RANK */}
      <Card className="bg-gradient-to-r from-primary to-primary-light dark:from-primary/80 dark:via-[#0a0a0a] dark:to-[#0a0a0a] border-primary/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          <div className="flex-shrink-0 relative">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rank.b} p-[2px]`}>
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center flex-col">
                <rank.i className={`${rank.c} mb-1`} size={28} />
                <span className="text-2xl font-bold text-white">{userLevel.level}</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400">Lvl</div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">{userLevel.title}</h2>
                <p className="text-sm text-zinc-100 dark:text-zinc-400">Total: {userLevel.totalXP.toLocaleString()} XP</p>
              </div>
              <div className="hidden sm:block text-white dark:text-primary-light font-bold">{userLevel.currentXP} <span className="text-zinc-200 dark:text-zinc-500">/ {xpNext} XP</span></div>
            </div>
            <div className="w-full h-4 bg-black/20 dark:bg-zinc-800 rounded-full overflow-hidden border border-white/10 dark:border-zinc-700 relative">
              <div className={`h-full bg-gradient-to-r ${rank.b} transition-all duration-1000`} style={{ width: `${(userLevel.currentXP / xpNext) * 100}%` }} />
              <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]" />
            </div>
            <p className="text-xs text-zinc-200 dark:text-zinc-500 mt-2 text-right sm:hidden">{userLevel.currentXP} / {xpNext} XP</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ l: 'Hoje', v: `${kpiData.todayMinutes} min`, i: Zap, c: 'yellow-500' }, { l: 'Total', v: `${kpiData.totalHours} h`, i: Clock, c: 'primary', ic: 'primary-light' }, { l: 'Sequência', v: `${kpiData.streak} dias`, i: Flame, c: 'orange-500' }].map((x, i) => (
          <Card key={i} className={`flex items-center gap-4 border-l-4 border-l-${x.c}`}>
            <div className={`p-3 bg-${x.c}/20 rounded-full text-${x.ic || x.c}`}><x.i size={24} /></div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{x.l}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{x.v}</p>
            </div>
          </Card>
        ))}
        <Card onClick={() => { setForm(countdown); setModal(true); }} className={`flex items-center gap-4 border-l-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all group ${countStyle.c}`}>
          <div className={`p-3 rounded-full transition-colors ${countStyle.b}`}><Flag size={24} /></div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{daysLeft !== null ? (countdown.title || "Meta") : "Próxima Meta"}</p>
            {daysLeft !== null ? (<p className={`text-2xl font-bold ${daysLeft <= 7 ? 'scale-105 origin-left' : ''} transition-transform`}>{daysLeft === 0 ? "É HOJE!" : daysLeft < 0 ? "Concluído" : `${daysLeft} dias`}</p>) : <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 italic">Definir data...</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[300px]">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-primary" /> Atividade Semanal</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#52525b" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa' }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="minutos" stroke="#1100ab" strokeWidth={3} dot={{ r: 4, fill: '#1100ab' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* CARTÃO TRABALHO PROFUNDO */}
        <Card className="bg-gradient-to-br from-primary to-primary-light dark:from-primary/40 dark:to-[#0a0a0a] border-primary/30 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] group-hover:bg-primary/20 transition-all duration-500"></div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Trabalho Profundo <InfinityIcon size={18} className="text-white dark:text-primary-light" /></h3>
              <p className="text-zinc-100 dark:text-zinc-300 mb-6 italic text-sm border-l-2 border-white/50 dark:border-primary/50 pl-3">"A superficialidade não constrói impérios."</p>
            </div>
            <Button onClick={() => setCurrentView('focus')} className="w-full py-4 text-lg shadow-lg shadow-black/20 dark:shadow-primary/20 hover:shadow-black/40 dark:hover:shadow-primary/40 border border-white/20 dark:border-white/5 bg-white/20 hover:bg-white/30 dark:bg-primary dark:hover:bg-primary-dark text-white">Mergulhar no Foco <Zap size={20} className="fill-current" /></Button>
        </Card>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Configurar Meta">
        <form onSubmit={e => { e.preventDefault(); setCountdown({ date: form.date, title: form.title || "Minha Meta" }); setModal(false); }} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Nome da Meta</label>
            <input type="text" placeholder="Ex: ENEM..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase">Data Alvo</label>
            <input type="date" required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="pt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setCountdown({ date: null, title: '' }); setModal(false); }} className="flex-1">Limpar</Button>
            <Button type="submit" className="flex-[2]">Salvar Data</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};