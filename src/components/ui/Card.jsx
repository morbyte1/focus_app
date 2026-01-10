import React from 'react';

export const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-lg p-6 ${className}`}>
    {children}
  </div>
);