import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

// Hook auxiliar isolado para persistência
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) { return defaultValue; }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export const LanguageProvider = ({ children }) => {
  const [activeLanguage, setActiveLanguage] = useStickyState(null, 'lang_active');
  const [languageSessions, setLanguageSessions] = useStickyState([], 'lang_sessions');

  const addLanguageSession = (minutes, words, grammar, skills, materials) => {
    setLanguageSessions(prev => [...prev, {
        id: Date.now(),
        date: new Date().toISOString(),
        minutes: Number(minutes),
        words: words || [],
        grammar: grammar || '',
        skills: skills || [],
        materials: materials || ''
    }]);
  };

  const getTheme = () => {
    if (activeLanguage === 'EN') return { 
        id: 'EN', flag: '🇺🇸', name: 'Inglês', 
        colors: { primary: '#1e3a8a', secondary: '#3b82f6' },
        classes: { bg: 'bg-blue-50 dark:bg-[#0a192f]', border: 'border-blue-200 dark:border-blue-900', text: 'text-blue-900 dark:text-blue-100', button: 'bg-blue-900 hover:bg-blue-800' }
    };
    if (activeLanguage === 'ES') return { 
        id: 'ES', flag: '🇪🇸', name: 'Espanhol', 
        colors: { primary: '#ca8a04', secondary: '#eab308' },
        classes: { bg: 'bg-yellow-50 dark:bg-[#2b2204]', border: 'border-yellow-200 dark:border-yellow-900', text: 'text-yellow-900 dark:text-yellow-100', button: 'bg-yellow-600 hover:bg-yellow-500' }
    };
    if (activeLanguage === 'DE') return { 
        id: 'DE', flag: '🇩🇪', name: 'Alemão', 
        colors: { primary: '#991b1b', secondary: '#ef4444' },
        classes: { bg: 'bg-red-50 dark:bg-[#2e0909]', border: 'border-red-200 dark:border-red-900', text: 'text-red-900 dark:text-red-100', button: 'bg-red-800 hover:bg-red-700' }
    };
    return null;
  };

  return (
    <LanguageContext.Provider value={{
      activeLanguage, setActiveLanguage,
      languageSessions, addLanguageSession,
      getTheme
    }}>
      {children}
    </LanguageContext.Provider>
  );
};