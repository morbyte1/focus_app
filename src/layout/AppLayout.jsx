import React, { useContext, useState } from 'react';
// 1. Importar Trophy
import { LayoutDashboard, Zap, Target, BarChart2, History, Settings, Menu, X, ChevronRight, ChevronLeft, Calendar, AlertTriangle, GraduationCap, Trophy } from 'lucide-react';
import { FocusContext, getXP, getRank } from '../context/FocusContext';

import { DashboardView } from '../components/views/DashboardView';
import { FocusView } from '../components/views/FocusView';
import { MistakesView } from '../components/views/MistakesView';
import { GoalsView } from '../components/views/GoalsView';
import { StatsView } from '../components/views/StatsView';
import { HistoryView } from '../components/views/HistoryView';
import { SettingsView } from '../components/views/SettingsView';
import { CalendarTab } from '../components/CalendarTab'; 
import { SchoolView } from '../components/views/SchoolView'; 
// 2. Importar AchievementsView
import { AchievementsView } from '../components/views/AchievementsView';

export const AppLayout = () => {
  const { currentView, setCurrentView, userLevel } = useContext(FocusContext);
  const [menu, setMenu] = useState(false); 
  const [col, setCol] = useState(false);
  
  const xpN = getXP(userLevel.level);
  const xpP = Math.min(100, (userLevel.currentXP / xpN) * 100);
  const rk = getRank(userLevel.level);
  
  // 3. Adicionar item 'achievements' na navegação
  const nav = [
    { id: 'dashboard', l: 'Painel', i: LayoutDashboard }, 
    { id: 'school', l: 'Escola', i: GraduationCap },
    { id: 'focus', l: 'Focar', i: Zap }, 
    { id: 'achievements', l: 'Conquistas', i: Trophy }, // <--- NOVO ITEM AQUI
    { id: 'mistakes', l: 'Erros', i: AlertTriangle }, 
    { id: 'calendar', l: 'Calendário', i: Calendar }, 
    { id: 'goals', l: 'Metas', i: Target }, 
    { id: 'stats', l: 'Estatísticas', i: BarChart2 }, 
    { id: 'history', l: 'Histórico', i: History }, 
    { id: 'settings', l: 'Configurações', i: Settings }
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#000000] text-zinc-900 dark:text-zinc-300 font-sans font-medium overflow-hidden">
        <button className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl" onClick={() => setMenu(!menu)}>
            {menu ? <X /> : <Menu />}
        </button>
        {menu && <div className="fixed inset-0 bg-black/90 z-40 md:hidden" onClick={() => setMenu(false)} />}
        
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#000000] border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-300 md:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'} ${col ? 'w-20' : 'w-64'}`}>
            <div className={`p-6 flex items-center ${col ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-900 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0">F</div>
                    {!col && <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Focus</span>}
                </div>
                <button onClick={() => setCol(!col)} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#09090b] rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    {col ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
            
            <div className={`mx-4 mb-6 p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-3xl ${col ? 'flex justify-center' : ''}`}>
                <div className={`flex items-center gap-3 ${col ? 'justify-center' : 'mb-2'}`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rk.b} flex items-center justify-center text-xs text-white font-bold`}>{userLevel.level}</div>
                    {!col && <div className="flex-1 min-w-0"><p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userLevel.title}</p><p className="text-[10px] text-zinc-500">{userLevel.currentXP}/{xpN} XP</p></div>}
                </div>
                {!col && <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${rk.b}`} style={{ width: `${xpP}%` }} /></div>}
            </div>
            
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {nav.map(i => (
                    <button key={i.id} onClick={() => { setCurrentView(i.id); setMenu(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${currentView === i.id ? 'bg-primary/10 text-primary-light font-medium' : 'hover:bg-zinc-100 dark:hover:bg-[#09090b] hover:text-zinc-900 dark:hover:text-white'} ${col ? 'justify-center' : ''}`} title={col ? i.l : ''}>
                        <i.i size={20} />{!col && i.l}
                    </button>
                ))}
            </nav>
        </aside>

        <main className={`flex-1 overflow-y-auto h-full p-4 md:p-8 bg-zinc-50 dark:bg-[#000000] transition-all duration-300 ${col ? 'md:ml-20' : 'md:ml-64'}`}>
            <div className="max-w-6xl mx-auto h-full">
                {currentView === 'dashboard' && <DashboardView />} 
                {currentView === 'focus' && <FocusView />} 
                {currentView === 'calendar' && <CalendarTab />} 
                {currentView === 'mistakes' && <MistakesView />} 
                {currentView === 'goals' && <GoalsView />} 
                {currentView === 'stats' && <StatsView />} 
                {currentView === 'history' && <HistoryView />} 
                {currentView === 'settings' && <SettingsView />}
                {currentView === 'school' && <SchoolView />}
                {/* 4. Renderizar AchievementsView */}
                {currentView === 'achievements' && <AchievementsView />}
            </div>
        </main>
    </div>
  );
};