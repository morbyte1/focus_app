import React, { useContext, useMemo, useState } from 'react';
import { Globe, ArrowRight, BarChart2, PieChart as PieChartIcon, Calendar, Clock, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LanguageContext } from '../../context/LanguageContext';
import { FocusContext } from '../../context/FocusContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// --- CUSTOM HOOK DE NEGÓCIO ---
const useLanguageStats = (sessions) => {
  return useMemo(() => {
    const totalWords = sessions.reduce((acc, s) => acc + (s.words?.length || 0), 0);
    const totalGrammarRules = sessions.reduce((acc, s) => {
      if (!s.grammar) return acc;
      const rules = s.grammar.split('\n').filter(r => r.trim() !== '');
      return acc + rules.length;
    }, 0);

    let totalMinutes = 0;
    const skillsCount = {};
    const chartData = [];
    
    // Configurando janela de 7 dias (Domingo a Sábado atual)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

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

    // Calculando métricas de Habilidades e Total de Horas
    sessions.forEach(s => {
        totalMinutes += s.minutes;
        if (s.skills && Array.isArray(s.skills)) {
            s.skills.forEach(skill => {
                skillsCount[skill] = (skillsCount[skill] || 0) + 1;
            });
        }
    });

    const totalHours = (totalMinutes / 60).toFixed(1);
    const skillsData = Object.entries(skillsCount).map(([name, value]) => ({ name, value }));

    return { totalWords, totalGrammarRules, chartData, totalHours, skillsData };
  }, [sessions]);
};

// --- COMPONENTES DE TOOLTIP CUSTOMIZADOS (RECHARTS) ---
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

const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#09090b] border border-zinc-800 p-3 rounded-xl shadow-xl text-white">
          <p className="text-xs text-zinc-300 font-bold capitalize">{payload[0].name}: <span className="text-white font-black">{payload[0].value} sessões</span></p>
        </div>
      );
    }
    return null;
};

// --- VIEW PRINCIPAL ---
export const LanguageView = () => {
  const { activeLanguage, setActiveLanguage, languageSessions, getTheme, languageSchedule, updateLanguageScheduleDay } = useContext(LanguageContext);
  const { setCurrentView } = useContext(FocusContext);
  
  const stats = useLanguageStats(languageSessions.filter(s => s.languageId === activeLanguage));
  const theme = getTheme();

  // Estados para Modal de Edição do Cronograma
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ material: '', minMinutes: 30, skills: [], notes: '' });

  const DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();

  const openEditSchedule = (day) => {
     setEditingDay(day.dayIndex);
     setScheduleForm({ 
         material: day.material || '', 
         minMinutes: day.minMinutes || 30, 
         skills: day.skills || [], 
         notes: day.notes || '' 
     });
  };

  const handleSaveSchedule = (e) => {
     e.preventDefault();
     if (editingDay !== null) {
         updateLanguageScheduleDay(editingDay, scheduleForm);
         setEditingDay(null);
     }
  };

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
                Centro de Idiomas <span className="text-xl">{theme.flag}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Aqui você poderá gerenciar todo o seu estudo e o caminho para a fluência.</p>
        </div>
        <button onClick={() => setActiveLanguage(null)} className="text-xs text-zinc-400 hover:underline">Trocar idioma</button>
      </header>

      <div className={`flex-1 p-6 md:p-10 rounded-[2rem] border transition-colors ${theme.classes.bg} ${theme.classes.border}`}>
          
          <div className="mb-10 text-center md:text-left">
              <h2 className={`text-2xl md:text-4xl font-extrabold ${theme.classes.text} leading-tight`}>
                  Você já estudou <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.totalHours.toString().replace('.', ',')} horas</span> e aprendeu <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.totalWords}</span> palavras em {theme.name}!
              </h2>
          </div>

          {/* Gráficos de KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Gráfico 1: Barras */}
              <div className="bg-white dark:bg-[#000000] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-6">
                      <BarChart2 className="text-zinc-400" size={20} />
                      <h3 className="font-bold text-zinc-900 dark:text-white">Estatísticas da semana</h3>
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

              {/* Gráfico 2: Pizza de Habilidades */}
              <div className="bg-white dark:bg-[#000000] rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-6">
                      <PieChartIcon className="text-zinc-400" size={20} />
                      <h3 className="font-bold text-zinc-900 dark:text-white">Foco de Habilidades</h3>
                  </div>
                  <div className="h-64 w-full flex justify-center items-center">
                      {stats.skillsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.skillsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {stats.skillsData.map((entry, index) => {
                                        const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary, theme.colors.quaternary];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    })}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-zinc-500 text-sm text-center italic">Registre sessões com habilidades<br/>para gerar o gráfico.</p>
                      )}
                  </div>
              </div>
          </div>

          {/* NOVO: Cronograma Semanal */}
          <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                  <Calendar className="text-zinc-400 dark:text-zinc-500" size={24} />
                  <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Cronograma Semanal</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {languageSchedule.map(day => (
                      <div key={day.dayIndex} className={`bg-white dark:bg-[#000000] p-5 rounded-2xl border transition-all ${todayIndex === day.dayIndex ? theme.classes.highlight : 'border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'} shadow-sm relative group`}>
                          
                          <button onClick={() => openEditSchedule(day)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <Edit2 size={16} />
                          </button>

                          <h4 className={`font-bold ${todayIndex === day.dayIndex ? theme.classes.text : 'text-zinc-900 dark:text-white'} mb-4 flex items-center`}>
                              {DAYS_OF_WEEK[day.dayIndex]} 
                              {todayIndex === day.dayIndex && <span className="text-[10px] ml-2 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Hoje</span>}
                          </h4>

                          <div className="space-y-4 text-sm">
                              <div>
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Material</span>
                                  <p className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{day.material || <span className="italic text-zinc-400 font-normal">Livre</span>}</p>
                              </div>
                              <div>
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1"><Clock size={12}/> Meta de Tempo</span>
                                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">{day.minMinutes} min</p>
                              </div>
                              {day.skills.length > 0 && (
                                  <div>
                                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Habilidades em Foco</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {day.skills.map(s => <span key={s} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] px-2 py-1 rounded-md uppercase font-bold">{s}</span>)}
                                      </div>
                                  </div>
                              )}
                              {day.notes && (
                                  <div>
                                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Notas e Metas</span>
                                      <p className="text-zinc-600 dark:text-zinc-400 text-xs italic line-clamp-3 leading-relaxed">"{day.notes}"</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex justify-center md:justify-end border-t border-zinc-200/50 dark:border-zinc-800/50 pt-8">
              <button 
                onClick={() => setCurrentView('focus')}
                className={`px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-transform hover:scale-105 shadow-xl ${theme.classes.button}`}
              >
                  Iniciar Sessão de Idioma <ArrowRight size={20} />
              </button>
          </div>
      </div>

      {/* MODAL DE EDIÇÃO DO CRONOGRAMA */}
      <Modal isOpen={editingDay !== null} onClose={() => setEditingDay(null)} title={`Planejar: ${editingDay !== null ? DAYS_OF_WEEK[editingDay] : ''}`}>
          <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Material de Estudo</label>
                  <input type="text" placeholder="Ex: Duolingo, Livro X, Podcast..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm outline-none focus:border-primary text-zinc-900 dark:text-white" value={scheduleForm.material} onChange={e => setScheduleForm(p => ({ ...p, material: e.target.value }))} />
              </div>
              
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Tempo Mínimo (minutos)</label>
                  <input type="number" min="1" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm outline-none focus:border-primary text-zinc-900 dark:text-white" value={scheduleForm.minMinutes} onChange={e => setScheduleForm(p => ({ ...p, minMinutes: Number(e.target.value) }))} />
              </div>
              
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Habilidades em Foco</label>
                  <div className="grid grid-cols-2 gap-2">
                      {[ { id: 'escuta', l: 'Escuta' }, { id: 'leitura', l: 'Leitura' }, { id: 'fala', l: 'Fala' }, { id: 'escrita', l: 'Escrita' } ].map(s => {
                          const isSelected = scheduleForm.skills.includes(s.id);
                          return (
                              <button type="button" key={s.id} onClick={() => {
                                  setScheduleForm(p => ({
                                      ...p, skills: isSelected ? p.skills.filter(x => x !== s.id) : [...p.skills, s.id]
                                  }))
                              }} className={`p-3 rounded-xl border text-sm font-bold transition-all ${isSelected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>{s.l}</button>
                          );
                      })}
                  </div>
              </div>
              
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Notas e Objetivos (Opcional)</label>
                  <textarea placeholder="Ex: Fazer 2 lições inteiras..." className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm outline-none focus:border-primary h-24 resize-none text-zinc-900 dark:text-white" value={scheduleForm.notes} onChange={e => setScheduleForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              
              <div className="pt-2 flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setEditingDay(null)} className="flex-1 py-3">Cancelar</Button>
                  <Button type="submit" className="flex-[2] py-3 shadow-lg shadow-primary/30">Salvar Plano</Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};