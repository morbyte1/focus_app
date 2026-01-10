import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = "", type="button" }) => (
  <button type={type} onClick={onClick} className={`px-5 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${variant==='primary'?"bg-[#1100ab] hover:bg-[#0c007a] text-white shadow-[#1100ab]/30 shadow-md":variant==='secondary'?"bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white dark:border-zinc-700":"bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"} ${className}`}>
    {children}
  </button>
);