import React, { useState, useMemo } from 'react';
import { DailyRoute, RouteDeparture, User, UserRole, FinanceiroStatus } from '../types';
import { Card, Input, Select } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PagamentoEquipe {
  id: string;
  data: string;
  tipo: 'Viagem' | 'Diário';
  papel: 'motorista' | 'ajudante';
  pessoaId: string;
  pessoaNome: string;
  placa: string;
  destino: string;
  oc: string;
  valor: number;
}

interface AdminTeamReportProps {
  dailyRoutes: DailyRoute[];
  routes: RouteDeparture[];
  users: User[];
  onBack: () => void;
}

const AdminTeamReport: React.FC<AdminTeamReportProps> = ({ dailyRoutes = [], routes = [], users = [], onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPessoaId, setSelectedPessoaId] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pagamentos = useMemo(() => {
    const list: PagamentoEquipe[] = [];
    const safeNum = (v: unknown) => {
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };
    const routesList = Array.isArray(routes) ? routes : [];
    const dailyList = Array.isArray(dailyRoutes) ? dailyRoutes : [];
    const usersList = Array.isArray(users) ? users : [];

    routesList
      .filter(r => r && r.statusFinanceiro === FinanceiroStatus.APROVADO)
      .forEach(r => {
        const vm = safeNum(r.valorMotorista);
        const va = safeNum(r.valorAjudante);
        const motoristaNome = usersList.find(u => u.id === r.motoristaId)?.nome ?? 'Motorista';
        const ajudanteNome = r.ajudanteNome ?? usersList.find(u => u.id === r.ajudanteId)?.nome ?? 'Ajudante';
        if (vm > 0) list.push({ id: `route-m-${r.id}`, data: r.createdAt, tipo: 'Viagem', papel: 'motorista', pessoaId: r.motoristaId, pessoaNome: motoristaNome, placa: r.placa, destino: r.destino || '—', oc: r.oc, valor: vm });
        if (va > 0) list.push({ id: `route-a-${r.id}`, data: r.createdAt, tipo: 'Viagem', papel: 'ajudante', pessoaId: r.ajudanteId, pessoaNome: ajudanteNome, placa: r.placa, destino: r.destino || '—', oc: r.oc, valor: va });
      });

    dailyList
      .filter(r => r && r.statusFinanceiro === FinanceiroStatus.APROVADO)
      .forEach(r => {
        const vm = safeNum(r.valorMotorista);
        const va = safeNum(r.valorAjudante);
        const motoristaNome = usersList.find(u => u.id === r.motoristaId)?.nome ?? 'Motorista';
        const ajudanteNome = r.ajudanteNome ?? usersList.find(u => u.id === r.ajudanteId)?.nome ?? 'Ajudante';
        if (vm > 0) list.push({ id: `daily-m-${r.id}`, data: r.createdAt, tipo: 'Diário', papel: 'motorista', pessoaId: r.motoristaId, pessoaNome: motoristaNome, placa: r.placa, destino: r.destino || '—', oc: r.oc, valor: vm });
        if (va > 0 && r.ajudanteId) list.push({ id: `daily-a-${r.id}`, data: r.createdAt, tipo: 'Diário', papel: 'ajudante', pessoaId: r.ajudanteId, pessoaNome: ajudanteNome, placa: r.placa, destino: r.destino || '—', oc: r.oc, valor: va });
      });

    return list;
  }, [routes, dailyRoutes, users]);

  const filtered = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    return pagamentos.filter(p => {
      const date = new Date(p.data);
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesPessoa = !selectedPessoaId || p.pessoaId === selectedPessoaId;
      return matchesDate && matchesPessoa;
    });
  }, [pagamentos, startDate, endDate, selectedPessoaId]);

  const totals = useMemo(() => {
    const motoristas = filtered.filter(p => p.papel === 'motorista').reduce((s, p) => s + p.valor, 0);
    const ajudantes = filtered.filter(p => p.papel === 'ajudante').reduce((s, p) => s + p.valor, 0);
    return {
      motoristas: Math.round(motoristas * 100) / 100,
      ajudantes: Math.round(ajudantes * 100) / 100,
      total: Math.round((motoristas + ajudantes) * 100) / 100,
    };
  }, [filtered]);

  /** Toda a equipe: motoristas e ajudantes cadastrados (ativos) — para o relatório puxar todos */
  const equipeCompleta = useMemo(() => {
    const list = (users || []).filter(
      u => u.ativo !== false && (u.perfil === UserRole.MOTORISTA || u.perfil === UserRole.AJUDANTE)
    );
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users]);

  const pessoaOptions = useMemo(() => {
    return [{ label: '— Todas —', value: '' }, ...equipeCompleta.map(u => ({ label: u.nome, value: u.id }))];
  }, [equipeCompleta]);

  /** Resumo por pessoa: toda a equipe (motoristas e ajudantes), com total a pagar no período (0 se não houver) */
  const resumoPorPessoa = useMemo(() => {
    const byId: Record<string, { pessoaNome: string; totalAPagar: number }> = {};
    equipeCompleta.forEach(u => byId[u.id] = { pessoaNome: u.nome, totalAPagar: 0 });
    filtered.forEach(p => {
      if (byId[p.pessoaId]) byId[p.pessoaId].totalAPagar += p.valor;
      else byId[p.pessoaId] = { pessoaNome: p.pessoaNome, totalAPagar: p.valor };
    });
    return Object.entries(byId)
      .map(([pessoaId, d]) => ({ pessoaId, pessoaNome: d.pessoaNome, totalAPagar: Math.round(d.totalAPagar * 100) / 100 }))
      .sort((a, b) => b.totalAPagar - a.totalAPagar);
  }, [equipeCompleta, filtered]);

  const pagamentosPessoaSelecionada = useMemo(() => {
    if (!selectedPessoaId) return [];
    return filtered.filter(p => p.pessoaId === selectedPessoaId);
  }, [filtered, selectedPessoaId]);

  const resumoPessoaSelecionada = useMemo(() => {
    if (!selectedPessoaId) return null;
    const nome = equipeCompleta.find(u => u.id === selectedPessoaId)?.nome ?? pagamentosPessoaSelecionada[0]?.pessoaNome ?? 'Pessoa';
    const totalAPagar = pagamentosPessoaSelecionada.reduce((s, p) => s + p.valor, 0);
    return { nome, totalAPagar: Math.round(totalAPagar * 100) / 100 };
  }, [selectedPessoaId, equipeCompleta, pagamentosPessoaSelecionada]);

  const chartPorPessoa = useMemo(() => {
    return resumoPorPessoa.map(r => ({ nome: r.pessoaNome, valor: r.totalAPagar }));
  }, [resumoPorPessoa]);

  const copyResumoWhatsApp = (pessoaId: string, pessoaNome: string, totalAPagar: number) => {
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : startDate ? `a partir de ${startDate}` : endDate ? `até ${endDate}` : 'todo o período';
    const msg = `📋 *Resumo - ${pessoaNome} (Equipe)*\n\n*Total a pagar (${periodo}):* R$ ${totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n_Prime Group_`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedKey(pessoaId);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const copyResumoDetalhadoWhatsApp = () => {
    if (!resumoPessoaSelecionada) return;
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : startDate ? `a partir de ${startDate}` : endDate ? `até ${endDate}` : 'todo o período';
    let msg = `📋 *Resumo - ${resumoPessoaSelecionada.nome} (Equipe)*\nPeríodo: ${periodo}\n\n`;
    pagamentosPessoaSelecionada.forEach(p => {
      const data = new Date(p.data).toLocaleDateString('pt-BR');
      const tipo = p.tipo;
      const oc = p.oc || '—';
      const placa = p.placa || '—';
      const valor = p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      msg += `• ${data} | ${tipo} | OC ${oc} | ${placa} → R$ ${valor}\n`;
    });
    msg += `\n*Total a pagar: R$ ${resumoPessoaSelecionada.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n_Prime Group_`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedKey(`detalhe-${selectedPessoaId}`);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-3xl font-black uppercase text-white">Relatório de Equipe</h2>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">Voltar</button>
      </div>

      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Data Início" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data Fim" type="date" value={endDate} onChange={setEndDate} />
          <Select label="Filtrar Pessoa" value={selectedPessoaId} onChange={setSelectedPessoaId} options={pessoaOptions} />
        </div>
      </Card>

      <Card className="border-teal-900/40 bg-teal-950/20">
        <h3 className="text-sm font-black uppercase tracking-widest mb-1 text-teal-400">Resumo por pessoa</h3>
        <p className="text-[10px] text-slate-500 mb-4">Selecione uma pessoa no filtro acima para ver o total a pagar com datas, tipo (Viagem/Diário), OC e placa. Clique em &quot;Copiar para WhatsApp&quot; para enviar o resumo detalhado.</p>
        {!selectedPessoaId ? (
          <p className="text-slate-500 text-sm py-4">Selecione uma pessoa em &quot;Filtrar Pessoa&quot; acima para ver o resumo (datas, Viagem/Diário, OC, placa e valor a pagar).</p>
        ) : resumoPessoaSelecionada ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase">Pessoa:</span>
                <span className="ml-2 text-white font-black">{resumoPessoaSelecionada.nome}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400 font-black text-lg">R$ {resumoPessoaSelecionada.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar</span>
                <button
                  type="button"
                  onClick={copyResumoDetalhadoWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  {copiedKey === `detalhe-${selectedPessoaId}` ? 'Copiado!' : 'Copiar para WhatsApp'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">OC</th>
                    <th className="p-3">Placa</th>
                    <th className="p-3 text-right">Valor a pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosPessoaSelecionada.map(p => (
                    <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-300">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-bold text-slate-200">{p.tipo}</td>
                      <td className="p-3 font-bold text-slate-200">{p.oc || '—'}</td>
                      <td className="p-3 font-mono text-blue-400">{p.placa || '—'}</td>
                      <td className="p-3 text-right font-black text-red-400">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm py-4">Nenhum pagamento no período para esta pessoa.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center bg-slate-900/50 border-slate-800">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Motoristas</div>
          <div className="text-2xl font-black text-blue-400">R$ {totals.motoristas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="text-center bg-slate-900/50 border-slate-800">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Ajudantes</div>
          <div className="text-2xl font-black text-amber-400">R$ {totals.ajudantes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="text-center bg-slate-900/50 border-slate-800 border-teal-900/40">
          <div className="text-[10px] font-black text-teal-500 uppercase mb-1 tracking-widest">Total Equipe</div>
          <div className="text-2xl font-black text-teal-400">R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Valor a pagar por pessoa</h3>
        {chartPorPessoa.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPorPessoa} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'A pagar']}
                  labelFormatter={(label) => `Pessoa: ${label}`}
                />
                <Bar dataKey="valor" name="A pagar" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>

      <Card className="border-slate-800 bg-teal-950/20 border-teal-900/30">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-teal-400">Resumo para WhatsApp — clique no nome</h3>
        <p className="text-[10px] text-slate-500 mb-4">Ao clicar, o texto com o total a pagar é copiado. Cole no WhatsApp e envie.</p>
        <div className="space-y-2">
          {resumoPorPessoa.length === 0 ? (
            <div className="text-slate-500 text-sm py-4 text-center">Nenhum dado no período.</div>
          ) : (
            resumoPorPessoa.map((item) => (
              <div
                key={item.pessoaId}
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-900/50 transition-all"
              >
                <button
                  type="button"
                  onClick={() => copyResumoWhatsApp(item.pessoaId, item.pessoaNome, item.totalAPagar)}
                  className="text-sm font-bold text-white hover:text-teal-400 transition-colors text-left"
                >
                  {item.pessoaNome}
                </button>
                <span className="text-slate-500 text-xs ml-auto font-black">R$ {item.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar</span>
                {copiedKey === item.pessoaId && <span className="text-[10px] font-bold text-emerald-500 uppercase">Copiado!</span>}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border-slate-800 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Pessoa</th>
                <th className="p-4">Papel</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Placa / OC</th>
                <th className="p-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-xs font-mono text-slate-400">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 text-xs font-bold text-slate-200">{p.pessoaNome}</td>
                  <td className="p-4 text-xs">
                    <span className={p.papel === 'motorista' ? 'text-blue-400' : 'text-amber-400'}>{p.papel === 'motorista' ? 'Motorista' : 'Ajudante'}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-300">{p.tipo}</td>
                  <td className="p-4 text-xs font-mono text-slate-400">{p.placa} — OC {p.oc}</td>
                  <td className="p-4 text-right text-xs font-black text-red-400">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminTeamReport;
