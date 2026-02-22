import React, { useState, useEffect, useContext } from 'react';
import { Compass, Clock, Target, CalendarDays, AlertTriangle, TrendingUp, CheckCircle, CalendarX2, CalendarCheck } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { useStudySimulation } from '../../hooks/useStudySimulation';
import { Card } from '../ui/Card';

export const SimulationView = () => {
  const { subjects } = useContext(FocusContext);
  const activeSubjects = subjects.filter(s => !s.isSchool);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjects.length > 0 ? activeSubjects[0].id : '');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [maxDailyMinutes, setMaxDailyMinutes] = useState(60);

  const sim = useStudySimulation(selectedSubjectId, deadlineDate, maxDailyMinutes);

  // Nova Funcionalidade C: Persistência do Deadline via localStorage
  useEffect(() => {
    if (selectedSubjectId) {
      const savedDate = localStorage.getItem(`study_deadline_${selectedSubjectId}`);
      if (savedDate) {
        setDeadlineDate(savedDate);
      } else {
        setDeadlineDate('');
      }
    }
  }, [selectedSubjectId]);

  const handleDeadlineChange = (val) => {
    setDeadlineDate(val);
    if (selectedSubjectId) {
      localStorage.setItem(`study_deadline_${selectedSubjectId}`, val);
    }
  };

  const formatHours = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Nova Funcionalidade B: Formatação Humanizada de Tópicos Semanais
  const formatWeeklyTopics = (topics) => {
    if (topics >= 1) {
      return `${Math.round(topics)} tópicos / semana`;
    } else if (topics > 0) {
      const weeks = Math.round(1 / topics);
      return `1 tópico a cada ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    return '0 tópicos / semana';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
            <Compass className="text-primary" /> Simulação de Conclusão
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Projete seu plano de ação com base no seu ritmo real e cronograma semanal.
        </p>
      </header>

      {/* Inputs / Controles */}
      <Card className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 dark:bg-[#09090b]">
         <div>
             <label className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                 Matéria Alvo
                 {/* Nova Funcionalidade D: Indicador Semáforo */}
                 {sim.healthStatus === 'green' && <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-fadeIn">Confortável</span>}
                 {sim.healthStatus === 'yellow' && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-fadeIn">Cuidado</span>}
                 {sim.healthStatus === 'red' && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm animate-fadeIn">Alerta</span>}
             </label>
             <select 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors cursor-pointer"
             >
                 {activeSubjects.map(s => (
                     <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
             </select>
         </div>
         <div>
             <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Data Limite (Deadline)</label>
             <input 
                type="date" 
                value={deadlineDate}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors cursor-pointer"
             />
         </div>
         <div>
             <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Teto Diário (Minutos)</label>
             <input 
                type="number"
                min="10"
                step="10"
                value={maxDailyMinutes}
                onChange={(e) => setMaxDailyMinutes(Number(e.target.value))}
                className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors cursor-pointer"
                placeholder="Ex: 60"
             />
         </div>
      </Card>

      {!selectedSubjectId ? (
          <div className="text-center py-12 opacity-50 text-zinc-500">
             Selecione uma matéria para iniciar o GPS.
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Raio-X do Ritmo */}
              <Card className="flex flex-col justify-between">
                  <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                          <TrendingUp size={16} className="text-blue-500" /> Raio-X do Ritmo
                      </h3>
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-zinc-600 dark:text-zinc-400 text-sm">Tópicos Totais:</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{sim.totalTopics}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-zinc-600 dark:text-zinc-400 text-sm">Tópicos Concluídos:</span>
                          <span className="font-bold text-emerald-500">{sim.completedTopics}</span>
                      </div>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 mt-4">
                      <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Seu ritmo médio atual</p>
                      {sim.hasEnoughData ? (
                          <p className="text-2xl font-black text-blue-500">
                              {Math.round(sim.avgTimePerTopic)} <span className="text-sm font-medium text-zinc-500">min / tópico</span>
                          </p>
                      ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">
                             Finalize ao menos 1 tópico com registro de tempo nas sessões para visualizar o cálculo.
                          </p>
                      )}
                  </div>
              </Card>

              {/* Card 2: O Desafio Restante */}
              <Card className="flex flex-col justify-between">
                  <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                          <Target size={16} className="text-orange-500" /> Meta
                      </h3>
                      <div className="flex items-end gap-2 mb-4">
                          <span className="text-5xl font-black text-zinc-900 dark:text-white">{sim.remainingTopics}</span>
                          <span className="text-zinc-500 font-medium pb-1">tópicos restantes</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          * A projeção abaixo descarta os dias em que a matéria não está no cronograma.
                      </p>
                  </div>

                  <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 mt-4">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase mb-1 flex items-center gap-1">
                          <Clock size={12}/> Projeção Total de Tempo 
                      </p>
                      {sim.hasEnoughData ? (
                          <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                              {formatHours(sim.estimatedTimeRemaining)}
                          </p>
                      ) : (
                          <p className="text-xs text-orange-500 italic">Dados insuficientes para estimar.</p>
                      )}
                  </div>
              </Card>

              {/* Nova Funcionalidade A: Card 3 - Previsão de Conclusão */}
              <Card className="flex flex-col justify-between">
                  <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-2 mb-4">
                          <CalendarCheck size={16} className="text-purple-500" /> Previsão de Conclusão
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          * Calculado com base no seu ritmo, seu teto diário de {maxDailyMinutes} min, nos dias em que estuda a matéria e <span className="font-bold">adicionando 1 semana de segurança</span>.
                      </p>
                  </div>

                  <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 mt-4">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                          Você terminará dia:
                      </p>
                      {sim.projectedEndDate ? (
                          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 capitalize">
                              {sim.projectedEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                      ) : (
                          <p className="text-xs text-purple-500 italic">Estude mais para gerar esta previsão.</p>
                      )}
                  </div>
              </Card>

              {/* Card 4: Plano de Ação Destaque */}
              <Card className={`md:col-span-2 lg:col-span-3 flex flex-col transition-all duration-300 ${sim.isNotInSchedule ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900' : sim.isUnrealistic ? 'border-red-500 animate-pulse bg-red-500/5' : 'border-primary bg-primary/5'}`}>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                      <CalendarDays size={16} /> Plano de Ação
                  </h3>
                  
                  {sim.isNotInSchedule ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          <CalendarX2 size={32} className="text-zinc-400 mb-2 opacity-50" />
                          <p className="text-zinc-500 text-sm font-medium">Esta matéria não está no seu cronograma semanal. Configure-a no Calendário primeiro.</p>
                      </div>
                  ) : !sim.hasDeadline ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          <CalendarDays size={32} className="text-zinc-400 mb-2 opacity-50" />
                          <p className="text-zinc-500 text-sm">Defina uma data limite (Deadline) acima para gerar seu plano diário de estudos.</p>
                      </div>
                  ) : !sim.hasEnoughData ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          <AlertTriangle size={32} className="text-zinc-400 mb-2 opacity-50" />
                          <p className="text-zinc-500 text-sm">Estude e conclua tópicos para conseguir simular o plano.</p>
                      </div>
                  ) : sim.remainingTopics === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          <CheckCircle size={32} className="text-emerald-500 mb-2" />
                          <p className="text-emerald-500 font-bold text-lg">Matéria Zerada!</p>
                      </div>
                  ) : (
                      <div className="flex flex-col h-full justify-between">
                          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                      Para terminar no prazo, tendo <span className="font-bold">{sim.totalScheduledDaysWithMargin} dias reais agendados</span>:
                                  </p>
                              </div>
                              <div className="bg-white dark:bg-black p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Ritmo nos dias de estudos</p>
                                  <p className={`text-3xl font-black ${sim.isUnrealistic ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                                      {formatHours(sim.minutesPerScheduledDayRequired)} <span className="text-sm font-medium text-zinc-500">/ dia de estudo</span>
                                  </p>
                              </div>
                              <div className="bg-white dark:bg-black p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Ritmo Semanal Exigido</p>
                                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                                      {formatWeeklyTopics(sim.weeklyTopicsRequired)}
                                  </p>
                              </div>
                          </div>
                          
                          {sim.isUnrealistic && (
                              <div className="mt-4 flex items-start gap-2 text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                  <p className="text-xs font-bold leading-tight">
                                      Atenção: O tempo necessário ultrapassa seu limite diário configurado de {maxDailyMinutes} minutos. Você precisa ajustar sua data limite ou aumentar seu tempo de dedicação diária.
                                  </p>
                              </div>
                          )}
                      </div>
                  )}
              </Card>
          </div>
      )}
    </div>
  );
};