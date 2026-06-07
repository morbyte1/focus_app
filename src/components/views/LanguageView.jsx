import React, { useContext, useMemo, useState } from 'react';
import { 
  Globe, ArrowRight, BarChart2, Calendar, Clock, Edit2, RefreshCw, 
  Ear, Eye, Mic, BookOpen, Plus, Trash2, ExternalLink, Flame, Target, 
  Award, History, LayoutDashboard, CalendarDays, BrainCircuit, AlertCircle, Layers, Zap, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

const TABS = [
  { id: 'dashboard', l: 'Visão Geral', icon: LayoutDashboard },
  { id: 'plan',      l: 'Plano',       icon: CalendarDays },
  { id: 'materials', l: 'Materiais',   icon: BookOpen },
  { id: 'anki',      l: 'Revisão',     icon: BrainCircuit },
  { id: 'history',   l: 'Histórico',   icon: History },
];

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

const parseAnkiFile = (text) => {
  const lines = text.trim().split('\n');
  const dataLines = lines.filter(l => !l.startsWith('#'));
  if (dataLines.length < 2) return null;

  const headers = dataLines[0].split('\t').map(h => h.trim().toLowerCase().replace(/ /g, '_'));

  const getIdx = (...names) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxEase    = getIdx('ease_factor', 'ease', 'fator_de_facilidade');
  const idxLapses  = getIdx('lapses', 'lapsos', 'erros');
  const idxInterval = getIdx('interval', 'intervalo');
  const idxFront   = getIdx('front', 'frente', 'question');
  const idxBack    = getIdx('back', 'verso', 'answer');
  const idxDeck    = getIdx('deck', 'baralho');
  const idxReviews = getIdx('reviews', 'revisões', 'review_count');

  if (idxEase === -1 && idxLapses === -1) return null;

  const cards = dataLines.slice(1).map((line, i) => {
    const cols = line.split('\t');
    return {
      id: i,
      front:    idxFront !== -1    ? cols[idxFront]?.trim()             : `Cartão ${i + 1}`,
      back:     idxBack !== -1     ? cols[idxBack]?.trim()              : '',
      deck:     idxDeck !== -1     ? cols[idxDeck]?.trim()              : 'Sem baralho',
      ease:     idxEase !== -1     ? Number(cols[idxEase]) || 250       : 250,
      lapses:   idxLapses !== -1   ? Number(cols[idxLapses]) || 0       : 0,
      interval: idxInterval !== -1 ? Number(cols[idxInterval]) || 0     : 0,
      reviews:  idxReviews !== -1  ? Number(cols[idxReviews]) || 0      : 0,
    };
  }).filter(c => c.front);

  return cards;
};

const useLanguageStats = (sessions) => {
  return useMemo(() => {
    let totalMinutes = 0;
    const chartData = [];
    const skillsCount = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = new Date(now);
    today.setHours(0,0,0,0);

    const daysActiveThisMonth = new Set(
      sessions
        .filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .map(s => new Date(s.date).toDateString())
    ).size;

    const todayMinutes = sessions
      .filter(s => new Date(s.date).toDateString() === today.toDateString())
      .reduce((acc, s) => acc + s.minutes, 0);

    sessions.forEach(s => {
      totalMinutes += s.minutes;
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
      level = 'A1'; nextLevel = 'A2'; targetHours = 100; hoursRemaining = targetHours - hours; progressPercent = (hours / targetHours) * 100;
    } else if (hours < 300) {
      level = 'A2'; nextLevel = 'B1'; targetHours = 300; hoursRemaining = targetHours - hours; progressPercent = ((hours - 100) / 200) * 100;
    } else if (hours < 600) {
      level = 'B1'; nextLevel = 'B2'; targetHours = 600; hoursRemaining = targetHours - hours; progressPercent = ((hours - 300) / 300) * 100;
    } else if (hours < 1100) {
      level = 'B2'; nextLevel = 'C1'; targetHours = 1100; hoursRemaining = targetHours - hours; progressPercent = ((hours - 600) / 500) * 100;
    } else if (hours < 1700) {
      level = 'C1'; nextLevel = 'C2'; targetHours = 1700; hoursRemaining = targetHours - hours; progressPercent = ((hours - 1100) / 600) * 100;
    } else {
      level = 'C2'; nextLevel = 'MAX'; targetHours = hours; hoursRemaining = 0; progressPercent = 100;
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
      chartData.push({ day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), minutes: daySessions.reduce((a, b) => a + b.minutes, 0) });
    }

    const skillsData = Object.entries(skillsCount).map(([name, score]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), score }));

    const map = new Map();
    sessions.forEach(s => {
      const dStr = s.date.split('T')[0];
      map.set(dStr, (map.get(dStr) || 0) + s.minutes);
    });

    const heatmapData = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(currentYear, 0, 1);
      d.setDate(d.getDate() + i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const str = `${yr}-${mo}-${dy}`;
      heatmapData.push({ date: str, minutes: map.get(str) || 0 });
    }

    const last30Sessions = sessions.slice(-30);
    const recentSkillsCount = {};
    last30Sessions.forEach(s => {
      if (s.skills && Array.isArray(s.skills)) {
        s.skills.forEach(skill => {
          recentSkillsCount[skill] = (recentSkillsCount[skill] || 0) + 1;
        });
      }
    });
    const totalRecentSkillEntries = Object.values(recentSkillsCount).reduce((a, b) => a + b, 0);
    let skillImbalanceWarning = null;
    if (totalRecentSkillEntries > 0) {
      const dominantSkill = Object.entries(recentSkillsCount).sort((a, b) => b[1] - a[1])[0];
      if (dominantSkill && (dominantSkill[1] / totalRecentSkillEntries) > 0.8) {
        skillImbalanceWarning = dominantSkill[0];
      }
    }

    return { 
      totalMinutes, currentHours, streak: currentStreak, maxStreak, 
      daysActiveThisMonth, todayMinutes, chartData, skillsData, heatmapData, cefrData, skillImbalanceWarning 
    };
  }, [sessions]);
};

export const LanguageView = () => {
  const { 
    activeLanguage, setActiveLanguage, activeLanguageSessions, 
    addLanguageSession, deleteLanguageSession, languageSchedule, 
    updateLanguageScheduleDay, languageMaterials, addLanguageMaterial, 
    deleteLanguageMaterial, theme, updateLanguageMaterial,
    ankiData, setAnkiDataForLanguage
  } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ material: [], minMinutes: 30, skills: [], notes: '' });
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', level: 'A1', link: '', instructions: '' });
  const [manMod, setManMod] = useState(false);
  const [langForm, setLangForm] = useState({ date: new Date().toISOString().split('T')[0], minutes: '', sessionSummary: '', skills: [], materials: [] });

  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const askConfirm = (message, onConfirm) => setConfirmModal({ open: true, message, onConfirm });

  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredEdit, setHoveredEdit] = useState(null);

  const [ankiError, setAnkiError] = useState('');
  const [ankiLoading, setAnkiLoading] = useState(false);

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

  const totalMaterialTime = langForm.materials.reduce((acc, m) => acc + (Number(m.minutes) || 0), 0);
  const isMaterialTimePresent = langForm.materials.length > 0 && totalMaterialTime > 0;

  const handleManualSave = (e) => {
    e.preventDefault();
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

  const openEditSchedule = (day) => {
    setScheduleForm({
      material: Array.isArray(day.material) ? [...day.material] : (day.material ? [{ name: day.material, minutes: '' }] : []),
      minMinutes: day.minMinutes || 30,
      skills: Array.isArray(day.skills) ? [...day.skills] : [],
      notes: day.notes || ''
    });
    setEditingDay(day.dayIndex);
  };

  const getLastUsed = (materialName) => {
    const sessionsWithMaterial = activeLanguageSessions
      .filter(s => {
        if (!s.materials) return false;
        if (Array.isArray(s.materials)) return s.materials.some(m => m.name === materialName);
        return s.materials === materialName;
      })
      .map(s => new Date(s.date));
    if (sessionsWithMaterial.length === 0) return null;
    const latest = new Date(Math.max(...sessionsWithMaterial));
    const diffDays = Math.floor((new Date() - latest) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

      {stats.skillImbalanceWarning && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl text-sm">
          <AlertCircle size={18} className="text-yellow-500 flex-shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-200">
            <span className="font-bold">Desequilíbrio detectado:</span> Mais de 80% das suas sessões recentes focaram em{' '}
            <span className="font-bold capitalize">{stats.skillImbalanceWarning}</span>.
            Tente equilibrar com as outras habilidades para uma aquisição mais completa.
          </p>
        </div>
      )}

      <Card className="p-5 h-auto flex flex-col justify-center relative overflow-hidden">
        <div className="flex justify-between items-center mb-2 relative z-10">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">{stats.cefrData.level}</span>
          <div className="text-center">
            <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
              {stats.cefrData.progressPercent.toFixed(0)}%
            </span>
            <span className="text-xs text-zinc-500 ml-1">concluído</span>
          </div>
          <span className="font-bold text-zinc-400">{stats.cefrData.nextLevel !== 'MAX' ? stats.cefrData.nextLevel : '🏆'}</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(stats.cefrData.progressPercent, 100)}%`, backgroundColor: theme.colors.primary }}
          />
        </div>
        <p className="text-xs text-zinc-400 mt-2 text-center relative z-10">
          {stats.cefrData.nextLevel !== 'MAX'
            ? `${stats.cefrData.hoursRemaining}h restantes para ${stats.cefrData.nextLevel}`
            : 'Nível máximo alcançado!'}
        </p>
      </Card>

      <div className="flex flex-row gap-4 w-full overflow-x-auto no-scrollbar pb-2 sm:pb-0">
        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Flame size={20} style={{ color: theme.colors.primary }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Sequência</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.streak} dias</span>
          <span className="text-xs text-zinc-400 mt-0.5">Recorde: {stats.maxStreak} dias</span>
        </Card>
        
        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Clock size={24} style={{ color: theme.colors.primary }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Horas Totais</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.currentHours}h</span>
        </Card>

        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Calendar size={24} style={{ color: theme.colors.primary }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Dias Ativos (Mês)</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.daysActiveThisMonth}</span>
        </Card>

        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Zap size={20} style={{ color: theme.colors.primary }} />
            <span className="text-xs font-semibold uppercase tracking-wider">Hoje</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.todayMinutes} min</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Target size={18} style={{ color: theme.colors.primary }} />
            Foco de Hoje
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Habilidades Sugeridas</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {languageSchedule[todayIndex].skills.length > 0 
                  ? languageSchedule[todayIndex].skills.map(s => {
                      const IconComp = SKILL_ICONS[s];
                      return (
                        <span key={s} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-1 rounded-md uppercase font-bold flex items-center gap-1">
                          {IconComp && <IconComp size={12} />} {s}
                        </span>
                      );
                    })
                  : <span className="text-xs text-zinc-400 italic">Nenhuma definida</span>
                }
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Meta Diária de Tempo</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{languageSchedule[todayIndex].minMinutes} min</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Materiais</span>
              <div className="mt-1">
                 {languageSchedule[todayIndex].material && languageSchedule[todayIndex].material.length > 0 
                    ? languageSchedule[todayIndex].material.map((m, idx) => (
                        <div key={idx} className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                          • {m.name} {m.minutes ? `(${m.minutes} min)` : ''}
                        </div>
                      ))
                    : <span className="text-xs text-zinc-400 italic">Nenhum definido</span>
                 }
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <BarChart2 size={18} style={{ color: theme.colors.primary }} />
            Minutos na Semana
          </h2>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip 
                  formatter={(value) => [value, "minutos"]}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="minutes" name="minutos" radius={[4, 4, 0, 0]} style={{ fill: theme.colors.primary }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Target size={18} style={{ color: theme.colors.primary }} />
            Habilidades
          </h2>
          <div className="flex-1 w-full min-h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.skillsData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#52525b" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} width={80} />
                <Tooltip 
                  formatter={(value) => [value, "minutos"]}
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="score" name="minutos" radius={[0, 4, 4, 0]} barSize={20} style={{ fill: theme.colors.primary }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={18} style={{ color: theme.colors.primary }} /> 
            Consistência Anual
          </h2>
          <div className="flex-1 overflow-x-auto no-scrollbar pb-2">
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
                  <div 
                    key={idx} 
                    title={`${day.date}: ${day.minutes} minutos`}
                    className={`w-3 h-3 rounded-sm flex-shrink-0 transition-colors ${!isFilled ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                    style={isFilled ? { backgroundColor: theme.colors.primary, opacity } : {}}
                  />
                );
              })}
            </div>
          </div>
        </Card>
      </div>

    </div>
  );

  const renderPlan = () => (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <Calendar style={{ color: theme.colors.primary }} size={24} />
        <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Cronograma Semanal</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {languageSchedule.map(day => (
          <div key={day.dayIndex} className={`bg-white dark:bg-[#000000] p-5 rounded-2xl border transition-all h-fit flex flex-col ${todayIndex === day.dayIndex ? theme.classes.highlight : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'} shadow-sm relative`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className={`font-bold ${todayIndex === day.dayIndex ? theme.classes.text : 'text-zinc-900 dark:text-white'} flex items-center`}>
                {DAYS_OF_WEEK[day.dayIndex]}
                {todayIndex === day.dayIndex && <span style={{ color: theme.colors.primary }} className="text-[10px] ml-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Hoje</span>}
              </h4>
              <div className="flex gap-2">
                <button 
                  onMouseEnter={() => setHoveredEdit(day.dayIndex)}
                  onMouseLeave={() => setHoveredEdit(null)}
                  style={{ color: hoveredEdit === day.dayIndex ? theme.colors.primary : undefined }}
                  onClick={() => openEditSchedule(day)} 
                  className="text-zinc-400 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button onClick={() => askConfirm('Limpar o dia?', () => updateLanguageScheduleDay(day.dayIndex, { material: [], minMinutes: 30, skills: [], notes: '' }))} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1"><BookOpen size={12}/> Materiais</span>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                  {Array.isArray(day.material) && day.material.length > 0 ? day.material.map(m => {
                    if (typeof m === 'string') return m;
                    return m.minutes ? `${m.name} (${m.minutes} min)` : m.name;
                  }).join(', ') : (typeof day.material === 'string' && day.material ? day.material : <span className="italic text-zinc-400 font-normal">Livre</span>)}
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
        <button onClick={() => setIsMaterialModalOpen(true)} className={`px-5 py-2.5 text-sm rounded-2xl font-bold transition-all active:scale-95 text-white flex items-center gap-2 shadow-sm ${theme.classes.button}`}>
          <Plus size={18}/> Novo Material
        </button>
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
              <button onClick={() => askConfirm('Excluir este material?', () => deleteLanguageMaterial(m.id))} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              <div className="mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${getLevelColor(m.level)}`}>Nível {m.level}</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 pr-8">{m.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 mb-4">{m.instructions}</p>
              
              <div className="mt-auto flex flex-col gap-2">
                {(() => {
                  const days = getLastUsed(m.name);
                  if (days === null) return (
                    <span className="text-xs text-zinc-400 italic">Nunca usado em sessões</span>
                  );
                  if (days > 14) return (
                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      ⚠ Último uso: há {days} dias
                    </span>
                  );
                  return (
                    <span className="text-xs text-zinc-400">Último uso: há {days} dia{days !== 1 ? 's' : ''}</span>
                  );
                })()}

                {m.link && (
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-bold rounded-xl transition-colors mt-2">
                    <ExternalLink size={16} /> Acessar Material
                  </a>
                )}
              </div>
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
          <History size={20} className={theme.classes.text.split(' ')[0]} /> Histórico de {theme.name}
        </h2>
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
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700" style={{ color: theme.colors.primary, borderColor: theme.colors.primary + '4d', backgroundColor: theme.colors.primary + '1a' }}>
                    <Clock size={12}/> {s.minutes} min
                  </span>
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
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
                      {s.materials}
                    </span>
                  )}

                  {s.skills && s.skills.length > 0 && (
                    s.skills.map(skill => {
                      const IconComp = SKILL_ICONS[skill];
                      return IconComp ? (
                        <span key={skill} className="flex items-center gap-1 text-xs bg-zinc-200/50 dark:bg-zinc-700/50 px-2 py-1 rounded-md text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-300 dark:border-zinc-600">
                          <IconComp size={14} /> {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </span>
                      ) : null;
                    })
                  )}
                </div>

                {s.sessionSummary && (
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm italic mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2 break-words">"{s.sessionSummary}"</p>
                )}
              </div>
              <button onClick={() => askConfirm('Excluir sessão?', () => deleteLanguageSession(s.id))} className="p-2 text-zinc-400 hover:text-red-500 transition-colors self-end sm:self-center">
                <Trash2 size={18} />
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const handleAnkiUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnkiError('');
    setAnkiLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const cards = parseAnkiFile(text);
        if (!cards || cards.length === 0) {
          setAnkiError('Arquivo inválido ou sem dados. Exporte do Anki em: Browse → File → Export → "Notes in Plain Text" com todos os campos.');
          setAnkiLoading(false);
          return;
        }
        setAnkiDataForLanguage(activeLanguage, cards);
        setAnkiLoading(false);
      } catch {
        setAnkiError('Erro ao processar o arquivo. Verifique se o formato é .txt exportado pelo Anki.');
        setAnkiLoading(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const renderAnki = () => {
    const currentAnkiCards = ankiData[activeLanguage] || [];
    const totalCards       = currentAnkiCards.length;
    const matureCards      = currentAnkiCards.filter(c => c.interval > 21).length;
    const maturityRate     = totalCards > 0 ? ((matureCards / totalCards) * 100).toFixed(0) : 0;
    const avgEase          = totalCards > 0 
      ? (currentAnkiCards.reduce((a, c) => a + c.ease, 0) / totalCards).toFixed(0) 
      : 0;
    const problematicCards = currentAnkiCards.filter(c => c.ease < 200 || c.lapses > 3);
    const topProblematic   = [...problematicCards]
      .sort((a, b) => b.lapses - a.lapses || a.ease - b.ease)
      .slice(0, 10);

    const intervalDistribution = [
      { label: '0–7 dias',   count: currentAnkiCards.filter(c => c.interval <= 7).length,                       fill: '#ef4444' },
      { label: '8–21 dias',  count: currentAnkiCards.filter(c => c.interval > 7 && c.interval <= 21).length,       fill: '#f97316' },
      { label: '22–60 dias', count: currentAnkiCards.filter(c => c.interval > 21 && c.interval <= 60).length,      fill: '#eab308' },
      { label: '60+ dias',   count: currentAnkiCards.filter(c => c.interval > 60).length,                          fill: '#22c55e' },
    ];

    const deckStats = Object.entries(
      currentAnkiCards.reduce((acc, c) => {
        if (!acc[c.deck]) acc[c.deck] = { total: 0, easeSum: 0, lapseSum: 0, mature: 0 };
        acc[c.deck].total++;
        acc[c.deck].easeSum += c.ease;
        acc[c.deck].lapseSum += c.lapses;
        if (c.interval > 21) acc[c.deck].mature++;
        return acc;
      }, {})
    ).map(([deck, data]) => ({
      deck,
      total: data.total,
      avgEase: (data.easeSum / data.total).toFixed(0),
      avgLapses: (data.lapseSum / data.total).toFixed(1),
      maturityRate: ((data.mature / data.total) * 100).toFixed(0),
    }));

    return (
      <div className="animate-fadeIn space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <BrainCircuit size={20} style={{ color: theme.colors.primary }} />
            Análise de Revisões (Anki)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Importe o arquivo exportado do Anki para visualizar a saúde dos seus cartões.
            <br />
            <span className="font-bold text-zinc-600 dark:text-zinc-300">Como exportar:</span>{' '}
            No Anki → Browse → File → Export → selecione{' '}
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Notes in Plain Text (.txt)</span>{' '}
            → marque{' '}
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Include all fields</span>{' '}
            → Export.
          </p>
          <div className="flex items-center gap-4">
            <label
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white cursor-pointer transition-opacity hover:opacity-90 active:scale-95"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Plus size={16} />
              {totalCards > 0 ? 'Atualizar Dados' : 'Importar Arquivo'}
              <input type="file" accept=".txt,.csv" className="hidden" onChange={handleAnkiUpload} />
            </label>
            {totalCards > 0 && (
              <button
                onClick={() => askConfirm('Remover todos os dados do Anki para este idioma?', () => setAnkiDataForLanguage(activeLanguage, []))}
                className="text-sm text-zinc-400 hover:text-red-500 transition-colors font-medium"
              >
                Remover dados
              </button>
            )}
            {ankiLoading && <span className="text-sm text-zinc-500 animate-pulse">Processando...</span>}
          </div>
          {ankiError && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              {ankiError}
            </p>
          )}
        </Card>

        {totalCards === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <BrainCircuit size={48} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 font-medium">Nenhum dado importado ainda.</p>
            <p className="text-zinc-400 text-sm mt-1">Importe seu arquivo .txt do Anki acima para começar.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total de Cartões', value: totalCards,          sub: 'importados',          icon: BookOpen  },
                { label: 'Taxa de Maturidade', value: maturityRate + '%',  sub: `${matureCards} maduros (>21 dias)`, icon: Award    },
                { label: 'Ease Factor Médio', value: avgEase + '%',        sub: avgEase < 200 ? '⚠ Atenção: abaixo do ideal' : '✓ Saudável', icon: Target   },
                { label: 'Cartões Críticos',  value: problematicCards.length, sub: 'ease <200% ou erros >3', icon: AlertCircle },
              ].map((kpi, i) => (
                <Card key={i} className="p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1">
                    <kpi.icon size={16} style={{ color: theme.colors.primary }} />
                    <span className="text-xs font-bold uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</span>
                  <span className="text-xs text-zinc-400">{kpi.sub}</span>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 size={18} style={{ color: theme.colors.primary }} />
                Distribuição de Intervalos de Revisão
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Cartões na zona verde (60+ dias) estão consolidados na memória de longo prazo. Cartões na zona vermelha (0–7 dias) ainda precisam de atenção frequente.</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intervalDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip
                      formatter={(value) => [value, 'cartões']}
                      contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" name="cartões" radius={[4, 4, 0, 0]}>
                      {intervalDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {topProblematic.length > 0 && (
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" />
                  Cartões que Precisam de Atenção ({problematicCards.length} total)
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Cartões com Ease Factor abaixo de 200% ou mais de 3 erros acumulados. Priorize revisá-los com recall ativo.</p>
                <div className="space-y-2">
                  {topProblematic.map((card, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{card.front}</p>
                        <p className="text-xs text-zinc-500 truncate">{card.deck}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${card.ease < 200 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                          Ease {card.ease}%
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {card.lapses} erros
                        </span>
                      </div>
                    </div>
                  ))}
                  {problematicCards.length > 10 && (
                    <p className="text-xs text-zinc-400 text-center pt-2">...e mais {problematicCards.length - 10} cartões críticos.</p>
                  )}
                </div>
              </Card>
            )}

            {deckStats.length > 1 && (
              <Card className="p-6">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers size={18} style={{ color: theme.colors.primary }} />
                  Saúde por Baralho
                </h3>
                <div className="space-y-3">
                  {deckStats.map((deck, i) => (
                    <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1 mr-4">{deck.deck}</p>
                        <span className="text-xs text-zinc-500">{deck.total} cartões</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-zinc-400 uppercase font-bold tracking-wider">Ease Médio</p>
                          <p className={`font-bold ${Number(deck.avgEase) < 200 ? 'text-red-500' : 'text-emerald-500'}`}>{deck.avgEase}%</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 uppercase font-bold tracking-wider">Erros Médios</p>
                          <p className="font-bold text-zinc-700 dark:text-zinc-300">{deck.avgLapses}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 uppercase font-bold tracking-wider">Maturidade</p>
                          <p className={`font-bold ${Number(deck.maturityRate) >= 50 ? 'text-emerald-500' : 'text-yellow-500'}`}>{deck.maturityRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col animate-fadeIn pb-24 md:pb-0 relative"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.primary}0d 0%, transparent 180px)`
      }}
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 relative z-10">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === t.id
                ? theme.classes.bg + ' ' + theme.classes.border + ' border'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
            }`}
            style={activeTab === t.id ? { color: theme.colors.primary } : {}}
          >
            <t.icon size={15} />
            {t.l}
          </button>
        ))}
      </div>

      <div className="flex-1 relative z-10">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'plan' && renderPlan()}
        {activeTab === 'materials' && renderMaterials()}
        {activeTab === 'anki' && renderAnki()}
        {activeTab === 'history' && renderHistory()}
      </div>

      <button
        onClick={() => setManMod(true)}
        className="fixed bottom-8 right-8 z-30 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 md:bottom-10 md:right-10"
        style={{ backgroundColor: theme.colors.primary }}
        title="Lançar Sessão Manual"
      >
        <Plus size={24} />
      </button>

      <Modal isOpen={editingDay !== null} onClose={() => setEditingDay(null)} title={`Editar Plano: ${editingDay !== null ? DAYS_OF_WEEK[editingDay] : ''}`}>
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Materiais</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentMaterials.map(m => {
                const isSel = scheduleForm.material.some(x => x.name === m.name);
                return (
                  <button type="button" key={m.id} onClick={() => {
                    setScheduleForm(p => {
                      if(isSel) return {...p, material: p.material.filter(x => x.name !== m.name)};
                      return {...p, material: [...p.material, { name: m.name, minutes: '' }]};
                    })
                  }} 
                  style={isSel ? {
                    backgroundColor: theme.colors.primary + '1a',
                    borderColor: theme.colors.primary + '4d',
                    color: theme.colors.primary
                  } : {}}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800">
                    {m.name}
                  </button>
                )
              })}
            </div>
            {scheduleForm.material.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                <input 
                  type="number" min="1" placeholder="Minutos (Opcional)" 
                  onFocus={() => setFocusedInput(`sched-mat-${m.name}`)}
                  onBlur={() => setFocusedInput(null)}
                  style={{ borderColor: focusedInput === `sched-mat-${m.name}` ? theme.colors.primary : undefined }}
                  className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none transition-colors" 
                  value={m.minutes} 
                  onChange={e => {
                    setScheduleForm(p => ({
                      ...p,
                      material: p.material.map(x => x.name === m.name ? { ...x, minutes: e.target.value } : x)
                    }))
                  }}/>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Meta Mínima de Tempo (Minutos)</label>
            <input 
              required type="number" min="10" 
              onFocus={() => setFocusedInput('sched-min-minutes')}
              onBlur={() => setFocusedInput(null)}
              style={{ borderColor: focusedInput === 'sched-min-minutes' ? theme.colors.primary : undefined }}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors" 
              value={scheduleForm.minMinutes} 
              onChange={e => setScheduleForm({...scheduleForm, minMinutes: Number(e.target.value)})} 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades Recomendadas</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'escuta', l: 'Escuta', i: Ear },
                { id: 'leitura', l: 'Leitura', i: Eye },
                { id: 'fala', l: 'Fala', i: Mic },
                { id: 'escrita', l: 'Escrita', i: BookOpen }
              ].map(s => (
                <button type="button" key={s.id} onClick={() => {
                  setScheduleForm(p => ({
                    ...p, skills: p.skills.includes(s.id) ? p.skills.filter(x => x !== s.id) : [...p.skills, s.id]
                  }))
                }} 
                style={scheduleForm.skills.includes(s.id) ? {
                  backgroundColor: theme.colors.primary + '1a',
                  borderColor: theme.colors.primary + '4d',
                  color: theme.colors.primary
                } : {}}
                className="flex items-center gap-2 p-2 rounded-xl border text-sm font-bold transition-all bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800">
                  <s.i size={16}/> {s.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Notas / Metas Extras</label>
            <textarea 
              onFocus={() => setFocusedInput('sched-notes')}
              onBlur={() => setFocusedInput(null)}
              style={{ borderColor: focusedInput === 'sched-notes' ? theme.colors.primary : undefined }}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-20 outline-none resize-none transition-colors" 
              value={scheduleForm.notes} 
              onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})} 
              placeholder="Metas para esse dia especificamente..." 
            />
          </div>

          <button type="submit" className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-95 text-white shadow-sm ${theme.classes.button}`}>
            Salvar Dia
          </button>
        </form>
      </Modal>

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
            <input 
              required type="text" placeholder="Livro, PDF, Série..." 
              onFocus={() => setFocusedInput('mat-name')}
              onBlur={() => setFocusedInput(null)}
              style={{ borderColor: focusedInput === 'mat-name' ? theme.colors.primary : undefined }}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors" 
              value={materialForm.name} 
              onChange={e => setMaterialForm({...materialForm, name: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nível Estimado</label>
              <select 
                onFocus={() => setFocusedInput('mat-level')}
                onBlur={() => setFocusedInput(null)}
                style={{ borderColor: focusedInput === 'mat-level' ? theme.colors.primary : undefined }}
                className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors" 
                value={materialForm.level} 
                onChange={e => setMaterialForm({...materialForm, level: e.target.value})}>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Link (Opcional)</label>
              <input 
                type="url" placeholder="https://" 
                onFocus={() => setFocusedInput('mat-link')}
                onBlur={() => setFocusedInput(null)}
                style={{ borderColor: focusedInput === 'mat-link' ? theme.colors.primary : undefined }}
                className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors" 
                value={materialForm.link} 
                onChange={e => setMaterialForm({...materialForm, link: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Instruções de Uso / Metas</label>
            <textarea 
              onFocus={() => setFocusedInput('mat-inst')}
              onBlur={() => setFocusedInput(null)}
              style={{ borderColor: focusedInput === 'mat-inst' ? theme.colors.primary : undefined }}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 outline-none resize-none transition-colors" 
              value={materialForm.instructions} 
              onChange={e => setMaterialForm({...materialForm, instructions: e.target.value})} 
              placeholder="Onde parei, como usar..." 
            />
          </div>
          <button type="submit" className={`w-full py-3 mt-2 rounded-2xl font-bold transition-all active:scale-95 text-white shadow-sm ${theme.classes.button}`}>
            Salvar Material
          </button>
        </form>
      </Modal>

      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual de Idioma">
        <form onSubmit={handleManualSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Data</label>
              <input 
                required type="date" 
                onFocus={() => setFocusedInput('man-date')}
                onBlur={() => setFocusedInput(null)}
                style={{ borderColor: focusedInput === 'man-date' ? theme.colors.primary : undefined }}
                className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors" 
                value={langForm.date} 
                onChange={e => setLangForm({...langForm, date: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Duração Total (min)</label>
              <input 
                required type="number" min="1" 
                onFocus={() => setFocusedInput('man-minutes')}
                onBlur={() => setFocusedInput(null)}
                style={{ borderColor: focusedInput === 'man-minutes' ? theme.colors.primary : undefined }}
                className={`w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none transition-colors ${isMaterialTimePresent ? 'bg-zinc-200 dark:bg-zinc-900 cursor-not-allowed opacity-80' : ''}`} 
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
                  }} 
                  style={isSel ? {
                    backgroundColor: theme.colors.primary + '1a',
                    borderColor: theme.colors.primary + '4d',
                    color: theme.colors.primary
                  } : {}}
                  className="px-3 py-1.5 rounded-xl border text-sm font-bold transition-all bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800">
                    {m.name}
                  </button>
                )
              })}
              {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Nenhum material cadastrado.</span>}
            </div>
            {langForm.materials.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 animate-fadeIn mt-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                <input 
                  type="number" min="1" placeholder="Minutos (Opcional)" 
                  onFocus={() => setFocusedInput(`man-mat-${m.name}`)}
                  onBlur={() => setFocusedInput(null)}
                  style={{ borderColor: focusedInput === `man-mat-${m.name}` ? theme.colors.primary : undefined }}
                  className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none transition-colors" 
                  value={m.minutes} 
                  onChange={e => {
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
                  setLangForm(p => ({
                    ...p, skills: p.skills.includes(s.id) ? p.skills.filter(x => x !== s.id) : [...p.skills, s.id]
                  }))
                }} 
                style={langForm.skills.includes(s.id) ? {
                  backgroundColor: theme.colors.primary + '1a',
                  borderColor: theme.colors.primary + '4d',
                  color: theme.colors.primary
                } : {}}
                className="flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800">
                  <s.i size={16}/> {s.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Resumo da Sessão</label>
            <textarea 
              onFocus={() => setFocusedInput('man-summary')}
              onBlur={() => setFocusedInput(null)}
              style={{ borderColor: focusedInput === 'man-summary' ? theme.colors.primary : undefined }}
              className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 h-24 outline-none resize-none transition-colors" 
              value={langForm.sessionSummary} 
              onChange={e => setLangForm({...langForm, sessionSummary: e.target.value})} 
              placeholder="O que você estudou hoje?"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setManMod(false)} className="flex-1">Cancelar</Button>
            <button type="submit" className={`flex-[2] py-2.5 rounded-2xl font-bold transition-all active:scale-95 text-white shadow-sm ${theme.classes.button}`}>Salvar Sessão</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null })} title="Confirmar">
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-300">{confirmModal.message}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })} className="flex-1">Cancelar</Button>
            <Button onClick={() => { confirmModal.onConfirm?.(); setConfirmModal({ open: false, message: '', onConfirm: null }); }} className="flex-1 bg-red-500 hover:bg-red-600 border-red-600 text-white">Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};