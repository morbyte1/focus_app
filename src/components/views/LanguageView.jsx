import React, { useContext, useMemo, useState } from 'react';
import { 
  Globe, ArrowRight, BarChart2, Calendar, Clock, Edit2, RefreshCw, 
  Ear, Eye, Mic, BookOpen, Plus, Trash2, ExternalLink, Flame, Target, 
  Award, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LanguageContext } from '../../context/LanguageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const SKILL_ICONS = {
  'escuta': Ear,
  'leitura': Eye,
  'fala': Mic,
  'escrita': BookOpen
};

const getLevelColor = (level) => {
    const map = {
      'A1': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      'A2': 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20',
      'B1': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'B2': 'bg-blue-600/10 text-blue-600 border-blue-600/20',
      'C1': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'C2': 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return map[level] || map['A1'];
};

const useLanguageStats = (sessions) => {
  return useMemo(() => {
    let totalMinutes = 0;
    let sessionsThisMonth = 0;
    const chartData = [];
    const skillsCount = {};
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = new Date(now);
    today.setHours(0,0,0,0);

    sessions.forEach(s => {
      totalMinutes += s.minutes;
      
      const sDate = new Date(s.date);
      if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
        sessionsThisMonth++;
      }

      // CORREÇÃO: O tempo integral é contabilizado para cada habilidade selecionada
      if (s.skills && Array.isArray(s.skills) && s.skills.length > 0) {
        s.skills.forEach(skill => {
          skillsCount[skill] = (skillsCount[skill] || 0) + s.minutes;
        });
      }
    });

    const currentHours = Math.floor(totalMinutes / 60);
    const hours = currentHours;
    let level, nextLevel, targetHours, progressPercent, hoursRemaining;

    if (hours < 100) {
      level = 'A1'; nextLevel = 'A2'; targetHours = 100;
      hoursRemaining = targetHours - hours;
      progressPercent = (hours / targetHours) * 100;
    } else if (hours < 300) {
      level = 'A2'; nextLevel = 'B1'; targetHours = 300;
      hoursRemaining = targetHours - hours;
      progressPercent = ((hours - 100) / 200) * 100;
    } else if (hours < 600) {
      level = 'B1'; nextLevel = 'B2'; targetHours = 600;
      hoursRemaining = targetHours - hours;
      progressPercent = ((hours - 300) / 300) * 100;
    } else if (hours < 1100) {
      level = 'B2'; nextLevel = 'C1'; targetHours = 1100;
      hoursRemaining = targetHours - hours;
      progressPercent = ((hours - 600) / 500) * 100;
    } else if (hours < 1700) {
      level = 'C1'; nextLevel = 'C2'; targetHours = 1700;
      hoursRemaining = targetHours - hours;
      progressPercent = ((hours - 1100) / 600) * 100;
    } else {
      level = 'C2'; nextLevel = 'MAX'; targetHours = hours;
      hoursRemaining = 0; progressPercent = 100;
    }
    const cefrData = { level, nextLevel, currentHours, targetHours, hoursRemaining, progressPercent };

    const dates = [...new Set(sessions.map(s => new Date(s.date).setHours(0,0,0,0)))].sort((a, b) => a - b);
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let prevDate = null;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    dates.forEach(time => {
        if (!prevDate) {
            tempStreak = 1;
        } else {
            const diffDays = Math.round((time - prevDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        prevDate = time;
    });

    if (prevDate === today.getTime() || prevDate === yesterday.getTime()) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const daySessions = sessions.filter(s => new Date(s.date).toDateString() === dateStr);
      chartData.push({
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        minutes: daySessions.reduce((a, b) => a + b.minutes, 0)
      });
    }

    const skillsData = Object.entries(skillsCount).map(([name, score]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), score }));

    // CORREÇÃO: Fixando Mapa de Calor apenas para 01/01/2026 até 31/12/2026
    const map = new Map();
    sessions.forEach(s => {
        const dStr = s.date.split('T')[0];
        map.set(dStr, (map.get(dStr) || 0) + s.minutes);
    });
    
    const heatmapData = [];
    for (let i = 0; i < 365; i++) {
        const d = new Date(2026, 0, 1);
        d.setDate(d.getDate() + i);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const dy = String(d.getDate()).padStart(2, '0');
        const str = `${yr}-${mo}-${dy}`;
        
        heatmapData.push({
            date: str,
            minutes: map.get(str) || 0
        });
    }

    return { totalMinutes, currentHours, streak: currentStreak, maxStreak, sessionsThisMonth, chartData, skillsData, heatmapData, cefrData };
  }, [sessions]);
};

export const LanguageView = () => {
  const { 
    activeLanguage, setActiveLanguage, 
    activeLanguageSessions, addLanguageSession, deleteLanguageSession,
    getTheme, 
    languageSchedule, updateLanguageScheduleDay,
    languageMaterials, addLanguageMaterial, deleteLanguageMaterial
  } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados de Planejamento (Plan)
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ material: [], minMinutes: 30, skills: [], notes: '' });

  // Estados de Materiais
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', level: 'A1', link: '', instructions: '' });

  // Estados Lançamento Manual
  const [manMod, setManMod] = useState(false);
  const [langForm, setLangForm] = useState({
      date: new Date().toISOString().split('T')[0],
      minutes: '',
      sessionSummary: '',
      skills: [],
      materials: [] 
  });

  const theme = getTheme();
  const stats = useLanguageStats(activeLanguageSessions);
  const currentMaterials = languageMaterials.filter(m => m.languageId === activeLanguage);

  const DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();

  if (!activeLanguage) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn mt-16 md:mt-32">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <Globe size={32} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white text-center mb-2">Seja bem-vindo à aba de idiomas</h2>
        <p className="text-zinc-500 text-center mb-10 max-w-md">Escolha abaixo o idioma que você está aprendendo para destravar sua dashboard e temas exclusivos.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {[
            { id: 'EN', name: 'Inglês', flag: '🇺🇸', color: 'bg-blue-900 hover:bg-blue-800' },
            { id: 'ES', name: 'Espanhol', flag: '🇪🇸', color: 'bg-yellow-600 hover:bg-yellow-500' },
            { id: 'DE', name: 'Alemão', flag: '🇩🇪', color: 'bg-red-800 hover:bg-red-700' }
          ].map(lang => (
            <button key={lang.id} onClick={() => setActiveLanguage(lang.id)} className={`${lang.color} text-white p-10 rounded-3xl transition-transform hover:-translate-y-2 flex flex-col items-center gap-4 shadow-xl shadow-black/10 no-tap-highlight select-none focus:outline-none`}>
              <span className="text-7xl drop-shadow-md">{lang.flag}</span>
              <span className="text-xl font-bold tracking-wide">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const totalMaterialTime = langForm.materials.reduce((acc, m) => acc + (Number(m.minutes) || 0), 0);
  const isMaterialTimePresent = langForm.materials.length > 0 && totalMaterialTime > 0;

  const handleManualSave = (e) => {
    e.preventDefault();
    
    // Soma Automática de Tempo (validação)
    const finalMinutes = isMaterialTimePresent ? totalMaterialTime : Number(langForm.minutes);
    if (!finalMinutes || finalMinutes <= 0) return alert("Preencha a duração.");
    
    const customDate = new Date(langForm.date);
    customDate.setHours(new Date().getHours());
    
    addLanguageSession(finalMinutes, langForm.sessionSummary, langForm.skills, langForm.materials, customDate.toISOString());
    
    setManMod(false);
    setLangForm({ date: new Date().toISOString().split('T')[0], minutes: '', sessionSummary: '', skills: [], materials: [] });
  };

  const handleSaveSchedule = (e) => {
     e.preventDefault();
     if (editingDay !== null) {
         updateLanguageScheduleDay(editingDay, scheduleForm);
         setEditingDay(null);
     }
  };

  // CORREÇÃO: Função para abrir a edição da agenda 
  const openEditSchedule = (day) => {
    setScheduleForm({
        material: Array.isArray(day.material) ? [...day.material] : (day.material ? [{ name: day.material, minutes: '' }] : []),
        minMinutes: day.minMinutes || 30,
        skills: Array.isArray(day.skills) ? [...day.skills] : [],
        notes: day.notes || ''
    });
    setEditingDay(day.dayIndex);
  };

  // --- RENDERIZADORES DE ABAS ---
  const renderDashboard = () => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between h-14 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img">{theme.flag}</span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{theme.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-full font-bold text-sm text-white shadow-sm" style={{ backgroundColor: theme.colors.primary }}>
            Nível {stats.cefrData.level}
          </div>
          <button onClick={() => setActiveLanguage(null)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-bold bg-zinc-200/50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full">
             <RefreshCw size={14}/> Trocar
          </button>
        </div>
      </div>

      <div className="flex flex-row gap-4 w-full overflow-x-auto pb-2 sm:pb-0">
        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sequência</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.streak} dias</span>
        </Card>
        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Horas Totais</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.currentHours}h</span>
        </Card>
        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Target size={16} className="text-green-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sessões (Mês)</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.sessionsThisMonth}</span>
        </Card>
      </div>

      <Card className="p-5 h-[90px] flex flex-col justify-center relative overflow-hidden">
        <div className="flex justify-between items-end mb-2 relative z-10">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats.cefrData.level}</span>
          <span className="text-sm font-medium text-zinc-500">
            {stats.cefrData.nextLevel === 'MAX' ? 'Nível Máximo Alcançado!' : `${stats.cefrData.hoursRemaining} horas restantes para ${stats.cefrData.nextLevel}`}
          </span>
          <span className="font-bold text-zinc-400">{stats.cefrData.nextLevel !== 'MAX' ? stats.cefrData.nextLevel : ''}</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative z-10">
          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(stats.cefrData.progressPercent, 100)}%`, backgroundColor: theme.colors.primary }} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} style={{ color: theme.colors.primary }} />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Foco de Hoje</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
            {(() => {
                const todaysPlan = languageSchedule[todayIndex];
                const hasPlan = todaysPlan && (todaysPlan.material.length > 0 || todaysPlan.skills.length > 0 || todaysPlan.notes);
                
                if (!hasPlan) {
                   return (
                     <>
                        <BookOpen size={32} className="text-zinc-400 mb-3" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum material programado</p>
                        <p className="text-xs text-zinc-500 mt-1">Configure na aba "Plano" para ver sugestões aqui.</p>
                     </>
                   );
                }
                return (
                    <div className="w-full text-left space-y-4">
                        {todaysPlan.material.length > 0 && (
                            <div>
                               <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Material</span>
                               <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {Array.isArray(todaysPlan.material) ? todaysPlan.material.map((mObj, idx) => {
                                      const matName = typeof mObj === 'string' ? mObj : mObj.name;
                                      const matMinutes = typeof mObj === 'object' && mObj.minutes ? ` (${mObj.minutes}m)` : '';
                                      const foundMat = currentMaterials.find(x => x.name === matName);

                                      const content = (
                                          <>
                                              {matName}{matMinutes}
                                              {foundMat && foundMat.link && <ExternalLink size={12} className="inline ml-1 mb-0.5" />}
                                          </>
                                      );

                                      // CORREÇÃO: Transformação do nome do material em âncora se existir link
                                      return foundMat && foundMat.link ? (
                                          <a key={idx} href={foundMat.link} target="_blank" rel="noopener noreferrer" className="text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:text-primary transition-colors underline decoration-dashed underline-offset-4">
                                              {content}{idx < todaysPlan.material.length - 1 ? ',' : ''}
                                          </a>
                                      ) : (
                                          <span key={idx} className="text-zinc-700 dark:text-zinc-300 font-medium text-sm">
                                              {content}{idx < todaysPlan.material.length - 1 ? ',' : ''}
                                          </span>
                                      );
                                  }) : <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm">{todaysPlan.material}</span>}
                               </div>
                            </div>
                        )}

                        {todaysPlan.skills.length > 0 && (
                            <div>
                               <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Habilidades em Foco</span>
                               <div className="flex flex-wrap gap-1 mt-1">
                                  {todaysPlan.skills.map(s => {
                                      const IconComp = SKILL_ICONS[s];
                                      return (
                                          <span key={s} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] px-2 py-1 rounded-md uppercase font-bold flex items-center gap-1">
                                              {IconComp && <IconComp size={10} />} {s}
                                          </span>
                                      );
                                  })}
                               </div>
                            </div>
                        )}

                        {todaysPlan.notes && (
                            <div>
                               <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Notas</span>
                               <p className="text-zinc-600 dark:text-zinc-400 text-xs italic mt-1">"{todaysPlan.notes}"</p>
                            </div>
                        )}
                    </div>
                );
            })()}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Minutos na Semana</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} style={{ fill: theme.colors.primary }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Habilidades</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skillsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#52525b" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20} style={{ fill: theme.colors.primary }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-1 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Consistência Anual</h2>
          <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-max">
              {stats.heatmapData.map((day, idx) => {
                let opacity = 0;
                let isFilled = day.minutes > 0;
                if (isFilled) {
                  if (day.minutes < 30) opacity = 0.4;
                  else if (day.minutes < 60) opacity = 0.7;
                  else opacity = 1;
                }
                return (
                  <div key={idx} title={`${day.date}: ${day.minutes} minutos`} className={`w-3 h-3 rounded-sm flex-shrink-0 transition-colors ${!isFilled ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`} style={isFilled ? { backgroundColor: theme.colors.primary, opacity } : {}} />
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center md:justify-end border-t border-zinc-200/50 dark:border-zinc-800/50 pt-8 gap-4">
        {/* CORREÇÃO: Remoção do botão de Timer, deixando apenas Registro Manual */}
        <button onClick={() => setManMod(true)} className={`px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-transform hover:scale-105 shadow-xl ${theme.classes.button}`}>
            <Plus size={20} /> Lançar Sessão Manual
        </button>
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="text-zinc-400 dark:text-zinc-500" size={24} />
        <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Cronograma Semanal</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {languageSchedule.map(day => (
          <div key={day.dayIndex} className={`bg-white dark:bg-[#000000] p-5 rounded-2xl border transition-all h-fit flex flex-col ${todayIndex === day.dayIndex ? theme.classes.highlight : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'} shadow-sm relative`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className={`font-bold ${todayIndex === day.dayIndex ? theme.classes.text : 'text-zinc-900 dark:text-white'} flex items-center`}>
                {DAYS_OF_WEEK[day.dayIndex]}
                {todayIndex === day.dayIndex && <span className="text-[10px] ml-2 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Hoje</span>}
              </h4>
              <div className="flex gap-2">
                <button onClick={() => openEditSchedule(day)} className="text-zinc-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => {
                  if (window.confirm('Limpar o dia?')) updateLanguageScheduleDay(day.dayIndex, { material: [], minMinutes: 30, skills: [], notes: '' });
                }} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Material</span>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium break-words whitespace-normal">
                  {Array.isArray(day.material) && day.material.length > 0 ? 
                    day.material.map(m => {
                        if (typeof m === 'string') return m;
                        return m.minutes ? `${m.name} (${m.minutes} min)` : m.name;
                    }).join(', ') 
                    : (typeof day.material === 'string' && day.material ? day.material : <span className="italic text-zinc-400 font-normal">Livre</span>)}
                </p>
              </div>
              
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1"><Clock size={12}/> Meta de Tempo</span>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">{day.minMinutes} min</p>
              </div>

              {day.skills.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Habilidades em Foco</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {day.skills.map(s => {
                        const IconComp = SKILL_ICONS[s];
                        return (
                            <span key={s} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] px-2 py-1 rounded-md uppercase font-bold flex items-center gap-1">
                                {IconComp && <IconComp size={10} />} {s}
                            </span>
                        );
                    })}
                  </div>
                </div>
              )}

              {day.notes && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Notas e Metas</span>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs italic leading-relaxed break-words whitespace-normal">"{day.notes}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaterials = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <BookOpen size={20} className={theme.classes.text.split(' ')[0]} /> Meus Materiais
        </h2>
        <Button onClick={() => setIsMaterialModalOpen(true)}><Plus size={18}/> Novo Material</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentMaterials.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <Globe size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 font-medium">Nenhum material adicionado.</p>
            <p className="text-zinc-400 text-sm mt-1">Reúna seus PDFs, sites e livros aqui.</p>
          </div>
        ) : (
          currentMaterials.map(m => (
            <Card key={m.id} className="relative group flex flex-col">
              <button onClick={() => deleteLanguageMaterial(m.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              <div className="mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${getLevelColor(m.level)}`}>Nível {m.level}</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 pr-8">{m.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 mb-4">{m.instructions}</p>
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-bold rounded-xl transition-colors">
                  Acessar Material <ExternalLink size={14} />
                </a>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <History size={20} className={theme.classes.text.split(' ')[0]} /> Histórico Completo
        </h2>
        <Button onClick={() => setManMod(true)}><Plus size={18}/> Sessão Manual</Button>
      </div>

      <div className="space-y-4">
        {activeLanguageSessions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <Clock size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 font-medium">Você ainda não registrou sessões de {theme.name}.</p>
          </div>
        ) : (
          [...activeLanguageSessions].sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
            <Card key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white capitalize">{new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20"><Clock size={12}/> {s.minutes} min</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  {s.materials && Array.isArray(s.materials) && s.materials.length > 0 && (
                    s.materials.map((m, idx) => (
                      <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
                        {m.name} {m.minutes ? `(${m.minutes}m)` : ''}
                      </span>
                    ))
                  )}
                  {typeof s.materials === 'string' && s.materials && (
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium">{s.materials}</span>
                  )}
                  {s.skills && s.skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize font-bold">
                      {SKILL_ICONS[skill] && React.createElement(SKILL_ICONS[skill], { size: 12 })} {skill}
                    </span>
                  ))}
                </div>

                {/* CORREÇÃO: Renderização do novo campo Resumo no histórico */}
                {s.sessionSummary && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50 w-full">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Resumo da Sessão</p>
                     <p className="text-sm text-zinc-600 dark:text-zinc-300 italic whitespace-pre-wrap leading-relaxed">"{s.sessionSummary}"</p>
                  </div>
                )}
              </div>

              <div className="flex self-end sm:self-center">
                <button onClick={() => {
                  if(window.confirm('Excluir esta sessão definitivamente?')) deleteLanguageSession(s.id);
                }} className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl transition-colors">
                  <Trash2 size={18}/>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'plan': return renderPlan();
      case 'materials': return renderMaterials();
      case 'history': return renderHistory();
      default: return renderDashboard();
    }
  };

  const TABS = [
    { id: 'dashboard', label: 'Visão Geral', icon: BarChart2 },
    { id: 'plan', label: 'Plano', icon: Calendar },
    { id: 'materials', label: 'Materiais', icon: BookOpen },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-0 py-6">
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive 
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-md' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
              } `}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {renderContent()}

      {/* --- MODAIS DE NEGÓCIO --- */}
      
      {/* Edição do Plano Semanal */}
      <Modal isOpen={editingDay !== null} onClose={() => setEditingDay(null)} title="Editar Planejamento">
        <form onSubmit={handleSaveSchedule} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Materiais</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentMaterials.map(m => {
                const isSel = scheduleForm.material.some(x => x.name === m.name);
                return (
                  <button type="button" key={m.id} onClick={() => {
                    setScheduleForm(prev => {
                        if(isSel) return {...prev, material: prev.material.filter(x => x.name !== m.name)};
                        return {...prev, material: [...prev.material, { name: m.name, minutes: '' }]};
                    })
                  }} className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${isSel ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>{m.name}</button>
                )
              })}
              {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Nenhum material cadastrado na aba Materiais.</span>}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Meta de Tempo Total do Dia (min)</label>
            <input type="number" required min="1" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={scheduleForm.minMinutes} onChange={e => setScheduleForm({...scheduleForm, minMinutes: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades em Foco</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'escuta', l: 'Escuta', i: Ear },
                { id: 'leitura', l: 'Leitura', i: Eye },
                { id: 'fala', l: 'Fala', i: Mic },
                { id: 'escrita', l: 'Escrita', i: BookOpen }
              ].map(s => (
                <button type="button" key={s.id} onClick={() => {
                  setScheduleForm(p => ({ ...p, skills: p.skills.includes(s.id) ? p.skills.filter(x => x !== s.id) : [...p.skills, s.id] }))
                }} className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${scheduleForm.skills.includes(s.id) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><s.i size={16}/> {s.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Notas / Direcionamentos</label>
            <textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 outline-none focus:border-primary resize-none" value={scheduleForm.notes} onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})} placeholder="Metas para esse dia especificamente..." />
          </div>
          <Button type="submit" className="w-full py-3">Salvar Dia</Button>
        </form>
      </Modal>

      {/* Adicionar Material */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Novo Material de Estudo">
        <form onSubmit={(e) => {
          e.preventDefault();
          if(materialForm.name) {
             addLanguageMaterial(materialForm);
             setMaterialForm({ name: '', level: 'A1', link: '', instructions: '' });
             setIsMaterialModalOpen(false);
          }
        }} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nome do Material</label>
            <input required type="text" placeholder="Livro, PDF, Série..." className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nível Estimado</label>
              <select className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={materialForm.level} onChange={e => setMaterialForm({...materialForm, level: e.target.value})}>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Link (Opcional)</label>
              <input type="url" placeholder="https://" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={materialForm.link} onChange={e => setMaterialForm({...materialForm, link: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Instruções de Uso / Metas</label>
            <textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 outline-none focus:border-primary resize-none" value={materialForm.instructions} onChange={e => setMaterialForm({...materialForm, instructions: e.target.value})} placeholder="Onde parei, como usar..." />
          </div>
          <Button type="submit" className="w-full py-3 mt-2">Salvar Material</Button>
        </form>
      </Modal>

      {/* CORREÇÃO: Lançamento Manual Refatorado */}
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual de Idioma">
        <form onSubmit={handleManualSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Data</label>
              <input required type="date" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary" value={langForm.date} onChange={e => setLangForm({...langForm, date: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Duração Total (min)</label>
              <input 
                 required 
                 type="number" 
                 min="1" 
                 className={`w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-primary ${isMaterialTimePresent ? 'bg-zinc-200 dark:bg-zinc-900 cursor-not-allowed opacity-80' : ''}`} 
                 value={isMaterialTimePresent ? totalMaterialTime : langForm.minutes} 
                 onChange={e => setLangForm({...langForm, minutes: e.target.value})} 
                 readOnly={isMaterialTimePresent}
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Materiais Utilizados (Opcional)</label>
            <div className="flex flex-wrap gap-2">
              {currentMaterials.map(m => {
                const isSel = langForm.materials.some(x => x.name === m.name);
                return (
                  <button type="button" key={m.id} onClick={() => {
                    setLangForm(p => {
                        if(isSel) return {...p, materials: p.materials.filter(x => x.name !== m.name)};
                        return {...p, materials: [...p.materials, { name: m.name, minutes: '' }]};
                    })
                  }} className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${isSel ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>{m.name}</button>
                )
              })}
              {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Nenhum material cadastrado.</span>}
            </div>

            {langForm.materials.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-fadeIn mt-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                    <input type="number" min="1" placeholder="Minutos (Opcional)" className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none focus:border-primary" value={m.minutes} onChange={e => {
                        setLangForm(p => ({
                            ...p,
                            materials: p.materials.map(x => x.name === m.name ? { ...x, minutes: e.target.value } : x)
                        }))
                    }}/>
                </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades (Opcional)</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'escuta', l: 'Escuta', i: Ear },
                { id: 'leitura', l: 'Leitura', i: Eye },
                { id: 'fala', l: 'Fala', i: Mic },
                { id: 'escrita', l: 'Escrita', i: BookOpen }
              ].map(s => (
                <button type="button" key={s.id} onClick={() => {
                  setLangForm(p => ({ ...p, skills: p.skills.includes(s.id) ? p.skills.filter(x => x !== s.id) : [...p.skills, s.id] }))
                }} className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${langForm.skills.includes(s.id) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}><s.i size={16}/> {s.l}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Resumo da Sessão</label>
            <textarea 
               className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 outline-none focus:border-primary resize-none text-sm" 
               value={langForm.sessionSummary} 
               onChange={e => setLangForm({...langForm, sessionSummary: e.target.value})} 
               placeholder="O que você estudou ou praticou hoje? (Opcional)" 
            />
          </div>

          <Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-primary/20">Salvar Registro</Button>
        </form>
      </Modal>

    </div>
  );
};