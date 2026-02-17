import React, { useState, useMemo } from 'react';
import { FixedExpense } from '../types';
import { Card, Input, Select, BigButton, Modal } from '../components/UI';
import { Pencil, Trash2 } from 'lucide-react';

interface AdminFixedExpensesProps {
  fixedExpenses: FixedExpense[];
  onUpdateExpenses: (expenses: FixedExpense[]) => void;
  onBack: () => void;
}

const CATEGORIA_OPTIONS: { label: string; value: string }[] = [
  { label: 'Salários/Equipe', value: 'funcionario' },
  { label: 'Contador', value: 'contador' },
  { label: 'Manobra', value: 'manobra' },
  { label: 'Sistema', value: 'sistema' },
  { label: 'Impostos', value: 'imposto' },
  { label: 'Outros/Gerais', value: 'outros' },
  { label: 'Outra (digite abaixo)', value: '__outra__' },
];

const AdminFixedExpenses: React.FC<AdminFixedExpensesProps> = ({ fixedExpenses, onUpdateExpenses, onBack }) => {
  const [categoria, setCategoria] = useState('outros');
  const [categoriaOutra, setCategoriaOutra] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [diaVencimento, setDiaVencimento] = useState('');

  const [parcDescricao, setParcDescricao] = useState('');
  const [parcValorTotal, setParcValorTotal] = useState('');
  const [parcNumParcelas, setParcNumParcelas] = useState('');
  const [parcPrimeiraData, setParcPrimeiraData] = useState(new Date().toISOString().slice(0, 7));
  const [parcDiaVencimento, setParcDiaVencimento] = useState('');
  const [parcCategoria, setParcCategoria] = useState('outros');
  const [parcCategoriaOutra, setParcCategoriaOutra] = useState('');

  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [editDescricao, setEditDescricao] = useState('');
  const [editCategoria, setEditCategoria] = useState('outros');
  const [editCategoriaOutra, setEditCategoriaOutra] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editDataCompetencia, setEditDataCompetencia] = useState('');
  const [editDiaVencimento, setEditDiaVencimento] = useState('');

  const parseDia = (v: string): number | undefined => {
    const n = Math.floor(Number(v));
    if (v === '' || isNaN(n)) return undefined;
    return Math.max(1, Math.min(31, n));
  };

  const openEdit = (e: FixedExpense) => {
    setEditingExpense(e);
    setEditDescricao(e.descricao || '');
    const isOutra = CATEGORIA_OPTIONS.every(opt => opt.value !== e.categoria);
    setEditCategoria(isOutra ? '__outra__' : e.categoria);
    setEditCategoriaOutra(isOutra ? e.categoria : '');
    setEditValor(String(e.valor ?? ''));
    setEditDataCompetencia(e.dataCompetencia || new Date().toISOString().slice(0, 7));
    setEditDiaVencimento(e.diaVencimento != null ? String(e.diaVencimento) : '');
  };

  const closeEdit = () => {
    setEditingExpense(null);
    setEditDescricao('');
    setEditCategoria('outros');
    setEditCategoriaOutra('');
    setEditValor('');
    setEditDataCompetencia('');
    setEditDiaVencimento('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editDescricao.trim() || editValor === '' || Number(editValor) < 0) return;
    const catFinal = editCategoria === '__outra__' ? (editCategoriaOutra.trim() || 'Outra') : editCategoria;
    const updated: FixedExpense = {
      ...editingExpense,
      descricao: editDescricao.trim(),
      categoria: catFinal,
      valor: Math.round(Number(editValor) * 100) / 100,
      dataCompetencia: editDataCompetencia,
      diaVencimento: parseDia(editDiaVencimento),
    };
    onUpdateExpenses(fixedExpenses.map(x => (x.id === updated.id ? updated : x)));
    closeEdit();
  };

  const handleDelete = (exp: FixedExpense) => {
    if (!window.confirm(`Excluir "${exp.descricao}" (R$ ${Number(exp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})?`)) return;
    onUpdateExpenses(fixedExpenses.filter(x => x.id !== exp.id));
    if (editingExpense?.id === exp.id) closeEdit();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor) return;
    const catFinal = categoria === '__outra__' ? (categoriaOutra.trim() || 'Outra') : categoria;
    const newExp: FixedExpense = {
      id: crypto.randomUUID(),
      categoria: catFinal,
      descricao,
      valor: Number(valor),
      dataCompetencia: mes,
      diaVencimento: parseDia(diaVencimento),
      createdAt: new Date().toISOString()
    };
    onUpdateExpenses([newExp, ...fixedExpenses]);
    setDescricao(''); setValor(''); setCategoriaOutra(''); setDiaVencimento('');
  };

  const handleAddParceled = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(parcValorTotal);
    const n = Math.max(1, Math.min(60, Math.floor(Number(parcNumParcelas) || 1)));
    if (!parcDescricao.trim() || total <= 0 || n < 1) return;
    const catParcFinal = parcCategoria === '__outra__' ? (parcCategoriaOutra.trim() || 'Outra') : parcCategoria;
    const [y, m] = parcPrimeiraData.split('-').map(Number);
    const valorParcela = total / n;
    const parcelas: FixedExpense[] = [];
    const diaVen = parseDia(parcDiaVencimento);
    for (let i = 0; i < n; i++) {
      const date = new Date(y, m - 1 + i, 1);
      const dataCompetencia = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const valorFinal = i === n - 1 ? total - valorParcela * (n - 1) : valorParcela;
      parcelas.push({
        id: crypto.randomUUID(),
        categoria: catParcFinal,
        descricao: `${parcDescricao.trim()} — Parcela ${i + 1}/${n}`,
        valor: Math.round(valorFinal * 100) / 100,
        dataCompetencia,
        diaVencimento: diaVen,
        createdAt: new Date().toISOString()
      });
    }
    onUpdateExpenses([...parcelas, ...fixedExpenses]);
    setParcDescricao(''); setParcValorTotal(''); setParcNumParcelas(''); setParcDiaVencimento(''); setParcCategoriaOutra('');
  };

  const filtered = useMemo(() => fixedExpenses.filter(e => e.dataCompetencia === mes), [fixedExpenses, mes]);
  
  // Garantia de soma numérica real para despesas fixas
  const total = useMemo(() => filtered.reduce((acc, curr) => Number(acc) + Number(curr.valor || 0), 0), [filtered]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">Custos Estruturais</h2>
          <p className="text-slate-500 text-sm">Administração de despesas fixas mensais</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white">Voltar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-indigo-900/30">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Novo Lançamento</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <Select label="Categoria" value={categoria} onChange={setCategoria} options={CATEGORIA_OPTIONS} />
              {categoria === '__outra__' && (
                <Input label="Nome da categoria" value={categoriaOutra} onChange={setCategoriaOutra} placeholder="Digite a categoria" />
              )}
              <Input label="Mês de Referência" type="month" value={mes} onChange={setMes} />
              <Input label="Dia do vencimento (1-31)" type="number" value={diaVencimento} onChange={setDiaVencimento} placeholder="Opcional" />
              <Input label="Descrição do Gasto" value={descricao} onChange={setDescricao} placeholder="Descrição do gasto" />
              <Input label="Valor (R$)" type="number" value={valor} onChange={setValor} placeholder="0.00" />
              <BigButton onClick={() => {}}>CONFIRMAR GASTO</BigButton>
            </form>
          </Card>

          <Card className="border-amber-900/30 bg-amber-950/10">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-6">Despesa parcelada</h3>
            <form onSubmit={handleAddParceled} className="space-y-4">
              <Select label="Categoria" value={parcCategoria} onChange={setParcCategoria} options={CATEGORIA_OPTIONS} />
              {parcCategoria === '__outra__' && (
                <Input label="Nome da categoria" value={parcCategoriaOutra} onChange={setParcCategoriaOutra} placeholder="Digite a categoria" />
              )}
              <Input label="Descrição" value={parcDescricao} onChange={setParcDescricao} placeholder="Descrição" required />
              <Input label="Valor total (R$)" type="number" value={parcValorTotal} onChange={setParcValorTotal} placeholder="0.00" required />
              <Input label="Número de parcelas" type="number" value={parcNumParcelas} onChange={setParcNumParcelas} placeholder="3" />
              <Input label="1ª parcela (mês/ano)" type="month" value={parcPrimeiraData} onChange={setParcPrimeiraData} />
              <Input label="Dia do vencimento (1-31)" type="number" value={parcDiaVencimento} onChange={setParcDiaVencimento} placeholder="Opcional" />
              <BigButton onClick={() => {}} disabled={!parcDescricao.trim() || !parcValorTotal || Number(parcValorTotal) <= 0}>
                LANÇAR PARCELAS
              </BigButton>
            </form>
          </Card>
        </div>

        <Card className="lg:col-span-2 bg-slate-900/40">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Acumulado ({mes}):</span>
            <span className="text-3xl font-black text-white">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-700 italic text-sm">Nenhuma despesa para este período.</div>
            ) : (
              filtered.map(e => (
                <div key={e.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-200 uppercase tracking-tight truncate">{e.descricao}</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase mt-1 flex items-center gap-2">
                      {e.categoria}
                      {e.diaVencimento != null && e.diaVencimento >= 1 && e.diaVencimento <= 31 && (
                        <span className="text-slate-500">· Venc. dia {e.diaVencimento}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-red-400 shrink-0">R$ {Number(e.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <div className="flex items-center gap-1 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={!!editingExpense} onClose={closeEdit} title="Editar custo (fixo ou parcelado)">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Select label="Categoria" value={editCategoria} onChange={setEditCategoria} options={CATEGORIA_OPTIONS} />
          {editCategoria === '__outra__' && (
            <Input label="Nome da categoria" value={editCategoriaOutra} onChange={setEditCategoriaOutra} placeholder="Digite a categoria" />
          )}
          <Input label="Mês de referência" type="month" value={editDataCompetencia} onChange={setEditDataCompetencia} />
          <Input label="Dia do vencimento (1-31)" type="number" value={editDiaVencimento} onChange={setEditDiaVencimento} placeholder="Opcional" />
          <Input label="Descrição" value={editDescricao} onChange={setEditDescricao} placeholder="Descrição do gasto" />
          <Input label="Valor (R$)" type="number" value={editValor} onChange={setEditValor} placeholder="0.00" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeEdit} className="px-6 py-3 rounded-xl font-bold border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors uppercase text-xs tracking-widest">
              Cancelar
            </button>
            <button type="submit" disabled={!editDescricao.trim() || editValor === '' || Number(editValor) < 0} className="px-6 py-3 rounded-xl font-bold border border-blue-600 bg-blue-700 text-white hover:bg-blue-600 transition-colors uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFixedExpenses;
