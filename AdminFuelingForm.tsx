import React, { useMemo, useState } from 'react';
import { Fueling, MaintenanceRequest, Vehicle, FuelingStatus, FixedExpense, DailyRoute, RouteDeparture, AgregadoFreight, FinanceiroStatus, Toll, MaintenanceStatus } from '../types';
import { Card } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

  const { receitaFretes, receitaAgregados, totalFretes, totalDespesas, despesasPorCategoria } = useMemo(() => {
    const safeNum = (val: any): number => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
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
    const feFiltered = !startDate && !endDate ? fixedExpenses : fixedExpenses.filter(e => filterDate((e.dataCompetencia || e.createdAt.slice(0, 7)) + '-01'));

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
  }, [fuelings, maintenances, vehicles, fixedExpenses, dailyRoutes, routes, agregadoFreights, tolls, startDate, endDate]);

  const resultadoLiquido = totalFretes - totalDespesas;

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
            />
          </div>
        </div>
        <p className="text-slate-500 text-[10px] mt-2">Deixe em branco para ver todo o período.</p>
      </Card>

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
