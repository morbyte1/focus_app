import React, { useContext, useMemo, useEffect } from 'react';
import { Trophy, Lock, Star, Medal, Target, Zap, BookOpen, AlertTriangle, Crown, Flame, Sun, Moon, Crosshair, Sparkles } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

// CONFIGURAÇÃO COMPLETA DAS CONQUISTAS
const ACHIEVEMENTS_DB = [
  // === AQUECIMENTO ===
  { id: 'aq_1', tier: 'Aquecimento', title: 'Aquecimento', desc: 'Estudou 30 minutos em um dia.', xp: 50, icon: Flame, color: 'text-orange-400', bg: 'from-orange-500/20 to-red-500/5', check: (s) => s.maxDailyMinutes >= 30 },
  { id: 'aq_2', tier: 'Aquecimento', title: 'Primeiro Degrau', desc: 'Estudou 1 hora em um dia.', xp: 100, icon: Target, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/5', check: (s) => s.maxDailyMinutes >= 60 },
  { id: 'aq_3', tier: 'Aquecimento', title: 'Foco em Dobro', desc: 'Estudou 2 dias seguidos.', xp: 150, icon: Zap, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/5', check: (s) => s.streak >= 2 },
  { id: 'aq_4', tier: 'Aquecimento', title: 'Arquiteto', desc: 'Criou sua primeira matéria.', xp: 50, icon: BookOpen, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/5', check: (s) => s.totalSubjects >= 1 },
  { id: 'aq_5', tier: 'Aquecimento', title: 'Ciclo Inicial', desc: 'Concluiu 1 sessão de estudo.', xp: 50, icon: Zap, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/5', check: (s) => s.totalSessions >= 1 },
  { id: 'aq_6', tier: 'Aquecimento', title: 'Trindade de Foco', desc: 'Concluiu 3 sessões no mesmo dia.', xp: 100, icon: Layers, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-blue-500/5', check: (s) => s.maxDailySessions >= 3 },
  { id: 'aq_7', tier: 'Aquecimento', title: 'Planejador', desc: 'Adicionou sua primeira meta semanal.', xp: 50, icon: Target, color: 'text-red-400', bg: 'from-red-500/20 to-orange-500/5', check: (s) => s.hasGoals },
  { id: 'aq_8', tier: 'Aquecimento', title: 'Rotina Viva', desc: 'Registrou 5 sessões de estudo.', xp: 100, icon: Zap, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-500/5', check: (s) => s.totalSessions >= 5 },
  { id: 'aq_9', tier: 'Aquecimento', title: 'Polímata Iniciante', desc: 'Estudou 2 matérias diferentes no mesmo dia.', xp: 150, icon: BookOpen, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/5', check: (s) => s.maxDailySubjects >= 2 },
  { id: 'aq_10', tier: 'Aquecimento', title: 'Consistência Inicial', desc: 'Registrou 10 sessões no total.', xp: 200, icon: Zap, color: 'text-teal-400', bg: 'from-teal-500/20 to-green-500/5', check: (s) => s.totalSessions >= 10 },
  { id: 'aq_11', tier: 'Aquecimento', title: 'Explorador', desc: 'Adicionou 3 tópicos em uma matéria.', xp: 100, icon: BookOpen, color: 'text-amber-400', bg: 'from-amber-500/20 to-yellow-500/5', check: (s) => s.maxTopicsInSubject >= 3 },
  { id: 'aq_12', tier: 'Aquecimento', title: 'Madrugador', desc: 'Estudou antes das 8:00 AM.', xp: 150, icon: Sun, color: 'text-yellow-500', bg: 'from-yellow-400/20 to-orange-400/5', check: (s) => s.earlyBird },
  { id: 'aq_13', tier: 'Aquecimento', title: 'Coruja', desc: 'Estudou após as 22:00 PM.', xp: 150, icon: Moon, color: 'text-indigo-500', bg: 'from-indigo-600/20 to-purple-600/5', check: (s) => s.nightOwl },
  { id: 'aq_14', tier: 'Aquecimento', title: 'Colecionador', desc: 'Adicionou 3 matérias diferentes.', xp: 100, icon: BookOpen, color: 'text-pink-400', bg: 'from-pink-500/20 to-rose-500/5', check: (s) => s.totalSubjects >= 3 },
  { id: 'aq_15', tier: 'Aquecimento', title: 'Iniciante em Questões', desc: 'Resolveu 25 questões no total.', xp: 100, icon: Crosshair, color: 'text-blue-500', bg: 'from-blue-500/20 to-indigo-500/5', check: (s) => s.totalQuestions >= 25 },

  // === APRENDIZ ===
  { id: 'ap_1', tier: 'Aprendiz', title: 'Hábito Formado', desc: 'Estudou por 5 dias seguidos.', xp: 300, icon: Flame, color: 'text-orange-500', bg: 'from-orange-600/20 to-red-600/5', check: (s) => s.streak >= 5 },
  { id: 'ap_2', tier: 'Aprendiz', title: 'Primeiras Dez', desc: 'Acumulou 10 horas totais de estudo.', xp: 400, icon: ClockIcon, color: 'text-blue-500', bg: 'from-blue-600/20 to-indigo-600/5', check: (s) => s.totalHours >= 10 },
  { id: 'ap_3', tier: 'Aprendiz', title: 'Maratonista', desc: 'Estudou 4 horas em um único dia.', xp: 500, icon: Trophy, color: 'text-yellow-500', bg: 'from-yellow-600/20 to-orange-600/5', check: (s) => s.maxDailyMinutes >= 240 },
  { id: 'ap_4', tier: 'Aprendiz', title: 'Equilibrado', desc: 'Registrou estudos em 5 matérias diferentes.', xp: 350, icon: BookOpen, color: 'text-emerald-500', bg: 'from-emerald-600/20 to-teal-600/5', check: (s) => s.totalSubjectsUsed >= 5 },
  { id: 'ap_5', tier: 'Aprendiz', title: 'Sprint Semanal', desc: 'Completou 10 sessões em 7 dias.', xp: 400, icon: Zap, color: 'text-purple-500', bg: 'from-purple-600/20 to-pink-600/5', check: (s) => s.maxWeeklySessions >= 10 },
  { id: 'ap_6', tier: 'Aprendiz', title: 'Evolução Consciente', desc: 'Resolveu 200 questões no total.', xp: 300, icon: Crosshair, color: 'text-cyan-500', bg: 'from-cyan-600/20 to-blue-600/5', check: (s) => s.totalQuestions >= 200 },
  { id: 'ap_7', tier: 'Aprendiz', title: 'Disciplina de Ferro', desc: 'Estudou 1 hora por dia em 5 dias diferentes.', xp: 450, icon: ShieldIcon, color: 'text-zinc-500', bg: 'from-zinc-600/20 to-gray-600/5', check: (s) => s.daysWith1Hour >= 5 },
  { id: 'ap_8', tier: 'Aprendiz', title: 'Meio Centurião', desc: 'Completou 50 sessões no total.', xp: 400, icon: Star, color: 'text-amber-500', bg: 'from-amber-600/20 to-yellow-600/5', check: (s) => s.totalSessions >= 50 },
  { id: 'ap_9', tier: 'Aprendiz', title: 'Aprendiz em Questões', desc: 'Resolveu 100 questões no total.', xp: 250, icon: Crosshair, color: 'text-blue-500', bg: 'from-blue-600/20 to-indigo-600/5', check: (s) => s.totalQuestions >= 100 },
  { id: 'ap_10', tier: 'Aprendiz', title: 'Guerreiro de Questões', desc: 'Resolveu 500 questões no total.', xp: 600, icon: Crosshair, color: 'text-red-500', bg: 'from-red-600/20 to-orange-600/5', check: (s) => s.totalQuestions >= 500 },

  // === ESPECIALISTA ===
  { id: 'esp_1', tier: 'Especialista', title: 'Inabalável', desc: 'Estudou por 10 dias seguidos.', xp: 1000, icon: Flame, color: 'text-red-500', bg: 'from-red-600/20 to-orange-600/5', check: (s) => s.streak >= 10 },
  { id: 'esp_2', tier: 'Especialista', title: 'Meio Milhar', desc: 'Acumulou 50 horas totais de estudo.', xp: 1200, icon: ClockIcon, color: 'text-blue-600', bg: 'from-blue-700/20 to-indigo-700/5', check: (s) => s.totalHours >= 50 },
  { id: 'esp_3', tier: 'Especialista', title: 'Veterano', desc: 'Completou 200 sessões no total.', xp: 1500, icon: Medal, color: 'text-yellow-600', bg: 'from-yellow-700/20 to-amber-700/5', check: (s) => s.totalSessions >= 200 },
  { id: 'esp_4', tier: 'Especialista', title: 'Mestre do Tempo', desc: 'Acumulou 100 horas totais de estudo.', xp: 2000, icon: ClockIcon, color: 'text-purple-600', bg: 'from-purple-700/20 to-pink-700/5', check: (s) => s.totalHours >= 100 },
  { id: 'esp_5', tier: 'Especialista', title: 'Sábio', desc: 'Manteve aproveitamento acima de 80% em 100+ questões.', xp: 1800, icon: Sparkles, color: 'text-emerald-600', bg: 'from-emerald-700/20 to-green-700/5', check: (s) => s.totalQuestions >= 100 && s.accuracy >= 80 },
  { id: 'esp_6', tier: 'Especialista', title: 'Persistência Suprema', desc: 'Manteve uma sequência de 15 dias de estudo.', xp: 2500, icon: Flame, color: 'text-orange-600', bg: 'from-orange-700/20 to-red-700/5', check: (s) => s.streak >= 15 },
  { id: 'esp_7', tier: 'Especialista', title: 'Centurião Pomodoro', desc: 'Concluiu 100 sessões de estudo.', xp: 1000, icon: Target, color: 'text-red-600', bg: 'from-red-700/20 to-orange-700/5', check: (s) => s.totalSessions >= 100 },
  { id: 'esp_8', tier: 'Especialista', title: 'Especialista em Questões', desc: 'Resolveu 250 questões no total.', xp: 800, icon: Crosshair, color: 'text-indigo-600', bg: 'from-indigo-700/20 to-blue-700/5', check: (s) => s.totalQuestions >= 250 },

  // === LENDÁRIO ===
  { id: 'len_1', tier: 'Lendário', title: 'Lenda Viva', desc: 'Estudou por 30 dias seguidos.', xp: 5000, icon: Crown, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-amber-500/10', check: (s) => s.streak >= 30 },
  { id: 'len_2', tier: 'Lendário', title: 'Imortal', desc: 'Acumulou 250 horas totais de estudo.', xp: 4000, icon: Zap, color: 'text-purple-400', bg: 'from-purple-500/20 to-fuchsia-500/10', check: (s) => s.totalHours >= 250 },
  { id: 'len_3', tier: 'Lendário', title: 'Guardião do Conhecimento', desc: 'Acumulou 500 horas totais de estudo.', xp: 6000, icon: BookOpen, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/10', check: (s) => s.totalHours >= 500 },
  { id: 'len_4', tier: 'Lendário', title: 'Sniper de Elite', desc: 'Resolveu 5.000 questões no total.', xp: 5500, icon: Crosshair, color: 'text-red-400', bg: 'from-red-500/20 to-orange-500/10', check: (s) => s.totalQuestions >= 5000 },
  { id: 'len_5', tier: 'Lendário', title: 'Mestre Supremo', desc: 'Consagrou seu nome com 1.000 horas de estudo.', xp: 10000, icon: Crown, color: 'text-amber-300', bg: 'from-amber-400/20 to-yellow-400/10', check: (s) => s.totalHours >= 1000 },
  { id: 'len_6', tier: 'Lendário', title: 'Lendário em Questões', desc: 'Resolveu 1.000 questões no total.', xp: 3000, icon: Crosshair, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/10', check: (s) => s.totalQuestions >= 1000 },

  // === DIVINO ===
  { id: 'div_1', tier: 'Divino', title: 'Divindade do Focus', desc: 'A conquista suprema. Você zerou os estudos.', xp: 50000, icon: Sun, color: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]', bg: 'from-white/20 to-blue-300/10', check: (s) => s.totalHours >= 2000 && s.totalQuestions >= 10000 },
];

// Ícones auxiliares
function ClockIcon(props) { return <Target {...props} /> }
function LayersIcon(props) { return <Layers {...props} /> }
function ShieldIcon(props) { return <Trophy {...props} /> }

export const AchievementsView = () => {
  const { sessions, subjects, themes, unlockedAchievements, unlockAchievement } = useContext(FocusContext);

  // 1. Calcular Métricas Avançadas
  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);
    const totalQuestions = sessions.reduce((acc, s) => acc + (s.questions || 0), 0);
    const totalErrors = sessions.reduce((acc, s) => acc + (s.errors || 0), 0);
    const accuracy = totalQuestions > 0 ? ((totalQuestions - totalErrors) / totalQuestions) * 100 : 0;
    
    // Agrupar sessões por dia
    const sessionsByDay = {};
    sessions.forEach(s => {
        const day = new Date(s.date).toDateString();
        if (!sessionsByDay[day]) sessionsByDay[day] = [];
        sessionsByDay[day].push(s);
    });

    const days = Object.values(sessionsByDay);
    
    // Métricas diárias
    let maxDailyMinutes = 0;
    let maxDailySessions = 0;
    let maxDailySubjects = 0;
    let daysWith1Hour = 0;
    let maxWeeklySessions = 0; // Aproximação de sprint semanal (janela móvel simples ou maior dia x 7)

    days.forEach(daySessions => {
        const mins = daySessions.reduce((a, b) => a + b.minutes, 0);
        if (mins > maxDailyMinutes) maxDailyMinutes = mins;
        if (daySessions.length > maxDailySessions) maxDailySessions = daySessions.length;
        if (mins >= 60) daysWith1Hour++;
        
        const subjectsInDay = new Set(daySessions.map(s => s.subjectId)).size;
        if (subjectsInDay > maxDailySubjects) maxDailySubjects = subjectsInDay;
    });

    // Calcular Sprint Semanal (Janela de 7 dias)
    const sortedDates = Object.keys(sessionsByDay).map(d => new Date(d)).sort((a,b) => a - b);
    for (let i = 0; i < sortedDates.length; i++) {
        let count = 0;
        const startWindow = sortedDates[i];
        const endWindow = new Date(startWindow);
        endWindow.setDate(endWindow.getDate() + 7);
        
        sessions.forEach(s => {
            const d = new Date(s.date);
            if (d >= startWindow && d < endWindow) count++;
        });
        if (count > maxWeeklySessions) maxWeeklySessions = count;
    }

    // Calcular Streak
    const todayS = new Date().toDateString();
    const datesSet = new Set(sessions.map(s => new Date(s.date).toDateString()));
    let streak = 0, d = new Date();
    // Lógica para contar streak, permitindo "pular" fim de semana se não houver estudo ou contar continuamente
    // Simplificado: Conta dias consecutivos para trás
    while (datesSet.has(d.toDateString()) || (d.toDateString()===todayS && !datesSet.has(todayS))) { 
        if (datesSet.has(d.toDateString())) streak++; 
        d.setDate(d.getDate() - 1); 
        if(d < new Date(new Date().getFullYear()-1,0,1)) break; 
    }

    // Outros verificadores
    const earlyBird = sessions.some(s => new Date(s.date).getHours() < 8);
    const nightOwl = sessions.some(s => new Date(s.date).getHours() >= 22);
    
    // Tópicos (Máximo em uma matéria)
    let maxTopicsInSubject = 0;
    subjects.forEach(sub => {
        const count = themes.filter(t => t.subjectId === sub.id).length; // Tópicos cadastrados
        if (count > maxTopicsInSubject) maxTopicsInSubject = count;
    });
    
    const totalSubjectsUsed = new Set(sessions.map(s => s.subjectId)).size;

    return {
        totalMinutes,
        totalHours: totalMinutes / 60,
        totalSessions: sessions.length,
        totalQuestions,
        accuracy,
        totalSubjects: subjects.length,
        hasGoals: subjects.some(s => s.goalHours > 0),
        maxDailyMinutes,
        maxDailySessions,
        maxDailySubjects,
        maxWeeklySessions,
        streak,
        earlyBird,
        nightOwl,
        maxTopicsInSubject,
        totalSubjectsUsed,
        daysWith1Hour
    };
  }, [sessions, subjects, themes]);

  // 2. Processar e Verificar Desbloqueios
  const processedAchievements = useMemo(() => {
    return ACHIEVEMENTS_DB.map(ach => {
      const isUnlocked = ach.check(stats);
      return { ...ach, isUnlocked };
    });
  }, [stats]);

  // 3. Efeito para disparar XP (Verifica se já não foi ganho antes)
  useEffect(() => {
    processedAchievements.forEach(ach => {
        if (ach.isUnlocked && !unlockedAchievements.includes(ach.id)) {
            unlockAchievement(ach.id, ach.xp, ach.title);
        }
    });
  }, [processedAchievements, unlockedAchievements, unlockAchievement]);

  const totalUnlocked = processedAchievements.filter(a => a.isUnlocked).length;
  const tiers = ['Aquecimento', 'Aprendiz', 'Especialista', 'Lendário', 'Divino'];

  return (
    <div className="space-y-10 animate-fadeIn pb-24 md:pb-0">
      
      {/* HEADER GAMIFICADO */}
      <header className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-white border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-400 drop-shadow-lg" size={40} /> Hall da Fama
            </h1>
            <p className="text-zinc-400 text-lg">Sua jornada épica de estudos imortalizada aqui.</p>
          </div>
          <div className="text-right">
             <span className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                {totalUnlocked} <span className="text-2xl text-zinc-600 font-medium">/ {ACHIEVEMENTS_DB.length}</span>
             </span>
             <div className="w-64 h-3 bg-zinc-800 rounded-full mt-3 overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-primary to-purple-500 transition-all duration-1000 shadow-[0_0_15px_currentColor]" 
                  style={{ width: `${(totalUnlocked / ACHIEVEMENTS_DB.length) * 100}%` }}
                />
             </div>
          </div>
        </div>
      </header>

      {/* SEÇÕES DE TIERS */}
      {tiers.map(tier => {
        const tierItems = processedAchievements.filter(a => a.tier === tier);
        if (tierItems.length === 0) return null;

        let tierColor = "text-zinc-400";
        if (tier === 'Aquecimento') tierColor = "text-orange-400";
        if (tier === 'Aprendiz') tierColor = "text-blue-400";
        if (tier === 'Especialista') tierColor = "text-purple-400";
        if (tier === 'Lendário') tierColor = "text-yellow-400";
        if (tier === 'Divino') tierColor = "text-white animate-pulse";

        return (
          <div key={tier} className="space-y-5">
            <h2 className={`text-2xl font-black uppercase tracking-widest flex items-center gap-3 ${tierColor} border-b border-zinc-200 dark:border-zinc-800 pb-2`}>
              {tier === 'Divino' ? <Sun size={24}/> : <Medal size={24}/>}
              Nível {tier}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tierItems.map(item => (
                <Card 
                  key={item.id} 
                  className={`
                    relative overflow-hidden transition-all duration-500 border
                    ${item.isUnlocked 
                        ? 'border-transparent bg-white dark:bg-[#09090b] shadow-xl dark:shadow-black/50 hover:-translate-y-1' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/30 opacity-60 grayscale-[0.8]'
                    }
                  `}
                >
                  {/* Borda Gradiente e Glow para Desbloqueados */}
                  {item.isUnlocked && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} opacity-20 pointer-events-none transition-opacity duration-500`}/>
                  )}

                  <div className="relative z-10 flex gap-5 items-center">
                    {/* ÍCONE */}
                    <div className={`
                        w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-lg
                        ${item.isUnlocked 
                            ? `bg-zinc-100 dark:bg-zinc-900 ${item.color} scale-110` 
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 scale-100'
                        }
                    `}>
                        {item.isUnlocked ? <item.icon size={32} strokeWidth={1.5} /> : <Lock size={28} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <h3 className={`font-bold text-lg leading-tight mb-1 truncate ${item.isUnlocked ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                {item.title}
                             </h3>
                        </div>
                        
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                            {item.desc}
                        </p>

                        {/* STATUS */}
                         <div className="flex items-center justify-between">
                            {item.isUnlocked ? (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-500 px-2 py-1 rounded-md border border-green-500/20 flex items-center gap-1">
                                    Conquistado <Sparkles size={10}/>
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bloqueado</span>
                            )}
                            
                            {item.isUnlocked && (
                                <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                                    +{item.xp} XP
                                </span>
                            )}
                         </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};