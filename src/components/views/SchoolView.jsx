import React, { useContext, useState, useMemo, useEffect } from 'react';
import { 
    GraduationCap, Plus, Calendar, Clock, Trash2, FileText, CheckCircle, Send, ClipboardCheck, 
    AlertOctagon, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Minus, Settings, BookOpen, AlertTriangle 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// === SUB-COMPONENTES NOVOS (FALTAS, CALENDÁRIO, GRADE) ===

// Modal de Configuração da Grade Horária
const ScheduleConfigModal = ({ isOpen, onClose, subjects, schoolSchedule, updateSchoolSchedule }) => {
    const days = [
        { id: 1, name: "Segunda" }, { id: 2, name: "Terça" }, { id: 3, name: "Quarta" },
        { id: 4, name: "Quinta" }, { id: 5, name: "Sexta" }
    ];
    const [addingToDay, setAddingToDay] = useState(null); // ID do dia que está recebendo aula

    const addLesson = (dayId, subjectId) => {
        const current = schoolSchedule[dayId] || [];
        updateSchoolSchedule(dayId, [...current, Number(subjectId)]);
        setAddingToDay(null);
    };

    const removeLesson = (dayId, index) => {
        const current = schoolSchedule[dayId] || [];
        const updated = [...current];
        updated.splice(index, 1);
        updateSchoolSchedule(dayId, updated);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Grade Horária">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
                <p className="text-sm text-zinc-500">Defina suas aulas semanais para calcular os limites de faltas e organizar o calendário.</p>
                
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {days.map(d => (
                        <div key={d.id} className="min-w-[160px] flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 flex flex-col">
                            <h4 className="font-bold text-center text-zinc-900 dark:text-white mb-3 uppercase text-xs tracking-wider">{d.name}</h4>
                            
                            <div className="flex-1 space-y-2 mb-3">
                                {(schoolSchedule[d.id] || []).map((lessonSubId, idx) => {
                                    const sub = subjects.find(s => s.id === lessonSubId);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-black p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs shadow-sm">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub?.color || '#555' }}></div>
                                                <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">{sub?.name || '?'}</span>
                                            </div>
                                            <button onClick={() => removeLesson(d.id, idx)} className="text-zinc-400 hover:text-red-500"><Trash2 size={12}/></button>
                                        </div>
                                    )
                                })}
                                {(schoolSchedule[d.id] || []).length === 0 && <p className="text-center text-zinc-400 text-[10px] italic py-2">Sem aulas</p>}
                            </div>

                            {addingToDay === d.id ? (
                                <div className="animate-fadeIn">
                                    <select 
                                        autoFocus
                                        className="w-full text-xs bg-white dark:bg-black border border-primary rounded-xl p-2 outline-none mb-2"
                                        onChange={(e) => e.target.value && addLesson(d.id, e.target.value)}
                                        onBlur={() => setAddingToDay(null)}
                                        defaultValue=""
                                    >
                                        <option value="">Escolha...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <button onClick={() => setAddingToDay(d.id)} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 text-xs font-bold transition-colors">
                                    + Adicionar
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

const AbsencesTab = ({ subjects, schoolAbsences, schoolSchedule, deleteAbsenceRecord, setIsAddAbsenceModalOpen }) => {
    // Cálculo avançado de estatísticas e limites baseados na Grade Horária
    const stats = useMemo(() => {
        const absencesCountMap = {}; 
        let totalLost = 0;
        const reasonMap = {};

        // 1. Contar Faltas Reais
        schoolAbsences.forEach(record => {
            Object.entries(record.lessons).forEach(([subId, count]) => {
                if (count > 0) {
                    absencesCountMap[subId] = (absencesCountMap[subId] || 0) + count;
                    totalLost += count;
                }
            });
            const dailyLost = Object.values(record.lessons).reduce((a, b) => a + b, 0);
            if (dailyLost > 0) {
                reasonMap[record.reason] = (reasonMap[record.reason] || 0) + dailyLost;
            }
        });

        // 2. Calcular Limites Baseados na Grade (40 Semanas Letivas)
        const SCHOOL_WEEKS = 40;
        const MAX_ABSENCE_PERCENTAGE = 0.25;
        
        // Frequência semanal por matéria
        const weeklyFreq = {};
        Object.values(schoolSchedule).flat().forEach(subId => {
            weeklyFreq[subId] = (weeklyFreq[subId] || 0) + 1;
        });

        // Total de aulas no ano (soma de todas as frequencias * 40)
        const totalAnnualClassesGlobal = Object.values(weeklyFreq).reduce((a, b) => a + b, 0) * SCHOOL_WEEKS;

        // Montar dados de Risco por Matéria
        const riskData = subjects.map(sub => {
            const freq = weeklyFreq[sub.id] || 0;
            const totalAnnual = freq * SCHOOL_WEEKS;
            const limit = Math.floor(totalAnnual * MAX_ABSENCE_PERCENTAGE);
            const current = absencesCountMap[sub.id] || 0;
            const percentageUsed = limit > 0 ? (current / limit) * 100 : 0;
            
            return {
                ...sub,
                freq,
                totalAnnual,
                limit,
                current,
                percentageUsed
            };
        }).filter(d => d.freq > 0).sort((a, b) => b.percentageUsed - a.percentageUsed);

        // Identificar Crítico e Melhor
        const critical = riskData.length > 0 && riskData[0].current > 0 ? riskData[0] : null;
        
        // Taxa Global Real (Baseada na Grade)
        const globalRate = totalAnnualClassesGlobal > 0 
            ? Math.max(0, 100 - ((totalLost / totalAnnualClassesGlobal) * 100)).toFixed(1)
            : "100.0";

        // Gráfico de Pizza (Motivos)
        const REASON_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        const reasonChartData = Object.entries(reasonMap)
            .map(([reason, count], index) => ({
                name: reason,
                value: count,
                color: REASON_COLORS[index % REASON_COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { totalLost, critical, globalRate, riskData, reasonChartData, totalAnnualClassesGlobal };
    }, [schoolAbsences, subjects, schoolSchedule]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-red-500 bg-red-500/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Risco Crítico</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{stats.critical?.name || "Nenhuma"}</h3>
                    <p className="text-sm text-red-500 font-medium">
                        {stats.critical ? `${stats.critical.current} / ${stats.critical.limit} faltas` : "Tudo sob controle"}
                    </p>
                </Card>
                <Card className="border-l-4 border-blue-500 bg-blue-500/5">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Frequência Global</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{stats.globalRate}%</h3>
                    <p className="text-sm text-blue-500 font-medium">Base: {stats.totalAnnualClassesGlobal} aulas/ano</p>
                </Card>
                <Card className="border-l-4 border-orange-500 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10 transition-colors" onClick={() => setIsAddAbsenceModalOpen(true)}>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Ação Rápida</p>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Plus size={20}/> Registrar</h3>
                    <p className="text-sm text-orange-500 font-medium">Adicionar falta</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monitor de Risco (Barra de Progresso) */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-500"/> Monitor de Risco (Limite 25%)
                        </h3>
                        <div className="space-y-5">
                            {stats.riskData.length === 0 ? (
                                <p className="text-center text-zinc-400 text-sm py-10">Configure sua Grade Horária para ver os limites de faltas.</p>
                            ) : (
                                stats.riskData.map(d => {
                                    const percentage = Math.min(100, (d.current / d.limit) * 100);
                                    let barColor = 'bg-emerald-500';
                                    if (percentage >= 75) barColor = 'bg-red-500';
                                    else if (percentage >= 50) barColor = 'bg-yellow-500';

                                    return (
                                        <div key={d.id}>
                                            <div className="flex justify-between items-end mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{d.name}</span>
                                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{d.freq} aulas/sem</span>
                                                </div>
                                                <span className={`text-xs font-bold ${percentage >= 75 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                    {d.current} / {d.limit} ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* Gráfico de Motivos */}
                <Card className="min-h-[300px] flex flex-col">
                    <h3 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center gap-2"><AlertOctagon size={18} className="text-orange-500"/> Motivos</h3>
                    <div className="flex-1 min-h-[200px]">
                        {stats.reasonChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.reasonChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {stats.reasonChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '10px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sem dados.</div>}
                    </div>
                </Card>
            </div>

            {/* Lista Histórico */}
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

const CalendarTab = ({ subjects, schoolWorks, schoolAbsences, schoolSchedule }) => {
    const [date, setDate] = useState(new Date());
    const [selectedDayInfo, setSelectedDayInfo] = useState(null); 

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });

    const handleDayClick = (day) => {
        const dateObj = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const works = schoolWorks.filter(w => w.dueDate === dateStr);
        const absence = schoolAbsences.find(a => a.date === dateStr);
        
        // Lógica de Grade Diária
        const dayOfWeek = dateObj.getDay(); // 0 (Dom) a 6 (Sab)
        const dailyScheduleIds = (dayOfWeek >= 1 && dayOfWeek <= 5) ? schoolSchedule[dayOfWeek] : [];
        const dailyLessons = dailyScheduleIds.map(id => subjects.find(s => s.id === id)).filter(Boolean);

        setSelectedDayInfo({ dateStr, works, absence, dailyLessons, dayOfWeek });
    };

    useEffect(() => {
        const today = new Date();
        if (today.getMonth() === month && today.getFullYear() === year) {
            handleDayClick(today.getDate());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

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
                    <Card className="animate-fadeIn bg-primary/5 border-primary/20 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white capitalize">{new Date(selectedDayInfo.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                        </div>
                        
                        {/* Seção 1: Faltas */}
                        {selectedDayInfo.absence ? (
                            <div className="mb-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <p className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1"><AlertOctagon size={12}/> Falta Registrada</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-1">{selectedDayInfo.absence.reason}</p>
                                <p className="text-xs text-zinc-500">{Object.entries(selectedDayInfo.absence.lessons).filter(([,c]) => c > 0).map(([id, c]) => `${c}x ${subjects.find(sub => sub.id === Number(id))?.name}`).join(', ')}</p>
                            </div>
                        ) : null}

                        {/* Seção 2: Grade Horária do Dia (NOVO) */}
                        <div className="mb-4 flex-1">
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1"><BookOpen size={12}/> Aulas do Dia</p>
                            {selectedDayInfo.dailyLessons && selectedDayInfo.dailyLessons.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedDayInfo.dailyLessons.map((sub, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-black/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                            <span className="text-[10px] text-zinc-400 font-mono w-4">{idx + 1}º</span>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }}></div>
                                            <span className="text-sm text-zinc-900 dark:text-white font-medium">{sub.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                                    <p className="text-xs text-zinc-400 italic">
                                        {[0,6].includes(selectedDayInfo.dayOfWeek) ? "Final de Semana" : "Sem aulas na grade."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Seção 3: Trabalhos */}
                        {selectedDayInfo.works.length > 0 && (
                            <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                                <p className="text-xs font-bold text-zinc-500 uppercase">Entregas</p>
                                {selectedDayInfo.works.map(w => (
                                    <div key={w.id} className="bg-white dark:bg-black p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm shadow-sm">
                                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === w.subjectId)?.color }}/> <span className="text-xs text-zinc-500 font-bold uppercase">{subjects.find(s => s.id === w.subjectId)?.name}</span></div>
                                        <p className="font-bold text-zinc-900 dark:text-white truncate mb-1">{w.title}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ) : (
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
  const { 
    subjects, schoolWorks, addWork, updateWork, deleteWork, 
    schoolAbsences, addAbsenceRecord, deleteAbsenceRecord,
    schoolSchedule, updateSchoolSchedule 
  } = useContext(FocusContext);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false); // Modal da Grade
  const [selectedWork, setSelectedWork] = useState(null); 
  const [form, setForm] = useState({ subjectId: "", title: "", dueDate: "", description: "" });

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
        
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsScheduleModalOpen(true)} className="py-2 text-xs">
                <Settings size={16}/> Grade Horária
            </Button>
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
                        <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1">
          {activeTab === 'works' && (
              <div className="space-y-4">
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

          {activeTab === 'absences' && <AbsencesTab subjects={subjects} schoolAbsences={schoolAbsences} schoolSchedule={schoolSchedule} deleteAbsenceRecord={deleteAbsenceRecord} setIsAddAbsenceModalOpen={setIsAddAbsenceModalOpen} />}
          {activeTab === 'calendar' && <CalendarTab subjects={subjects} schoolWorks={schoolWorks} schoolAbsences={schoolAbsences} schoolSchedule={schoolSchedule} />}
      </div>

      {/* === MODAL DE GRADE HORÁRIA === */}
      <ScheduleConfigModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        subjects={subjects} 
        schoolSchedule={schoolSchedule}
        updateSchoolSchedule={updateSchoolSchedule}
      />

      {/* === MODAL DE TRABALHOS (CÓDIGO ORIGINAL MANTIDO) === */}
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

      {/* === MODAL DE DETALHES DO TRABALHO === */}
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