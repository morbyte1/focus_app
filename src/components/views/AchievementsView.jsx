import React, { useContext, useMemo } from 'react';
import { Trophy, Lock, Star, Medal, Target, Zap, BookOpen, AlertTriangle, Crown } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

// Configuração das Conquistas (Extensível)
const ACHIEVEMENTS_DATA = [
  // === NÍVEL 1: APRENDIZ ===
  {
    id: 'time_1',
    tier: 'Aprendiz',
    title: 'Aquecimento Mental',
    desc: 'Acumule 300 minutos (5h) de estudo total.',
    target: 300,
    metric: 'minutes',
    icon: ClockIcon,
    xp: 500,
    color: 'text-blue-400',
    bg: 'from-blue-500/20 to-cyan-500/5'
  },
  {
    id: 'topic_1',
    tier: 'Aprendiz',
    title: 'Primeiros Passos',
    desc: 'Finalize 5 tópicos de estudo.',
    target: 5,
    metric: 'topics',
    icon: BookOpen,
    xp: 300,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-green-500/5'
  },
  {
    id: 'mistake_1',
    tier: 'Aprendiz',
    title: 'Humildade',
    desc: 'Registre 10 erros no caderno para aprender.',
    target: 10,
    metric: 'mistakes',
    icon: AlertTriangle,
    xp: 200,
    color: 'text-orange-400',
    bg: 'from-orange-500/20 to-yellow-500/5'
  },
  {
    id: 'session_1',
    tier: 'Aprendiz',
    title: 'Iniciando a Jornada',
    desc: 'Complete 10 sessões de foco.',
    target: 10,
    metric: 'sessions',
    icon: Zap,
    xp: 250,
    color: 'text-purple-400',
    bg: 'from-purple-500/20 to-pink-500/5'
  },

  // === NÍVEL 2: ESPECIALISTA ===
  {
    id: 'time_2',
    tier: 'Especialista',
    title: 'Maratonista',
    desc: 'Alcance 1.000 minutos de estudo.',
    target: 1000,
    metric: 'minutes',
    icon: ClockIcon,
    xp: 1500,
    color: 'text-blue-500',
    bg: 'from-blue-600/20 to-indigo-600/5'
  },
  {
    id: 'topic_2',
    tier: 'Especialista',
    title: 'Devorador de Conteúdo',
    desc: 'Finalize 20 tópicos de estudo.',
    target: 20,
    metric: 'topics',
    icon: BookOpen,
    xp: 1000,
    color: 'text-emerald-500',
    bg: 'from-emerald-600/20 to-teal-600/5'
  },
  {
    id: 'mistake_2',
    tier: 'Especialista',
    title: 'Rei da Revisão',
    desc: 'Registre 30 erros.',
    target: 30,
    metric: 'mistakes',
    icon: AlertTriangle,
    xp: 800,
    color: 'text-orange-500',
    bg: 'from-orange-600/20 to-red-600/5'
  },
  
  // === NÍVEL 3: MESTRE ===
  {
    id: 'time_3',
    tier: 'Mestre',
    title: 'Senhor do Tempo',
    desc: 'Atinja a marca de 5.000 minutos estudados.',
    target: 5000,
    metric: 'minutes',
    icon: Crown,
    xp: 5000,
    color: 'text-yellow-400',
    bg: 'from-yellow-500/20 to-amber-600/5'
  },
  {
    id: 'topic_3',
    tier: 'Mestre',
    title: 'Polímata',
    desc: 'Finalize 50 tópicos diferentes.',
    target: 50,
    metric: 'topics',
    icon: Star,
    xp: 3500,
    color: 'text-yellow-400',
    bg: 'from-yellow-500/20 to-orange-600/5'
  },
];

// Componente ícone auxiliar para evitar repetição
function ClockIcon(props) { return <Target {...props} /> }

export const AchievementsView = () => {
  const { sessions, mistakes, themes } = useContext(FocusContext);

  // 1. Calcular Métricas Atuais (Baseado no Contexto Existente)
  const stats = useMemo(() => {
    return {
      minutes: sessions.reduce((acc, s) => acc + s.minutes, 0),
      sessions: sessions.length,
      mistakes: mistakes.length,
      topics: themes.reduce((acc, t) => acc + t.items.filter(i => i.completed).length, 0)
    };
  }, [sessions, mistakes, themes]);

  // 2. Processar Conquistas com Progresso
  const processedAchievements = useMemo(() => {
    return ACHIEVEMENTS_DATA.map(ach => {
      const current = stats[ach.metric] || 0;
      const progress = Math.min(100, (current / ach.target) * 100);
      const isUnlocked = current >= ach.target;
      return { ...ach, current, progress, isUnlocked };
    });
  }, [stats]);

  // Agrupar por Tier
  const tiers = ['Aprendiz', 'Especialista', 'Mestre'];
  
  const totalUnlocked = processedAchievements.filter(a => a.isUnlocked).length;
  const totalAchievements = ACHIEVEMENTS_DATA.length;

  return (
    <div className="space-y-8 animate-fadeIn pb-24 md:pb-0">
      
      {/* HEADER GAMIFICADO */}
      <header className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-white border border-zinc-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} /> Sala de Troféus
            </h1>
            <p className="text-zinc-400">Desbloqueie marcos importantes na sua jornada de estudos.</p>
          </div>
          <div className="text-right">
             <span className="text-4xl font-bold">{totalUnlocked} <span className="text-lg text-zinc-500 font-normal">/ {totalAchievements}</span></span>
             <div className="w-48 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000" 
                  style={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
                />
             </div>
          </div>
        </div>
      </header>

      {/* SEÇÕES DE TIERS */}
      {tiers.map(tier => {
        const tierItems = processedAchievements.filter(a => a.tier === tier);
        if (tierItems.length === 0) return null;

        return (
          <div key={tier} className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              {tier === 'Aprendiz' && <Medal size={20} className="text-orange-400"/>}
              {tier === 'Especialista' && <Medal size={20} className="text-zinc-400"/>}
              {tier === 'Mestre' && <Medal size={20} className="text-yellow-400"/>}
              Nível {tier}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tierItems.map(item => (
                <Card 
                  key={item.id} 
                  className={`
                    relative overflow-hidden transition-all duration-300 border-2
                    ${item.isUnlocked 
                        ? 'border-transparent bg-white dark:bg-[#09090b] shadow-lg dark:shadow-primary/5' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b]/50 opacity-90'
                    }
                  `}
                >
                  {/* Borda Gradiente para Desbloqueados */}
                  {item.isUnlocked && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} opacity-20 pointer-events-none`}/>
                  )}

                  <div className="relative z-10 flex gap-4 items-start">
                    {/* ÍCONE */}
                    <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors
                        ${item.isUnlocked 
                            ? `bg-zinc-100 dark:bg-zinc-900 ${item.color} shadow-inner` 
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 grayscale'
                        }
                    `}>
                        {item.isUnlocked ? <item.icon size={28} strokeWidth={1.5} /> : <Lock size={24} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <h3 className={`font-bold text-lg leading-tight mb-1 ${item.isUnlocked ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                {item.title}
                             </h3>
                             {item.isUnlocked && (
                                <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">
                                    +{item.xp} XP
                                </span>
                             )}
                        </div>
                        
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
                            {item.desc}
                        </p>

                        {/* BARRA DE PROGRESSO */}
                        <div>
                             <div className="flex justify-between text-xs font-bold uppercase text-zinc-400 mb-1">
                                <span>Progresso</span>
                                <span>{Math.floor(item.current)} / {item.target}</span>
                             </div>
                             <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${item.isUnlocked ? 'bg-gradient-to-r from-primary to-purple-500' : 'bg-zinc-400'}`}
                                    style={{ width: `${item.progress}%` }} 
                                />
                             </div>
                        </div>
                    </div>
                  </div>
                  
                  {/* Selo de Conquistado */}
                  {item.isUnlocked && (
                     <div className="absolute -bottom-6 -right-6 text-primary/5 rotate-12 pointer-events-none">
                        <Trophy size={100} />
                     </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};