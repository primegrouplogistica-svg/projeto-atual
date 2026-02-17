
import React, { useState, useMemo } from 'react';
import { Fueling, MaintenanceRequest, Vehicle, FuelingStatus, DailyRoute, RouteDeparture, MaintenanceStatus, Toll, FixedExpense, FinanceiroStatus } from '../types';
import { Card, Badge, Input, Select } from '../components/UI';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AdminVehicleReportProps {
  fuelings: Fueling[];
  maintenances: MaintenanceRequest[];
  vehicles: Vehicle[];
  dailyRoutes: DailyRoute[];
  routes: RouteDeparture[];
  tolls: Toll[];
  fixedExpenses: FixedExpense[];
  onBack: () => void;
  onUpdateDailyRoute: (id: string, update: Partial<DailyRoute>) => void;
  onUpdateRoute: (id: string, update: Partial<RouteDeparture>) => void;
}

const AdminVehicleReport: React.FC<AdminVehicleReportProps> = ({ 
  fuelings, 
  maintenances, 
  vehicles, 
  dailyRoutes, 
  routes, 
  tolls,
  fixedExpenses,
  onBack 
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

  const dateFilteredData = useMemo(() => {
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    if (anoSelecionado) {
      start = new Date(`${anoSelecionado}-01-01`);
      end = new Date(`${anoSelecionado}-12-31`);
    }
    if (end) end.setHours(23, 59, 59, 999);
    
    const filterByDate = (dateStr: string) => {
      if (!start || !end) return true;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Despesas fixas: sem período = todas; com período = competência dentro do intervalo
    const feStart = start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}` : '';
    const feEnd = end ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}` : '';
    const feFiltered = !start || !end ? fixedExpenses : fixedExpenses.filter(x => {
      const comp = x.dataCompetencia || '';
      return comp >= feStart && comp <= feEnd;
    });

    return {
      f: fuelings.filter(x => filterByDate(x.createdAt)),
      m: maintenances.filter(x => filterByDate(x.createdAt)),
      dr: dailyRoutes.filter(x => filterByDate(x.createdAt)),
      r: routes.filter(x => filterByDate(x.createdAt)),
      t: tolls.filter(x => filterByDate(x.data)),
      fe: feFiltered
    };
  }, [startDate, endDate, anoSelecionado, fuelings, maintenances, dailyRoutes, routes, tolls, fixedExpenses]);

  const vehicleStats = useMemo(() => {
    const { f, m, dr, r, t } = dateFilteredData;
    return vehicles.map(v => {
      const vFuelings = f.filter(fuel => fuel.vehicleId === v.id && fuel.status === FuelingStatus.APROVADO);
      const vMaintenances = m.filter(maint => maint.vehicleId === v.id && maint.status === MaintenanceStatus.FEITA);
      // Apenas rotas com financeiro aprovado entram em receita e custo de equipe
      const vDailyRoutes = dr.filter(daily => daily.vehicleId === v.id && daily.statusFinanceiro === FinanceiroStatus.APROVADO);
      const vRoutes = r.filter(route => route.vehicleId === v.id && route.statusFinanceiro === FinanceiroStatus.APROVADO);
      const vTolls = t.filter(toll => toll.vehicleId === v.id);

      const gastoCombustivel = vFuelings.reduce((sum, fuel) => Number(sum) + Number(fuel.valor || 0), 0);
      const gastoManutencao = vMaintenances.reduce((sum, maint) => Number(sum) + Number(maint.valor || 0), 0);
      const gastoPedagio = vTolls.reduce((sum, toll) => Number(sum) + Number(toll.valor || 0), 0);

      const gastoEquipe = [
        ...vDailyRoutes.map(op => Number(op.valorMotorista || 0) + Number(op.valorAjudante || 0)),
        ...vRoutes.map(op => Number(op.valorMotorista || 0) + Number(op.valorAjudante || 0))
      ].reduce((sum, val) => Number(sum) + Number(val || 0), 0);

      const totalFrete = [...vDailyRoutes, ...vRoutes].reduce((sum, op) => Number(sum) + Number(op.valorFrete || 0), 0);
      const totalCustos = gastoCombustivel + gastoManutencao + gastoPedagio + gastoEquipe;
      const lucroOp = totalFrete - totalCustos;

      return {
        id: v.id,
        placa: v.placa,
        modelo: v.modelo,
        totalFrete,
        totalCustos,
        lucroOp,
        gastoCombustivel,
        gastoManutencao,
        gastoPedagio,
        gastoEquipe,
        margem: totalFrete > 0 ? ((lucroOp / totalFrete) * 100) : 0
      };
    }).sort((a, b) => b.totalFrete - a.totalFrete);
  }, [vehicles, dateFilteredData]);

  const totalDespesasFixas = useMemo(() => dateFilteredData.fe.reduce((sum, e) => Number(sum) + Number(e.valor || 0), 0), [dateFilteredData]);

  const totals = useMemo(() => {
    return vehicleStats.reduce((acc, curr) => ({
      frete: Number(acc.frete) + Number(curr.totalFrete || 0),
      custos: Number(acc.custos) + Number(curr.totalCustos || 0),
      lucroOp: Number(acc.lucroOp) + Number(curr.lucroOp || 0)
    }), { frete: 0, custos: 0, lucroOp: 0 });
  }, [vehicleStats]);

  const lucroLiquido = Number(totals.lucroOp) - Number(totalDespesasFixas);

  const chartData = useMemo(() => vehicleStats.map(s => ({
    placa: s.placa,
    receita: Math.round(s.totalFrete * 100) / 100,
    custos: Math.round(s.totalCustos * 100) / 100,
    lucro: Math.round(s.lucroOp * 100) / 100,
    custoEquipe: Math.round(s.gastoEquipe * 100) / 100,
    custoCombustivel: Math.round(s.gastoCombustivel * 100) / 100,
    custoPedagio: Math.round(s.gastoPedagio * 100) / 100,
    custoManutencao: Math.round(s.gastoManutencao * 100) / 100,
  })), [vehicleStats]);

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
    fuelings.forEach(x => addPeriodo(x.createdAt));
    maintenances.forEach(x => addPeriodo(x.createdAt));
    dailyRoutes.forEach(x => addPeriodo(x.createdAt));
    routes.forEach(x => addPeriodo(x.createdAt));
    tolls.forEach(x => addPeriodo(x.data));
    fixedExpenses.forEach(x => addPeriodoCompetencia(x.dataCompetencia));

    const safeNum = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const list: { periodo: string; label: string; frete: number; custos: number; despesasFixas: number; lucro: number }[] = [];

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

      const f = fuelings.filter(x => filterByPeriodo(x.createdAt) && x.status === FuelingStatus.APROVADO);
      const m = maintenances.filter(x => filterByPeriodo(x.createdAt) && x.status === MaintenanceStatus.FEITA);
      const dr = dailyRoutes.filter(x => filterByPeriodo(x.createdAt) && x.statusFinanceiro === FinanceiroStatus.APROVADO);
      const r = routes.filter(x => filterByPeriodo(x.createdAt) && x.statusFinanceiro === FinanceiroStatus.APROVADO);
      const t = tolls.filter(x => filterByPeriodo(x.data));
      const fe = fixedExpenses.filter(x => filterByCompetencia(x.dataCompetencia));

      const frete = [...dr, ...r].reduce((s, op) => s + safeNum(op.valorFrete), 0);
      const gastoCombustivel = f.reduce((s, fuel) => s + safeNum(fuel.valor), 0);
      const gastoManutencao = m.reduce((s, maint) => s + safeNum(maint.valor), 0);
      const gastoPedagio = t.reduce((s, toll) => s + safeNum(toll.valor), 0);
      const gastoEquipe = [...dr, ...r].reduce((s, op) => s + safeNum(op.valorMotorista) + safeNum(op.valorAjudante), 0);
      const custos = gastoCombustivel + gastoManutencao + gastoPedagio + gastoEquipe;
      const despesasFixas = fe.reduce((s, e) => s + safeNum(e.valor), 0);
      const lucro = frete - custos - despesasFixas;

      const [y, mm] = isAno ? [p, ''] : p.split('-');
      const label = isAno ? p : `${mm}/${y}`;

      list.push({
        periodo: p,
        label,
        frete: Math.round(frete * 100) / 100,
        custos: Math.round(custos * 100) / 100,
        despesasFixas: Math.round(despesasFixas * 100) / 100,
        lucro: Math.round(lucro * 100) / 100
      });
    });

    return list;
  }, [fuelings, maintenances, dailyRoutes, routes, tolls, fixedExpenses, agrupamento, startDate, endDate, anoSelecionado]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">Desempenho da Frota</h2>
          <p className="text-slate-500 text-sm">Análise matemática consolidada por unidade</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white">Voltar</button>
      </div>

      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label="Data Início" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data Fim" type="date" value={endDate} onChange={setEndDate} />
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
                      formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, (name === 'frete' ? 'Faturamento' : name === 'custos' ? 'Custos' : name === 'lucro' ? 'Lucro' : name)]}
                      labelFormatter={(label) => `${agrupamento === 'ano' ? 'Ano' : 'Mês'}: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="frete" name="Faturamento" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="custos" name="Custos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
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
                      <th className="p-3 text-right">Faturamento</th>
                      <th className="p-3 text-right">Custos Frota</th>
                      <th className="p-3 text-right">Despesas Fixas</th>
                      <th className="p-3 text-right">Lucro Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desempenhoPorPeriodo.map((row, i) => (
                      <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">{row.label}</td>
                        <td className="p-3 text-right text-emerald-400">R$ {row.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-red-400">R$ {row.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-amber-400">R$ {row.despesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Faturamento Bruto</div>
          <div className="text-xl font-black text-white">R$ {totals.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="bg-red-900/10 border-red-900/40 text-center">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Custos Frota (Var)</div>
          <div className="text-xl font-black text-white">R$ {totals.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="bg-indigo-900/10 border-indigo-900/40 text-center">
          <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Despesas Fixas</div>
          <div className="text-xl font-black text-white">R$ {totalDespesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className={`${lucroLiquido >= 0 ? 'bg-emerald-900/10 border-emerald-900/40' : 'bg-red-900/20 border-red-900/50'} text-center`}>
          <div className={`text-[10px] font-black ${lucroLiquido >= 0 ? 'text-emerald-500' : 'text-red-500'} uppercase tracking-widest mb-1`}>Lucro Real Consolidado</div>
          <div className={`text-xl font-black ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Receita x Custos por veículo</h3>
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  labelFormatter={(label) => `Placa: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="receita" name="Receita (fretes)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custos" name="Custos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Custo do veículo (combustível + pedágio + manutenção + equipe)</h3>
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
                  labelFormatter={(label) => `Placa: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="custoCombustivel" name="Combustível" stackId="custo" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="custoPedagio" name="Pedágio" stackId="custo" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="custoManutencao" name="Manutenção" stackId="custo" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="custoEquipe" name="Equipe (motorista + ajudante)" stackId="custo" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Lucro operacional por veículo</h3>
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" width={55} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Lucro']}
                  labelFormatter={(label) => `Placa: ${label}`}
                />
                <Bar dataKey="lucro" name="Lucro operacional" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartData[i].lucro >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Custo de equipe (motorista e ajudante) por veículo</h3>
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="placa" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo equipe']}
                  labelFormatter={(label) => `Placa: ${label}`}
                />
                <Bar dataKey="custoEquipe" name="Custo equipe (motorista + ajudante)" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>
    </div>
  );
};

export default AdminVehicleReport;
