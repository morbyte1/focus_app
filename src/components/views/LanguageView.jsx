import React, { useContext, useMemo } from 'react';
import { Globe, ArrowRight, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LanguageContext } from '../../context/LanguageContext';
import { FocusContext } from '../../context/FocusContext';

// --- CUSTOM HOOK DE NEGÓCIO ---
const useLanguageStats = (sessions) => {
  return useMemo(() => {
    const totalWords = sessions.reduce((acc, s) => acc + (s.words?.length || 0), 0);
    const totalGrammarRules = sessions.reduce((acc, s) => {
      if (!s.grammar) return acc;
      const rules = s.grammar.split('\n').filter(r => r.trim() !== '');
      return acc + rules.length;
    }, 0);

    const chartData = [];
    
    // TAREFA 3: Encontrar o Domingo desta semana (Semana Estática Dom-Sáb)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

    // Gerando de Domingo (0) a Sábado (6)
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toDateString();
      const daySessions = sessions.filter(s => new Date(s.date).toDateString() === dateStr);
      
      chartData.push({
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        minutes: daySessions.reduce((a, b) => a + b.minutes, 0),
        words: daySessions.reduce((a, b) => a + (b.words?.length || 0), 0)
      });
    }

    return { totalWords, totalGrammarRules, chartData };
  }, [sessions]);
};

// --- COMPONENTE DE TOOLTIP CUSTOMIZADO (RECHARTS) ---
const CustomLanguageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#09090b] border border-zinc-800 p-3 rounded-xl shadow-xl text-white">
        <p className="font-bold text-sm mb-1">{label}</p>
        <p className="text-xs text-zinc-300">Tempo estudado: <span className="font-bold text-white">{data.minutes} min</span></p>
        <p className="text-xs text-zinc-300">Palavras aprendidas: <span className="font-bold text-white">{data.words}</span></p>
      </div>
    );
  }
  return null;
};

// --- VIEW PRINCIPAL ---
export const LanguageView = () => {
  const { activeLanguage, setActiveLanguage, languageSessions, getTheme } = useContext(LanguageContext);
  const { setCurrentView } = useContext(FocusContext);
  
  // ✅ CORREÇÃO BUG 3: Filtro estrito removendo o "!s.languageId"
  const stats = useLanguageStats(languageSessions.filter(s => s.languageId === activeLanguage));
  const theme = getTheme();

  // Fase B: Onboarding
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
            <button 
                key={lang.id} 
                onClick={() => setActiveLanguage(lang.id)}
                className={`${lang.color} text-white p-10 rounded-3xl transition-transform hover:-translate-y-2 flex flex-col items-center gap-4 shadow-xl shadow-black/10`}
            >
              <span className="text-7xl drop-shadow-md">{lang.flag}</span>
              <span className="text-xl font-bold tracking-wide">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fase B: Post-Onboarding (Dashboard de Idiomas)
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0 h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                Idiomas <span className="text-xl">{theme.flag}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Acompanhamento imersivo e aquisição de fluência.</p>
        </div>
        <button onClick={() => setActiveLanguage(null)} className="text-xs text-zinc-400 hover:underline">Trocar idioma</button>
      </header>

      <div className={`flex-1 p-6 md:p-10 rounded-[2rem] border transition-colors ${theme.classes.bg} ${theme.classes.border}`}>
          
          <div className="mb-10 text-center md:text-left">
              <h2 className={`text-2xl md:text-4xl font-extrabold ${theme.classes.text} leading-tight`}>
                  Você já aprendeu <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.totalWords}</span> palavras e <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.totalGrammarRules}</span> regras gramaticais em {theme.name}.
              </h2>
          </div>

          <div className="bg-white dark:bg-[#000000] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800/50 mb-8">
              <div className="flex items-center gap-2 mb-6">
                  <BarChart2 className="text-zinc-400" size={20} />
                  <h3 className="font-bold text-zinc-900 dark:text-white">Imersão (Últimos 7 dias)</h3>
              </div>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                          <Tooltip content={<CustomLanguageTooltip />} cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="minutes" fill={theme.colors.secondary} radius={[6, 6, 6, 6]} maxBarSize={50} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="flex justify-center md:justify-end">
              <button 
                onClick={() => setCurrentView('focus')}
                className={`px-8 py-4 rounded-full text-white font-bold flex items-center gap-3 transition-transform hover:scale-105 shadow-xl ${theme.classes.button}`}
              >
                  Iniciar Sessão de Idioma <ArrowRight size={20} />
              </button>
          </div>
      </div>
    </div>
  );
};