import React, { useContext, useMemo, useState } from 'react';
import { 
  Globe, ArrowRight, BarChart2, PieChart as PieChartIcon, 
  Calendar, Clock, Edit2, RefreshCw, Ear, Eye, Mic, BookOpen, 
  Plus, Trash2, ExternalLink 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LanguageContext } from '../../context/LanguageContext';
import { FocusContext } from '../../context/FocusContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// --- MAPA DE ÍCONES PARA HABILIDADES ---
const SKILL_ICONS = {
  'escuta': Ear,
  'leitura': Eye,
  'fala': Mic,
  'escrita': BookOpen
};

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

    sessions.forEach(s => {
        totalMinutes += s.minutes;
        if (s.skills && Array.isArray(s.skills)) {
            s.skills.forEach(skill => {
                skillsCount[skill] = (skillsCount[skill] || 0) + 1;
            });
        }
    });

    // Formatação de Tempo Amigável
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    let formattedTime = "";
    if (hours > 0) {
      formattedTime += `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    if (hours > 0 && mins > 0) {
      formattedTime += " e ";
    }
    if (mins > 0 || totalMinutes === 0) {
      formattedTime += `${mins} minuto${mins !== 1 ? 's' : ''}`;
    }

    const skillsData = Object.entries(skillsCount).map(([name, value]) => ({ name, value }));
    return { totalWords, totalGrammarRules, chartData, formattedTime, skillsData };
  }, [sessions]);
};

// --- COMPONENTES DE TOOLTIP CUSTOMIZADOS ---
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
  const { 
    activeLanguage, setActiveLanguage, 
    languageSessions, getTheme, 
    languageSchedule, updateLanguageScheduleDay,
    languageMaterials, addLanguageMaterial, deleteLanguageMaterial
  } = useContext(LanguageContext);
  
  const { setCurrentView } = useContext(FocusContext);
  const stats = useLanguageStats(languageSessions.filter(s => s.languageId === activeLanguage));
  const theme = getTheme();

  // Estados - Navegação
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados - Cronograma
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ material: [], minMinutes: 30, skills: [], notes: '' });
  
  // Estados - Materiais
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', level: 'A1', link: '', instructions: '' });

  const DAYS_OF_WEEK = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();

  // Filtros Globais Baseados no Idioma
  const currentMaterials = languageMaterials.filter(m => m.languageId === activeLanguage);

  // --- Handlers: Cronograma ---
  const openEditSchedule = (day) => {
     setEditingDay(day.dayIndex);
     // Transforma os dados em array de objetos compatível com o novo formato
     const parsedMaterial = Array.isArray(day.material) 
        ? day.material.map(m => typeof m === 'string' ? { name: m, minutes: '' } : m) 
        : (day.material ? [{ name: day.material, minutes: '' }] : []);
     
     setScheduleForm({ 
         material: parsedMaterial, 
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

  const handleToggleMaterial = (materialName) => {
    setScheduleForm(prev => {
        const isSelected = prev.material.some(m => m.name === materialName);
        return {
            ...prev,
            material: isSelected 
                ? prev.material.filter(m => m.name !== materialName) 
                : [...prev.material, { name: materialName, minutes: '' }]
        };
    });
  };

  // --- Handlers: Materiais ---
  const handleSaveMaterial = (e) => {
    e.preventDefault();
    if(materialForm.name) {
      addLanguageMaterial(materialForm);
      setMaterialForm({ name: '', level: 'A1', link: '', instructions: '' });
      setIsMaterialModalOpen(false);
    }
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

  // Fase Onboarding
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
                className={`${lang.color} text-white p-10 rounded-3xl transition-transform hover:-translate-y-2 flex flex-col items-center gap-4 shadow-xl shadow-black/10 no-tap-highlight select-none focus:outline-none`}
            >
              <span className="text-7xl drop-shadow-md">{lang.flag}</span>
              <span className="text-xl font-bold tracking-wide">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // SUB-RENDERERS para Abas
  const renderDashboard = () => (
    <div className={`p-6 md:p-10 rounded-[2rem] border transition-colors animate-fadeIn ${theme.classes.bg} ${theme.classes.border}`}>
      <div className="mb-10 text-center md:text-left">
          <h2 className={`text-2xl md:text-4xl font-extrabold ${theme.classes.text} leading-tight`}>
              Você já estudou <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.formattedTime}</span> e aprendeu <span className="text-5xl mx-1 underline decoration-4 underline-offset-4 opacity-90">{stats.totalWords}</span> palavras em {theme.name}!
          </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-zinc-400 dark:text-zinc-500" size={24} />
              <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Cronograma Semanal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {languageSchedule.map(day => (
                  <div key={day.dayIndex} className={`bg-white dark:bg-[#000000] p-5 rounded-2xl border transition-all ${todayIndex === day.dayIndex ? theme.classes.highlight : 'border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'} shadow-sm relative group`}>
                      
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button onClick={() => openEditSchedule(day)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                              <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                                if (window.confirm('Deseja limpar o planejamento deste dia?')) {
                                    updateLanguageScheduleDay(day.dayIndex, { material: [], minMinutes: 30, skills: [], notes: '' });
                                }
                            }}
                            className="text-zinc-400 hover:text-red-500 transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>

                      <h4 className={`font-bold ${todayIndex === day.dayIndex ? theme.classes.text : 'text-zinc-900 dark:text-white'} mb-4 flex items-center`}>
                          {DAYS_OF_WEEK[day.dayIndex]} 
                          {todayIndex === day.dayIndex && <span className="text-[10px] ml-2 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Hoje</span>}
                      </h4>

                      <div className="space-y-4 text-sm">
                          <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Material</span>
                              <p className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                                {Array.isArray(day.material) && day.material.length > 0 
                                    ? day.material.map(m => {
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
                                                {IconComp && <IconComp size={10} />}
                                                {s}
                                            </span>
                                          );
                                      })}
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
          <button onClick={() => setCurrentView('focus')} className={`px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-transform hover:scale-105 shadow-xl ${theme.classes.button}`}>
              Iniciar Sessão de Idioma <ArrowRight size={20} />
          </button>
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
                    <button onClick={() => deleteLanguageMaterial(m.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

  // --- RENDER GERAL ---
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0 h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                Centro de Idiomas <span className="text-xl">{theme.flag}</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">Gerencie sua jornada rumo à fluência.</p>
        </div>
        
        <button 
            onClick={() => setActiveLanguage(null)} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm active:scale-95 no-tap-highlight select-none focus:outline-none"
        >
            <RefreshCw size={16} /> Trocar Idioma
        </button>
      </header>

      {/* Sistema de Abas Internas ("Pills") */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-xl flex gap-1 overflow-x-auto custom-scrollbar w-full md:w-auto border border-zinc-200/50 dark:border-zinc-800">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
                { id: 'materials', label: 'Materiais', icon: BookOpen }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap no-tap-highlight select-none focus:outline-none ${
                        activeTab === tab.id 
                            ? `bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800` 
                            : `text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800`
                    }`}
                >
                    <tab.icon size={16} className={activeTab === tab.id ? theme.classes.text.split(' ')[0] : ''} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* View Content based on Tabs */}
      <div className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'materials' && renderMaterials()}
      </div>

      {/* --- MODAIS DE SUPORTE --- */}

      {/* Modal: Edição de Cronograma (Dashboard) */}
      <Modal isOpen={editingDay !== null} onClose={() => setEditingDay(null)} title={`Planejar: ${editingDay !== null ? DAYS_OF_WEEK[editingDay] : ''}`}>
          <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Materiais de Estudo</label>
                  <div className="flex flex-wrap gap-2">
                     {currentMaterials.map(m => {
                        const isSelected = scheduleForm.material.some(x => x.name === m.name);
                        return (
                            <button type="button" key={m.id} onClick={() => handleToggleMaterial(m.name)} 
                                className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${isSelected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                               {m.name}
                            </button>
                        );
                     })}
                     {currentMaterials.length === 0 && <span className="text-xs text-zinc-400 italic">Cadastre materiais na aba de Materiais.</span>}
                  </div>
                  
                  {/* Inputs específicos de tempo para os materiais selecionados */}
                  {scheduleForm.material.length > 0 && (
                     <div className="mt-4 space-y-2 animate-fadeIn">
                        {scheduleForm.material.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-1/2 truncate">{m.name}</span>
                                <input 
                                   type="number" 
                                   min="1" 
                                   placeholder="Minutos (opcional)" 
                                   className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 text-sm outline-none focus:border-primary text-zinc-900 dark:text-white" 
                                   value={m.minutes} 
                                   onChange={e => {
                                       setScheduleForm(p => ({
                                           ...p,
                                           material: p.material.map(x => x.name === m.name ? { ...x, minutes: e.target.value } : x)
                                       }))
                                   }}
                                />
                            </div>
                        ))}
                     </div>
                  )}
              </div>
              
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Tempo Mínimo Geral (minutos)</label>
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

      {/* Modal: Adicionar Material */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Adicionar Material">
        <form onSubmit={handleSaveMaterial} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Material</label>
                <input required type="text" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" value={materialForm.name} onChange={e => setMaterialForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Nível Exigido</label>
                <select className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary cursor-pointer" value={materialForm.level} onChange={e => setMaterialForm(p => ({...p, level: e.target.value}))}>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Link (Opcional)</label>
                <input type="url" placeholder="https://" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" value={materialForm.link} onChange={e => setMaterialForm(p => ({...p, link: e.target.value}))} />
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Instruções de Uso</label>
                <textarea className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary h-24 resize-none" value={materialForm.instructions} onChange={e => setMaterialForm(p => ({...p, instructions: e.target.value}))}></textarea>
            </div>
            <div className="pt-2">
                <Button type="submit" className="w-full py-3">Salvar Material</Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};