import React, { useContext, useState, useMemo, useEffect } from 'react';
import { 
    GraduationCap, Plus, Calendar, Clock, Trash2, FileText, CheckCircle, Send, ClipboardCheck, 
    AlertOctagon, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Minus, Settings, BookOpen, AlertTriangle, TrendingUp 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

// === CONSTANTES DE CONFIGURAÇÃO ===
const GRADE_THRESHOLDS = {
    WARNING: 6.0,   // Abaixo disso é vermelho
    ATTENTION: 8.0  // Abaixo disso é amarelo, acima é verde
};

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
    
    // NOVO: Função para limpar o dia inteiro
    const clearDay = (dayId) => {
        if(window.confirm("Limpar todas as aulas deste dia?")) {
            updateSchoolSchedule(dayId, []);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Grade Horária">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-sm text-zinc-500">Defina suas aulas para calcular corretamente os riscos de faltas.</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {days.map(d => (
                        <div key={d.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-[200px]">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-zinc-700 dark:text-zinc-300">{d.name}</h4>
                                <button onClick={() => clearDay(d.id)} className="text-xs text-red-400 hover:text-red-500">Limpar</button>
                            </div>
                            
                            <div className="flex-1 space-y-2 mb-3">
                                {(schoolSchedule[d.id] || []).map((sId, idx) => {
                                    const sub = subjects.find(s => s.id === sId);
                                    return (
                                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-black p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs shadow-sm">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub?.color || '#ccc' }}></div>
                                                <span className="truncate max-w-[80px] text-zinc-700 dark:text-zinc-300">{sub?.name || '???'}</span>
                                            </div>
                                            <button onClick={() => removeLesson(d.id, idx)} className="text-zinc-400 hover:text-red-500"><Trash2 size={12}/></button>
                                        </div>
                                    );
                                })}
                                {(!schoolSchedule[d.id] || schoolSchedule[d.id].length === 0) && <p className="text-xs text-zinc-400 text-center py-4">Sem aulas</p>}
                            </div>

                            {addingToDay === d.id ? (
                                <div className="animate-fadeIn space-y-1">
                                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                        {subjects.map(s => (
                                            <button key={s.id} onClick={() => addLesson(d.id, s.id)} className="text-left text-xs p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 truncate">
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setAddingToDay(null)} className="w-full text-xs text-red-500 mt-1">Cancelar</button>
                                </div>
                            ) : (
                                <Button onClick={() => setAddingToDay(d.id)} className="w-full text-xs py-1"><Plus size={12}/> Aula</Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

// Componente Interno: Calendário Escolar
const CalendarTab = ({ schoolWorks, schoolAbsences, schoolSchedule, subjects }) => {
    const today = new Date();
    const [currDate, setCurrDate] = useState(today);
    const [selectedDay, setSelectedDay] = useState(null);

    // Auto-selecionar o dia atual ao carregar
    useEffect(() => {
        const tStr = new Date().toISOString().split('T')[0];
        const works = schoolWorks.filter(w => w.dueDate.split('T')[0] === tStr);
        const absence = schoolAbsences.find(a => a.date === tStr);
        const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Seg...
        const lessons = schoolSchedule[dayOfWeek] || [];
        
        setSelectedDay({
            date: tStr,
            works,
            absence,
            lessons
        });
    }, [schoolWorks, schoolAbsences, schoolSchedule]);

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(currDate.getFullYear(), currDate.getMonth());
    const firstDay = new Date(currDate.getFullYear(), currDate.getMonth(), 1).getDay();

    const handleDayClick = (day) => {
        const d = new Date(currDate.getFullYear(), currDate.getMonth(), day);
        const dStr = d.toISOString().split('T')[0];
        const works = schoolWorks.filter(w => w.dueDate.split('T')[0] === dStr);
        const absence = schoolAbsences.find(a => a.date === dStr);
        const dayOfWeek = d.getDay(); // 0-6
        const lessons = schoolSchedule[dayOfWeek] || [];
        
        setSelectedDay({ date: dStr, works, absence, lessons });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="flex-1 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">
                        {currDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() - 1))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400"><ChevronLeft size={20}/></button>
                        <button onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() + 1))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400"><ChevronRight size={20}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-zinc-400 uppercase">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dStr = new Date(currDate.getFullYear(), currDate.getMonth(), day).toISOString().split('T')[0];
                        const hasWork = schoolWorks.some(w => w.dueDate.split('T')[0] === dStr);
                        const hasAbsence = schoolAbsences.some(a => a.date === dStr);
                        const isSelected = selectedDay?.date === dStr;
                        
                        let classes = "h-14 rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all relative border border-transparent ";
                        if (isSelected) classes += "bg-primary/10 border-primary text-primary ";
                        else classes += "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ";
                        
                        // Lógica visual de Falta: Vermelho + Sublinhado
                        if (hasAbsence) classes += "text-red-500 font-bold underline decoration-2 underline-offset-4 decoration-red-500 ";

                        return (
                            <button key={day} onClick={() => handleDayClick(day)} className={classes}>
                                {day}
                                {hasWork && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Painel Lateral do Calendário */}
            <div className="w-full lg:w-80 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Detalhes do Dia</span>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                            {selectedDay ? new Date(selectedDay.date).toLocaleDateString() : 'Selecione'}
                        </h3>
                    </div>
                    {/* Botão de fechar removido conforme solicitado */}
                </div>
                
                {selectedDay ? (
                    <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        {/* Grade do Dia */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Clock size={14}/> Grade de Aulas</h4>
                            {selectedDay.lessons.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedDay.lessons.map((sId, idx) => {
                                        const sub = subjects.find(s => s.id === sId);
                                        return (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                <span className="text-xs font-mono text-zinc-400 w-4">{idx+1}º</span>
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color }}></div>
                                                <span className="text-sm text-zinc-700 dark:text-zinc-300">{sub?.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : <p className="text-sm text-zinc-400 italic">Sem aulas registradas.</p>}
                        </div>

                        {/* Trabalhos */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><BookOpen size={14}/> Entregas</h4>
                            {selectedDay.works.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedDay.works.map(w => {
                                        const sub = subjects.find(s => s.id === w.subjectId);
                                        return (
                                            <div key={w.id} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub?.color }} />
                                                    <span className="text-xs font-bold text-zinc-500 uppercase">{sub?.name}</span>
                                                </div>
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{w.title}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-sm text-zinc-400 italic">Nada para entregar.</p>}
                        </div>

                        {/* Faltas */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><AlertOctagon size={14}/> Faltas</h4>
                            {selectedDay.absence ? (
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                    <p className="font-bold text-red-700 dark:text-red-400">{selectedDay.absence.reason}</p>
                                    <div className="mt-3 space-y-1">
                                        {Object.entries(selectedDay.absence.lessons).map(([sId, count]) => {
                                            if(count === 0) return null;
                                            const sub = subjects.find(s => s.id === Number(sId));
                                            return (
                                                <div key={sId} className="flex justify-between text-xs text-red-600/80">
                                                    <span>{sub?.name}</span>
                                                    <span>{count} aulas</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : <p className="text-sm text-zinc-400 italic">Presença confirmada.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                        <Calendar size={48} className="mb-4 opacity-20" />
                        <p>Selecione um dia</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente Interno: Painel de Faltas
const AbsencesTab = ({ schoolAbsences, deleteAbsenceRecord, subjects, schoolSchedule }) => {
    // KPI 1: Taxa Global (Base 1200 aulas)
    const totalLost = schoolAbsences.reduce((acc, abs) => {
        return acc + Object.values(abs.lessons).reduce((a, b) => a + b, 0);
    }, 0);
    const globalRate = Math.max(0, 100 - ((totalLost / 1200) * 100)).toFixed(1);

    // KPI 2: Por Matéria
    const bySubject = useMemo(() => {
        const counts = {};
        schoolAbsences.forEach(abs => {
            Object.entries(abs.lessons).forEach(([sId, count]) => {
                counts[sId] = (counts[sId] || 0) + count;
            });
        });
        return Object.entries(counts).map(([id, qtd]) => {
            const sub = subjects.find(s => s.id === Number(id));
            return { name: sub?.name || '?', value: qtd, color: sub?.color || '#ccc', id: Number(id) };
        }).sort((a, b) => b.value - a.value);
    }, [schoolAbsences, subjects]);

    // KPI 3: Por Motivo
    const byReason = useMemo(() => {
        const counts = {};
        schoolAbsences.forEach(abs => {
            counts[abs.reason] = (counts[abs.reason] || 0) + 1;
        });
        const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
        return Object.entries(counts).map(([r, q], i) => ({ name: r, value: q, color: COLORS[i % COLORS.length] }));
    }, [schoolAbsences]);

    const activeSubjects = subjects.filter(s => !s.isSchool);

    return (
        <div className="space-y-6">
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Presença Global</span>
                    <div className="mt-2 flex items-end gap-2">
                        <span className={`text-3xl font-bold ${Number(globalRate) < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{globalRate}%</span>
                        <span className="text-xs text-zinc-400 mb-1">anual</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full ${Number(globalRate) < 75 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${globalRate}%` }} />
                    </div>
                </Card>
                <Card>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Mais Faltas</span>
                    <div className="mt-2">
                        <span className="text-xl font-bold text-zinc-900 dark:text-white truncate block">{bySubject[0]?.name || 'Nenhuma'}</span>
                        <span className="text-sm text-red-500 font-medium">{bySubject[0]?.value || 0} aulas perdidas</span>
                    </div>
                </Card>
                <Card>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Total Acumulado</span>
                    <div className="mt-2">
                        <span className="text-3xl font-bold text-zinc-900 dark:text-white">{totalLost}</span>
                        <span className="text-xs text-zinc-500"> aulas</span>
                    </div>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><PieChartIcon size={18}/> Faltas por Matéria</h3>
                    <div className="flex-1 min-h-[200px]">
                        {bySubject.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={bySubject} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {bySubject.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sem dados</div>}
                    </div>
                </Card>
                <Card className="min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><AlertOctagon size={18}/> Motivos Recorrentes</h3>
                    <div className="flex-1 min-h-[200px]">
                        {byReason.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={byReason} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {byReason.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sem dados</div>}
                    </div>
                </Card>
            </div>

            {/* Monitor de Risco (Limite 25%) */}
            <Card>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={18}/> Risco de Reprovação (Limite 25%)</h3>
                
                {/* AVISO SE A GRADE ESTIVER VAZIA */}
                {Object.keys(schoolSchedule).length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Configure sua <b>Grade Horária</b> (botão de engrenagem no topo) para calcular seus limites de falta corretamente.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeSubjects.map(s => {
                            // 1. Calcular quantas aulas dessa matéria tem na semana
                            let lessonsPerWeek = 0;
                            Object.values(schoolSchedule).forEach(dayLessons => {
                                lessonsPerWeek += dayLessons.filter(id => id === s.id).length;
                            });

                            if (lessonsPerWeek === 0) return null; // Não mostra matérias que não estão na grade

                            // 2. Calcular limite anual (40 semanas letivas)
                            const totalAnnualLessons = lessonsPerWeek * 40;
                            const limitAbsences = Math.floor(totalAnnualLessons * 0.25);
                            
                            // 3. Faltas atuais
                            const currentAbsences = bySubject.find(x => x.id === s.id)?.value || 0;
                            const percentageUsed = (currentAbsences / limitAbsences) * 100;

                            // 4. Cor do risco
                            let barColor = 'bg-emerald-500';
                            if (percentageUsed > 50) barColor = 'bg-yellow-500';
                            if (percentageUsed > 80) barColor = 'bg-red-500';

                            return (
                                <div key={s.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.name}</span>
                                        <span className="text-zinc-500">{currentAbsences} / {limitAbsences} permitidas</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, percentageUsed)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Histórico Recente */}
            <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-3">Histórico Recente</h3>
                <div className="space-y-3">
                    {schoolAbsences.slice().reverse().slice(0, 5).map(abs => (
                        <div key={abs.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 font-bold text-xs">
                                    {new Date(abs.date).getDate()}
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white">{abs.reason}</p>
                                    <p className="text-xs text-zinc-500">
                                        {Object.values(abs.lessons).reduce((a,b)=>a+b,0)} aulas perdidas
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => deleteAbsenceRecord(abs.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SchoolView = () => {
    const { subjects, schoolWorks, addWork, updateWork, deleteWork, schoolAbsences, addAbsenceRecord, deleteAbsenceRecord, schoolSchedule, updateSchoolSchedule } = useContext(FocusContext);
    
    const [activeTab, setActiveTab] = useState('works'); // works, absences, calendar
    const [modalOpen, setModalOpen] = useState(false);
    const [absModalOpen, setAbsModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    
    // Form States
    const [newWork, setNewWork] = useState({ subjectId: subjects[0]?.id, title: '', dueDate: '', description: '', maxGrade: 10 });
    const [absForm, setAbsForm] = useState({ date: new Date().toISOString().split('T')[0], reason: 'Doença', counts: {} });
    const [viewWork, setViewWork] = useState(null);

    // Helpers
    const getUrgency = (date) => {
        const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { color: 'text-red-500', border: 'border-red-500', text: 'Atrasado' };
        if (diff === 0) return { color: 'text-red-500 animate-pulse', border: 'border-red-500', text: 'É Hoje!' };
        if (diff <= 1) return { color: 'text-orange-500', border: 'border-orange-500', text: 'Amanhã' };
        if (diff <= 3) return { color: 'text-yellow-500', border: 'border-yellow-500', text: `${diff} dias` };
        return { color: 'text-emerald-500', border: 'border-zinc-200 dark:border-zinc-800', text: `${diff} dias` };
    };

    // Ordenação de Trabalhos
    const sortedWorks = useMemo(() => {
        return [...schoolWorks].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }, [schoolWorks]);

    // Cálculo de Médias (Grade Stats) - CORRIGIDO
    const gradeStats = useMemo(() => {
        return subjects.map(s => {
            // Pega apenas trabalhos corrigidos desta matéria
            const gradedWorks = schoolWorks.filter(w => w.subjectId === s.id && (w.status === 'corrected' || w.status === 'delivered') && typeof w.grade === 'number');
            
            // PREVENÇÃO DE BUG: Se não houver notas, retorna nulo para não quebrar a conta
            if (gradedWorks.length === 0) return null;

            // Média Aritmética Normalizada (Base 10)
            // Fórmula: (Nota Tirada / Nota Máxima) * 10
            const sum = gradedWorks.reduce((acc, w) => {
                const max = w.maxGrade || 10;
                const normalized = (w.grade / max) * 10;
                return acc + normalized;
            }, 0);
            
            const avg = sum / gradedWorks.length;
            
            return { id: s.id, name: s.name, color: s.color, average: avg };
        })
        .filter(Boolean) // Remove os nulos (matérias sem nota)
        .sort((a, b) => a.average - b.average); // Ordena: piores médias primeiro (alerta)
    }, [subjects, schoolWorks]);

    const updateAbsCount = (sId, delta) => {
        setAbsForm(p => ({ ...p, counts: { ...p.counts, [sId]: Math.max(0, (p.counts[sId] || 0) + delta) } }));
    };

    const handleCreateWork = (e) => {
        e.preventDefault();
        // ENVIA maxGrade PARA O CONTEXTO
        addWork(newWork.subjectId, newWork.title, newWork.dueDate, newWork.description, newWork.maxGrade);
        setModalOpen(false);
        setNewWork({ subjectId: subjects[0]?.id, title: '', dueDate: '', description: '', maxGrade: 10 });
    };

    return (
        <div className="animate-fadeIn pb-24 md:pb-0">
            {/* Header com Navegação */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2"><GraduationCap className="text-primary"/> Escola</h1>
                    <p className="text-zinc-500 text-sm">Gerencie trabalhos, provas e faltas.</p>
                </div>
                <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                    {['works', 'absences', 'calendar'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                            {t === 'works' ? 'Trabalhos' : t === 'absences' ? 'Faltas' : 'Calendário'}
                        </button>
                    ))}
                </div>
                <Button onClick={() => setScheduleModalOpen(true)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 border-none"><Settings size={18}/></Button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            
            {/* 1. ABA TRABALHOS */}
            {activeTab === 'works' && (
                <div className="space-y-6">
                    
                    {/* Painel de Médias Acadêmicas (NOVO) */}
                    {gradeStats.length > 0 ? (
                        <div className="mb-2">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 px-1">Desempenho Acadêmico (Médias)</h3>
                            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                                {gradeStats.map(stat => (
                                    <div key={stat.id} className="min-w-[140px] bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl flex flex-col justify-between shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                            <span className="text-xs font-bold text-zinc-500 truncate">{stat.name}</span>
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <span className={`text-2xl font-bold ${stat.average < GRADE_THRESHOLDS.WARNING ? 'text-red-500' : stat.average < GRADE_THRESHOLDS.ATTENTION ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {stat.average.toFixed(1)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 mb-1">/ 10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                            <p className="text-sm text-zinc-400 italic">Conclua e atribua notas aos seus trabalhos para ver suas médias aqui.</p>
                        </div>
                    )}

                    <Button onClick={() => setModalOpen(true)} className="w-full md:w-auto"><Plus size={18}/> Novo Trabalho</Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedWorks.map(w => {
                            const sub = subjects.find(s => s.id === w.subjectId);
                            const urg = getUrgency(w.dueDate);
                            
                            return (
                                <div key={w.id} onClick={() => setViewWork(w)} className={`bg-white dark:bg-[#09090b] p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg group relative ${w.status === 'pending' ? urg.border : 'border-zinc-200 dark:border-zinc-800 opacity-75'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: sub?.color || '#ccc' }}>{sub?.name}</span>
                                        {w.status === 'pending' && <span className={`text-xs font-bold ${urg.color} flex items-center gap-1`}><Clock size={12}/> {urg.text}</span>}
                                        {w.status === 'completed' && <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><CheckCircle size={12}/> Feito</span>}
                                        {w.status === 'delivered' && <span className="text-xs font-bold text-purple-500 flex items-center gap-1"><Send size={12}/> Entregue</span>}
                                        {w.status === 'corrected' && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><ClipboardCheck size={12}/> Corrigido</span>}
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{w.title}</h3>
                                    <p className="text-xs text-zinc-500 mb-3">{new Date(w.dueDate).toLocaleDateString()}</p>
                                    
                                    {/* Exibição da Nota no Card */}
                                    {w.status === 'corrected' && typeof w.grade === 'number' && (
                                        <div className="mt-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 flex justify-between items-center">
                                            <span className="text-xs font-bold text-zinc-500 uppercase">Nota</span>
                                            <div className="flex items-end gap-1">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-white">{w.grade}</span>
                                                <span className="text-xs text-zinc-400 mb-1">/ {w.maxGrade || 10}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. ABA FALTAS */}
            {activeTab === 'absences' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Controle de Faltas</h2>
                        <Button onClick={() => setAbsModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white"><Plus size={18}/> Registrar Falta</Button>
                    </div>
                    <AbsencesTab schoolAbsences={schoolAbsences} deleteAbsenceRecord={deleteAbsenceRecord} subjects={subjects} schoolSchedule={schoolSchedule} />
                </div>
            )}

            {/* 3. ABA CALENDÁRIO */}
            {activeTab === 'calendar' && (
                <div className="h-[600px]">
                    <CalendarTab schoolWorks={schoolWorks} schoolAbsences={schoolAbsences} schoolSchedule={schoolSchedule} subjects={subjects} />
                </div>
            )}

            {/* MODAIS */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Trabalho">
                <form onSubmit={handleCreateWork} className="space-y-4">
                    <div>
                        <label className="text-sm text-zinc-500">Matéria</label>
                        <select className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={newWork.subjectId} onChange={e => setNewWork({ ...newWork, subjectId: e.target.value })}>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-zinc-500">Título</label>
                        <input required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={newWork.title} onChange={e => setNewWork({ ...newWork, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-zinc-500">Data Entrega</label>
                            <input required type="date" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={newWork.dueDate} onChange={e => setNewWork({ ...newWork, dueDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm text-zinc-500">Valor da Atividade</label>
                            {/* Input com min="1" para evitar divisão por zero */}
                            <input type="number" min="1" required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={newWork.maxGrade} onChange={e => setNewWork({ ...newWork, maxGrade: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-zinc-500">Sobre o trabalho</label>
                        <textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white h-24" value={newWork.description} onChange={e => setNewWork({ ...newWork, description: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full">Criar</Button>
                </form>
            </Modal>

            <Modal isOpen={!!viewWork} onClose={() => setViewWork(null)} title="Detalhes">
                {viewWork && (
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase">Status</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {['pending', 'completed', 'delivered', 'corrected'].map(s => (
                                    <button key={s} onClick={() => updateWork(viewWork.id, { status: s })} className={`px-3 py-1 rounded-full text-xs font-bold border ${viewWork.status === s ? 'bg-primary text-white border-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}>
                                        {s === 'pending' && 'Pendente'}
                                        {s === 'completed' && 'Feito'}
                                        {s === 'delivered' && 'Entregue'}
                                        {s === 'corrected' && 'Corrigido'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {viewWork.status === 'corrected' && (
                            <div className="animate-fadeIn p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nota Obtida (de 0 a {viewWork.maxGrade || 10})</label>
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full mt-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white font-bold text-lg" 
                                    value={viewWork.grade || ''} 
                                    onChange={e => updateWork(viewWork.id, { grade: Number(e.target.value) })} 
                                    placeholder="Digite a nota..."
                                />
                            </div>
                        )}

                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase">Descrição</span>
                            <p className="mt-1 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl">{viewWork.description || 'Sem descrição.'}</p>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <button onClick={() => { deleteWork(viewWork.id); setViewWork(null); }} className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-2"><Trash2 size={16}/> Excluir Trabalho</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={absModalOpen} onClose={() => setAbsModalOpen(false)} title="Registrar Falta">
                <form onSubmit={e => { e.preventDefault(); if(Object.values(absForm.counts).some(v=>v>0)) { addAbsenceRecord(absForm.date, absForm.reason, absForm.counts); setAbsModalOpen(false); setAbsForm({ date: new Date().toISOString().split('T')[0], reason: 'Doença', counts: {} }); } }} className="space-y-4">
                    <div>
                        <label className="text-sm text-zinc-500">Data</label>
                        <input required type="date" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={absForm.date} onChange={e => setAbsForm({ ...absForm, date: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-500">Motivo</label>
                        <select className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-zinc-900 dark:text-white" value={absForm.reason} onChange={e => setAbsForm({ ...absForm, reason: e.target.value })}>
                            {['Doença', 'Transporte', 'Clima', 'Preguiça', 'Atraso', 'Evento Familiar', 'Outro'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <label className="text-sm text-zinc-500 mb-2 block">Aulas Perdidas</label>
                        <div className="space-y-2">
                            {subjects.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}/>
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
                        <Button type="submit" className="px-8">Salvar</Button>
                    </div>
                </form>
            </Modal>

            <ScheduleConfigModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} subjects={subjects} schoolSchedule={schoolSchedule} updateSchoolSchedule={updateSchoolSchedule} />
        </div>
    );
};