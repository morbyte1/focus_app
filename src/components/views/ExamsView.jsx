import React, { useContext, useState } from 'react';
import { ClipboardList, Plus, Calendar, Clock, Award, Trash2, ChevronRight, PieChart } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const ExamsView = () => {
  const { exams, addExam, deleteExam, subjects } = useContext(FocusContext);
  
  // Estado para o Modal de Nova Prova
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    generalGrade: '',
    generalMax: '', // Novo campo: Nota Máxima ou Total de Questões Geral
    subjects: [] // Array de { id, subjectId, grade, max }
  });

  // Estado para o Modal de Detalhes
  const [selectedExam, setSelectedExam] = useState(null);

  // --- Handlers do Formulário ---
  
  // Adicionar uma linha de matéria específica
  const addSubjectRow = () => {
    setForm(prev => ({
      ...prev,
      subjects: [...prev.subjects, { id: Date.now(), subjectId: '', grade: '', max: '' }]
    }));
  };

  // Remover linha de matéria
  const removeSubjectRow = (rowId) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== rowId)
    }));
  };

  // Atualizar valores na linha de matéria
  const updateSubjectRow = (rowId, field, value) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === rowId ? { ...s, [field]: value } : s)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.generalGrade || !form.generalMax) return alert("Preencha o nome, nota obtida e nota máxima.");

    addExam({
      name: form.name,
      date: form.date,
      duration: form.duration,
      generalGrade: form.generalGrade,
      generalMax: form.generalMax, // Salvando o máximo geral
      subjects: form.subjects.filter(s => s.subjectId && s.grade) // Salva apenas linhas preenchidas (max é opcional, mas recomendado)
    });

    setIsModalOpen(false);
    setForm({ name: '', date: new Date().toISOString().split('T')[0], duration: '', generalGrade: '', generalMax: '', subjects: [] });
  };

  // Helper para calcular porcentagem
  const getPercentage = (val, max) => {
    if (!val || !max) return 0;
    return Math.round((Number(val) / Number(max)) * 100);
  };

  // Helper para cor da porcentagem
  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 50) return 'text-blue-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-0">
      
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Minhas Provas</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Histórico de avaliações e simulados.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nova Prova
        </Button>
      </header>

      {/* Grid de Provas (Lista Resumida) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.length === 0 ? (
          <div className="col-span-full text-center py-12 opacity-50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <ClipboardList size={48} className="mx-auto mb-3 text-zinc-400" />
            <p className="text-zinc-500">Nenhuma prova registrada.</p>
          </div>
        ) : (
          exams.map(exam => (
            <Card 
              key={exam.id} 
              className="cursor-pointer hover:border-primary/50 group relative transition-all"
              onClick={() => setSelectedExam(exam)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                   <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{exam.name}</h3>
                   <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <Calendar size={12}/> {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                   </div>
                </div>
                {/* Badge de Nota x/x */}
                <div className="flex flex-col items-end">
                    <div className="bg-primary/10 text-primary-light px-3 py-1 rounded-xl text-sm font-bold border border-primary/20">
                    {exam.generalGrade} <span className="text-primary-light/60 text-xs">/ {exam.generalMax}</span>
                    </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                 <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                    <Clock size={12}/> {exam.duration || '--:--'}
                 </span>
                 <span className="text-xs font-bold text-zinc-400 group-hover:text-primary transition-colors flex items-center gap-1">
                    Ver detalhes <ChevronRight size={12}/>
                 </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* --- MODAL: NOVA PROVA --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Prova">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dados Gerais */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase">Nome da Prova</label>
              <input required type="text" placeholder="Ex: ENEM 2024 - Dia 1" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Data</label>
                  <input required type="date" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
               </div>
               <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Duração (hh:mm)</label>
                  <input type="time" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
               </div>
            </div>

            {/* Linha de Nota Geral e Nota Máxima */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase flex items-center gap-2">
                        <Award size={14}/> Nota Obtida
                    </label>
                    <input required type="number" step="0.1" placeholder="Ex: 75" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary text-lg font-bold" value={form.generalGrade} onChange={e => setForm({ ...form, generalGrade: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase flex items-center gap-2">
                        <PieChart size={14}/> Total / Máx
                    </label>
                    <input required type="number" step="0.1" placeholder="Ex: 90" className="w-full mt-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-zinc-900 dark:text-white outline-none focus:border-primary text-lg font-bold" value={form.generalMax} onChange={e => setForm({ ...form, generalMax: e.target.value })} />
                </div>
            </div>
          </div>

          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800"></div>

          {/* Seção Dinâmica de Matérias */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-xs text-zinc-500 font-bold uppercase">Notas por Matéria</label>
               <button type="button" onClick={addSubjectRow} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                 <Plus size={12}/> Adicionar Matéria
               </button>
            </div>
            
            <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
               {form.subjects.map((item) => (
                 <div key={item.id} className="flex gap-2 items-center animate-fadeIn">
                    <select 
                        className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary"
                        value={item.subjectId}
                        onChange={(e) => updateSubjectRow(item.id, 'subjectId', e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    
                    {/* Nota Obtida */}
                    <input 
                        type="number" 
                        placeholder="Nota" 
                        className="w-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary text-center"
                        value={item.grade}
                        onChange={(e) => updateSubjectRow(item.id, 'grade', e.target.value)}
                    />
                    
                    <span className="text-zinc-400 text-sm">/</span>

                    {/* Nota Máxima */}
                    <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary text-center"
                        value={item.max}
                        onChange={(e) => updateSubjectRow(item.id, 'max', e.target.value)}
                    />

                    <button type="button" onClick={() => removeSubjectRow(item.id)} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 size={16}/>
                    </button>
                 </div>
               ))}
               {form.subjects.length === 0 && (
                 <p className="text-xs text-zinc-400 italic text-center py-2">Nenhuma matéria detalhada.</p>
               )}
            </div>
          </div>

          <Button type="submit" className="w-full">Salvar Prova</Button>
        </form>
      </Modal>

      {/* --- MODAL: DETALHES DA PROVA --- */}
      {selectedExam && (
        <Modal isOpen={!!selectedExam} onClose={() => setSelectedExam(null)} title="Detalhes da Prova">
           <div className="space-y-6">
              
              {/* Header do Detalhe */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none"/>
                 <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{selectedExam.name}</h2>
                 <div className="flex justify-center items-center gap-4 text-sm text-zinc-500 mb-6">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(selectedExam.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"/>
                    <span className="flex items-center gap-1"><Clock size={14}/> {selectedExam.duration || 'N/A'}</span>
                 </div>
                 
                 {/* Placar Principal com Porcentagem */}
                 <div className="inline-flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1">Desempenho Geral</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-zinc-900 dark:text-white">{selectedExam.generalGrade}</span>
                        <span className="text-xl font-medium text-zinc-400">/ {selectedExam.generalMax}</span>
                    </div>
                    {selectedExam.generalMax && (
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getPercentage(selectedExam.generalGrade, selectedExam.generalMax) >= 50 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {getPercentage(selectedExam.generalGrade, selectedExam.generalMax)}% de aproveitamento
                        </div>
                    )}
                 </div>
              </div>

              {/* Lista de Matérias */}
              <div>
                 <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <ClipboardList size={16} className="text-zinc-400"/> Desempenho por Matéria
                 </h3>
                 <div className="space-y-3">
                    {selectedExam.subjects && selectedExam.subjects.length > 0 ? (
                        selectedExam.subjects.map((item, idx) => {
                            const sub = subjects.find(s => s.id === Number(item.subjectId));
                            const pct = item.max ? getPercentage(item.grade, item.max) : 0;
                            
                            return (
                                <div key={idx} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color || '#555' }}></div>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">{sub?.name || 'Matéria Excluída'}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-zinc-900 dark:text-white">{item.grade}</span>
                                            {item.max && <span className="text-xs text-zinc-400"> / {item.max}</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Barra de Progresso por Matéria */}
                                    {item.max && (
                                        <div className="w-full flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-bold ${getScoreColor(pct)}`}>{pct}%</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                            Sem notas específicas registradas.
                        </div>
                    )}
                 </div>
              </div>

              {/* Footer com Botão de Excluir */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                 <button 
                    onClick={() => { deleteExam(selectedExam.id); setSelectedExam(null); }}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-colors text-xs font-bold"
                 >
                    <Trash2 size={16}/> Excluir Registro
                 </button>
              </div>
           </div>
        </Modal>
      )}

    </div>
  );
};