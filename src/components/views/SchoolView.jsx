import React, { useContext, useState } from 'react';
import { GraduationCap, Plus, Calendar, AlertCircle, Clock, Trash2, FileText, ChevronRight } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const SchoolView = () => {
  const { subjects, schoolWorks, addWork, deleteWork } = useContext(FocusContext);
  
  // Estados para Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null); // Para ver detalhes

  // Estado do Formulário
  const [form, setForm] = useState({ subjectId: "", title: "", dueDate: "", description: "" });

  // Função para calcular dias restantes e estilos
  const getUrgency = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString + 'T00:00:00'); // Garante hora local/meia noite
    
    // Diferença em dias
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, label: "Atrasado", color: "text-red-500", border: "border-red-500", bg: "bg-red-500/10" };
    if (diffDays === 0) return { days: 0, label: "É Hoje!", color: "text-red-600", border: "border-red-600 animate-pulse", bg: "bg-red-600/10" };
    if (diffDays <= 1) return { days: diffDays, label: "Amanhã", color: "text-red-500", border: "border-red-500", bg: "bg-red-500/10" };
    if (diffDays <= 3) return { days: diffDays, label: `${diffDays} dias`, color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-500/10" };
    if (diffDays <= 7) return { days: diffDays, label: `${diffDays} dias`, color: "text-yellow-500", border: "border-yellow-500", bg: "bg-yellow-500/10" };
    
    return { days: diffDays, label: `${diffDays} dias`, color: "text-emerald-500", border: "border-zinc-200 dark:border-zinc-800", bg: "bg-emerald-500/10" };
  };

  // Ordenar trabalhos por data (mais próximo primeiro)
  const sortedWorks = [...schoolWorks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (form.subjectId && form.title && form.dueDate) {
      addWork(form.subjectId, form.title, form.dueDate, form.description);
      setForm({ subjectId: "", title: "", dueDate: "", description: "" });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Trabalhos Escolares</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Gerencie suas entregas e prazos.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Novo
        </Button>
      </header>

      {/* LISTA DE TRABALHOS */}
      <div className="space-y-4">
        {sortedWorks.length === 0 ? (
           <div className="text-center py-12 opacity-50">
             <GraduationCap size={48} className="mx-auto mb-3 text-zinc-400" />
             <p className="text-zinc-500">Nenhum trabalho pendente.</p>
           </div>
        ) : (
            sortedWorks.map(work => {
                const subject = subjects.find(s => s.id === work.subjectId);
                const urgency = getUrgency(work.dueDate);

                return (
                    <Card 
                        key={work.id} 
                        onClick={() => setSelectedWork(work)}
                        className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group border-l-4 ${urgency.border.replace('animate-pulse', '')} ${urgency.days === 0 ? 'border-red-600' : ''}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    {/* Badge da Matéria */}
                                    <span 
                                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider"
                                        style={{ backgroundColor: subject?.color || '#71717a' }}
                                    >
                                        {subject?.name || 'Geral'}
                                    </span>
                                    {/* Data formatada */}
                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(work.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{work.title}</h3>
                                {work.description && <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-1">{work.description}</p>}
                            </div>

                            {/* Indicador de Urgência */}
                            <div className={`flex flex-col items-end flex-shrink-0 ${urgency.color}`}>
                                <span className={`text-xs font-bold uppercase bg-white dark:bg-black px-2 py-1 rounded-lg border ${urgency.border} flex items-center gap-1`}>
                                    <Clock size={12} /> {urgency.label}
                                </span>
                            </div>
                        </div>
                    </Card>
                );
            })
        )}
      </div>

      {/* MODAL: NOVO TRABALHO */}
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
                    placeholder="Ex: Trabalho de História..." 
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
                <label className="text-xs text-zinc-500 font-bold uppercase">Sobre o trabalho (Detalhes)</label>
                <textarea 
                    className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white h-24 outline-none focus:border-primary resize-none"
                    placeholder="Capítulos para ler, links, requisitos..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
            </div>
            <Button type="submit" className="w-full mt-2">Adicionar na Agenda</Button>
        </form>
      </Modal>

      {/* MODAL: DETALHES DO TRABALHO */}
      {selectedWork && (
          <Modal isOpen={!!selectedWork} onClose={() => setSelectedWork(null)} title="Detalhes do Trabalho">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: subjects.find(s => s.id === selectedWork.subjectId)?.color || '#555' }}></div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase">
                            {subjects.find(s => s.id === selectedWork.subjectId)?.name || 'Matéria Excluída'}
                        </p>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedWork.title}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Calendar size={10}/> Entrega</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                            {new Date(selectedWork.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1 flex items-center gap-1"><Clock size={10}/> Prazo</p>
                        <p className={`font-semibold ${getUrgency(selectedWork.dueDate).color}`}>
                            {getUrgency(selectedWork.dueDate).label}
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[100px]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1"><FileText size={10}/> Sobre o trabalho</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {selectedWork.description || <span className="text-zinc-400 italic">Sem descrição.</span>}
                    </p>
                </div>

                <div className="pt-2">
                    <button 
                        onClick={() => { deleteWork(selectedWork.id); setSelectedWork(null); }}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all font-bold text-sm"
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