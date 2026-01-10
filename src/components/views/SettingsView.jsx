import React, { useContext } from 'react';
import { Settings, Sun, Moon, Monitor, HardDrive, Download, Upload, Trash2, Crown, RotateCcw, User } from 'lucide-react'; // Adicionei User nos imports
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';

export const SettingsView = () => {
  // Puxamos userName e setUserName do contexto
  const { resetAllData, resetXPOnly, theme, setTheme, userName, setUserName } = useContext(FocusContext);
  
  // ... (funções hExp e hImp permanecem iguais)
  const hExp = () => { /* ... código existente ... */ };
  const hImp = (e) => { /* ... código existente ... */ };
  
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Configurações</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Gerencie seus dados e preferências.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- NOVO CARTÃO DE PERFIL --- */}
        <Card>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" /> Perfil
          </h3>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <label className="text-sm text-zinc-600 dark:text-zinc-300 mb-2 block">Como você quer ser chamado?</label>
            <input 
              type="text" 
              placeholder="Seu nome..." 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              className="w-full bg-zinc-200 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2 text-zinc-900 dark:text-white outline-none focus:border-primary transition-colors"
            />
          </div>
        </Card>

        <Card>
          {/* ... Conteúdo Aparência (MANTENHA O RESTO IGUAL) ... */}
           <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Settings size={20} className="text-primary" /> Aparência</h3>
           <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {/* ... botões de tema ... */}
             <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">Escolha o tema de sua preferência.</p>
            <div className="flex gap-2 bg-zinc-200 dark:bg-black/50 p-1 rounded-xl">
              <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow text-primary' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><Sun size={16} /> Claro</button>
              <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-primary text-white shadow' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><Moon size={16} /> Escuro</button>
              <button onClick={() => setTheme('system')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'system' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}><Monitor size={16} /> Auto</button>
            </div>
           </div>
        </Card>
        
        {/* ... Mantenha Dados do Sistema e Gamificação aqui ... */}
        <Card>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><HardDrive size={20} className="text-primary" /> Dados do Sistema</h3>
          {/* ... botões exportar/importar/resetar ... */}
           <div className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-3">
                <button onClick={hExp} className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"><Download size={16} /> Exportar</button>
                <label className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"><Upload size={16} /> Importar<input type="file" className="hidden" onChange={hImp} /></label>
              </div>
            </div>
            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
              <button onClick={resetAllData} className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><Trash2 size={16} /> Resetar TUDO (Fábrica)</button>
            </div>
          </div>
        </Card>

        <Card>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Crown size={20} className="text-yellow-500" /> Gamificação</h3>
             <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button onClick={resetXPOnly} className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all"><RotateCcw size={16} /> Resetar Nível e XP</button>
            </div>
        </Card>

      </div>
    </div>
  );
};