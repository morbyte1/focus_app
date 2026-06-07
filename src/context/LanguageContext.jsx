import React, { createContext, useState, useEffect, useMemo } from 'react';

export const LanguageContext = createContext();

// Hook auxiliar isolado para persistência
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Layout padrão para o Cronograma Semanal (0 = Domingo, 6 = Sábado)
const DEFAULT_SCHEDULE = Array.from({ length: 7 }).map((_, i) => ({
  dayIndex: i,
  material: [],
  minMinutes: 30,
  skills: [],
  notes: ''
}));

export const LanguageProvider = ({ children }) => {
  const [activeLanguage, setActiveLanguage] = useStickyState(null, 'lang_active');
  const [languageSessions, setLanguageSessions] = useStickyState([], 'lang_sessions');
  const [languageScheduleMap, setLanguageScheduleMap] = useStickyState({}, 'lang_schedule');
  const [languageMaterials, setLanguageMaterials] = useStickyState([], 'lang_materials');
  const [ankiData, setAnkiData] = useStickyState({}, 'lang_anki_data');

  // Migração de dados legados (converte material em string para array)
  useEffect(() => {
    if (languageScheduleMap && typeof languageScheduleMap === 'object' && !Array.isArray(languageScheduleMap)) {
      let migrated = false;
      const newMap = { ...languageScheduleMap };
      
      for (const lang in newMap) {
        if (Array.isArray(newMap[lang])) {
          newMap[lang] = newMap[lang].map(day => {
            if (typeof day.material === 'string') {
              migrated = true;
              if (day.material.trim() === '') {
                return { ...day, material: [] };
              } else {
                return { ...day, material: [{ name: day.material, minutes: '' }] };
              }
            }
            return day;
          });
        }
      }
      if (migrated) {
        setLanguageScheduleMap(newMap);
      }
    }
  }, []); // Executa apenas na montagem

  const addLanguageSession = (minutes, sessionSummary, skills, materials, date = new Date().toISOString()) => {
    const newSession = {
      id: Date.now(),
      languageId: activeLanguage,
      date,
      minutes: Number(minutes),
      sessionSummary: sessionSummary || '',
      skills: skills || [],
      materials: materials || []
    };
    setLanguageSessions(prev => [...prev, newSession]);
  };

  const deleteLanguageSession = (id) => {
    setLanguageSessions(prev => prev.filter(s => s.id !== id));
  };

  const activeLanguageSessions = languageSessions.filter(s => s.languageId === activeLanguage);

  // --- CRUD: MATERIAIS ---
  const addLanguageMaterial = (material) => {
    setLanguageMaterials(prev => [...prev, { ...material, id: Date.now(), languageId: activeLanguage }]);
  };

  const deleteLanguageMaterial = (id) => {
    setLanguageMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateLanguageMaterial = (id, updates) => {
    setLanguageMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const setAnkiDataForLanguage = (languageId, cards) => {
    setAnkiData(prev => ({ ...prev, [languageId]: cards }));
  };

  const theme = useMemo(() => {
    if (activeLanguage === 'EN') return {
      id: 'EN',
      flag: '🇺🇸',
      name: 'Inglês',
      colors: { primary: '#1e3a8a', secondary: '#3b82f6', tertiary: '#93c5fd', quaternary: '#bfdbfe' },
      classes: {
        bg: 'bg-blue-50 dark:bg-[#0a192f]',
        border: 'border-blue-200 dark:border-blue-900',
        text: 'text-blue-900 dark:text-blue-100',
        button: 'bg-blue-900 hover:bg-blue-800',
        highlight: 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
      }
    };
    if (activeLanguage === 'ES') return {
      id: 'ES',
      flag: '🇪🇸',
      name: 'Espanhol',
      colors: { primary: '#ca8a04', secondary: '#eab308', tertiary: '#fde047', quaternary: '#fef08a' },
      classes: {
        bg: 'bg-yellow-50 dark:bg-[#2b2204]',
        border: 'border-yellow-200 dark:border-yellow-900',
        text: 'text-yellow-900 dark:text-yellow-100',
        button: 'bg-yellow-600 hover:bg-yellow-500',
        highlight: 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
      }
    };
    if (activeLanguage === 'DE') return {
      id: 'DE',
      flag: '🇩🇪',
      name: 'Alemão',
      colors: { primary: '#991b1b', secondary: '#ef4444', tertiary: '#fca5a5', quaternary: '#fecaca' },
      classes: {
        bg: 'bg-red-50 dark:bg-[#2e0909]',
        border: 'border-red-200 dark:border-red-900',
        text: 'text-red-900 dark:text-red-100',
        button: 'bg-red-800 hover:bg-red-700',
        highlight: 'border-red-500 bg-red-100 dark:bg-red-900/30'
      }
    };
    return null;
  }, [activeLanguage]);

  // Usada externamente pelo HistoryView (via FocusContext bridge) para deletar
  // sessões de idioma ao apagar um dia completo do histórico geral.
  const deleteLanguageSessionsByDate = (dateStr) => {
    setLanguageSessions(prev => prev.filter(s => new Date(s.date).toDateString() !== dateStr));
  };

  const resetLanguageData = () => {
    setLanguageSessions([]);
    setLanguageMaterials([]);
    setLanguageScheduleMap({});
    setAnkiData({});
    setActiveLanguage(null);
  };

  const currentMap = languageScheduleMap && typeof languageScheduleMap === 'object' && !Array.isArray(languageScheduleMap)
    ? languageScheduleMap
    : {};
  const activeLanguageSchedule = currentMap[activeLanguage] || DEFAULT_SCHEDULE;

  const updateLanguageScheduleDay = (dayIndex, updates) => {
    setLanguageScheduleMap(prev => {
      const map = prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {};
      const currentSchedule = map[activeLanguage] || DEFAULT_SCHEDULE;
      const newSchedule = currentSchedule.map(day => day.dayIndex === dayIndex ? { ...day, ...updates } : day);
      return { ...map, [activeLanguage]: newSchedule };
    });
  };

  return (
    <LanguageContext.Provider value={{
      activeLanguage, setActiveLanguage,
      languageSessions, setLanguageSessions,
      activeLanguageSessions, addLanguageSession, deleteLanguageSession,
      languageSchedule: activeLanguageSchedule, updateLanguageScheduleDay,
      languageMaterials, addLanguageMaterial, deleteLanguageMaterial, updateLanguageMaterial,
      theme,
      deleteLanguageSessionsByDate, resetLanguageData,
      ankiData, setAnkiDataForLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};