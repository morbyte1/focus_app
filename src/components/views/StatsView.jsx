import React, { useContext, useMemo } from 'react';
import { BarChart2, Trophy, Clock, CheckSquare, Activity, CheckCircle, AlertTriangle, Calendar, Layers, Infinity as InfinityIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

export const StatsView = () => {
  // ADICIONADO: 'exams' desestruturado do contexto
  const { sessions, subjects, mistakes, themes, advancedStats, exams } = useContext(FocusContext);
  const { monthlyData } = advancedStats;
  
  const activeSubjects = subjects.filter(s => !s.isSchool);

  const totQ = sessions.reduce((a, s) => a + (s.questions || 0), 0);
  const totE = sessions.reduce((a, s) => a + (s.errors || 0), 0);
  
  const perfData = activeSubjects.map(s => { 
      const ss = sessions.filter(x => x.subjectId === s.id);
      const q = ss.reduce((a, c) => a + (c.questions || 0), 0);
      const e = ss.reduce((a, c) => a + (c.errors || 0), 0); 
      return { name: s.name, Questões: q, Erros: e, Acerto: q ? Math.round(((q - e) / q) * 100) : 0, color: s.color }; 
  }).filter(d => d.Questões > 0);
  
  const misReasons = Object.entries(mistakes.reduce((a, m) => ({ ...a, [m.reason]: (a[m.reason] || 0) + 1 }), {})).map(([k, v]) => ({ name: k, quantidade: v }));
  
  const compTopics = activeSubjects.map(s => ({ name: s.name, value: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0), color: s.color })).filter(d => d.value > 0);
  
  const wrnQ = activeSubjects.map(s => ({ name: s.name, value: sessions.filter(x => x.subjectId === s.id).reduce((a, c) => a + (c.errors || 0), 0), color: s.color })).filter(d => d.value > 0);
  
  // --- ROADMAP CORRIGIDO (APENAS DIAS ÚTEIS) ---
  const heat = useMemo(() => { 
      const d = []; 
      const end = new Date(); 
      for (let c = new Date(end.getFullYear(), 0, 1); c <= end; c.setDate(c.getDate() + 1)) {
          // Filtra: se não for Domingo (0) nem Sábado (6)
          if (c.getDay() !== 0 && c.getDay() !== 6) {
              d.push({ 
                date: new Date(c), 
                hasStudy: sessions.some(s => new Date(s.date).toDateString() === c.toDateString()) 
              }); 
          }
      }
      return d; 
  }, [sessions]);
  
  const hi = useMemo(() => {
    if (!activeSubjects.length) return null;
    const agg = activeSubjects.map(s => { const ss = sessions.filter(x => x.subjectId === s.id); return { name: s.name, min: ss.reduce((a, c) => a + c.minutes, 0), q: ss.reduce((a, c) => a + (c.questions || 0), 0), e: ss.reduce((a, c) => a + (c.errors || 0), 0), t: themes.filter(t => t.subjectId === s.id).reduce((a, t) => a + t.items.filter(i => i.completed).length, 0) }; });
    const sMin = [...agg].sort((a, b) => b.min - a.min), sTop = [...agg].sort((a, b) => b.t - a.t), sQ = [...agg].sort((a, b) => b.q - a.q);
    return { ms: sMin[0], ls: sMin[sMin.length - 1], mt: sTop[0], lt: sTop[sTop.length - 1], mq: sQ[0], lq: sQ[sQ.length - 1], mc: [...agg].sort((a, b) => (b.q - b.e) - (a.q - a.e))[0], me: [...agg].sort((a, b) => b.e - a.e)[0] };
  }, [activeSubjects, sessions, themes]);

  // NOVO: Cálculo de estatísticas de provas para os cards
  const examStats = useMemo(() => {
    if (!exams || exams.length === 0) return null;
    
    // Agrupa notas por matéria e calcula tempo
    const subjectGrades = {};
    let totalMinutes = 0;
    let examsWithDuration = 0;

    exams.forEach(exam => {
        // Cálculo do tempo médio
        if (exam.duration) {
            const [h, m] = exam.duration.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                totalMinutes += (h * 60) + m;
                examsWithDuration++;
            }
        }

        if (exam.subjects) {
            exam.subjects.forEach(sub => {
                if (sub.grade && sub.max && sub.subjectId) {
                    if (!subjectGrades[sub.subjectId]) {
                        subjectGrades[sub.subjectId] = { totalObtained: 0, totalMax: 0 };
                    }
                    subjectGrades[sub.subjectId].totalObtained += parseFloat(sub.grade);
                    subjectGrades[sub.subjectId].totalMax += parseFloat(sub.max);
                }
            });
        }
    });

    // Formatação do tempo médio
    const avgMins = examsWithDuration > 0 ? totalMinutes / examsWithDuration : 0;
    const avgH = Math.floor(avgMins / 60);
    const avgM = Math.round(avgMins % 60);
    const formattedAvgTime = `${avgH}h ${avgM}m`;

    const results = Object.entries(subjectGrades).map(([id, stats]) => {
        const subject = subjects.find(s => s.id === Number(id));
        if (!subject) return null;
        const percentage = stats.totalMax > 0 ? (stats.totalObtained / stats.totalMax) * 100 : 0;
        return { name: subject.name, percentage };
    }).filter(Boolean);

    // Se não houver matérias, mas houver tempo, retorna null para best/worst mas manda o tempo
    if (results.length === 0 && examsWithDuration === 0) return null;

    results.sort((a, b) => b.percentage - a.percentage);

    return {
        best: results[0],
        worst: results[results.length - 1],
        avgTime: formattedAvgTime // Novo dado retornado
    };
  }, [exams, subjects]);

  // COMBINAÇÃO: Cria a lista final de cards mesclando estudo e provas
  const displayCards = useMemo(() => {
      const cards = [];
      
      // Cards originais de estudo (se existirem dados)
      if (hi) {
          cards.push(
            { l: 'Mais Estudada', v: hi.ms.name, s: `${Math.round(hi.ms.min / 60)}h`, i: Clock, c: '#1100ab' },
            { l: 'Menos Estudada', v: hi.ls.name, s: `${Math.round(hi.ls.min / 60)}h`, i: Clock, c: 'zinc-500' },
            { l: 'Mais Tópicos', v: hi.mt.name, s: `${hi.mt.t} feitos`, i: CheckSquare, c: 'emerald-500' },
            { l: 'Menos Tópicos', v: hi.lt.name, s: `${hi.lt.t} feitos`, i: CheckSquare, c: 'zinc-500' },
            { l: 'Mais Questões', v: hi.mq.name, s: `${hi.mq.q} total`, i: Activity, c: 'blue-500' },
            { l: 'Menos Questões', v: hi.lq.name, s: `${hi.lq.q} total`, i: Activity, c: 'zinc-500' },
            { l: 'Melhor Precisão', v: hi.mc.name, s: `${hi.mc.q - hi.mc.e} certas`, i: CheckCircle, c: 'emerald-500' },
            { l: 'Mais Erros', v: hi.me.name, s: `${hi.me.e} erros`, i: AlertTriangle, c: 'red-500' }
          );
      }

      // Novos cards de provas (se existirem dados)
      if (examStats) {
          if (examStats.best) {
             cards.push(
                { l: 'Melhor em Provas', v: examStats.best.name, s: `${examStats.best.percentage.toFixed(0)}% aproveitamento`, i: Trophy, c: 'yellow-500' },
                { l: 'Pior em Provas', v: examStats.worst.name, s: `${examStats.worst.percentage.toFixed(0)}% aproveitamento`, i: AlertTriangle, c: 'orange-500' }
             );
          }
          // Card de Tempo Médio
          if (examStats.avgTime) {
             cards.push(
                { l: 'Tempo Médio Provas', v: examStats.avgTime, s: 'estimativa por prova', i: Clock, c: 'blue-400' }
             );
          }
      }

      return cards;
  }, [hi, examStats]);

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
        
        {displayCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            {displayCards.map((x, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full">
                <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1"><x.i size={12} className={`text-${x.c.replace('#', '')}`} /> {x.l}</p>
                <p className="text-zinc-900 dark:text-white font-bold truncate mt-1 text-lg">{x.v}</p>
                <p className={`text-xs text-${x.c.replace('#', '')} mt-1`}>{x.s}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-zinc-500">Estude mais ou registre provas para gerar destaques.</p>}
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px]">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-6 flex items-center gap-2"><Activity size={18} className="text-primary" /> Volume de Questões</h3>
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