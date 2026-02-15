import React, { useContext, useState } from 'react';
// 1. Importar Trophy e ClipboardList (Novo ícone para provas)
import { LayoutDashboard, Zap, Target, BarChart2, History, Settings, Menu, X, ChevronRight, ChevronLeft, Calendar, AlertTriangle, GraduationCap, Trophy, ClipboardList } from 'lucide-react';
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
import { AchievementsView } from '../components/views/AchievementsView';
// 2. Importar ExamsView
import { ExamsView } from '../components/views/ExamsView';

export const AppLayout = () => {
  // 1. Adicionado isActive e setIsActive na desestruturação
  const { currentView, setCurrentView, userLevel, isActive, setIsActive } = useContext(FocusContext);
  const [menu, setMenu] = useState(false); 
  const [col, setCol] = useState(false);
  
  const xpN = getXP(userLevel.level);
  const xpP = Math.min(100, (userLevel.currentXP / xpN) * 100);
  const rk = getRank(userLevel.level);
  
  const nav = [
    { id: 'dashboard', l: 'Painel', i: LayoutDashboard }, 
    { id: 'school', l: 'Escola', i: GraduationCap },
    { id: 'focus', l: 'Focar', i: Zap }, 
    { id: 'exams', l: 'Provas', i: ClipboardList },
    { id: 'achievements', l: 'Conquistas', i: Trophy },
    { id: 'mistakes', l: 'Erros', i: AlertTriangle }, 
    { id: 'calendar', l: 'Calendário', i: Calendar }, 
    { id: 'goals', l: 'Matérias', i: Target }, 
    { id: 'stats', l: 'Estatísticas', i: BarChart2 }, 
    { id: 'history', l: 'Histórico', i: History }, 
    { id: 'settings', l: 'Configurações', i: Settings }
  ];

  // 2. Nova função para gerenciar a segurança da navegação
  const handleNavigation = (viewId) => {
    // Se estiver na view de foco e o timer estiver ativo
    if (currentView === 'focus' && isActive && viewId !== 'focus') {
      const confirmLeave = window.confirm("O timer está rodando! Se sair agora, ele será pausado. Deseja continuar?");
      if (!confirmLeave) return; // Cancela a navegação
      
      setIsActive(false); // Pausa o timer
    }
    
    setCurrentView(viewId);
    setMenu(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#000000] text-zinc-900 dark:text-zinc-300 font-sans font-medium overflow-hidden">
        {/* ... (Cabeçalho Mobile e Menu Overlay mantidos iguais) ... */}
        
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#000000] border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-300 md:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'} ${col ? 'w-20' : 'w-64'}`}>
            {/* ... (Logo e Status do Usuário mantidos iguais) ... */}
            
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {nav.map(i => (
                    // 3. onClick atualizado para usar handleNavigation
                    <button 
                        key={i.id} 
                        onClick={() => handleNavigation(i.id)} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${currentView === i.id ? 'bg-primary/10 text-primary-light font-medium' : 'hover:bg-zinc-100 dark:hover:bg-[#09090b] hover:text-zinc-900 dark:hover:text-white'} ${col ? 'justify-center' : ''}`} 
                        title={col ? i.l : ''}
                    >
                        <i.i size={20} />{!col && i.l}
                    </button>
                ))}
            </nav>
        </aside>

        {/* ... (Main content mantido igual) ... */}
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
                {currentView === 'achievements' && <AchievementsView />}
                {currentView === 'exams' && <ExamsView />}
            </div>
        </main>
    </div>
  );
};