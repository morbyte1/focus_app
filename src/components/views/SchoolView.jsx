import React, { useContext, useState, useMemo, useEffect } from 'react';
import { 
    GraduationCap, Plus, Calendar, Clock, Trash2, FileText, CheckCircle, Send, ClipboardCheck, 
    AlertOctagon, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Minus 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// === SUB-COMPONENTES NOVOS (FALTAS E CALENDÁRIO) ===

const AbsencesTab = ({ subjects, schoolAbsences, deleteAbsenceRecord, setIsAddAbsenceModalOpen }) => {
    const stats = useMemo(() => {
        const map = {}; 
        let totalLost = 0;

        // Mapa para motivos (Novo Gráfico)
        const reasonMap = {};

        schoolAbsences.forEach(record => {
            // Contagem por Matéria
            Object.entries(record.lessons).forEach(([subId, count]) => {
                if (count > 0) {
                    map[subId] = (map[subId] || 0) + count;
                    totalLost += count;
                }
            });

            // Contagem por Motivo (Ponderado pelas aulas perdidas no dia)
            const dailyLost = Object.values(record.lessons).reduce((a, b) => a + b, 0);
            if (dailyLost > 0) {
                reasonMap[record.reason] = (reasonMap[record.reason] || 0) + dailyLost;
            }
        });

        // 1. Dados Gráfico Matérias
        const sortedSubs = Object.entries(map)
            .map(([id, count]) => ({ id: Number(id), count }))
            .sort((a, b) => b.count - a.count);

        const critical = sortedSubs.length > 0 ? subjects.find(s => s.id === sortedSubs[0].id) : null;
        const criticalCount = sortedSubs.length > 0 ? sortedSubs[0].count : 0;
        
        const subIdsWithAbsences = new Set(sortedSubs.map(s => s.id));
        const perfectSubs = subjects.filter(s => !subIdsWithAbsences.has(s.id));
        const best = perfectSubs.length > 0 
            ? perfectSubs[0] 
            : (sortedSubs.length > 0 ? subjects.find(s => s.id === sortedSubs[sortedSubs.length - 1].id) : null);

        // ATUALIZADO: Base de cálculo alterada para 1200 aulas
        const globalRate = Math.max(0, 100 - ((totalLost / 1200) * 100)).toFixed(1); 

        const chartData = sortedSubs.map(item => {
            const sub = subjects.find(s => s.id === item.id);
            return { name: sub?.name || '?', value: item.count, color: sub?.color || '#555' };
        });

        // 2. Dados Gráfico Motivos (Novo)
        const REASON_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        const reasonChartData = Object.entries(reasonMap)
            .map(([reason, count], index) => ({
                name: reason,
                value: count,
                color: REASON_COLORS[index % REASON_COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { totalLost, critical, criticalCount, best, globalRate, chartData, reasonChartData };
    }, [schoolAbsences, subjects]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-red-500 bg-red-500/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Matéria Crítica</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{stats.critical?.name || "Nenhuma"}</h3>
                    <p className="text-sm text-red-500 font-medium">{stats.criticalCount} aulas perdidas</p>
                </Card>
                <Card className="border-l-4 border-emerald-500 bg-emerald-500/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Melhor Presença</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{stats.best?.name || "Todas"}</h3>
                    <p className="text-sm text-emerald-500 font-medium">Exemplar!</p>
                </Card>
                <Card className="border-l-4 border-blue-500 bg-blue-500/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Taxa Global (Est.)</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{stats.globalRate}%</h3>
                    <p className="text-sm text-blue-500 font-medium">Base: 1200 aulas/ano</p>
                </Card>
            </div>

            {/* Layout atualizado para suportar dois gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[250px] flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center gap-2"><PieChartIcon size={18} className="text-primary"/> Distribuição por Matéria</h3>
                    <div className="flex-1 min-h-[200px]">
                        {stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {stats.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sem faltas registradas.</div>}
                    </div>
                </Card>

                {/* Novo Gráfico de Motivos */}
                <Card className="min-h-[250px] flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center gap-2"><AlertOctagon size={18} className="text-orange-500"/> Motivos Recorrentes</h3>
                    <div className="flex-1 min-h-[200px]">
                        {stats.reasonChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.reasonChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {stats.reasonChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sem dados suficientes.</div>}
                    </div>
                </Card>
            </div>

            {/* Seção de Registro movida para baixo */}
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-left flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <AlertOctagon size={24} className="text-zinc-400"/>
                    </div>
                    <div>
                        <p className="text-zinc-900 dark:text-white font-bold">Gerenciar Faltas</p>
                        <p className="text-zinc-500 text-sm">Mantenha seu registro atualizado.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddAbsenceModalOpen(true)} className="w-full md:w-auto"><Plus size={18}/> Registrar Nova Falta</Button>
            </div>

            <div>
                <h3 className="text-zinc-900 dark:text-white font-bold mb-4">Histórico Recente</h3>
                <div className="space-y-3">
                    {schoolAbsences.length === 0 ? <p className="text-zinc-500 italic text-sm">Nenhum registro.</p> : 
                    [...schoolAbsences].sort((a,b) => new Date(b.date) - new Date(a.date)).map(record => (
                        <div key={record.id} className="bg-white dark:bg-[#09090b] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center hover:border-red-500/30 transition-colors group">
                            <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    <span className="text-zinc-400 font-normal text-xs">• {record.reason}</span>
                                </p>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    {Object.entries(record.lessons).filter(([,c]) => c > 0).map(([sId, count]) => {
                                        const sub = subjects.find(s => s.id === Number(sId));
                                        return (
                                            <span key={sId} className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                {count}x {sub?.name}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <button onClick={() => deleteAbsenceRecord(record.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CalendarTab = ({ subjects, schoolWorks, schoolAbsences }) => {
    const [date, setDate] = useState(new Date());
    const [selectedDayInfo, setSelectedDayInfo] = useState(null); 

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });

    const handleDayClick = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const works = schoolWorks.filter(w => w.dueDate === dateStr);
        const absence = schoolAbsences.find(a => a.date === dateStr);
        // ATUALIZADO: Sempre define o objeto, mesmo se vazio, para mostrar a data selecionada
        setSelectedDayInfo({ dateStr, works, absence });
    };

    // ATUALIZADO: Auto-selecionar o dia atual ao montar o componente
    useEffect(() => {
        const today = new Date();
        // Apenas se o calendário estiver exibindo o mês/ano corrente (comportamento padrão)
        if (today.getMonth() === month && today.getFullYear() === year) {
            handleDayClick(today.getDate());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col md:flex-row gap-6 animate-fadeIn h-full">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6 bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white capitalize flex items-center gap-2">
                        <Calendar size={20} className="text-primary"/> {monthName} <span className="text-zinc-400">{year}</span>
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => setDate(new Date(year, month - 1))} className="p-2 hover:bg-white dark:hover:bg-black rounded-xl transition-colors"><ChevronLeft size={20}/></button>
                        <button onClick={() => setDate(new Date(year, month + 1))} className="p-2 hover:bg-white dark:hover:bg-black rounded-xl transition-colors"><ChevronRight size={20}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-center text-xs font-bold text-zinc-400 py-2">{d}</span>)}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const works = schoolWorks.filter(w => w.dueDate === dateStr);
                        const absence = schoolAbsences.find(a => a.date === dateStr);
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                        return (
                            <button key={day} onClick={() => handleDayClick(day)} className={`h-14 md:h-20 rounded-2xl border transition-all flex flex-col items-start justify-between p-2 relative ${isToday ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] hover:border-zinc-300 dark:hover:border-zinc-700'} ${selectedDayInfo?.dateStr === dateStr ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-black' : ''}`}>
                                <span className={`text-sm font-bold ${absence ? 'text-red-500 underline decoration-red-500 decoration-2' : 'text-zinc-700 dark:text-zinc-300'}`}>{day}</span>
                                <div className="flex flex-wrap gap-1 w-full">
                                    {works.map((w, idx) => idx <= 2 ? <div key={w.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === w.subjectId)?.color || '#555' }} /> : null)}
                                    {works.length > 3 && <span className="text-[8px] text-zinc-400">+</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="w-full md:w-80 space-y-4">
                {selectedDayInfo ? (
                    <Card className="animate-fadeIn bg-primary/5 border-primary/20">
                        {/* ATUALIZADO: Botão de fechar removido */}
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white capitalize">{new Date(selectedDayInfo.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                        </div>
                        
                        {selectedDayInfo.absence ? (
                            <div className="mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <p className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1"><AlertOctagon size={12}/> Falta Registrada</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-1">{selectedDayInfo.absence.reason}</p>
                                <p className="text-xs text-zinc-500">{Object.entries(selectedDayInfo.absence.lessons).filter(([,c]) => c > 0).map(([id, c]) => `${c}x ${subjects.find(sub => sub.id === Number(id))?.name}`).join(', ')}</p>
                            </div>
                        ) : (
                            <div className="mb-4 text-center py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                                <p className="text-xs text-zinc-400 font-bold uppercase">Presença OK</p>
                            </div>
                        )}

                        {selectedDayInfo.works.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Trabalhos do Dia</p>
                                {selectedDayInfo.works.map(w => (
                                    <div key={w.id} className="bg-white dark:bg-black p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm shadow-sm">
                                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === w.subjectId)?.color }}/> <span className="text-xs text-zinc-500 font-bold uppercase">{subjects.find(s => s.id === w.subjectId)?.name}</span></div>
                                        <p className="font-bold text-zinc-900 dark:text-white truncate mb-1">{w.title}</p>
                                        <p className="text-xs text-zinc-500 line-clamp-2">{w.description || "Sem descrição."}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-4">
                                <p className="text-xs text-zinc-400">Nenhum trabalho para este dia.</p>
                             </div>
                        )}
                    </Card>
                ) : (
                    // Estado vazio (tecnicamente inalcançável se o useEffect funcionar e o usuário não navegar para meses vazios, mas mantido por segurança)
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400">
                        <Calendar size={32} className="mb-2 opacity-50"/>
                        <p className="text-sm">Selecione um dia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// === VIEW PRINCIPAL ===

export const SchoolView = () => {
  const { subjects, schoolWorks, addWork, updateWork, deleteWork, schoolAbsences, addAbsenceRecord, deleteAbsenceRecord } = useContext(FocusContext);
  
  // States da view original
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null); 
  const [form, setForm] = useState({ subjectId: "", title: "", dueDate: "", description: "" });

  // States das novas abas
  const [activeTab, setActiveTab] = useState('works');
  const [isAddAbsenceModalOpen, setIsAddAbsenceModalOpen] = useState(false);
  const [absForm, setAbsForm] = useState({ date: new Date().toISOString().split('T')[0], reason: "Doença / Médico", counts: {} });

  // --- LÓGICA ORIGINAL RESTAURADA ---
  const statusConfig = {
    pending: { label: 'Pendente', icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200' },
    done: { label: 'Feito', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    delivered: { label: 'Entregue', icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    corrected: { label: 'Corrigido', icon: ClipboardCheck, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  };

  const getUrgency = (dateString, status) => {
    if (status === 'delivered' || status === 'corrected') return { label: "Entregue", color: "text-zinc-400", border: "border-zinc-200 dark:border-zinc-800", bg: "bg-zinc-100" };
    if (status === 'done') return { label: "Pronto", color: "text-emerald-500", border: "border-emerald-500", bg: "bg-emerald-500/10" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString + 'T00:00:00');
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Atrasado", color: "text-red-500", border: "border-red-500 animate-pulse", bg: "bg-red-500/10" };
    if (diffDays === 0) return { label: "É Hoje!", color: "text-red-600", border: "border-red-600 animate-pulse", bg: "bg-red-600/10" };
    if (diffDays === 1) return { label: "Amanhã", color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-500/10" };
    if (diffDays <= 3) return { label: `${diffDays} dias`, color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-500/10" };
    if (diffDays <= 7) return { label: `${diffDays} dias`, color: "text-yellow-500", border: "border-yellow-500", bg: "bg-yellow-500/10" };
    
    return { label: `${diffDays} dias`, color: "text-emerald-500", border: "border-zinc-200 dark:border-zinc-800", bg: "bg-emerald-500/10" };
  };

  const sortedWorks = [...schoolWorks].sort((a, b) => {
    const score = (status) => status === 'pending' ? 0 : status === 'done' ? 1 : 2;
    if (score(a.status) !== score(b.status)) return score(a.status) - score(b.status);
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (form.subjectId && form.title && form.dueDate) {
      addWork(form.subjectId, form.title, form.dueDate, form.description);
      setForm({ subjectId: "", title: "", dueDate: "", description: "" });
      setIsAddModalOpen(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedWork) return;
    const updates = { status: newStatus };
    if (newStatus !== 'corrected') updates.grade = null;
    updateWork(selectedWork.id, updates);
    setSelectedWork(prev => ({ ...prev, ...updates }));
  };

  const handleGradeChange = (val) => {
    const num = parseFloat(val);
    updateWork(selectedWork.id, { grade: isNaN(num) ? null : num });
    setSelectedWork(prev => ({ ...prev, grade: isNaN(num) ? null : num }));
  };

  // --- LÓGICA NOVAS ABAS ---
  const updateAbsCount = (subId, delta) => {
    setAbsForm(prev => {
        const current = prev.counts[subId] || 0;
        const next = Math.max(0, current + delta);
        return { ...prev, counts: { ...prev.counts, [subId]: next } };
    });
  };

  const handleAbsenceSubmit = (e) => {
    e.preventDefault();
    const total = Object.values(absForm.counts).reduce((a, b) => a + b, 0);
    if (total === 0) return alert("Selecione pelo menos uma aula perdida.");
    addAbsenceRecord(absForm.date, absForm.reason, absForm.counts);
    setAbsForm({ date: new Date().toISOString().split('T')[0], reason: "Doença / Médico", counts: {} });
    setIsAddAbsenceModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0 h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Escola & Acadêmico</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Gestão completa de tarefas e presença.</p>
        </div>
        
        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex gap-1">
            {[
                { id: 'works', label: 'Trabalhos', icon: GraduationCap },
                { id: 'absences', label: 'Faltas', icon: AlertOctagon },
                { id: 'calendar', label: 'Calendário', icon: Calendar },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1">
          {activeTab === 'works' && (
              <div className="space-y-4">
                  {/* Botão Novo mantido dentro da aba Works para preservar layout */}
                  <div className="flex justify-end">
                       <Button onClick={() => setIsAddModalOpen(true)} className="py-1.5 px-3 text-xs"><Plus size={16}/> Novo Trabalho</Button>
                  </div>

                  {sortedWorks.length === 0 ? (
                    <div className="text-center py-12 opacity-50">
                        <GraduationCap size={48} className="mx-auto mb-3 text-zinc-400" />
                        <p className="text-zinc-500">Nenhum trabalho registrado.</p>
                    </div>
                    ) : (
                        sortedWorks.map(work => {
                            const subject = subjects.find(s => s.id === work.subjectId);
                            const urgency = getUrgency(work.dueDate, work.status);
                            const stConfig = statusConfig[work.status] || statusConfig.pending;
                            const isPending = work.status === 'pending';
                            const badgeLabel = isPending ? urgency.label : stConfig.label;
                            const BadgeIcon = isPending ? Clock : stConfig.icon;
                            const badgeColor = isPending ? urgency.color : stConfig.color;
                            const badgeBg = isPending ? urgency.bg : stConfig.bg;
                            const badgeBorder = isPending ? urgency.border : stConfig.border;

                            return (
                                <Card 
                                    key={work.id} 
                                    onClick={() => setSelectedWork(work)}
                                    className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group border-l-4 ${urgency.border.replace('animate-pulse', '')}`}
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span 
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider"
                                                    style={{ backgroundColor: subject?.color || '#71717a' }}
                                                >
                                                    {subject?.name || 'Geral'}
                                                </span>
                                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(work.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <h3 className={`text-lg font-bold truncate ${work.status === 'corrected' || work.status === 'delivered' ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                                {work.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase border ${badgeColor} ${badgeBg} ${badgeBorder} shadow-sm`}>
                                                <BadgeIcon size={14} /> {badgeLabel}
                                            </div>
                                            {work.grade !== null && work.grade !== undefined && (
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white mt-1">
                                                    Nota: {work.grade}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
              </div>
          )}

          {activeTab === 'absences' && <AbsencesTab subjects={subjects} schoolAbsences={schoolAbsences} deleteAbsenceRecord={deleteAbsenceRecord} setIsAddAbsenceModalOpen={setIsAddAbsenceModalOpen} />}
          {activeTab === 'calendar' && <CalendarTab subjects={subjects} schoolWorks={schoolWorks} schoolAbsences={schoolAbsences} />}
      </div>

      {/* === MODAIS ORIGINAIS (WORKS) === */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Trabalho">
        <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label>
                <select 
                    required 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.subjectId}
                    onChange={e => setForm({ ...form, subjectId: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Título</label>
                <input 
                    required 
                    type="text" 
                    placeholder="Ex: Redação..." 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                />
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Data de Entrega</label>
                <input 
                    required 
                    type="date" 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Detalhes</label>
                <textarea 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
            </div>
            <Button type="submit" className="w-full mt-2">Salvar</Button>
        </form>
      </Modal>

      {selectedWork && (
          <Modal isOpen={!!selectedWork} onClose={() => setSelectedWork(null)} title="Gerenciar Trabalho">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === selectedWork.subjectId)?.color || '#555' }}></div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase">
                            {subjects.find(s => s.id === selectedWork.subjectId)?.name || 'Matéria Excluída'}
                        </p>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedWork.title}</h2>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Status Atual</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['pending', 'done', 'delivered', 'corrected'].map((st) => {
                            const conf = statusConfig[st];
                            const isActive = selectedWork.status === st;
                            return (
                                <button
                                    key={st}
                                    onClick={() => handleStatusChange(st)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all
                                        ${isActive 
                                            ? `bg-primary text-white border-primary shadow-lg shadow-primary/20` 
                                            : `bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-primary/50`
                                        }
                                    `}
                                >
                                    <conf.icon size={16} /> {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedWork.status === 'corrected' && (
                    <div className="animate-fadeIn bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl">
                        <label className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase flex items-center gap-2 mb-2">
                            <ClipboardCheck size={14}/> Nota Final
                        </label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 10"
                            className="w-full bg-white dark:bg-black border border-purple-200 dark:border-purple-900/50 rounded-xl p-3 text-2xl font-bold text-center text-purple-700 dark:text-purple-300 outline-none focus:border-purple-500"
                            value={selectedWork.grade === null ? '' : selectedWork.grade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                        />
                    </div>
                )}

                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[80px]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1"><FileText size={10}/> Detalhes</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {selectedWork.description || <span className="text-zinc-400 italic">Sem descrição.</span>}
                    </p>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => { deleteWork(selectedWork.id); setSelectedWork(null); }}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
                    >
                        <Trash2 size={16} /> Excluir Trabalho
                    </button>
                </div>
              </div>
          </Modal>
      )}

      {/* === MODAL DE FALTAS (NOVO) === */}
      <Modal isOpen={isAddAbsenceModalOpen} onClose={() => setIsAddAbsenceModalOpen(false)} title="Registrar Falta">
            <form onSubmit={handleAbsenceSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Data</label>
                        <input type="date" required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2.5 text-zinc-900 dark:text-white outline-none focus:border-primary" value={absForm.date} onChange={e => setAbsForm({...absForm, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Motivo</label>
                        <select className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2.5 text-zinc-900 dark:text-white outline-none focus:border-primary" value={absForm.reason} onChange={e => setAbsForm({...absForm, reason: e.target.value})}>
                            {["Doença / Médico", "Transporte / Trânsito", "Clima / Chuva", "Preguiça / Cansaço", "Atraso", "Evento Familiar", "Outro"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-zinc-500 font-bold uppercase mb-3 text-center">Quantas aulas você perdeu?</p>
                    <div className="space-y-3">
                        {subjects.map(s => (
                            <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}}></div>
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[120px]">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-black rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                                    <button type="button" onClick={() => updateAbsCount(s.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><Minus size={14}/></button>
                                    <span className="w-4 text-center text-sm font-bold text-zinc-900 dark:text-white">{absForm.counts[s.id] || 0}</span>
                                    <button type="button" onClick={() => updateAbsCount(s.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary hover:text-white text-primary transition-colors"><Plus size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center px-2">
                    <span className="text-sm text-zinc-500">Total: <b className="text-zinc-900 dark:text-white">{Object.values(absForm.counts).reduce((a,b)=>a+b,0)} aulas</b></span>
                    <Button type="submit" className="px-8">Confirmar</Button>
                </div>
            </form>
      </Modal>
    </div>
  );
};