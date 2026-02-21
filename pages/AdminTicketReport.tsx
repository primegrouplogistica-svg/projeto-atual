import React, { useMemo, useState } from 'react';
import { Ticket, User, Vehicle, UserRole } from '../types';
import { Card, Input, Select } from '../components/UI';
import { formatDateBr, parseDateLocal } from '../utils/date';

interface AdminTicketReportProps {
  tickets: Ticket[];
  users: User[];
  vehicles: Vehicle[];
  onBack: () => void;
}

const AdminTicketReport: React.FC<AdminTicketReportProps> = ({ tickets, users, vehicles, onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [placaFiltro, setPlacaFiltro] = useState('');
  const [motoristaFiltro, setMotoristaFiltro] = useState('');
  const [busca, setBusca] = useState('');

  const placasOptions = useMemo(() => {
    const placas = new Set<string>();
    vehicles.forEach(v => {
      if (v.placa) placas.add(v.placa.toUpperCase());
    });
    tickets.forEach(t => {
      if (t.placa) placas.add(t.placa.toUpperCase());
    });
    return Array.from(placas).sort().map(p => ({ label: p, value: p }));
  }, [vehicles, tickets]);

  const motoristasOptions = useMemo(() => {
    return users
      .filter(u => u.perfil === UserRole.MOTORISTA)
      .map(u => ({ label: u.nome, value: u.id }));
  }, [users]);

  const filtered = useMemo(() => {
    const start = startDate ? parseDateLocal(startDate) : null;
    const end = endDate ? parseDateLocal(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    const q = busca.trim().toLowerCase();

    return tickets.filter(t => {
      const date = parseDateLocal(t.createdAt);
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesPlaca = !placaFiltro || t.placa === placaFiltro;
      const matchesMotorista = !motoristaFiltro || t.motoristaId === motoristaFiltro;
      const matchesBusca = !q ||
        t.numeroTicket.toLowerCase().includes(q) ||
        t.oc.toLowerCase().includes(q) ||
        t.motivo.toLowerCase().includes(q) ||
        t.placa.toLowerCase().includes(q) ||
        (t.motoristaNome?.toLowerCase().includes(q) ?? false);
      return matchesDate && matchesPlaca && matchesMotorista && matchesBusca;
    }).sort((a, b) => parseDateLocal(b.createdAt).getTime() - parseDateLocal(a.createdAt).getTime());
  }, [tickets, startDate, endDate, placaFiltro, motoristaFiltro, busca]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-3xl font-black uppercase text-white">Relatório de Tickets</h2>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">Voltar</button>
      </div>

      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input label="Data Início" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data Fim" type="date" value={endDate} onChange={setEndDate} />
          <Select label="Placa" value={placaFiltro} onChange={setPlacaFiltro} options={[{ label: '— Todas —', value: '' }, ...placasOptions]} />
          <Select label="Motorista" value={motoristaFiltro} onChange={setMotoristaFiltro} options={[{ label: '— Todos —', value: '' }, ...motoristasOptions]} />
          <Input label="Buscar" value={busca} onChange={setBusca} placeholder="Ticket, OC, motivo..." />
        </div>
      </Card>

      <Card className="border-slate-800">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum ticket no período.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Ticket</th>
                  <th className="p-3">OC</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Motorista</th>
                  <th className="p-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-slate-300">{formatDateBr(t.createdAt)}</td>
                    <td className="p-3 font-bold text-slate-200">{t.numeroTicket}</td>
                    <td className="p-3 text-slate-300">{t.oc}</td>
                    <td className="p-3 text-slate-300">{t.placa}</td>
                    <td className="p-3 text-slate-300">{t.motoristaNome || users.find(u => u.id === t.motoristaId)?.nome || '—'}</td>
                    <td className="p-3 text-slate-400">{t.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTicketReport;
