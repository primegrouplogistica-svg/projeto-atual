
import React, { useState } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { Card, Badge, Input } from '../components/UI';
import { Pencil, X, Check } from 'lucide-react';

interface VehicleMgmtProps {
  vehicles: Vehicle[];
  onSaveVehicle: (v: Vehicle) => Promise<void>;
  onUpdateVehicle: (id: string, update: Partial<Vehicle>) => void;
  onBack: () => void;
}

const VehicleManagement: React.FC<VehicleMgmtProps> = ({ vehicles, onSaveVehicle, onUpdateVehicle, onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [km, setKm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlaca, setEditPlaca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editStatus, setEditStatus] = useState<VehicleStatus>(VehicleStatus.RODANDO);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !modelo) return alert('Placa e Modelo são obrigatórios');
    setIsSaving(true);
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      placa: placa.toUpperCase(),
      modelo,
      kmAtual: Number(km) || 0,
      status: VehicleStatus.RODANDO,
      proximaManutencaoKm: (Number(km) || 0) + 10000
    };
    await onSaveVehicle(newVehicle);
    setIsSaving(false);
    setShowForm(false);
    setPlaca(''); setModelo(''); setKm('');
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setEditPlaca(v.placa);
    setEditModelo(v.modelo);
    setEditStatus(v.status);
  };

  const saveEdit = (id: string) => {
    const placaTrim = editPlaca.trim().toUpperCase();
    const modeloTrim = editModelo.trim();
    if (!placaTrim || !modeloTrim) return alert('Placa e Modelo são obrigatórios');
    onUpdateVehicle(id, { placa: placaTrim, modelo: modeloTrim, status: editStatus });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPlaca('');
    setEditModelo('');
  };

  const statusOptions: { value: VehicleStatus; label: string }[] = [
    { value: VehicleStatus.RODANDO, label: 'Rodando' },
    { value: VehicleStatus.MANUTENCAO, label: 'Em manutenção' },
    { value: VehicleStatus.PARADO, label: 'Parado' },
  ];
  const getStatusLabel = (s: VehicleStatus) => statusOptions.find(o => o.value === s)?.label ?? s;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Gestão da Frota</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 text-white px-4 py-2 rounded-lg font-bold">
            {showForm ? 'Cancelar' : '+ Novo Veículo'}
          </button>
          <button onClick={onBack} className="bg-slate-800 px-4 py-2 rounded-lg font-bold text-sm">Voltar</button>
        </div>
      </div>

      {showForm && (
        <Card className="border-blue-900/50">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input label="Placa" value={placa} onChange={setPlaca} required placeholder="ABC-1234" />
            <Input label="Modelo" value={modelo} onChange={setModelo} required />
            <Input label="KM Inicial" type="number" value={km} onChange={setKm} />
            <div className="md:col-span-3">
              <button type="submit" disabled={isSaving} className="w-full p-6 rounded-2xl border-b-4 border-emerald-600 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-black uppercase tracking-widest transition-all">
                CADASTRAR
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map(v => (
          <Card key={v.id} className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            {editingId === v.id ? (
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Placa</label>
                  <input
                    type="text"
                    value={editPlaca}
                    onChange={(e) => setEditPlaca(e.target.value)}
                    placeholder="ABC-1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Modelo</label>
                  <input
                    type="text"
                    value={editModelo}
                    onChange={(e) => setEditModelo(e.target.value)}
                    placeholder="Modelo do veículo"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as VehicleStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => saveEdit(v.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase">
                    <Check size={14} /> Salvar
                  </button>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold uppercase">
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="font-mono font-black text-xl text-blue-400">{v.placa}</div>
                  <div className="text-sm font-bold text-slate-100">{v.modelo}</div>
                  <div className="text-[10px] text-slate-500 uppercase">KM: {v.kmAtual.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={v.status}>{getStatusLabel(v.status)}</Badge>
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Editar placa e modelo"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VehicleManagement;
