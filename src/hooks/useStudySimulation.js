import { useContext, useMemo } from 'react';
import { FocusContext } from '../context/FocusContext';

export const useStudySimulation = (subjectId, deadlineDate) => {
  const { themes, sessions } = useContext(FocusContext);

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

    // Passo C: Projeções e Plano de Ação
    const estimatedTimeRemaining = remainingTopics * avgTimePerTopic;
    
    let daysRemaining = 0;
    let dailyMinutesRequired = 0;
    let weeklyTopicsRequired = 0;
    let isUnrealistic = false;
    let hasDeadline = false;

    if (deadlineDate) {
      hasDeadline = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(deadlineDate);
      
      // Ajuste de fuso horário para garantir que o "dia" seja calculado corretamente
      deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
      deadline.setHours(0, 0, 0, 0);
      
      const diffTime = deadline - today;
      // Estabelece no mínimo 1 dia de diferença para evitar divisão por 0
      daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 

      dailyMinutesRequired = estimatedTimeRemaining / daysRemaining;
      weeklyTopicsRequired = (remainingTopics / daysRemaining) * 7;
      
      // Se precisar de mais de 10 horas diárias, marcamos como irrealista (600 minutos)
      isUnrealistic = dailyMinutesRequired > 600;
    }

    return {
      totalTopics,
      completedTopics,
      remainingTopics,
      avgTimePerTopic,
      hasEnoughData,
      estimatedTimeRemaining, // tempo retornado em minutos
      daysRemaining,
      dailyMinutesRequired,
      weeklyTopicsRequired,
      isUnrealistic,
      hasDeadline
    };
  }, [subjectId, deadlineDate, themes, sessions]);
};