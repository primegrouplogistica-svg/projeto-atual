
import React, { useState, useMemo } from 'react';
import { DailyRoute, RouteDeparture, User, UserRole, Fueling, MaintenanceRequest, FinanceiroStatus } from '../types';
import { Card, Select, Input } from '../components/UI';

interface AdminActivityReportProps {
  dailyRoutes: DailyRoute[];
  routes: RouteDeparture[];
  fuelings: Fueling[];
  maintenances: MaintenanceRequest[];
  users: User[];
  onUpdateDailyRoute: (id: string, update: Partial<DailyRoute>) => void;
  onUpdateRoute: (id: string, update: Partial<RouteDeparture>) => void;
  onUpdateFueling: (id: string, update: Partial<Fueling>) => void;
  onUpdateMaintenance: (id: string, update: Partial<MaintenanceRequest>) => void;
  onBack: () => void;
}

const AdminActivityReport: React.FC<AdminActivityReportProps> = ({ 
  dailyRoutes, 
  routes, 
  fuelings, 
  maintenances, 
  users, 
  onBack 
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredReport = useMemo(() => {
    if (!selectedUserId || !startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Apenas operações com financeiro aprovado entram no relatório de ganhos
    const vDaily = dailyRoutes.filter(dr => (dr.motoristaId === selectedUserId || dr.ajudanteId === selectedUserId) && dr.statusFinanceiro === FinanceiroStatus.APROVADO && new Date(dr.createdAt) >= start && new Date(dr.createdAt) <= end)
      .map(dr => ({ id: dr.id, data: dr.createdAt, placa: dr.placa, tipo: 'Rota', valorFrete: Number(dr.valorFrete || 0), valorMotorista: Number(dr.valorMotorista || 0), valorAjudante: Number(dr.valorAjudante || 0), sourceType: 'daily', isAjudante: dr.ajudanteId === selectedUserId }));

    const vRoutes = routes.filter(r => (r.ajudanteId === selectedUserId || r.motoristaId === selectedUserId) && r.statusFinanceiro === FinanceiroStatus.APROVADO && new Date(r.createdAt) >= start && new Date(r.createdAt) <= end)
      .map(r => ({ id: r.id, data: r.createdAt, placa: r.placa, tipo: 'Saída OC', valorFrete: Number(r.valorFrete || 0), valorMotorista: Number(r.valorMotorista || 0), valorAjudante: Number(r.valorAjudante || 0), sourceType: 'route', isAjudante: r.ajudanteId === selectedUserId }));

    return [...vDaily, ...vRoutes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [selectedUserId, startDate, endDate, dailyRoutes, routes]);

  const stats = useMemo(() => {
    const totalFrete = filteredReport.reduce((sum, item) => Number(sum) + Number(item.valorFrete || 0), 0);
    const totalGanhos = filteredReport.reduce((sum, item) => Number(sum) + Number(item.isAjudante ? (item.valorAjudante || 0) : (item.valorMotorista || 0)), 0);
    
    return { workedDays: new Set(filteredReport.map(a => new Date(a.data).toLocaleDateString())).size, totalFrete, totalGanhos };
  }, [filteredReport]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tight">Atividade do Colaborador</h2>
          <p className="text-slate-500 text-sm">Gestão financeira e produtividade individual</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white">Voltar</button>
      </div>

      <Card className="border-blue-900/30 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select label="Selecionar Colaborador" value={selectedUserId} onChange={setSelectedUserId} options={users.filter(u => u.perfil !== UserRole.ADMIN).map(u => ({ label: u.nome, value: u.id }))} />
          <Input label="Data Inicial" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data Final" type="date" value={endDate} onChange={setEndDate} />
        </div>
      </Card>

      {selectedUserId && startDate && endDate && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-600/10 border border-emerald-600/20 p-6 rounded-2xl text-center">
              <div className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Total Ganho (Líquido)</div>
              <div className="text-3xl font-black text-emerald-400">R$ {stats.totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl text-center border border-slate-800">
              <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Dias de Operação</div>
              <div className="text-3xl font-black text-white">{stats.workedDays}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityReport;
