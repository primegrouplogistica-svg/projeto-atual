import React, { useState, useMemo } from 'react';
import { MaintenanceRequest, MaintenanceStatus, Vehicle, User } from '../types';
import { Card, Input, Select } from '../components/UI';

interface AdminMaintenanceDoneProps {
  maintenances: MaintenanceRequest[];
  vehicles: Vehicle[];
  currentUser: User;
  onAddMaintenance: (m: MaintenanceRequest) => void;
  onBack: () => void;
}

const AdminMaintenanceDone: React.FC<AdminMaintenanceDoneProps> = ({
  maintenances,
  vehicles,
  currentUser,
  onAddMaintenance,
  onBack,
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [tipo, setTipo] = useState<'preventiva' | 'corretiva'>('corretiva');
  const [descricao, setDescricao] = useState('');
  const [km, setKm] = useState('');
  const [valor, setValor] = useState('');
  const [oficina, setOficina] = useState('');
  const [dataConclusao, setDataConclusao] = useState(new Date().toISOString().slice(0, 10));

  const feitas = useMemo(() => {
    return maintenances
      .filter(m => m.status === MaintenanceStatus.FEITA)
      .sort((a, b) => (b.doneAt || b.createdAt).localeCompare(a.doneAt || a.createdAt));
  }, [maintenances]);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !descricao.trim() || !selectedVehicle) return;
    const now = new Date().toISOString();
    const doneAt = dataConclusao ? new Date(dataConclusao + 'T12:00:00').toISOString() : now;
    const newM: MaintenanceRequest = {
      id: crypto.randomUUID(),
      vehicleId: selectedVehicle.id,
      placa: selectedVehicle.placa,
      motoristaId: currentUser.id,
      tipo,
      descricao: descricao.trim(),
      kmNoMomento: Number(km) || 0,
      foto: '',
      status: MaintenanceStatus.FEITA,
      adminResponsavelId: currentUser.id,
      doneAt,
      valor: valor ? Number(valor) : undefined,
      oficina: oficina.trim() || undefined,
      createdAt: now,
    };
    onAddMaintenance(newM);
    setDescricao('');
    setKm('');
    setValor('');
    setOficina('');
  };

  const isValid = vehicleId && descricao.trim();

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Manutenções feitas</h2>
          <p className="text-slate-500 text-sm">Adicione manutenções concluídas ou veja as aprovadas nas pendências</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">
          Voltar
        </button>
      </div>

      <Card className="border-emerald-900/30 bg-emerald-950/10">
        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Adicionar manutenção feita</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Veículo (placa)"
              value={vehicleId}
              onChange={setVehicleId}
              options={vehicles.map(v => ({ label: `${v.placa} — ${v.modelo}`, value: v.id }))}
              required
            />
            <Select
              label="Tipo"
              value={tipo}
              onChange={(v) => setTipo(v as 'preventiva' | 'corretiva')}
              options={[
                { label: 'Preventiva', value: 'preventiva' },
                { label: 'Corretiva', value: 'corretiva' },
              ]}
            />
          </div>
          <Input label="Descrição" value={descricao} onChange={setDescricao} placeholder="Descrição do serviço" required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="KM no momento" type="number" value={km} onChange={setKm} placeholder="0" />
            <Input label="Valor (R$)" type="number" value={valor} onChange={setValor} placeholder="0.00" />
            <Input label="Oficina" value={oficina} onChange={setOficina} placeholder="Nome da oficina" />
          </div>
          <Input label="Data da conclusão" type="date" value={dataConclusao} onChange={setDataConclusao} />
          <button type="submit" disabled={!isValid} className="w-full p-4 rounded-2xl border-b-4 border-emerald-600 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-widest transition-all">
            Adicionar manutenção feita
          </button>
        </form>
      </Card>

      <Card>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          Lista de manutenções feitas ({feitas.length})
        </h3>
        {feitas.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhuma manutenção feita ainda. Adicione acima ou aprove solicitações em Pendências.
          </div>
        ) : (
          <div className="space-y-3">
            {feitas.map(m => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-blue-400">{m.placa}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${m.tipo === 'preventiva' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                    {m.tipo}
                  </span>
                </div>
                <p className="text-sm text-slate-300 flex-1 min-w-[200px]">{m.descricao}</p>
                <div className="flex items-center gap-4 text-xs">
                  {m.doneAt && (
                    <span className="text-slate-500">
                      Concluído: {new Date(m.doneAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {m.oficina && <span className="text-slate-400">Oficina: {m.oficina}</span>}
                  {m.valor != null && (
                    <span className="font-bold text-red-400">R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminMaintenanceDone;
