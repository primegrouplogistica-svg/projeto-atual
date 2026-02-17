
import React, { useState, useMemo } from 'react';
import { Fueling, MaintenanceRequest, Vehicle, FuelingStatus, DailyRoute, RouteDeparture, MaintenanceStatus, Toll, FixedExpense, FinanceiroStatus } from '../types';
import { Card, Badge, Input, Select } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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

  const dateFilteredData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    const filterByDate = (dateStr: string) => {
      if (!start || !end) return true;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Despesas fixas: sem período = todas; com período = competência do mês da data inicial
    const feFiltered = !startDate ? fixedExpenses : fixedExpenses.filter(x => x.dataCompetencia === startDate.slice(0, 7));

    return {
      f: fuelings.filter(x => filterByDate(x.createdAt)),
      m: maintenances.filter(x => filterByDate(x.createdAt)),
      dr: dailyRoutes.filter(x => filterByDate(x.createdAt)),
      r: routes.filter(x => filterByDate(x.createdAt)),
      t: tolls.filter(x => filterByDate(x.data)),
      fe: feFiltered
    };
  }, [startDate, endDate, fuelings, maintenances, dailyRoutes, routes, tolls, fixedExpenses]);

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

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">Desempenho da Frota</h2>
          <p className="text-slate-500 text-sm">Análise matemática consolidada por unidade</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white">Voltar</button>
      </div>

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
