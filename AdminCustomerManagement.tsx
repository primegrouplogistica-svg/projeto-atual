
import React, { useState, useMemo } from 'react';
import { DailyRoute, User, Vehicle, UserRole } from '../types';
import { Card, Badge, Select } from '../components/UI';
import { X, Download } from 'lucide-react';

interface AdminChecklistReportProps {
  dailyRoutes: DailyRoute[];
  users: User[];
  vehicles: Vehicle[];
  onBack: () => void;
}

type LightboxImage = { src: string; label: string; placa?: string; date?: string };

const AdminChecklistReport: React.FC<AdminChecklistReportProps> = ({ dailyRoutes, users, vehicles, onBack }) => {
  const [filterPlaca, setFilterPlaca] = useState('');
  const [filterMotorista, setFilterMotorista] = useState('');
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  const downloadImage = (src: string, label: string, placa?: string, date?: string) => {
    const ext = src.startsWith('data:image/png') ? 'png' : 'jpg';
    const name = [placa, label, date ? new Date(date).toISOString().slice(0, 10) : ''].filter(Boolean).join('_').replace(/\s/g, '-') || `checklist-${label}.${ext}`;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${name}.${ext}`;
    a.click();
  };

  const checklists = useMemo(() => {
    // Filtra apenas rotas que possuem checklist (pelo menos nivelOleo)
    return dailyRoutes
      .filter(dr => dr.nivelOleo)
      .filter(dr => {
        const matchesPlaca = filterPlaca ? dr.placa === filterPlaca : true;
        const matchesMotorista = filterMotorista ? dr.motoristaId === filterMotorista : true;
        return matchesPlaca && matchesMotorista;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dailyRoutes, filterPlaca, filterMotorista]);

  const getUserName = (id: string) => users.find(u => u.id === id)?.nome || 'N/A';

  const driverOptions = useMemo(() => {
    return users
      .filter(u => u.perfil === UserRole.MOTORISTA && u.ativo)
      .map(u => ({ label: u.nome, value: u.id }));
  }, [users]);

  const vehicleOptions = useMemo(() => {
    return vehicles.map(v => ({ label: v.placa, value: v.placa }));
  }, [vehicles]);

  const clearFilters = () => {
    setFilterPlaca('');
    setFilterMotorista('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Modal ampliar / baixar foto */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-sm font-bold text-white truncate">{lightbox.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadImage(lightbox.src, lightbox.label, lightbox.placa, lightbox.date)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase"
                >
                  <Download size={16} /> Baixar
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <img
              src={lightbox.src}
              alt={lightbox.label}
              className="w-full h-full max-h-[80vh] object-contain rounded-lg bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Checklists da Frota</h2>
          <p className="text-slate-500 text-sm">Inspeções pré-saída realizadas pelos motoristas</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-sm">
            Voltar
          </button>
        </div>
      </div>

      <Card className="border-blue-900/30">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Select 
              label="Filtrar por Placa" 
              value={filterPlaca} 
              onChange={setFilterPlaca} 
              options={vehicleOptions}
            />
          </div>
          <div className="flex-1">
            <Select 
              label="Filtrar por Motorista" 
              value={filterMotorista} 
              onChange={setFilterMotorista} 
              options={driverOptions}
            />
          </div>
          {(filterPlaca || filterMotorista) && (
            <button 
              onClick={clearFilters}
              className="mb-4 px-4 py-2 text-xs font-black uppercase text-red-400 hover:text-red-300 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {checklists.length === 0 ? (
          <div className="py-20 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            Nenhum checklist encontrado para os filtros selecionados.
          </div>
        ) : (
          checklists.map(dr => (
            <Card key={dr.id} className="border-l-4 border-l-blue-600 hover:border-l-blue-400 transition-all">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Info Geral */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xl font-black text-blue-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                      {dr.placa}
                    </span>
                    <Badge status="rodando">INSPEÇÃO REALIZADA</Badge>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {new Date(dr.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Motorista</div>
                      <div className="text-sm font-bold text-slate-200">{getUserName(dr.motoristaId)}</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Cliente / Destino</div>
                      <div className="text-sm font-bold text-slate-200">{dr.clienteNome} • {dr.destino}</div>
                    </div>
                  </div>

                  {/* Indicação de avaria (texto na coluna esquerda) */}
                  {dr.avariaNova && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Avaria registrada — ver foto em destaque ao lado
                    </div>
                  )}

                  {/* Níveis Técnicos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${dr.nivelOleo === 'no_nivel' ? 'border-emerald-900/30 bg-emerald-900/10' : 'border-red-900/30 bg-red-900/10'}`}>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Nível Óleo</span>
                        <span className={`text-xs font-black uppercase ${dr.nivelOleo === 'no_nivel' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {dr.nivelOleo === 'no_nivel' ? 'OK' : 'ABAIXO'}
                        </span>
                      </div>
                      <span className={`text-lg font-black ${dr.nivelOleo === 'no_nivel' ? 'text-emerald-500' : 'text-red-500'}`}>X</span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between ${dr.nivelAgua === 'no_nivel' ? 'border-emerald-900/30 bg-emerald-900/10' : 'border-red-900/30 bg-red-900/10'}`}>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Nível Água</span>
                        <span className={`text-xs font-black uppercase ${dr.nivelAgua === 'no_nivel' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {dr.nivelAgua === 'no_nivel' ? 'OK' : 'ABAIXO'}
                        </span>
                      </div>
                      <span className={`text-lg font-black ${dr.nivelAgua === 'no_nivel' ? 'text-emerald-500' : 'text-red-500'}`}>X</span>
                    </div>
                  </div>
                </div>

                {/* Galeria de Fotos + Avaria em destaque */}
                <div className="lg:w-96 space-y-4">
                  {dr.avariaNova && (dr.avariaFoto || dr.avariaDescricao) && (
                    <div className="rounded-xl border-2 border-amber-500/60 bg-amber-950/30 overflow-hidden">
                      <div className="bg-amber-900/40 px-3 py-1.5 text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Avaria — em destaque
                      </div>
                      {dr.avariaFoto && (
                        <button
                          type="button"
                          onClick={() => setLightbox({ src: dr.avariaFoto!, label: 'Avaria', placa: dr.placa, date: dr.createdAt })}
                          className="block w-full aspect-video overflow-hidden cursor-pointer hover:opacity-90 transition-opacity text-left"
                        >
                          <img src={dr.avariaFoto} alt="Avaria" className="w-full h-full object-cover" />
                        </button>
                      )}
                      {dr.avariaDescricao && (
                        <div className="px-3 py-2 bg-slate-950/80 text-xs text-slate-300 border-t border-amber-500/20">{dr.avariaDescricao}</div>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Fotos da inspeção</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Frente', img: dr.fotoFrente },
                        { label: 'Esq.', img: dr.fotoLateralEsquerda },
                        { label: 'Dir.', img: dr.fotoLateralDireita },
                        { label: 'Traseira', img: dr.fotoTraseira }
                      ].map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => p.img && setLightbox({ src: p.img!, label: p.label, placa: dr.placa, date: dr.createdAt })}
                          className="relative group overflow-hidden rounded-lg bg-slate-950 border border-slate-800 h-24 cursor-pointer hover:border-blue-600 transition-colors text-left block w-full"
                        >
                          {p.img ? (
                            <img 
                              src={p.img} 
                              alt={p.label} 
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700 font-bold uppercase">Sem Foto</div>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter">
                            {p.label}
                          </div>
                          {p.img && (
                            <div className="absolute top-1 right-1 bg-black/50 px-1.5 py-0.5 rounded text-[8px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              Ampliar
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminChecklistReport;
