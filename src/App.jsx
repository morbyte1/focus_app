import React from 'react';
import { FocusProvider } from './context/FocusContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './layout/AppLayout';

// Estilos globais (Scrollbar, animações)
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar{width:6px}
    .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#555;border-radius:20px} 
    .dark .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#222} 
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .animate-fadeIn{animation:fadeIn 0.4s ease-out forwards}
    ::selection{background-color:#1100ab;color:#fff}
  `}</style>
);

const App = () => (
  <FocusProvider>
    <LanguageProvider>
      <GlobalStyles />
      <AppLayout />
    </LanguageProvider>
  </FocusProvider>
);

export default App;