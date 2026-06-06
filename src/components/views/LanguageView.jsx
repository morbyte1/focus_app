import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  Calendar, 
  BookA, 
  BookOpen, 
  History,
  Flame,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { Card } from '../ui/Card';

// ==========================================
// HOOK CUSTOMIZADO (Lógica & Cálculo CEFR)
// ==========================================
function useLanguageStats(mockDataProps = {}) {
  // Simulação de dados consumidos de um Contexto ou API superior.
  // Em seu app real, isso pode vir do LanguageContext.
  const {
    theme = { name: 'English', flag: '🇺🇸', colors: { primary: '#3b82f6' }, classes: { bg: 'bg-blue-500' } },
    stats = { totalMinutes: 18500, totalWords: 1240, streak: 12, chartData: [], skillsData: [] },
    sessions = []
  } = mockDataProps;

  // Lógica de Cálculo do Nível CEFR (Passo 2)
  const cefrData = useMemo(() => {
    const hours = Math.floor(stats.totalMinutes / 60);
    let level, nextLevel, currentHours, targetHours, progressPercent, hoursRemaining;

    if (hours < 100) {
      level = 'A1'; nextLevel = 'A2'; targetHours = 100;
      currentHours = hours;
      hoursRemaining = targetHours - currentHours;
      progressPercent = (currentHours / targetHours) * 100;
    } else if (hours < 300) {
      level = 'A2'; nextLevel = 'B1'; targetHours = 300;
      currentHours = hours;
      hoursRemaining = targetHours - currentHours;
      progressPercent = ((currentHours - 100) / 200) * 100;
    } else if (hours < 600) {
      level = 'B1'; nextLevel = 'B2'; targetHours = 600;
      currentHours = hours;
      hoursRemaining = targetHours - currentHours;
      progressPercent = ((currentHours - 300) / 300) * 100;
    } else if (hours < 1100) {
      level = 'B2'; nextLevel = 'C1'; targetHours = 1100;
      currentHours = hours;
      hoursRemaining = targetHours - currentHours;
      progressPercent = ((currentHours - 600) / 500) * 100;
    } else if (hours < 1700) {
      level = 'C1'; nextLevel = 'C2'; targetHours = 1700;
      currentHours = hours;
      hoursRemaining = targetHours - currentHours;
      progressPercent = ((currentHours - 1100) / 600) * 100;
    } else {
      level = 'C2'; nextLevel = 'MAX'; targetHours = hours;
      currentHours = hours;
      hoursRemaining = 0;
      progressPercent = 100;
    }

    return { level, nextLevel, currentHours, targetHours, hoursRemaining, progressPercent };
  }, [stats.totalMinutes]);

  // Cálculo de Sessões do Mês Atual
  const sessionsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return sessions.filter(session => {
      const d = new Date(session.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [sessions]);

  // Gerador de Dados para o Heatmap (Últimos 365 dias)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const map = new Map(sessions.map(s => [s.date.split('T')[0], s.minutes]));
    
    return Array.from({ length: 365 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (364 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        minutes: map.get(dateStr) || 0
      };
    });
  }, [sessions]);

  return { theme, stats, cefrData, sessionsThisMonth, heatmapData };
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function LanguageView(props) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, stats, cefrData, sessionsThisMonth, heatmapData } = useLanguageStats(props);

  // Navegação Principal (Passo 1)
  const TABS = [
    { id: 'dashboard', label: 'Visão Geral', icon: BarChart2 },
    { id: 'plan', label: 'Plano', icon: Calendar },
    { id: 'vocabulary', label: 'Vocabulário', icon: BookA },
    { id: 'materials', label: 'Materiais', icon: BookOpen },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  // ==========================================
  // RENDERIZADORES DE ABAS
  // ==========================================

  // Passo 3: Redesign Completo da Visão Geral (Dashboard)
  const renderDashboard = () => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Bloco A: Header */}
      <div className="flex items-center justify-between h-14 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="flag">{theme.flag}</span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{theme.name}</h1>
        </div>
        <div 
          className="px-4 py-1.5 rounded-full font-bold text-sm text-white shadow-sm"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Nível {cefrData.level}
        </div>
      </div>

      {/* Bloco B: KPI Strip */}
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
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{cefrData.currentHours}h</span>
        </Card>

        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Target size={16} className="text-green-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sessões (Mês)</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{sessionsThisMonth}</span>
        </Card>

        <Card className="flex-1 min-w-[140px] p-4 flex flex-col justify-center bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Award size={16} className="text-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Palavras</span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalWords}</span>
        </Card>
      </div>

      {/* Bloco C: Progresso CEFR */}
      <Card className="p-5 h-[90px] flex flex-col justify-center relative overflow-hidden">
        <div className="flex justify-between items-end mb-2 relative z-10">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">{cefrData.level}</span>
          <span className="text-sm font-medium text-zinc-500">
            {cefrData.nextLevel === 'MAX' 
              ? 'Nível Máximo Alcançado!' 
              : `${cefrData.hoursRemaining} horas restantes para ${cefrData.nextLevel}`
            }
          </span>
          <span className="font-bold text-zinc-400">{cefrData.nextLevel !== 'MAX' ? cefrData.nextLevel : ''}</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative z-10">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.min(cefrData.progressPercent, 100)}%`, 
              backgroundColor: theme.colors.primary 
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco D: Imersão do Dia */}
        <Card className="p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} style={{ color: theme.colors.primary }} />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Foco de Hoje</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
            <BookOpen size={32} className="text-zinc-400 mb-3" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum material programado</p>
            <p className="text-xs text-zinc-500 mt-1">Configure seu plano de estudos para ver sugestões aqui.</p>
          </div>
        </Card>

        {/* Bloco E: Gráfico Semanal */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Minutos na Semana</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                />
                <Bar 
                  dataKey="minutes" 
                  radius={[4, 4, 0, 0]} 
                  style={{ fill: theme.colors.primary }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco F: Habilidades */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Habilidades</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skillsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#52525b" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                />
                <Bar 
                  dataKey="score" 
                  radius={[0, 4, 4, 0]} 
                  barSize={20}
                  style={{ fill: theme.colors.primary }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bloco G: Heatmap Anual */}
        <Card className="p-6 lg:col-span-2 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Consistência Anual</h2>
          <div className="flex-1 overflow-x-auto pb-2 scrollbar-thin">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-max">
              {heatmapData.map((day, idx) => {
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

  const renderMaterials = () => (
    <Card className="min-h-[400px] flex items-center justify-center text-zinc-500 animate-in fade-in">
      <div className="text-center">
        <BookOpen className="mx-auto mb-4 opacity-50" size={48} />
        <p>Seus materiais salvos aparecerão aqui.</p>
      </div>
    </Card>
  );

  const renderPlan = () => (
    <Card className="min-h-[400px] flex items-center justify-center text-zinc-500 animate-in fade-in">
      Em breve...
    </Card>
  );

  const renderVocabulary = () => (
    <Card className="min-h-[400px] flex items-center justify-center text-zinc-500 animate-in fade-in">
      Em breve...
    </Card>
  );

  const renderHistory = () => (
    <Card className="min-h-[400px] flex items-center justify-center text-zinc-500 animate-in fade-in">
      Em breve...
    </Card>
  );

  // Switch de Views
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'plan': return renderPlan();
      case 'vocabulary': return renderVocabulary();
      case 'materials': return renderMaterials();
      case 'history': return renderHistory();
      default: return renderDashboard();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
      {/* Sistema de Pills / Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${isActive 
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-md' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo Ativo */}
      {renderContent()}
    </div>
  );
}