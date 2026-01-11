import React, { useContext, useState, useMemo } from 'react';
import { 
    GraduationCap, Plus, Calendar as CalendarIcon, Clock, Trash2, 
    FileText, CheckCircle, Send, ClipboardCheck, AlertOctagon, 
    PieChart as PieChartIcon, ChevronLeft, ChevronRight, X, Minus 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// === SUB-COMPONENTES PARA ORGANIZAR O CÓDIGO ===

// 1. ABA DE TRABALHOS (Reaproveitada e Otimizada)
const WorksTab = ({ subjects, schoolWorks, updateWork, deleteWork, setIsAddWorkModalOpen, setSelectedWork }) => {
    
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

    return (
        <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-zinc-500 uppercase">Lista de Tarefas</h3>
                <Button onClick={() => setIsAddWorkModalOpen(true)} className="py-1.5 px-3 text-xs"><Plus size={16}/> Novo Trabalho</Button>
            </div>
            
            {sortedWorks.length === 0 ? (
                <div className="text-center py-12 opacity-50 bg-white dark:bg-[#09090b] rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <GraduationCap size={48} className="mx-auto mb-3 text-zinc-400" />
                    <p className="text-zinc-500">Nenhum trabalho registrado.</p>
                </div>
            ) : (
                sortedWorks.map(work => {
                    const subject = subjects.find(s => s.id === work.subjectId);
                    const urgency = getUrgency(work.dueDate, work.status);
                    const stConfig = statusConfig[work.status] || statusConfig.pending;
                    const isPending = work.status === 'pending';
                    
                    return (
                        <Card key={work.id} onClick={() => setSelectedWork(work)} className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group border-l-4 ${urgency.border.replace('animate-pulse', '')}`}>
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider" style={{ backgroundColor: subject?.color || '#71717a' }}>
                                            {subject?.name || 'Geral'}
                                        </span>
                                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                                            <CalendarIcon size={12} />
                                            {new Date(work.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <h3 className={`text-lg font-bold truncate ${work.status === 'corrected' || work.status === 'delivered' ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>{work.title}</h3>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase border ${isPending ? urgency.color : stConfig.color} ${isPending ? urgency.bg : stConfig.bg} ${isPending ? urgency.border : stConfig.border}`}>
                                        {isPending ? <Clock size={14} /> : <stConfig.icon size={14}/>} {isPending ? urgency.label : stConfig.label}
                                    </div>
                                    {work.grade !== null && <span className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Nota: {work.grade}</span>}
                                </div>
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
    );
};

// 2. ABA DE FALTAS (Dashboard Completo)
const AbsencesTab = ({ subjects, schoolAbsences, deleteAbsenceRecord, setIsAddAbsenceModalOpen }) => {
    // Cálculos de KPI
    const stats = useMemo(() => {
        const map = {}; // { subjectId: totalLessons }
        let totalLost = 0;

        schoolAbsences.forEach(record => {
            Object.entries(record.lessons).forEach(([subId, count]) => {
                if (count > 0) {
                    map[subId] = (map[subId] || 0) + count;
                    totalLost += count;
                }
            });
        });

        const sortedSubs = Object.entries(map)
            .map(([id, count]) => ({ id: Number(id), count }))
            .sort((a, b) => b.count - a.count);

        const critical = sortedSubs.length > 0 ? subjects.find(s => s.id === sortedSubs[0].id) : null;
        const criticalCount = sortedSubs.length > 0 ? sortedSubs[0].count : 0;
        
        // Melhor presença: Matéria com 0 faltas ou a que tem menos
        const subIdsWithAbsences = new Set(sortedSubs.map(s => s.id));
        const perfectSubs = subjects.filter(s => !subIdsWithAbsences.has(s.id));
        const best = perfectSubs.length > 0 
            ? perfectSubs[0] 
            : (sortedSubs.length > 0 ? subjects.find(s => s.id === sortedSubs[sortedSubs.length - 1].id) : null);

        const globalRate = Math.max(0, 100 - ((totalLost / 1000) * 100)).toFixed(1); // Base 1000 aulas

        // Data Chart
        const chartData = sortedSubs.map(item => {
            const sub = subjects.find(s => s.id === item.id);
            return { name: sub?.name || '?', value: item.count, color: sub?.color || '#555' };
        });

        return { totalLost, critical, criticalCount, best, globalRate, chartData };
    }, [schoolAbsences, subjects]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPIs */}
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
                    <p className="text-sm text-blue-500 font-medium">Base: 1000 aulas/ano</p>
                </Card>
            </div>

            {/* Gráfico e Botão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="min-h-[250px] flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center gap-2"><PieChartIcon size={18}/> Distribuição</h3>
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

                <div className="flex flex-col gap-4">
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center flex-1">
                        <AlertOctagon size={40} className="text-zinc-400 mb-2"/>
                        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-4">Faltou hoje? Registre agora.</p>
                        <Button onClick={() => setIsAddAbsenceModalOpen(true)} className="w-full"><Plus size={18}/> Registrar Falta</Button>
                    </div>
                </div>
            </div>

            {/* Histórico Recente */}
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

// 3. ABA CALENDÁRIO (Visualização Unificada)
const CalendarTab = ({ subjects, schoolWorks, schoolAbsences, setIsAddAbsenceModalOpen }) => {
    const [date, setDate] = useState(new Date());
    const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { dateStr, works: [], absence: null }

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });

    const handleDayClick = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const works = schoolWorks.filter(w => w.dueDate === dateStr);
        const absence = schoolAbsences.find(a => a.date === dateStr);

        if (works.length > 0 || absence) {
            setSelectedDayInfo({ dateStr, works, absence });
        } else {
            setSelectedDayInfo(null);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 animate-fadeIn h-full">
            <div className="flex-1">
                {/* Header Calendário */}
                <div className="flex items-center justify-between mb-6 bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white capitalize flex items-center gap-2">
                        <CalendarIcon size={20} className="text-primary"/> {monthName} <span className="text-zinc-400">{year}</span>
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => setDate(new Date(year, month - 1))} className="p-2 hover:bg-white dark:hover:bg-black rounded-xl transition-colors"><ChevronLeft size={20}/></button>
                        <button onClick={() => setDate(new Date(year, month + 1))} className="p-2 hover:bg-white dark:hover:bg-black rounded-xl transition-colors"><ChevronRight size={20}/></button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-center text-xs font-bold text-zinc-400 py-2">{d}</span>)}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const works = schoolWorks.filter(w => w.dueDate === dateStr);
                        const absence = schoolAbsences.find(a => a.date === dateStr);
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                        const hasInfo = works.length > 0 || absence;

                        return (
                            <button 
                                key={day} 
                                onClick={() => handleDayClick(day)}
                                className={`
                                    h-14 md:h-20 rounded-2xl border transition-all flex flex-col items-start justify-between p-2 relative
                                    ${isToday ? 'border-primary bg-primary/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] hover:border-zinc-300 dark:hover:border-zinc-700'}
                                    ${selectedDayInfo?.dateStr === dateStr ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-black' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${absence ? 'text-red-500 underline decoration-red-500 decoration-2' : 'text-zinc-700 dark:text-zinc-300'}`}>{day}</span>
                                
                                <div className="flex flex-wrap gap-1 w-full">
                                    {works.map((w, idx) => {
                                        if (idx > 2) return null; // Limite visual
                                        const sub = subjects.find(s => s.id === w.subjectId);
                                        return <div key={w.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub?.color || '#555' }} title={w.title} />;
                                    })}
                                    {works.length > 3 && <span className="text-[8px] text-zinc-400">+</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Painel Lateral de Detalhes */}
            <div className="w-full md:w-80 space-y-4">
                {selectedDayInfo ? (
                    <Card className="animate-fadeIn bg-primary/5 border-primary/20">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                                {new Date(selectedDayInfo.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </h3>
                            <button onClick={() => setSelectedDayInfo(null)}><X size={16} className="text-zinc-400"/></button>
                        </div>
                        
                        {selectedDayInfo.absence && (
                            <div className="mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <p className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1"><AlertOctagon size={12}/> Falta Registrada</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-1">{selectedDayInfo.absence.reason}</p>
                                <p className="text-xs text-zinc-500">
                                    {Object.entries(selectedDayInfo.absence.lessons).filter(([,c]) => c > 0).map(([id, c]) => {
                                         const s = subjects.find(sub => sub.id === Number(id));
                                         return `${c}x ${s?.name}`;
                                    }).join(', ')}
                                </p>
                            </div>
                        )}

                        {selectedDayInfo.works.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Trabalhos</p>
                                {selectedDayInfo.works.map(w => {
                                    const sub = subjects.find(s => s.id === w.subjectId);
                                    return (
                                        <div key={w.id} className="bg-white dark:bg-black p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color }}/>
                                                <span className="text-xs text-zinc-500">{sub?.name}</span>
                                            </div>
                                            <p className="font-medium text-zinc-900 dark:text-white truncate">{w.title}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400">
                        <CalendarIcon size={32} className="mb-2 opacity-50"/>
                        <p className="text-sm">Selecione um dia com marcação para ver detalhes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// === COMPONENTE PRINCIPAL ===

export const SchoolView = () => {
    const { 
        subjects, schoolWorks, addWork, updateWork, deleteWork,
        schoolAbsences, addAbsenceRecord, deleteAbsenceRecord 
    } = useContext(FocusContext);

    const [activeTab, setActiveTab] = useState('works'); // works, absences, calendar
    
    // Modals States
    const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
    const [isAddAbsenceModalOpen, setIsAddAbsenceModalOpen] = useState(false);
    
    // Selection for Edit
    const [selectedWork, setSelectedWork] = useState(null);

    // Form States
    const [workForm, setWorkForm] = useState({ subjectId: "", title: "", dueDate: "", description: "" });
    const [absForm, setAbsForm] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        reason: "Doença / Médico", 
        counts: {} // { subjectId: count } 
    });

    // Handlers Works
    const handleWorkSubmit = (e) => {
        e.preventDefault();
        if (workForm.subjectId && workForm.title && workForm.dueDate) {
            addWork(workForm.subjectId, workForm.title, workForm.dueDate, workForm.description);
            setWorkForm({ subjectId: "", title: "", dueDate: "", description: "" });
            setIsAddWorkModalOpen(false);
        }
    };

    // Handlers Absences
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

    // Render Tab Content
    const renderContent = () => {
        switch(activeTab) {
            case 'works': 
                return <WorksTab subjects={subjects} schoolWorks={schoolWorks} updateWork={updateWork} deleteWork={deleteWork} setIsAddWorkModalOpen={setIsAddWorkModalOpen} setSelectedWork={setSelectedWork} />;
            case 'absences': 
                return <AbsencesTab subjects={subjects} schoolAbsences={schoolAbsences} deleteAbsenceRecord={deleteAbsenceRecord} setIsAddAbsenceModalOpen={setIsAddAbsenceModalOpen} />;
            case 'calendar': 
                return <CalendarTab subjects={subjects} schoolWorks={schoolWorks} schoolAbsences={schoolAbsences} setIsAddAbsenceModalOpen={setIsAddAbsenceModalOpen} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24 md:pb-0 h-full flex flex-col">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Escola & Acadêmico</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Gestão completa de tarefas e presença.</p>
                </div>
                
                {/* Navegação de Abas */}
                <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex gap-1">
                    {[
                        { id: 'works', label: 'Trabalhos', icon: GraduationCap },
                        { id: 'absences', label: 'Faltas', icon: AlertOctagon },
                        { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
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

            <div className="flex-1">
                {renderContent()}
            </div>

            {/* === MODAL ADD WORK === */}
            <Modal isOpen={isAddWorkModalOpen} onClose={() => setIsAddWorkModalOpen(false)} title="Novo Trabalho">
                <form onSubmit={handleWorkSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label>
                        <select required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={workForm.subjectId} onChange={e => setWorkForm({ ...workForm, subjectId: e.target.value })}>
                            <option value="">Selecione...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Título</label>
                        <input required type="text" placeholder="Ex: Redação..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={workForm.title} onChange={e => setWorkForm({ ...workForm, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Entrega</label>
                        <input required type="date" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={workForm.dueDate} onChange={e => setWorkForm({ ...workForm, dueDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase">Detalhes</label>
                        <textarea className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none" value={workForm.description} onChange={e => setWorkForm({ ...workForm, description: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full mt-2">Salvar</Button>
                </form>
            </Modal>

            {/* === MODAL ADD ABSENCE === */}
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
            
            {/* === MODAL EDIT WORK (Reutilizado logicamente, simplificado visualmente) === */}
            {selectedWork && (
                <Modal isOpen={!!selectedWork} onClose={() => setSelectedWork(null)} title="Gerenciar Trabalho">
                    {/* Conteúdo idêntico ao anterior para gerenciar status/notas */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedWork.title}</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {['Pendente', 'Feito', 'Entregue', 'Corrigido'].map((st) => (
                                <button key={st} onClick={() => { updateWork(selectedWork.id, {status: st, grade: st !== 'corrected' ? null : selectedWork.grade}); setSelectedWork(p => ({...p, status: st})); }} className={`p-2 rounded-xl border text-sm font-bold ${selectedWork.status === st ? 'bg-primary text-white border-primary' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500'}`}>{st}</button>
                            ))}
                        </div>
                        {selectedWork.status === 'Corrigido' && (
                             <input type="number" placeholder="Nota" className="w-full bg-zinc-100 dark:bg-black border rounded-xl p-3 font-bold text-center" value={selectedWork.grade || ''} onChange={(e) => { updateWork(selectedWork.id, {grade: e.target.value}); setSelectedWork(p => ({...p, grade: e.target.value})); }} />
                        )}
                        <button onClick={() => { deleteWork(selectedWork.id); setSelectedWork(null); }} className="w-full py-3 text-red-500 bg-red-500/10 rounded-xl font-bold flex justify-center gap-2"><Trash2 size={18}/> Excluir trabalho</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};