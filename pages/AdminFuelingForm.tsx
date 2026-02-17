import React, { useState, useMemo, useRef } from 'react';
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
  const [fotoNota, setFotoNota] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const motoristas = useMemo(() => users.filter(u => u.perfil === UserRole.MOTORISTA).sort((a, b) => a.nome.localeCompare(b.nome)), [users]);
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setFotoNota(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !motoristaId || !km || !valor || !selectedVehicle || !fotoNota) return;

    const newFueling: Fueling = {
      id: crypto.randomUUID(),
      vehicleId: selectedVehicle.id,
      placa: selectedVehicle.placa,
      motoristaId,
      kmNoMomento: Number(km),
      valor: Number(valor),
      fotoNota,
      status: FuelingStatus.PENDENTE,
      createdAt: new Date().toISOString(),
    };

    onSubmit(newFueling);
  };

  const isValid = vehicleId && motoristaId && km && valor && fotoNota && Number(km) >= 0 && Number(valor) > 0;

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

          <div className="space-y-2">
            <label className="block text-slate-400 text-sm font-medium uppercase tracking-wider">Foto da nota fiscal</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 rounded-xl min-h-[140px] text-center bg-slate-950/50 cursor-pointer hover:border-indigo-600 transition-colors overflow-hidden"
            >
              {fotoNota ? (
                <div className="relative p-2">
                  <img src={fotoNota} alt="Nota fiscal" className="w-full h-40 object-contain rounded-lg bg-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity gap-2">
                    <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">Trocar foto</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-3xl block mb-2 pt-6">📸</span>
                  <span className="text-sm text-slate-500 block">Tire uma foto no celular ou anexe no computador</span>
                </>
              )}
            </div>
          </div>

          <button type="submit" disabled={!isValid} className="w-full p-4 rounded-2xl border-b-4 border-indigo-600 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-widest transition-all active:translate-y-1">
            Enviar para aprovação
          </button>
        </form>
      </Card>
    </div>
  );
};

export default AdminFuelingForm;
