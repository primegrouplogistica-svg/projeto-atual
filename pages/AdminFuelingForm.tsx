import React, { useState, useMemo } from 'react';
import { Vehicle, User, UserRole, Fueling, FuelingStatus } from '../types';
import { Card, Input } from '../components/UI';

interface AdminFuelingFormProps {
  vehicles: Vehicle[];
  users: User[];
  onSubmit: (fueling: Fueling) => void;
  onBack: () => void;
}

const AdminFuelingForm: React.FC<AdminFuelingFormProps> = ({ vehicles, users, onSubmit, onBack }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [km, setKm] = useState('');
  const [valor, setValor] = useState('');

  const motoristas = useMemo(() => users.filter(u => u.perfil === UserRole.MOTORISTA).sort((a, b) => a.nome.localeCompare(b.nome)), [users]);
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !motoristaId || !km || !valor || !selectedVehicle) return;

    const newFueling: Fueling = {
      id: crypto.randomUUID(),
      vehicleId: selectedVehicle.id,
      placa: selectedVehicle.placa,
      motoristaId,
      kmNoMomento: Number(km),
      valor: Number(valor),
      fotoNota: '',
      status: FuelingStatus.PENDENTE,
      createdAt: new Date().toISOString(),
    };

    onSubmit(newFueling);
  };

  const isValid = vehicleId && motoristaId && km && valor && Number(km) >= 0 && Number(valor) > 0;

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Lançar combustível</h2>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">
          Voltar
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">Veículo (placa)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Selecione o veículo</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider">Motorista</label>
            <select
              value={motoristaId}
              onChange={(e) => setMotoristaId(e.target.value)}
              required
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Selecione o motorista</option>
              {motoristas.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          <Input
            label="KM no momento"
            type="number"
            value={km}
            onChange={setKm}
            required
            placeholder="KM atual no painel"
          />
          <Input
            label="Valor total (R$)"
            type="number"
            value={valor}
            onChange={setValor}
            required
            placeholder="Valor da nota"
          />

          <button type="submit" disabled={!isValid} className="w-full p-4 rounded-2xl border-b-4 border-indigo-600 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-widest transition-all active:translate-y-1">
            Enviar para aprovação
          </button>
        </form>
      </Card>
    </div>
  );
};

export default AdminFuelingForm;
