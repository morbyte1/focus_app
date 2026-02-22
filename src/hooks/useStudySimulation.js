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

    // Passo B: Ritmo Atual (Média de Tempo CORRIGIDA)
    const timePerCompletedTopic = {};
    completedTopicsList.forEach(item => {
        timePerCompletedTopic[item.text] = 0;
    });

    sessions.forEach(session => {
        if (session.subjectId === Number(subjectId) && timePerCompletedTopic[session.topic] !== undefined) {
            timePerCompletedTopic[session.topic] += session.minutes;
        }
    });

    const validTopicTimes = Object.values(timePerCompletedTopic).filter(mins => mins > 0);
    const validCompletedTopicsCount = validTopicTimes.length;
    const totalMinutesSpent = validTopicTimes.reduce((acc, mins) => acc + mins, 0);

    let avgTimePerTopic = 0;
    let hasEnoughData = false;

    if (validCompletedTopicsCount > 0) {
      avgTimePerTopic = totalMinutesSpent / validCompletedTopicsCount;
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

    // Nova Funcionalidade A: Calcular Data Exata de Conclusão (independente do deadline)
    let projectedEndDate = null;
    if (hasEnoughData && !isNotInSchedule && remainingTopics > 0) {
      // Assumimos que o usuário estuda o limite diário nos dias agendados
      const daysNeeded = Math.ceil(estimatedTimeRemaining / maxDailyMinutes);
      let current = new Date();
      current.setHours(0, 0, 0, 0);
      let daysFound = 0;
      let maxIterations = 365 * 5; // Trava de segurança (5 anos)

      while (daysFound < daysNeeded && maxIterations > 0) {
        current.setDate(current.getDate() + 1);
        if (scheduledWeekdays.includes(current.getDay())) {
          daysFound++;
        }
        maxIterations--;
      }

      // Adicionar Margem de Segurança (1 semana inteira)
      current.setDate(current.getDate() + 7);
      projectedEndDate = current;
    } else if (remainingTopics === 0) {
      projectedEndDate = new Date(); // Matéria já zerada
    }

    // Status de Saúde da Matéria
    let healthStatus = 'none';

    if (deadlineDate && !isNotInSchedule) {
      hasDeadline = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(deadlineDate);
      
      deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
      deadline.setHours(0, 0, 0, 0);
      
      // 2. Contar dias disponíveis estritamente baseados no cronograma
      if (deadline > today) {
        let current = new Date(today);
        while (current <= deadline) {
          const dayOfWeek = current.getDay(); 
          if (scheduledWeekdays.includes(dayOfWeek)) {
            scheduledDaysCount++;
          }
          current.setDate(current.getDate() + 1);
        }
      }

      // 3. Aplicar Margem de Segurança 
      const weeklyOccurrences = scheduledWeekdays.length;
      totalScheduledDaysWithMargin = scheduledDaysCount;
      
      if (scheduledDaysCount > weeklyOccurrences) {
        totalScheduledDaysWithMargin -= weeklyOccurrences;
      }

      totalScheduledDaysWithMargin = Math.max(1, totalScheduledDaysWithMargin);

      // 4. Calcular o ritmo necessário projetado para os dias úteis
      minutesPerScheduledDayRequired = estimatedTimeRemaining / totalScheduledDaysWithMargin;
      weeklyTopicsRequired = (remainingTopics / totalScheduledDaysWithMargin) * weeklyOccurrences;
      
      // 5. Validação de viabilidade
      isUnrealistic = minutesPerScheduledDayRequired > maxDailyMinutes;

      // Nova Funcionalidade D: Indicador de Saúde (Verde / Amarelo / Vermelho)
      if (hasEnoughData) {
        const usageRatio = minutesPerScheduledDayRequired / maxDailyMinutes;
        if (isUnrealistic || usageRatio > 0.9) {
          healthStatus = 'red';
        } else if (usageRatio > 0.6) {
          healthStatus = 'yellow';
        } else {
          healthStatus = 'green';
        }
      }
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
      isNotInSchedule,
      projectedEndDate, // Exportado para exibir o dia exato
      healthStatus      // Exportado para o "Semáforo"
    };
  }, [subjectId, deadlineDate, maxDailyMinutes, themes, sessions, studySchedule]);
};