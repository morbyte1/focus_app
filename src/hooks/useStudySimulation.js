import { useContext, useMemo } from 'react';
import { FocusContext } from '../context/FocusContext';

export const useStudySimulation = (subjectId, deadlineDate, maxDailyMinutes = 60) => {
  const { themes, sessions, studySchedule } = useContext(FocusContext);

  return useMemo(() => {
    // Passo A: Progresso e Extração de Tópicos
    const subjectThemes = themes.filter(t => t.subjectId === Number(subjectId));
    const allTopics = subjectThemes.flatMap(t => t.items);
    const totalTopics = allTopics.length;
    
    const completedTopicsList = allTopics.filter(item => item.completed);
    const completedTopics = completedTopicsList.length;
    const remainingTopics = totalTopics - completedTopics;

    // Passo B: Ritmo Atual (Média de Tempo)
    const completedTopicNames = completedTopicsList.map(item => item.text);
    
    // Filtrar sessões cruzando o subjectId e o nome do tópico que já foi concluído
    const relevantSessions = sessions.filter(
      session => session.subjectId === Number(subjectId) && completedTopicNames.includes(session.topic)
    );
    
    const totalMinutesSpent = relevantSessions.reduce((acc, session) => acc + session.minutes, 0);

    let avgTimePerTopic = 0;
    let hasEnoughData = false;

    // Prevenção de divisão por zero
    if (completedTopics > 0) {
      avgTimePerTopic = totalMinutesSpent / completedTopics;
      hasEnoughData = true;
    }

    // Passo C: Projeções e Plano de Ação Baseado em Cronograma
    const estimatedTimeRemaining = remainingTopics * avgTimePerTopic;
    
    let scheduledDaysCount = 0;
    let totalScheduledDaysWithMargin = 0;
    let minutesPerScheduledDayRequired = 0;
    let weeklyTopicsRequired = 0;
    
    let isUnrealistic = false;
    let hasDeadline = false;
    let isNotInSchedule = false;

    // 1. Identificar em quais dias da semana (1=Segunda a 5=Sexta) a matéria aparece
    const scheduledWeekdays = [];
    if (studySchedule) {
      for (let day = 1; day <= 5; day++) {
        const daySchedule = studySchedule[day];
        if (daySchedule && (Number(daySchedule.main) === Number(subjectId) || Number(daySchedule.sec) === Number(subjectId))) {
          scheduledWeekdays.push(day);
        }
      }
    }

    if (scheduledWeekdays.length === 0) {
      isNotInSchedule = true;
    }

    if (deadlineDate && !isNotInSchedule) {
      hasDeadline = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(deadlineDate);
      
      // Ajuste de fuso horário para garantir que o "dia" seja calculado corretamente
      deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
      deadline.setHours(0, 0, 0, 0);
      
      // 2. Contar dias disponíveis estritamente baseados no cronograma
      if (deadline > today) {
        let current = new Date(today);
        while (current <= deadline) {
          const dayOfWeek = current.getDay(); // 0=Dom, 1=Seg... 6=Sáb
          if (scheduledWeekdays.includes(dayOfWeek)) {
            scheduledDaysCount++;
          }
          current.setDate(current.getDate() + 1);
        }
      }

      // 3. Aplicar Margem de Segurança (Abordagem Pessimista - Subtrair 1 semana de folga)
      const weeklyOccurrences = scheduledWeekdays.length;
      totalScheduledDaysWithMargin = scheduledDaysCount;
      
      // Só aplica a margem negativa se o total de dias for maior que a própria margem 
      // para evitar prazos minúsculos resultarem em dias negativos
      if (scheduledDaysCount > weeklyOccurrences) {
        totalScheduledDaysWithMargin -= weeklyOccurrences;
      }

      // Prevenção absoluta de divisão por zero (mínimo de 1 dia)
      totalScheduledDaysWithMargin = Math.max(1, totalScheduledDaysWithMargin);

      // 4. Calcular o ritmo necessário projetado para os dias úteis do usuário
      minutesPerScheduledDayRequired = estimatedTimeRemaining / totalScheduledDaysWithMargin;
      weeklyTopicsRequired = (remainingTopics / totalScheduledDaysWithMargin) * weeklyOccurrences;
      
      // 5. Validação de viabilidade com base no teto de minutos
      isUnrealistic = minutesPerScheduledDayRequired > maxDailyMinutes;
    }

    return {
      totalTopics,
      completedTopics,
      remainingTopics,
      avgTimePerTopic,
      hasEnoughData,
      estimatedTimeRemaining,
      scheduledDaysCount,
      totalScheduledDaysWithMargin,
      minutesPerScheduledDayRequired,
      weeklyTopicsRequired,
      isUnrealistic,
      hasDeadline,
      isNotInSchedule
    };
  }, [subjectId, deadlineDate, maxDailyMinutes, themes, sessions, studySchedule]);
};