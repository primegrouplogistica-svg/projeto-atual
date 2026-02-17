
import React, { useState, useMemo } from 'react';
import { Vehicle } from '../types';
import { Card, Badge, Input } from '../components/UI';

interface AdminTrackingProps {
  vehicles: Vehicle[];
  onUpdateVehicle: (id: string, update: Partial<Vehicle>) => void;
  onBack: () => void;
}

const AdminTracking: React.FC<AdminTrackingProps> = ({ vehicles, onUpdateVehicle, onBack }) => {
  const [filter, setFilter] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [tempTrackerId, setTempTrackerId] = useState('');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.placa.toLowerCase().includes(filter.toLowerCase()) || 
      v.modelo.toLowerCase().includes(filter.toLowerCase())
    );
  }, [vehicles, filter]);

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      online: vehicles.filter(v => v.isOnline).length,
      withTracker: vehicles.filter(v => v.trackerId).length,
      noTracker: vehicles.filter(v => !v.trackerId).length
    };
  }, [vehicles]);

  const handleAssignTracker = (id: string) => {
    if (!tempTrackerId) return;
    onUpdateVehicle(id, { trackerId: tempTrackerId, isOnline: true });
    setAssigningId(null);
    setTempTrackerId('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rastreamento de Frota</h2>
          <p className="text-slate-500 text-sm">Monitoramento em tempo real dos veículos PRIME GROUP</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-sm transition-colors">
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 text-center py-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Frota Monitorada</div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </Card>
        <Card className="bg-emerald-900/10 border-emerald-900/40 text-center py-4">
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Veículos Online</div>
          <div className="text-2xl font-black text-emerald-400">{stats.online}</div>
        </Card>
        <Card className="bg-blue-900/10 border-blue-900/40 text-center py-4">
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Com Rastreador</div>
          <div className="text-2xl font-black text-blue-400">{stats.withTracker}</div>
        </Card>
        <Card className="bg-red-900/10 border-red-900/40 text-center py-4">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Sem Monitoramento</div>
          <div className="text-2xl font-black text-red-400">{stats.noTracker}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna do Mapa (Visual Placeholder) */}
        <Card className="lg:col-span-2 min-h-[500px] p-0 overflow-hidden relative border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[#0a0a14] flex flex-col items-center justify-center">
            {/* Grid de fundo simulando mapa dark */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {/* Elementos visuais simulando o mapa */}
            <div className="relative w-full h-full">
              {filteredVehicles.filter(v => v.trackerId).map((v, i) => (
                <div 
                  key={v.id} 
                  className="absolute animate-pulse" 
                  style={{ top: `${20 + (i * 12) % 60}%`, left: `${15 + (i * 25) % 70}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-600 p-2 rounded-full shadow-lg shadow-blue-900/50 border border-white/20">
                      <span className="text-lg">🚚</span>
                    </div>
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-[8px] font-mono font-bold border border-slate-800 mt-1 text-white">
                      {v.placa}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="absolute bottom-6 right-6 bg-slate-950/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase mb-2">Legenda Visual</h4>
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                     <span className="text-[10px] text-slate-400">Em Trânsito</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="text-[10px] text-slate-400">Ponto de Descarga</span>
                   </div>
                 </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                  <span className="text-4xl block mb-2">📡</span>
                  <h3 className="text-sm font-bold text-slate-200">Visão Satelital (Simulada)</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Pronto para integração GPS/API</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Veículos */}
        <div className="space-y-4">
          <Input 
            label="Buscar por Placa" 
            value={filter} 
            onChange={setFilter} 
            placeholder="Digite a placa..."
          />

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
            {filteredVehicles.map(v => (
              <Card key={v.id} className={`p-4 hover:border-blue-900/50 transition-all ${v.trackerId ? 'border-l-4 border-l-blue-600' : 'border-l-4 border-l-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-sm font-bold text-blue-400">
                    {v.placa}
                  </span>
                  {v.trackerId ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${v.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{v.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                  ) : (
                    <Badge status="pendente">Sem Tracker</Badge>
                  )}
                </div>

                {assigningId === v.id ? (
                  <div className="mt-3 space-y-2 animate-slideDown">
                    <Input label="ID do Rastreador" value={tempTrackerId} onChange={setTempTrackerId} placeholder="IMEI ou Serial" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAssignTracker(v.id)} className="flex-1 bg-blue-700 hover:bg-blue-600 py-2 rounded-lg font-bold text-xs">VINCULAR</button>
                      <button onClick={() => setAssigningId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg font-bold text-xs">CANCELAR</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      {v.trackerId ? `ID: ${v.trackerId}` : 'Não monitorado'}
                    </div>
                    <button 
                      onClick={() => { setAssigningId(v.id); setTempTrackerId(v.trackerId || ''); }}
                      className="text-[10px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors"
                    >
                      {v.trackerId ? 'Alterar' : '+ Adicionar'}
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTracking;
