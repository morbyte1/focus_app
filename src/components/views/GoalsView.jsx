import React, { useState, useContext } from 'react';
import { Target, Plus, ChevronRight, ChevronDown, Trash2, CheckSquare, X, Settings, ArrowLeft, Percent, GraduationCap } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const GoalsView = () => {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem } = useContext(FocusContext);
  const [viewSub, setViewSub] = useState(null); 
  const [col, setCol] = useState({}); 
  const [modal, setModal] = useState(false); 
  
  // ATUALIZADO: Adicionado estado isSchool no formulário
  const [f, setF] = useState({ name: "", goal: 60, color: "#8b5cf6", isSchool: false }); 
  
  const [edit, setEdit] = useState({ id: null, val: "" }); 
  const [newTheme, setNewTheme] = useState("");
  
  const getProg = (id, g) => { 
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0);
      const wM = sessions.reduce((a, s) => (s.subjectId === id && new Date(s.date) >= startW) ? a + s.minutes : a, 0); 
      // Evita divisão por zero se não tiver meta
      const goalM = g * 60;
      const p = goalM > 0 ? Math.round((wM / goalM) * 100) : 0; 
      return { h: (wM / 60).toFixed(1), p: Math.min(100, p || 0) }; 
  };

  if (viewSub) {
    const s = subjects.find(x => x.id === viewSub);
    const sTh = themes.filter(t => t.subjectId === s?.id);
    const tot = sTh.reduce((a, t) => a + t.items.length, 0);
    const comp = sTh.reduce((a, t) => a + t.items.filter(i => i.completed).length, 0);
    
    if (!s) return <div onClick={() => setViewSub(null)}>Erro.</div>;
    
    return (
      <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
        <button onClick={() => setViewSub(null)} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><ArrowLeft size={20} /> Voltar</button>
        <header className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <span className="text-xs font-bold uppercase px-2 py-1 rounded text-white mb-2 inline-block" style={{ backgroundColor: s.color }}>{s.name}</span>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Conteúdo</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-zinc-500 text-sm"><CheckSquare size={16} className="text-primary" /><span>{comp} / {tot} Tópicos</span></div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm"><Percent size={16} className="text-primary" /><span>{tot ? Math.round((comp / tot) * 100) : 0}% Concluído</span></div>
            </div>
          </div>
          {/* Se for escolar, mostra apenas o badge, não a meta */}
          {!s.isSchool && <div className="text-right text-2xl font-bold text-zinc-900 dark:text-white">{s.goalHours}h <span className="text-xs text-zinc-500 block font-normal">Meta Semanal</span></div>}
          {s.isSchool && <div className="text-right text-zinc-500"><div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full"><GraduationCap size={16}/> <span className="text-xs font-bold uppercase">Escolar</span></div></div>}
        </header>
        
        <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex gap-4 items-center">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 uppercase font-bold mb-1">Novo Tema</label>
            <input className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-2xl p-2 text-zinc-900 dark:text-white" value={newTheme} onChange={e => setNewTheme(e.target.value)} onKeyDown={e => e.key === 'Enter' && newTheme && addTheme(viewSub, newTheme) && setNewTheme("")} />
          </div>
          <Button onClick={() => newTheme && addTheme(viewSub, newTheme) && setNewTheme("")}>Adicionar</Button>
        </div>
        
        <div className="space-y-6">
          {sTh.map(t => { 
            const p = t.items.length ? Math.round((t.items.filter(i => i.completed).length / t.items.length) * 100) : 0; 
            return (
              <Card key={t.id} className="relative group transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-zinc-500">{col[t.id] ? <ChevronRight /> : <ChevronDown />}</button>
                    <div className="flex-1">
                      <h3 onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-xl font-bold text-zinc-900 dark:text-white cursor-pointer select-none">{t.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p}%` }} /></div>
                        <span className="text-xs text-zinc-500">{p}%</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteTheme(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
                {!col[t.id] && (
                  <div className="space-y-2 mb-4 animate-fadeIn pl-8">
                    {t.items.map(i => (
                      <div key={i.id} className="flex gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-2xl group/item">
                        <button onClick={() => toggleThemeItem(t.id, i.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${i.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-zinc-600'}`}>{i.completed && <CheckSquare size={14} className="text-white" />}</button>
                        <span className={`text-sm flex-1 ${i.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{i.text}</span>
                        <button onClick={() => deleteThemeItem(t.id, i.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    <form onSubmit={e => { e.preventDefault(); if (e.target.item.value) { addThemeItem(t.id, e.target.item.value); e.target.reset(); } }} className="flex gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                      <input name="item" className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-3 py-1.5 text-sm text-zinc-900 dark:text-white" placeholder="Tópico (Ctrl+V para lista)..." onPaste={e => { const d = e.clipboardData.getData('text'); if (d.includes('\n')) { e.preventDefault(); d.split('\n').map(l => l.trim()).filter(l => l).forEach(l => addThemeItem(t.id, l)); } }} />
                      <button type="submit" className="p-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-primary text-zinc-900 dark:text-white hover:text-white rounded"><Plus size={16} /></button>
                    </form>
                  </div>
                )}
              </Card>
            ) 
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Matérias e Metas</h1><Button onClick={() => setModal(true)}><Plus size={18} /> Nova</Button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(s => { 
          const { h, p } = getProg(s.id, s.goalHours); 
          return (
            <Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-primary/50">
              <div onClick={() => setViewSub(s.id)}>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: s.color }} />
                <div className="mb-4"><h3 className="text-xl font-bold text-zinc-900 dark:text-white">{s.name}</h3>
                {/* Lógica de exibição condicional */}
                {s.isSchool ? (
                    <p className="text-xs font-bold text-zinc-400 uppercase mt-1 flex items-center gap-1"><GraduationCap size={14}/> Apenas Escolar</p>
                ) : (
                    edit.id !== s.id && <p className="text-sm text-zinc-500">Meta: {s.goalHours}h</p>
                )}
                </div>
                
                {/* Se NÃO for escolar, mostra progresso. Se for, mostra vazio ou info */}
                {!s.isSchool && edit.id !== s.id && (<><div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-zinc-900 dark:text-white">{h}h</span><span className="text-sm font-medium" style={{ color: s.color }}>{p}%</span></div><div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p}%`, backgroundColor: s.color }} /></div></>)}
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                {edit.id === s.id ? (
                  <div className="flex gap-2 bg-black/80 p-1 rounded-2xl"><input type="number" className="w-16 bg-black border border-zinc-600 rounded-2xl px-1 text-sm text-white" value={edit.val} onChange={e => setEdit({ ...edit, val: e.target.value })} autoFocus /><button onClick={() => { updateSubject(s.id, edit.val / 60); setEdit({ id: null, val: "" }) }} className="text-green-400 text-xs font-bold">OK</button></div>
                ) : (
                  <>
                    {/* Só permite editar meta se não for escolar */}
                    {!s.isSchool && <button onClick={e => { e.stopPropagation(); setEdit({ id: s.id, val: Math.round(s.goalHours * 60) }) }} className="p-2 rounded-2xl bg-zinc-100 dark:bg-[#18181B]"><Settings size={16} className="text-zinc-400" /></button>}
                    <button onClick={e => { e.stopPropagation(); deleteSubject(s.id) }} className="p-2 rounded-2xl bg-zinc-100 dark:bg-[#18181B]"><Trash2 size={16} className="text-zinc-400 hover:text-red-500" /></button>
                  </>
                )}
              </div>
            </Card>
          ) 
        })}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nova Matéria">
        {/* ATUALIZADO: Passando isSchool para o addSubject */}
        <form onSubmit={e => { e.preventDefault(); addSubject(f.name, f.color, f.isSchool ? 0 : f.goal / 60, f.isSchool); setModal(false); setF({ name: "", goal: 60, color: "#8b5cf6", isSchool: false }); }} className="space-y-4">
          <div><label className="text-sm text-zinc-500">Nome</label><input required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 text-zinc-900 dark:text-white" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          
          {/* Checkbox Escolar */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
             <input type="checkbox" id="isSchool" className="w-5 h-5 rounded text-primary focus:ring-primary" checked={f.isSchool} onChange={e => setF({...f, isSchool: e.target.checked})} />
             <label htmlFor="isSchool" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">Apenas Escolar (Não conta nas estatísticas)</label>
          </div>

          {/* Só mostra input de horas se não for escolar */}
          {!f.isSchool && (
            <div className="animate-fadeIn">
                <label className="text-sm text-zinc-500">Meta Semanal (minutos)</label>
                <input required type="number" className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 text-zinc-900 dark:text-white" value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })} />
            </div>
          )}

          <div><label className="text-sm text-zinc-500">Cor</label><div className="flex gap-2 mt-2">{['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'].map(c => <div key={c} onClick={() => setF({ ...f, color: c })} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${f.color === c ? 'border-zinc-900 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div></div>
          <Button type="submit" className="w-full mt-4">Criar</Button>
        </form>
      </Modal>
    </div>
  );
};