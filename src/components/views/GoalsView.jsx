import React, { useState, useContext } from 'react';
import { Target, Plus, ChevronRight, AlertTriangle, ListFilter, ChevronDown, Trash2, CheckSquare, X, Settings, ArrowLeft, Percent, GraduationCap, GripVertical, Edit2, Check, Clock } from 'lucide-react';
import { FocusContext, formatMinutesToReadableTime } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const GoalsView = () => {
  const { 
    subjects, sessions, addSubject, updateSubject, deleteSubject, 
    themes, addTheme, deleteTheme, addThemeItem, toggleThemeItem, deleteThemeItem,
    renameTheme, renameThemeItem, reorderThemes, reorderThemeItems, updateThemeItemImportance
  } = useContext(FocusContext);
  
  const [viewSub, setViewSub] = useState(null); 
  const [col, setCol] = useState({}); 
  const [modal, setModal] = useState(false); 
  const [f, setF] = useState({ name: "", goal: 60, color: "#8b5cf6", isSchool: false }); 
  const [edit, setEdit] = useState({ id: null, val: "" }); 
  const [newTheme, setNewTheme] = useState("");

  // Estados para edição in-line
  const [editingTheme, setEditingTheme] = useState({ id: null, text: "" });
  const [editingItem, setEditingItem] = useState({ id: null, text: "" });
  
  const getProg = (id, g) => { 
      const startW = new Date(); 
      startW.setDate(startW.getDate() - startW.getDay()); 
      startW.setHours(0,0,0,0);
      const wM = sessions.reduce((a, s) => (s.subjectId === id && new Date(s.date) >= startW) ? a + s.minutes : a, 0); 
      const goalM = g * 60;
      const p = goalM > 0 ? Math.round((wM / goalM) * 100) : 0; 
      return { h: (wM / 60).toFixed(1), p: Math.min(100, p || 0) }; 
  };

  const getTopicTime = (subjectId, topicText) => {
      const totalMins = sessions
          .filter(s => s.subjectId === subjectId && s.topic === topicText)
          .reduce((acc, s) => acc + (s.minutes || 0), 0);
      return formatMinutesToReadableTime(totalMins);
  };

const getTopicStats = (subjectId, topicText) => {
      return sessions
          .filter(s => s.subjectId === subjectId && s.topic === topicText)
          .reduce((acc, s) => ({
              questions: acc.questions + (s.questions || 0),
              errors: acc.errors + (s.errors || 0)
          }), { questions: 0, errors: 0 });
  };

  const getImportanceStyle = (imp) => {
      switch(imp) {
          case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
          case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
          default: return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      }
  };

  const getImportanceLabel = (imp) => {
      switch(imp) {
          case 'high': return 'Alta';
          case 'medium': return 'Média';
          default: return 'Baixa';
      }
  };

  const handleDragEnd = (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'THEME') {
      reorderThemes(viewSub, source.index, destination.index);
    } else if (type === 'ITEM') {
      // droppableId para itens é o ID do tema
      reorderThemeItems(Number(source.droppableId), source.index, destination.index);
    }
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
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="themes-list" type="THEME">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                {sTh.map((t, index) => { 
                  const p = t.items.length ? Math.round((t.items.filter(i => i.completed).length / t.items.length) * 100) : 0; 
                  return (
                    <Draggable key={t.id.toString()} draggableId={`theme-${t.id}`} index={index}>
                      {(providedTheme) => (
                        <Card 
                          innerRef={providedTheme.innerRef}
                          {...providedTheme.draggableProps}
                          className="relative group transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 w-full items-center">
                              {/* Drag Handle */}
                              <div {...providedTheme.dragHandleProps} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing">
                                <GripVertical size={20} />
                              </div>
                              <button onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-zinc-500">{col[t.id] ? <ChevronRight /> : <ChevronDown />}</button>
                              
                              <div className="flex-1 flex items-center gap-2">
                                {editingTheme.id === t.id ? (
                                  <div className="flex items-center gap-2 w-full max-w-sm">
                                    <input 
                                      autoFocus
                                      className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-zinc-900 dark:text-white" 
                                      value={editingTheme.text} 
                                      onChange={e => setEditingTheme({ ...editingTheme, text: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          renameTheme(t.id, editingTheme.text);
                                          setEditingTheme({ id: null, text: "" });
                                        }
                                      }}
                                    />
                                    <button onClick={() => { renameTheme(t.id, editingTheme.text); setEditingTheme({ id: null, text: "" }); }} className="text-green-500"><Check size={18} /></button>
                                    <button onClick={() => setEditingTheme({ id: null, text: "" })} className="text-zinc-400"><X size={18} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <h3 onClick={() => setCol({ ...col, [t.id]: !col[t.id] })} className="text-xl font-bold text-zinc-900 dark:text-white cursor-pointer select-none">{t.title}</h3>
                                    <button onClick={() => setEditingTheme({ id: t.id, text: t.title })} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-opacity"><Edit2 size={14} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p}%` }} /></div>
                                <span className="text-xs text-zinc-500">{p}%</span>
                              </div>
                              <button onClick={() => deleteTheme(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                          </div>

                          {!col[t.id] && (
                            <Droppable droppableId={t.id.toString()} type="ITEM">
                              {(providedItemDrop) => (
                                <div {...providedItemDrop.droppableProps} ref={providedItemDrop.innerRef} className="space-y-2 mb-4 animate-fadeIn pl-8">
                                  {t.items.map((i, itemIdx) => (
                                    <Draggable key={i.id.toString()} draggableId={`item-${i.id}`} index={itemIdx}>
                                      {(providedItemDrag) => (
                                        <div 
                                          ref={providedItemDrag.innerRef}
                                          {...providedItemDrag.draggableProps}
                                          className="flex gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-2xl group/item items-center"
                                        >
                                          <div {...providedItemDrag.dragHandleProps} className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 cursor-grab active:cursor-grabbing">
                                            <GripVertical size={14} />
                                          </div>
                                          <button onClick={() => toggleThemeItem(t.id, i.id)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${i.completed ? 'bg-primary border-primary' : 'border-zinc-400 dark:border-zinc-600'}`}>{i.completed && <CheckSquare size={14} className="text-white" />}</button>
                                          
                                          {editingItem.id === i.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                              <input 
                                                autoFocus
                                                className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-600 rounded px-2 py-0.5 text-sm text-zinc-900 dark:text-white"
                                                value={editingItem.text}
                                                onChange={e => setEditingItem({ ...editingItem, text: e.target.value })}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    renameThemeItem(t.id, i.id, editingItem.text);
                                                    setEditingItem({ id: null, text: "" });
                                                  }
                                                }}
                                              />
                                              <button onClick={() => { renameThemeItem(t.id, i.id, editingItem.text); setEditingItem({ id: null, text: "" }); }} className="text-green-500"><Check size={16} /></button>
                                              <button onClick={() => setEditingItem({ id: null, text: "" })} className="text-zinc-400"><X size={16} /></button>
                                            </div>
                                          ) : (
                                            <div className="flex-1 flex items-center gap-2">
                                              <span className={`text-sm ${i.completed ? 'text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>{i.text}</span>
                                              <button onClick={() => setEditingItem({ id: i.id, text: i.text })} className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-opacity"><Edit2 size={12} /></button>
                                            </div>
                                          )}

{/* Adicione isso logo acima do render das badges para preparar os dados */}
{(() => {
  const stats = getTopicStats(s.id, i.text);
  const currentImp = i.importance || 'low'; // Garantia para itens antigos

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Badge de Importância (Clicável) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Essencial para não bugar o Drag and Drop
          const nextImp = currentImp === 'low' ? 'medium' : currentImp === 'medium' ? 'high' : 'low';
          updateThemeItemImportance(t.id, i.id, nextImp);
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer hover:opacity-80 ${getImportanceStyle(currentImp)}`}
        title="Alternar Importância"
      >
        <ListFilter size={10} />
        {getImportanceLabel(currentImp)}
      </button>

      {/* Badge de Tempo Estudado (Mantida e melhorada) */}
      <div className="flex items-center gap-1 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md text-zinc-500 dark:text-zinc-400 text-xs font-medium whitespace-nowrap">
        <Clock size={12} />
        {getTopicTime(s.id, i.text)}
      </div>

      {/* Badge de Questões (Renderiza apenas se > 0) */}
      {stats.questions > 0 && (
        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap" title="Questões Feitas">
          <CheckSquare size={12} />
          {stats.questions}
        </div>
      )}

      {/* Badge de Erros (Renderiza apenas se > 0) */}
      {stats.errors > 0 && (
        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap" title="Erros Cometidos">
          <AlertTriangle size={12} />
          {stats.errors}
        </div>
      )}
    </div>
  );
})()}

                                          <button onClick={() => deleteThemeItem(t.id, i.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 shrink-0"><X size={14} /></button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {providedItemDrop.placeholder}
                                  
                                  <form onSubmit={e => { e.preventDefault(); if (e.target.item.value) { addThemeItem(t.id, e.target.item.value); e.target.reset(); } }} className="flex gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                                    <input name="item" className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-3 py-1.5 text-sm text-zinc-900 dark:text-white" placeholder="Tópico (Ctrl+V para lista)..." onPaste={e => { const d = e.clipboardData.getData('text'); if (d.includes('\n')) { e.preventDefault(); d.split('\n').map(l => l.trim()).filter(l => l).forEach(l => addThemeItem(t.id, l)); } }} />
                                    <button type="submit" className="p-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-primary text-zinc-900 dark:text-white hover:text-white rounded"><Plus size={16} /></button>
                                  </form>
                                </div>
                              )}
                            </Droppable>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ) 
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  // ... (O restante do componente principal renderizando as matérias mantém-se inalterado)
  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
       {/* Conteúdo original da View principal mantido... */}
       {/* Cole aqui o restante original do arquivo a partir de `header className="flex justify-between items-center mb-4"` */}
       <header className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Matérias e Metas</h1><Button onClick={() => setModal(true)}><Plus size={18} /> Nova</Button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(s => { 
          const { h, p } = getProg(s.id, s.goalHours); 
          return (
            <Card key={s.id} className="relative overflow-hidden group cursor-pointer hover:border-primary/50">
              <div onClick={() => setViewSub(s.id)}>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: s.color }} />
                <div className="mb-4"><h3 className="text-xl font-bold text-zinc-900 dark:text-white">{s.name}</h3>
                {s.isSchool ? (
                    <p className="text-xs font-bold text-zinc-400 uppercase mt-1 flex items-center gap-1"><GraduationCap size={14}/> Apenas Escolar</p>
                ) : (
                    edit.id !== s.id && <p className="text-sm text-zinc-500">Meta: {s.goalHours}h</p>
                )}
                </div>
                
                {!s.isSchool && edit.id !== s.id && (<><div className="mb-2 flex justify-between items-end"><span className="text-3xl font-bold text-zinc-900 dark:text-white">{h}h</span><span className="text-sm font-medium" style={{ color: s.color }}>{p}%</span></div><div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p}%`, backgroundColor: s.color }} /></div></>)}
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                {edit.id === s.id ? (
                  <div className="flex gap-2 bg-black/80 p-1 rounded-2xl"><input type="number" className="w-16 bg-black border border-zinc-600 rounded-2xl px-1 text-sm text-white" value={edit.val} onChange={e => setEdit({ ...edit, val: e.target.value })} autoFocus /><button onClick={() => { updateSubject(s.id, edit.val / 60); setEdit({ id: null, val: "" }) }} className="text-green-400 text-xs font-bold">OK</button></div>
                ) : (
                  <>
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
        <form onSubmit={e => { e.preventDefault(); addSubject(f.name, f.color, f.isSchool ? 0 : f.goal / 60, f.isSchool); setModal(false); setF({ name: "", goal: 60, color: "#8b5cf6", isSchool: false }); }} className="space-y-4">
          <div><label className="text-sm text-zinc-500">Nome</label><input required className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 text-zinc-900 dark:text-white" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
             <input type="checkbox" id="isSchool" className="w-5 h-5 rounded text-primary focus:ring-primary" checked={f.isSchool} onChange={e => setF({...f, isSchool: e.target.checked})} />
             <label htmlFor="isSchool" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">Apenas Escolar (Não conta nas estatísticas)</label>
          </div>

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