import React, { useMemo, useState } from 'react';
import { Fueling, MaintenanceRequest, Vehicle, FuelingStatus, FixedExpense, DailyRoute, RouteDeparture, AgregadoFreight, FinanceiroStatus, Toll, MaintenanceStatus } from '../types';
import { Card, Input, Select } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Activity, Truck, CreditCard, Package } from 'lucide-react';

interface AdminDashboardProps {
  fuelings: Fueling[];
  maintenances: MaintenanceRequest[];
  vehicles: Vehicle[];
  fixedExpenses: FixedExpense[];
  dailyRoutes?: DailyRoute[];
  routes?: RouteDeparture[];
  agregadoFreights?: AgregadoFreight[];
  tolls?: Toll[];
  onBack: () => void;
}

const CORES_DESPESAS: Record<string, string> = {
  'Combustível': '#3b82f6',
  'Manutenção': '#f59e0b',
  'Pedágio': '#8b5cf6',
  'Equipe': '#ec4899',
  'Despesa fixa': '#6366f1',
  'Despesa parcelada': '#a855f7',
  'Agregados': '#14b8a6',
};

const isDespesaParcelada = (e: FixedExpense) => / — Parcela \d+\/\d+/.test(e.descricao || '');

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  fuelings,
  maintenances,
  vehicles,
  fixedExpenses,
  dailyRoutes = [],
  routes = [],
  agregadoFreights = [],
  tolls = [],
  onBack,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [agrupamento, setAgrupamento] = useState<'periodo' | 'mes' | 'ano'>('periodo');
  const [anoSelecionado, setAnoSelecionado] = useState<string>('');

  const opcoesAno = useMemo(() => {
    const anos: { label: string; value: string }[] = [{ label: '— Todos —', value: '' }];
    for (let y = 2026; y <= 2036; y++) anos.push({ label: String(y), value: String(y) });
    return anos;
  }, []);

  const { receitaFretes, receitaAgregados, totalFretes, totalDespesas, despesasPorCategoria } = useMemo(() => {
    const safeNum = (val: any): number => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    if (anoSelecionado) {
      start = new Date(`${anoSelecionado}-01-01`);
      end = new Date(`${anoSelecionado}-12-31`);
    }
    if (end) end.setHours(23, 59, 59, 999);

    const filterDate = (d: string) => {
      if (!start || !end) return true;
      const date = new Date(d);
      return date >= start && date <= end;
    };

    // Filtrar por período
    const dailyF = dailyRoutes.filter(r => filterDate(r.createdAt));
    const routesF = routes.filter(r => filterDate(r.createdAt));
    const fuelingsF = fuelings.filter(f => filterDate(f.createdAt));
    const maintenancesF = maintenances.filter(m => filterDate(m.createdAt));
    const tollsF = tolls.filter(t => filterDate(t.data));
    const agregadoF = agregadoFreights.filter(r => filterDate(r.data));
    // Despesas fixas e parceladas: só entram parcelas cuja data de competência (mês) está dentro do período
    const feFiltered = !start || !end ? fixedExpenses : fixedExpenses.filter(e => filterDate((e.dataCompetencia || e.createdAt?.slice(0, 7) || '') + '-01'));

    const despesaFixaOnly = feFiltered.filter(e => !isDespesaParcelada(e)).reduce((sum, e) => sum + safeNum(e.valor), 0);
    const despesaParcelada = feFiltered.filter(e => isDespesaParcelada(e)).reduce((sum, e) => sum + safeNum(e.valor), 0);

    // Receitas — fretes (viagem + diário) e agregados separados
    const revDaily = dailyF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO).reduce((sum, r) => sum + safeNum(r.valorFrete), 0);
    const revRoutes = routesF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO).reduce((sum, r) => sum + safeNum(r.valorFrete), 0);
    const receitaFretes = revDaily + revRoutes;
    const receitaAgregados = agregadoF.reduce((sum, r) => sum + safeNum(r.valorFrete), 0);
    const totalFretes = receitaFretes + receitaAgregados;

    // Despesas por categoria
    const combustivel = fuelingsF.filter(f => f.status === FuelingStatus.APROVADO).reduce((sum, f) => sum + safeNum(f.valor), 0);
    const manutencao = maintenancesF.filter(m => m.status === MaintenanceStatus.FEITA).reduce((sum, m) => sum + safeNum(m.valor), 0);
    const pedagio = tollsF.reduce((sum, t) => sum + safeNum(t.valor), 0);
    const routesAprovadas = routesF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO);
    const dailyAprovadas = dailyF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO);
    const equipe = routesAprovadas.reduce((s, r) => s + safeNum(r.valorMotorista) + safeNum(r.valorAjudante), 0) +
      dailyAprovadas.reduce((s, r) => s + safeNum(r.valorMotorista) + safeNum(r.valorAjudante), 0);
    const agregadoPai = agregadoF.reduce((sum, r) => sum + safeNum(r.valorAgregado), 0);

    const totalDespesas = combustivel + manutencao + pedagio + equipe + despesaFixaOnly + despesaParcelada + agregadoPai;

    const categorias = [
      { name: 'Combustível', value: combustivel },
      { name: 'Manutenção', value: manutencao },
      { name: 'Pedágio', value: pedagio },
      { name: 'Equipe', value: equipe },
      { name: 'Despesa fixa', value: despesaFixaOnly },
      { name: 'Despesa parcelada', value: despesaParcelada },
      { name: 'Agregados', value: agregadoPai },
    ].filter(c => c.value > 0);

    const despesasPorCategoria = categorias.map(c => ({
      ...c,
      color: CORES_DESPESAS[c.name] ?? '#64748b',
      percentual: totalDespesas > 0 ? (c.value / totalDespesas) * 100 : 0,
    }));

    return { receitaFretes, receitaAgregados, totalFretes, totalDespesas, despesasPorCategoria };
  }, [fuelings, maintenances, vehicles, fixedExpenses, dailyRoutes, routes, agregadoFreights, tolls, startDate, endDate, anoSelecionado]);

  const resultadoLiquido = totalFretes - totalDespesas;

  /** Agregação por mês ou ano para relatório e gráfico de evolução */
  const desempenhoPorPeriodo = useMemo(() => {
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    if (anoSelecionado) {
      start = new Date(`${anoSelecionado}-01-01`);
      end = new Date(`${anoSelecionado}-12-31`);
    }
    if (end) end.setHours(23, 59, 59, 999);
    const inRange = (dateStr: string) => {
      if (!dateStr) return false;
      if (!start || !end) return true;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };
    const compStart = start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}` : '';
    const compEnd = end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}` : '';
    const inRangeCompetencia = (comp: string) => !start || !end || (comp >= compStart && comp <= compEnd);

    const meses = new Set<string>();
    const anos = new Set<string>();
    const addPeriodo = (dateStr: string) => {
      if (!dateStr || !inRange(dateStr)) return;
      const d = new Date(dateStr);
      meses.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      anos.add(String(d.getFullYear()));
    };
    const addPeriodoCompetencia = (comp: string) => {
      if (!comp || !inRangeCompetencia(comp)) return;
      meses.add(comp);
      anos.add(comp.slice(0, 4));
    };

    dailyRoutes.forEach(x => addPeriodo(x.createdAt));
    routes.forEach(x => addPeriodo(x.createdAt));
    fuelings.forEach(x => addPeriodo(x.createdAt));
    maintenances.forEach(x => addPeriodo(x.createdAt));
    tolls.forEach(x => addPeriodo(x.data));
    agregadoFreights.forEach(x => addPeriodo(x.data));
    fixedExpenses.forEach(x => addPeriodoCompetencia(x.dataCompetencia));

    const safeNum = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const list: { periodo: string; label: string; frete: number; despesas: number; lucro: number }[] = [];

    const periodos = agrupamento === 'ano' ? Array.from(anos).sort() : Array.from(meses).sort();

    periodos.forEach(p => {
      const isAno = agrupamento === 'ano';
      const filterByPeriodo = (dateStr: string) => {
        if (!dateStr || !inRange(dateStr)) return false;
        const d = new Date(dateStr);
        if (isAno) return String(d.getFullYear()) === p;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === p;
      };
      const filterByCompetencia = (comp: string) => inRangeCompetencia(comp) && (isAno ? comp?.startsWith(p) : comp === p);

      const dailyF = dailyRoutes.filter(x => filterByPeriodo(x.createdAt));
      const routesF = routes.filter(x => filterByPeriodo(x.createdAt));
      const fuelingsF = fuelings.filter(x => filterByPeriodo(x.createdAt));
      const maintenancesF = maintenances.filter(x => filterByPeriodo(x.createdAt));
      const tollsF = tolls.filter(x => filterByPeriodo(x.data));
      const agregadoF = agregadoFreights.filter(x => filterByPeriodo(x.data));
      const feFiltered = fixedExpenses.filter(x => filterByCompetencia(x.dataCompetencia));

      const despesaFixaOnly = feFiltered.filter(e => !isDespesaParcelada(e)).reduce((s, e) => s + safeNum(e.valor), 0);
      const despesaParcelada = feFiltered.filter(e => isDespesaParcelada(e)).reduce((s, e) => s + safeNum(e.valor), 0);
      const combustivel = fuelingsF.filter(f => f.status === FuelingStatus.APROVADO).reduce((s, f) => s + safeNum(f.valor), 0);
      const manutencao = maintenancesF.filter(m => m.status === MaintenanceStatus.FEITA).reduce((s, m) => s + safeNum(m.valor), 0);
      const pedagio = tollsF.reduce((s, t) => s + safeNum(t.valor), 0);
      const routesAprovadas = routesF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO);
      const dailyAprovadas = dailyF.filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO);
      const equipe = routesAprovadas.reduce((s, r) => s + safeNum(r.valorMotorista) + safeNum(r.valorAjudante), 0) +
        dailyAprovadas.reduce((s, r) => s + safeNum(r.valorMotorista) + safeNum(r.valorAjudante), 0);
      const agregadoPai = agregadoF.reduce((s, r) => s + safeNum(r.valorAgregado), 0);

      const frete = dailyAprovadas.reduce((s, r) => s + safeNum(r.valorFrete), 0) + routesAprovadas.reduce((s, r) => s + safeNum(r.valorFrete), 0);
      const receitaAgreg = agregadoF.reduce((s, r) => s + safeNum(r.valorFrete), 0);
      const totalReceita = frete + receitaAgreg;
      const despesas = combustivel + manutencao + pedagio + equipe + despesaFixaOnly + despesaParcelada + agregadoPai;
      const lucro = totalReceita - despesas;

      const [y, mm] = isAno ? [p, ''] : p.split('-');
      const label = isAno ? p : `${mm}/${y}`;

      list.push({
        periodo: p,
        label,
        frete: Math.round(totalReceita * 100) / 100,
        despesas: Math.round(despesas * 100) / 100,
        lucro: Math.round(lucro * 100) / 100
      });
    });

    return list;
  }, [fuelings, maintenances, dailyRoutes, routes, tolls, fixedExpenses, agregadoFreights, agrupamento, startDate, endDate, anoSelecionado]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Executive Dashboard</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão Financeira Consolidada Prime Group</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 transition-all text-xs uppercase tracking-widest text-white shrink-0">Voltar</button>
      </div>

      <Card className="bg-slate-900/40 border-slate-800">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label="Data inicial" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data final" type="date" value={endDate} onChange={setEndDate} />
          <Select
            label="Agrupar relatório por"
            value={agrupamento}
            onChange={(v) => setAgrupamento(v as 'periodo' | 'mes' | 'ano')}
            options={[
              { label: 'Período selecionado', value: 'periodo' },
              { label: 'Por mês', value: 'mes' },
              { label: 'Por ano', value: 'ano' }
            ]}
          />
          {agrupamento === 'ano' && (
            <Select
              label="Selecionar ano"
              value={anoSelecionado}
              onChange={setAnoSelecionado}
              options={opcoesAno}
            />
          )}
        </div>
        <p className="text-slate-500 text-[10px] mt-2">Deixe em branco para ver todo o período.</p>
      </Card>

      {(agrupamento === 'mes' || agrupamento === 'ano') && (
        <>
          <Card className="border-indigo-900/40 bg-indigo-950/10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-indigo-400">Desempenho por {agrupamento === 'ano' ? 'ano' : 'mês'}</h3>
            {desempenhoPorPeriodo.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={desempenhoPorPeriodo} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, (name === 'frete' ? 'Receita' : name === 'despesas' ? 'Despesas' : 'Lucro')]}
                      labelFormatter={(label) => `${agrupamento === 'ano' ? 'Ano' : 'Mês'}: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="frete" name="Receita" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período.</div>
            )}
          </Card>

          <Card className="border-slate-800 overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Relatório por {agrupamento === 'ano' ? 'ano' : 'mês'}</h3>
            {desempenhoPorPeriodo.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    <tr>
                      <th className="p-3">{agrupamento === 'ano' ? 'Ano' : 'Mês/Ano'}</th>
                      <th className="p-3 text-right">Receita Total</th>
                      <th className="p-3 text-right">Despesas</th>
                      <th className="p-3 text-right">Lucro Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desempenhoPorPeriodo.map((row, i) => (
                      <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">{row.label}</td>
                        <td className="p-3 text-right text-emerald-400">R$ {row.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-red-400">R$ {row.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={`p-3 text-right font-black ${row.lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {row.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">Nenhum dado no período.</p>
            )}
          </Card>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-emerald-900/10 border-emerald-900/40 relative overflow-hidden">
          <div className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Receita fretes</div>
          <div className="text-2xl lg:text-3xl font-black text-white">R$ {receitaFretes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <Truck className="absolute -bottom-2 -right-2 text-emerald-500/20 w-14 h-14 lg:w-16 lg:h-16" />
        </Card>
        <Card className="bg-teal-900/10 border-teal-900/40 relative overflow-hidden">
          <div className="text-[10px] font-black text-teal-500 uppercase mb-1 tracking-widest">Receita agregados</div>
          <div className="text-2xl lg:text-3xl font-black text-white">R$ {receitaAgregados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <Package className="absolute -bottom-2 -right-2 text-teal-500/20 w-14 h-14 lg:w-16 lg:h-16" />
        </Card>
        <Card className="bg-red-900/10 border-red-900/40 relative overflow-hidden">
          <div className="text-[10px] font-black text-red-500 uppercase mb-1 tracking-widest">Despesas totais</div>
          <div className="text-3xl font-black text-white">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <CreditCard className="absolute -bottom-2 -right-2 text-red-500/20 w-16 h-16" />
        </Card>
        <Card className={`relative overflow-hidden ${resultadoLiquido >= 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
          <div className="text-[10px] font-black uppercase mb-1 tracking-widest text-slate-400">Resultado líquido</div>
          <div className={`text-3xl font-black ${resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {resultadoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 relative overflow-hidden">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Frota</div>
          <div className="text-3xl font-black text-white">{vehicles.length} <span className="text-xs opacity-40 uppercase">unid</span></div>
          <Activity className="absolute -bottom-2 -right-2 text-slate-500/10 w-16 h-16" />
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Para onde vão as despesas (%)</h3>
        <div className="h-96 w-full flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-h-[280px]">
            {despesasPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={despesasPorCategoria}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentual, value }) => `${name} ${percentual.toFixed(1)}% · R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                  >
                    {despesasPorCategoria.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    formatter={(value: number, name: string) => {
                      const pct = totalDespesas > 0 ? ((value / totalDespesas) * 100).toFixed(1) : '0';
                      return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`, name];
                    }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm font-bold">Nenhuma despesa no período</div>
            )}
          </div>
          <div className="lg:w-72 flex flex-col justify-center gap-3 p-4 border-t lg:border-t-0 lg:border-l border-slate-800">
            {despesasPorCategoria
              .slice()
              .sort((a, b) => b.percentual - a.percentual)
              .map(item => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-xs font-black text-white tabular-nums">{item.percentual.toFixed(1)}% · R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            {despesasPorCategoria.length > 0 && (
              <div className="mt-2 pt-3 border-t border-slate-800 text-center">
                <div className="text-[9px] font-black text-slate-500 uppercase">Total despesas</div>
                <div className="text-lg font-black text-white">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
