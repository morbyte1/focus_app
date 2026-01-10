import React, { useState, useContext } from 'react';
// 1. Ícones usados especificamente nesta tela
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Plus, Clock, Trash2 } from 'lucide-react';

// 2. Importando o Contexto e as constantes (POMODORO) e helpers (formatTime)
// Nota: O caminho volta duas pastas (../../) para achar a pasta context
import { FocusContext, POMODORO, formatTime } from '../../context/FocusContext';

// 3. Componentes visuais que criamos antes
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const FocusView = () => {
  const { 
    timerType, setTimerType, 
    subjects, selectedSubjectId, setSelectedSubjectId, 
    timerMode, setTimerMode, 
    timeLeft, setTimeLeft, 
    isActive, setIsActive, 
    cycles, setCycles, 
    tasks, addTask, toggleTask, deleteTask, 
    addSession, elapsedTime, setElapsedTime, 
    flowStoredTime, setFlowStoredTime 
  } = useContext(FocusContext);

  const [taskT, setTaskT] = useState(""); 
  const [finMod, setFinMod] = useState(false); 
  const [manMod, setManMod] = useState(false);
  const [fForm, setFForm] = useState({ n: "", q: "", e: "" }); 
  const [mForm, setMForm] = useState({ t: "", n: "", s: "", q: "", e: "" });
  
  if (!subjects.length) return <div className="text-center mt-20 text-zinc-400">Adicione matérias em Metas.</div>;
  
  const finish = (e) => { 
      e.preventDefault(); 
      const mins = Math.round(elapsedTime / 60); 
      if (mins > 0) { 
          addSession(mins, fForm.n, null, fForm.q, fForm.e); 
          alert(`Sessão salva: ${mins} min.`); 
      } else {
          alert("Tempo insuficiente para salvar.");
      }
      setIsActive(false); 
      setTimerMode('WORK'); 
      setTimeLeft(timerType === 'FLOW' ? 0 : POMODORO.WORK); 
      setElapsedTime(0); 
      setCycles(0); 
      setFinMod(false); 
      setFForm({ n: "", q: "", e: "" }); 
  };
  
  const manual = (e) => { 
      e.preventDefault(); 
      if (!mForm.t || !mForm.s) return alert("Preencha tempo e matéria."); 
      const tValid = Math.max(1, parseInt(mForm.t) || 0);
      addSession(tValid, mForm.n, mForm.s, mForm.q, mForm.e); 
      setMForm({ t: "", n: "", s: "", q: "", e: "" }); 
      setManMod(false); 
      alert("Salvo!"); 
  };

  return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn pb-24 md:pb-0">
      {/* TÍTULO ADICIONADO PARA MANTER HARMONIA (ocupa as colunas no grid ou fica acima) */}
      <header className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Modo Foco</h1>
      </header>
      
      <div className="lg:col-span-2 space-y-6">
        {/* ... Card do Timer e resto do conteúdo ... */}
        <Card className="flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-xl">
          {/* Fundo dinâmico */}
          <div className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${isActive ? (timerMode === 'WORK' ? 'bg-primary/20 animate-pulse' : 'bg-emerald-500/20 animate-pulse') : 'bg-zinc-200/50 dark:bg-zinc-800/30'}`}></div>
          
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 z-10 shadow-sm">
            <button onClick={() => { setIsActive(false); setTimerType('POMODORO'); setTimeLeft(POMODORO.WORK); setTimerMode('WORK'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'POMODORO' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Pomodoro</button>
            <button onClick={() => { setIsActive(false); setTimerType('FLOW'); setTimeLeft(0); setTimerMode('WORK'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timerType === 'FLOW' ? 'bg-primary text-white shadow' : 'text-zinc-500 dark:text-zinc-400'}`}>Flow</button>
          </div>
          
          <div className="w-full max-w-xs mb-8 z-10 text-center">
            <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Matéria</label>
            <select disabled={isActive} value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(Number(e.target.value))} className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl py-3 px-4 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="z-10 text-center">
            <div className="mb-6">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${timerMode === 'WORK' ? 'bg-primary/10 text-primary-light border-primary/20' : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'}`}>{timerMode === 'WORK' ? 'Foco Total' : 'Pausa'}</span>
            </div>
            
            <div className="text-8xl md:text-9xl font-mono font-bold text-zinc-900 dark:text-white tracking-tighter mb-4 tabular-nums drop-shadow-sm dark:drop-shadow-2xl">{formatTime(timeLeft)}</div>
            
            <div className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Ciclos: <span className="text-zinc-900 dark:text-white font-bold ml-2">{cycles}</span></div>
            
            <div className="flex gap-4 justify-center items-center mt-8">
              <button onClick={() => setIsActive(!isActive)} className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700' : (timerMode === 'WORK' ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-emerald-500 text-white hover:bg-emerald-600')}`}>
                {isActive ? <Pause size={24} /> : <Play size={24} />} <span>{isActive ? 'Pausar' : 'Iniciar'}</span>
              </button>
              
              <button onClick={() => { setIsActive(false); setTimeLeft(timerType === 'FLOW' ? 0 : POMODORO.WORK); setElapsedTime(0); }} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 transition-colors"><RotateCcw size={24} /></button>
              
              {timerType === 'FLOW' && timerMode === 'WORK' && <button onClick={() => { setFlowStoredTime(timeLeft); setTimerMode('BREAK'); setTimeLeft(Math.floor(timeLeft * 0.2)); setIsActive(true); }} className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"><Coffee size={24} /></button>}
              
              <button onClick={() => { setIsActive(false); setFinMod(true); }} className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"><CheckCircle size={24} /></button>
            </div>
            {timerType === 'FLOW' && timerMode === 'WORK' && <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4">Clique no <Coffee size={12} className="inline" /> para pausa.</p>}
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1"><Card className="h-full flex flex-col min-h-[300px]"><h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-primary" /> Tarefas</h3><form onSubmit={e => { e.preventDefault(); if (taskT && selectedSubjectId) { addTask(taskT, selectedSubjectId); setTaskT(""); } }} className="mb-4 flex gap-2"><input placeholder="Nova tarefa..." className="flex-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary" value={taskT} onChange={e => setTaskT(e.target.value)} /><button type="submit" className="bg-primary rounded-2xl px-3 text-white"><Plus size={18} /></button></form><div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{tasks.filter(t => t.subjectId === selectedSubjectId).map(t => (<div key={t.id} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${t.completed ? 'bg-primary/10 border-primary/20 opacity-60' : 'bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800'}`}><button onClick={() => toggleTask(t.id)} className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${t.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-zinc-500'}`}>{t.completed && <CheckCircle size={14} className="text-white" />}</button><span className={`text-sm flex-1 break-words ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{t.text}</span><button onClick={() => deleteTask(t.id)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></div>))}</div></Card></div>
      <div className="lg:col-span-3 mt-12 mb-8 flex flex-col items-center justify-center border-t border-zinc-200 dark:border-zinc-800/50 pt-10"><div className="bg-white dark:bg-[#09090b] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full text-center"><Clock size={24} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-500 opacity-50" /><p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Esqueceu de ligar o timer ou estudou fora do app?</p><button onClick={() => { setMForm({ ...mForm, s: subjects[0]?.id }); setManMod(true); }} className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary-light hover:text-white rounded-2xl border border-primary/20 transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/5"><Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Lançar Estudo Manual</button></div></div>
      <Modal isOpen={finMod} onClose={() => setFinMod(false)} title="Resumo da Sessão"><form onSubmit={finish} className="space-y-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">O que você estudou?</label><textarea className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none" value={fForm.n} onChange={e => setFForm({ ...fForm, n: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 font-bold uppercase">Questões Feitas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-blue-500" value={fForm.q} onChange={e => setFForm({ ...fForm, q: e.target.value })} /></div><div><label className="text-xs text-zinc-500 font-bold uppercase">Erradas</label><input type="number" min="0" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-red-500" value={fForm.e} onChange={e => setFForm({ ...fForm, e: e.target.value })} /></div></div><div className="pt-2 flex gap-2"><Button type="button" variant="secondary" onClick={() => setFinMod(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-[2]">Salvar Sessão</Button></div></form></Modal>
      <Modal isOpen={manMod} onClose={() => setManMod(false)} title="Registro Manual"><form onSubmit={manual} className="space-y-5"><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Matéria</label><select required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={mForm.s} onChange={e => setMForm({ ...mForm, s: e.target.value })}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Tempo (min)</label><input required type="number" min="1" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={mForm.t} onChange={e => setMForm({ ...mForm, t: e.target.value })} /></div><div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Diário</label><textarea className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white h-28 outline-none focus:border-primary resize-none text-sm" value={mForm.n} onChange={e => setMForm({ ...mForm, n: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-zinc-500 uppercase">Feitas</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-blue-500" value={mForm.q} onChange={e => setMForm({ ...mForm, q: e.target.value })} /></div><div><label className="text-xs font-bold text-zinc-500 uppercase">Erradas</label><input type="number" min="0" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-red-500" value={mForm.e} onChange={e => setMForm({ ...mForm, e: e.target.value })} /></div></div><Button type="submit" className="w-full py-3 mt-2 shadow-xl shadow-primary/20">Confirmar</Button></form></Modal>
    </div>
  );
};