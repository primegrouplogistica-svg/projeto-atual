import React, { useEffect, useMemo, useState } from 'react';
import { DriverLocation, User } from '../types';
import { Card, Badge } from '../components/UI';
import { supabase } from '../supabase';
import { subscribeDriverLocations } from '../supabase/driverLocation';

interface AdminDriverLiveProps {
  users: User[];
  onBack: () => void;
}

export const AdminDriverLive: React.FC<AdminDriverLiveProps> = ({ users, onBack }) => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);

  // Enriquecer com nome do usuário
  const enrichedLocations = useMemo(() => {
    const userMap = new Map(users.map((u) => [u.id, u.nome]));
    return locations.map((loc) => ({
      ...loc,
      userName: userMap.get(loc.userId) ?? loc.userName ?? 'Motorista',
    }));
  }, [locations, users]);

  useEffect(() => {
    if (!supabase) return;
    const unsubscribe = subscribeDriverLocations(supabase, setLocations);
    return () => unsubscribe();
  }, []);

  const isSupabaseConfigured = !!supabase;

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Localização em tempo real</h2>
          {isSupabaseConfigured ? (
            <p className="text-slate-500 text-sm mt-1">
              Monitoramento em tempo quase real dos motoristas conectados via app móvel (Supabase).
            </p>
          ) : (
            <p className="text-amber-400 text-sm mt-1">
              Para ativar o monitoramento em tempo real, configure as variáveis{' '}
              <code className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-[11px]">VITE_SUPABASE_URL</code> e{' '}
              <code className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-[11px]">VITE_SUPABASE_ANON_KEY</code>{' '}
              no arquivo <span className="font-mono">.env</span> / ambiente do Vite.
            </p>
          )}
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white shrink-0">
          Voltar
        </button>
      </div>

      {isSupabaseConfigured ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa simplificado */}
          <Card className="lg:col-span-2 min-h-[420px] p-0 overflow-hidden border-slate-800 relative">
            <div className="absolute inset-0 bg-[#020617]">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)',
                  backgroundSize: '26px 26px',
                }}
              ></div>

              {enrichedLocations.map((loc, index) => (
                <div
                  key={`${loc.userId}-${index}`}
                  className="absolute animate-pulse"
                  style={{
                    top: `${20 + (index * 15) % 55}%`,
                    left: `${18 + (index * 29) % 64}%`,
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-emerald-500 text-slate-950 p-2 rounded-full shadow-lg shadow-emerald-900/60 border border-emerald-300/70">
                      <span className="text-lg">🚚</span>
                    </div>
                    <span className="bg-slate-950/90 px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-slate-800 text-white">
                      {loc.userName}
                    </span>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 right-4 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl backdrop-blur">
                <h4 className="text-[10px] font-black text-sky-400 uppercase mb-1 tracking-widest">Legenda</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Motorista online (últimas coordenadas recebidas)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de posições */}
          <Card className="border-slate-800 max-h-[420px] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Motoristas Localizados</h3>
              <Badge status={enrichedLocations.length ? 'aprovado' : 'pendente'}>
                {enrichedLocations.length ? `${enrichedLocations.length} ativos` : 'Aguardando posições'}
              </Badge>
            </div>
            <div className="space-y-2">
              {enrichedLocations.map((loc) => (
                <div
                  key={`${loc.userId}-${loc.updatedAt}`}
                  className="flex flex-col gap-1 py-2 border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{loc.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(loc.updatedAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    lat: {loc.lat.toFixed(5)} | lng: {loc.lng.toFixed(5)}{' '}
                    {loc.accuracy != null && <span>(±{Math.round(loc.accuracy)}m)</span>}
                  </div>
                </div>
              ))}

              {!enrichedLocations.length && (
                <p className="text-xs text-slate-500 mt-4">
                  Ainda não recebemos nenhuma posição. Confirme que o motorista está logado como{' '}
                  <span className="font-mono">motorista</span>, com GPS liberado e conexão ativa.
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="border-amber-900/40 bg-amber-950/20">
          <p className="text-amber-100 text-sm">
            Supabase não está configurado. Sem ele, o app não consegue salvar e ler as coordenadas dos motoristas em tempo real.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminDriverLive;
