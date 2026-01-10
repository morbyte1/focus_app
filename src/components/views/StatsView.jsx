import React, { useContext, useMemo } from 'react';
import { BarChart2, Trophy, Clock, CheckSquare, Activity, CheckCircle, AlertTriangle, Calendar, Layers, Infinity as InfinityIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

export const StatsView = () => {
  const { sessions, subjects, mistakes, themes, advancedStats } = useContext(FocusContext);
  const { monthlyData } = advancedStats;
  
  const totQ = sessions.reduce((a, s) => a + (s.questions || 0), 0);
  const totE = sessions.reduce((a, s) => a + (s.errors || 0), 0);
  
  const perfData = subjects.map(s => { 
      const ss = sessions.filter(x => x.subjectId === s.id);
      const q = ss.reduce((a, c) => a + (c.questions || 0), 0);
      const e = ss.reduce((a, c) => a + (c.errors || 0), 0); 
      return { name: s.name, Questões: q, Erros: e, Acerto: q ? Math.round(((q - e) / q) * 100) : 0, color: s.color }; 
  }).filter(d => d.Questões > 0);
  
  const misReasons = Object.entries(mistakes.reduce((a, m) => ({ ...a, [m.reason]: (a[m.reason] || 0) + 1 }), {})).map(([k, v]) => ({ name: k, quantidade: v }));
  
  const compTopics = subjects.map(s => ({ name: s.name, value: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0), color: s.color })).filter(d => d.value > 0);
  
  const wrnQ = subjects.map(s => ({ name: s.name, value: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + (c.errors || 0), 0), color: s.color })).filter(d => d.value > 0);
  
  const heat = useMemo(() => { 
      const d = []; 
      const end = new Date(); 
      for (let c = new Date(end.getFullYear(), 0, 1); c <= end; c.setDate(c.getDate() + 1)) {
          d.push({ date: new Date(c), hasStudy: sessions.some(s => new Date(s.date).toDateString() === c.toDateString()) }); 
      }
      return d; 
  }, [sessions]);
  
  const hi = useMemo(() => {
    if (!subjects.length) return null;
    const agg = subjects.map(s => { const ss = sessions.filter(x => x.subjectId === s.id); return { name: s.name, min: ss.reduce((a, c) => a + c.minutes, 0), q: ss.reduce((a, c) => a + (c.questions || 0), 0), e: ss.reduce((a, c) => a + (c.errors || 0), 0), t: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0) }; });
    const sMin = [...agg].sort((a, b) => b.min - a.min), sTop = [...agg].sort((a, b) => b.t - a.t), sQ = [...agg].sort((a, b) => b.q - a.q);
    return { ms: sMin[0], ls: sMin[sMin.length - 1], mt: sTop[0], lt: sTop[sTop.length - 1], mq: sQ[0], lq: sQ[sQ.length - 1], mc: [...agg].sort((a, b) => (b.q - b.e) - (a.q - a.e))[0], me: [...agg].sort((a, b) => b.e - a.e)[0] };
  }, [subjects, sessions, themes]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Central de Dados</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ l: 'Tempo Total', v: `${(sessions.reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1)}h`, c: '#1100ab' }, { l: 'Questões', v: totQ, c: 'blue-500' }, { l: 'Precisão Global', v: `${totQ > 0 ? Math.round(((totQ - totE) / totQ) * 100) : 0}%`, c: 'emerald-500' }, { l: 'Tópicos Feitos', v: themes.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0), c: 'yellow-500' }].map((x, i) => (
          <Card key={i} className={`flex flex-col gap-1 border-l-4 border-l-[${x.c}]`}>
            <span className="text-xs text-zinc-500 uppercase font-bold">{x.l}</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{x.v}</span>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Destaques de Performance</h3>
        {hi ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            {[ 
               { l: 'Mais Estudada', v: hi.ms.name, s: `${Math.round(hi.ms.min / 60)}h`, i: Clock, c: '#1100ab' },
               { l: 'Menos Estudada', v: hi.ls.name, s: `${Math.round(hi.ls.min / 60)}h`, i: Clock, c: 'zinc-500' },
               { l: 'Mais Tópicos', v: hi.mt.name, s: `${hi.mt.t} feitos`, i: CheckSquare, c: 'emerald-500' },
               { l: 'Menos Tópicos', v: hi.lt.name, s: `${hi.lt.t} feitos`, i: CheckSquare, c: 'zinc-500' },
               { l: 'Mais Questões', v: hi.mq.name, s: `${hi.mq.q} total`, i: Activity, c: 'blue-500' },
               { l: 'Menos Questões', v: hi.lq.name, s: `${hi.lq.q} total`, i: Activity, c: 'zinc-500' },
               { l: 'Melhor Precisão', v: hi.mc.name, s: `${hi.mc.q - hi.mc.e} certas`, i: CheckCircle, c: 'emerald-500' },
               { l: 'Mais Erros', v: hi.me.name, s: `${hi.me.e} erros`, i: AlertTriangle, c: 'red-500' }
            ].map((x, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full">
                <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><x.i size={12} className={`text-${x.c.replace('#', '')}`} /> {x.l}</p>
                <p className="text-zinc-900 dark:text-white font-bold truncate mt-1 text-lg">{x.v}</p>
                <p className={`text-xs text-${x.c.replace('#', '')} mt-1`}>{x.s}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-zinc-500">Estude mais para gerar destaques.</p>}
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><Activity size={18} className="text-[#1100ab]" /> Volume de Questões</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#52525b" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} axisLine={false} />
                <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="Questões" fill="#1100ab" radius={[4, 4, 0, 0]} name="Feitas" />
                <Bar dataKey="Erros" fill="#ef4444" radius={[4, 4, 0, 0]} name="Erros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><Calendar size={18} className="text-blue-500" /> Atividade Mensal</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#52525b" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} interval={2} axisLine={false} />
                <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><Layers size={18} className="text-purple-500" /> Tópicos Finalizados</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {compTopics.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={compTopics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {compTopics.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-zinc-500 text-sm">Nenhum tópico concluído.</p>}
          </div>
        </Card>
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Questões Erradas por Matéria</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {wrnQ.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={wrnQ} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {wrnQ.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-zinc-500 text-sm">Sem registros de erros.</p>}
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Ranking de Motivos de Erro</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={misReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#52525b" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#555" tick={{ fontSize: 10 }} width={100} />
                <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="quantidade" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <Card>
        <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2"><InfinityIcon size={18} className="text-yellow-500" /> Roadmap de Consistência</h3>
        <div className="flex flex-wrap gap-1">
          {heat.map((d, i) => (
            <div key={i} title={`${d.date.toLocaleDateString()}: ${d.hasStudy ? 'Estudou' : 'Sem registro'}`} className={`w-3 h-3 rounded-sm transition-all hover:scale-125 ${d.hasStudy ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-300 dark:bg-zinc-800'}`}></div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">Cada quadrado representa um dia deste ano.</p>
      </Card>
    </div>
  );
};