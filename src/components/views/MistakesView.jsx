import React, { useContext, useState } from 'react';
import { AlertTriangle, CheckCircle, Trash2, ChevronDown } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { MathRenderer } from '../ui/MathRenderer';

export const MistakesView = () => {
  const { subjects, mistakes, addMistake, deleteMistake, consolidateMistake } = useContext(FocusContext);
  const [f, setF] = useState({ sub: "", desc: "", r: "Conceito", sol: "" }); 
  const [exp, setExp] = useState([]); 
  const [cons, setCons] = useState({ open: false, id: null, d: "", diag: "", strat: "" });
  
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header><h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Caderno de Erros</h1></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="h-fit">
          <h3 className="text-zinc-900 dark:text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Novo Erro</h3>
          <form onSubmit={e => { e.preventDefault(); if (f.sub && f.desc && f.sol) { addMistake(f.sub, f.desc, f.r, f.sol); setF({ sub: "", desc: "", r: "Conceito", sol: "" }); alert("Salvo!"); } }} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label>
              <select required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2.5 text-zinc-900 dark:text-white" value={f.sub} onChange={e => setF({ ...f, sub: e.target.value })}>
                <option value="">Selecione...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Motivo</label>
              <div className="flex flex-wrap gap-2 mt-2">{["Falta de Atenção", "Esqueci Fórmula", "Erro Cálculo", "Conceito", "Tempo"].map(r => <button key={r} type="button" onClick={() => setF({ ...f, r })} className={`text-xs px-3 py-1.5 rounded-full border ${f.r === r ? 'bg-[#1100ab] border-[#1100ab] text-white' : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>{r}</button>)}</div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Erro</label>
              <textarea required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-20" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Solução</label>
              <textarea required className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24" value={f.sol} onChange={e => setF({ ...f, sol: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {!mistakes.length ? <div className="text-center py-10 opacity-50"><CheckCircle size={40} className="mx-auto mb-2" /><p>Vazio.</p></div> : mistakes.map(m => (
            <div key={m.id} className={`border rounded-3xl p-5 relative group transition-all duration-300 ${m.consolidated ? 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-75' : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
              {m.consolidated && <div className="absolute top-4 right-12 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 flex items-center gap-1 select-none"><CheckCircle size={10} /> ERRO APRENDIDO</div>}
              <div className="absolute top-4 right-4 flex gap-2">
                {!m.consolidated && <button onClick={() => setCons({ open: true, id: m.id, d: m.description, diag: "", strat: "" })} className="text-zinc-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"><CheckCircle size={18} /></button>}
                <button onClick={() => deleteMistake(m.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: subjects.find(s => s.id === m.subjectId)?.color }}>{subjects.find(s => s.id === m.subjectId)?.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{m.reason}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1"><p className="text-xs text-red-400 font-bold uppercase">Erro</p><MathRenderer className="text-zinc-600 dark:text-zinc-300 text-sm" text={m.description} /></div>
                <div className="space-y-1 md:border-l md:border-zinc-200 dark:md:border-zinc-800 md:pl-6"><p className="text-xs text-green-400 font-bold uppercase">Solução</p><MathRenderer className="text-zinc-600 dark:text-zinc-300 text-sm" text={m.solution} /></div>
              </div>
              {m.consolidated && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                  <button onClick={() => setExp(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])} className="text-xs text-[#4d4dff] hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors">{exp.includes(m.id) ? 'Ocultar reflexão' : 'Ver minha reflexão'} <ChevronDown size={14} className={`transition-transform ${exp.includes(m.id) ? 'rotate-180' : ''}`} /></button>
                  {exp.includes(m.id) && (
                    <div className="mt-3 grid md:grid-cols-2 gap-4 animate-fadeIn">
                      <div className="bg-zinc-50 dark:bg-black/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Diagnóstico</p><p className="text-xs text-zinc-600 dark:text-zinc-300 italic">"{m.diagnosis}"</p></div>
                      <div className="bg-zinc-50 dark:bg-black/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800"><p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Estratégia</p><p className="text-xs text-zinc-600 dark:text-zinc-300 italic">"{m.strategy}"</p></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={cons.open} onClose={() => setCons({ ...cons, open: false })} title="Você realmente aprendeu?">
        <form onSubmit={e => { e.preventDefault(); if (cons.diag && cons.strat) { consolidateMistake(cons.id, cons.diag, cons.strat); setCons({ ...cons, open: false }); alert("Erro consolidado! +100 XP"); } }} className="space-y-4">
          <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-4"><p className="text-xs text-zinc-500 font-bold uppercase mb-1">Erro original</p><p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">{cons.d}</p></div>
          <div><label className="text-xs text-[#4d4dff] font-bold uppercase">Diagnóstico</label><textarea required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-20 outline-none focus:border-[#1100ab]" value={cons.diag} onChange={e => setCons({ ...cons, diag: e.target.value })} /></div>
          <div><label className="text-xs text-green-400 font-bold uppercase">Estratégia</label><textarea required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-20 outline-none focus:border-green-500" value={cons.strat} onChange={e => setCons({ ...cons, strat: e.target.value })} /></div>
          <Button type="submit" className="w-full mt-2">Confirmar Aprendizado</Button>
        </form>
      </Modal>
    </div>
  );
};