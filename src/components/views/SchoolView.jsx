import React, { useContext, useState } from 'react';
import { GraduationCap, Plus, Calendar, Clock, Trash2, FileText, CheckCircle, Send, ClipboardCheck, AlertCircle } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const SchoolView = () => {
  const { subjects, schoolWorks, addWork, updateWork, deleteWork } = useContext(FocusContext);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null); 
  const [form, setForm] = useState({ subjectId: "", title: "", dueDate: "", description: "" });

  // Helpers de Status
  const statusConfig = {
    pending: { label: 'Pendente', icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-200' },
    done: { label: 'Feito', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    delivered: { label: 'Entregue', icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    corrected: { label: 'Corrigido', icon: ClipboardCheck, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
  };

  const getUrgency = (dateString, status) => {
    if (status === 'delivered' || status === 'corrected') return { label: "Entregue", color: "text-zinc-400", border: "border-zinc-200 dark:border-zinc-800" };
    if (status === 'done') return { label: "Concluído (Não entregue)", color: "text-emerald-500", border: "border-emerald-500" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString + 'T00:00:00');
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Atrasado", color: "text-red-500", border: "border-red-500 animate-pulse" };
    if (diffDays === 0) return { label: "É Hoje!", color: "text-red-600", border: "border-red-600 animate-pulse" };
    if (diffDays <= 3) return { label: `${diffDays} dias`, color: "text-orange-500", border: "border-orange-500" };
    return { label: `${diffDays} dias`, color: "text-emerald-500", border: "border-zinc-200 dark:border-zinc-800" };
  };

  // Ordenação: Pendentes primeiro (por data), depois os finalizados
  const sortedWorks = [...schoolWorks].sort((a, b) => {
    const score = (status) => status === 'pending' ? 0 : status === 'done' ? 1 : 2;
    if (score(a.status) !== score(b.status)) return score(a.status) - score(b.status);
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (form.subjectId && form.title && form.dueDate) {
      addWork(form.subjectId, form.title, form.dueDate, form.description);
      setForm({ subjectId: "", title: "", dueDate: "", description: "" });
      setIsAddModalOpen(false);
    }
  };

  // Função para atualizar status
  const handleStatusChange = (newStatus) => {
    if (!selectedWork) return;
    
    // Se mudar para algo que não é corrigido, limpa a nota (opcional, mas seguro)
    const updates = { status: newStatus };
    if (newStatus !== 'corrected') updates.grade = null;
    
    updateWork(selectedWork.id, updates);
    
    // Atualiza o modal localmente para refletir mudança imediata
    setSelectedWork(prev => ({ ...prev, ...updates }));
  };

  const handleGradeChange = (val) => {
    const num = parseFloat(val);
    updateWork(selectedWork.id, { grade: isNaN(num) ? null : num });
    setSelectedWork(prev => ({ ...prev, grade: isNaN(num) ? null : num }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Trabalhos Escolares</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Controle de entregas e notas.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Novo
        </Button>
      </header>

      {/* LISTA */}
      <div className="space-y-4">
        {sortedWorks.length === 0 ? (
           <div className="text-center py-12 opacity-50">
             <GraduationCap size={48} className="mx-auto mb-3 text-zinc-400" />
             <p className="text-zinc-500">Nenhum trabalho registrado.</p>
           </div>
        ) : (
            sortedWorks.map(work => {
                const subject = subjects.find(s => s.id === work.subjectId);
                const urgency = getUrgency(work.dueDate, work.status);
                const stConfig = statusConfig[work.status] || statusConfig.pending;
                const StatusIcon = stConfig.icon;

                return (
                    <Card 
                        key={work.id} 
                        onClick={() => setSelectedWork(work)}
                        className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group border-l-4 ${urgency.border}`}
                    >
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span 
                                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider"
                                        style={{ backgroundColor: subject?.color || '#71717a' }}
                                    >
                                        {subject?.name || 'Geral'}
                                    </span>
                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(work.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <h3 className={`text-lg font-bold truncate ${work.status === 'corrected' || work.status === 'delivered' ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>
                                    {work.title}
                                </h3>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold uppercase border ${stConfig.color} ${stConfig.bg} ${stConfig.border}`}>
                                    <StatusIcon size={12} /> {stConfig.label}
                                </div>
                                {work.grade !== null && work.grade !== undefined && (
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                        Nota: {work.grade}
                                    </span>
                                )}
                                {(work.status === 'pending' || work.status === 'done') && (
                                    <span className={`text-xs ${urgency.color} font-medium`}>{urgency.label}</span>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })
        )}
      </div>

      {/* MODAL: CRIAR */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Trabalho">
        <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Matéria</label>
                <select 
                    required 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.subjectId}
                    onChange={e => setForm({ ...form, subjectId: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Título</label>
                <input 
                    required 
                    type="text" 
                    placeholder="Ex: Redação, Maquete..." 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                />
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Data de Entrega</label>
                <input 
                    required 
                    type="date" 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
            </div>
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase">Detalhes (Opcional)</label>
                <textarea 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
            </div>
            <Button type="submit" className="w-full mt-2">Salvar Trabalho</Button>
        </form>
      </Modal>

      {/* MODAL: DETALHES E STATUS */}
      {selectedWork && (
          <Modal isOpen={!!selectedWork} onClose={() => setSelectedWork(null)} title="Gerenciar Trabalho">
              <div className="space-y-6">
                
                {/* Cabeçalho do Modal */}
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === selectedWork.subjectId)?.color || '#555' }}></div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase">
                            {subjects.find(s => s.id === selectedWork.subjectId)?.name || 'Matéria Excluída'}
                        </p>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedWork.title}</h2>
                    </div>
                </div>

                {/* Ciclo de Vida (Botões de Status) */}
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Status Atual</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['pending', 'done', 'delivered', 'corrected'].map((st) => {
                            const conf = statusConfig[st];
                            const isActive = selectedWork.status === st;
                            return (
                                <button
                                    key={st}
                                    onClick={() => handleStatusChange(st)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all
                                        ${isActive 
                                            ? `bg-primary text-white border-primary shadow-lg shadow-primary/20` 
                                            : `bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-primary/50`
                                        }
                                    `}
                                >
                                    <conf.icon size={16} /> {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Campo de Nota (Só aparece se estiver Corrigido) */}
                {selectedWork.status === 'corrected' && (
                    <div className="animate-fadeIn bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl">
                        <label className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase flex items-center gap-2 mb-2">
                            <ClipboardCheck size={14}/> Nota Final
                        </label>
                        <input 
                            type="number" 
                            step="0.1"
                            placeholder="Ex: 10, 8.5..."
                            className="w-full bg-white dark:bg-black border border-purple-200 dark:border-purple-900/50 rounded-xl p-3 text-2xl font-bold text-center text-purple-700 dark:text-purple-300 outline-none focus:border-purple-500"
                            value={selectedWork.grade === null ? '' : selectedWork.grade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                        />
                        <p className="text-[10px] text-center text-zinc-400 mt-2">A nota será salva automaticamente.</p>
                    </div>
                )}

                {/* Descrição */}
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[80px]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1"><FileText size={10}/> Detalhes</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {selectedWork.description || <span className="text-zinc-400 italic">Sem descrição.</span>}
                    </p>
                </div>

                {/* Rodapé: Excluir */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => { deleteWork(selectedWork.id); setSelectedWork(null); }}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
                    >
                        <Trash2 size={16} /> Excluir Trabalho
                    </button>
                </div>

              </div>
          </Modal>
      )}
    </div>
  );
};