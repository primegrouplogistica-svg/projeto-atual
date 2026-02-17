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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Enriquecer com nome do usuário
  const enrichedLocations = useMemo(() => {
    const userMap = new Map(users.map((u) => [u.id, u.nome]));
    const result = locations.map((loc) => ({
      ...loc,
      userName: userMap.get(loc.userId) ?? loc.userName ?? 'Motorista',
    }));

    // Garante que sempre exista um selecionado quando chegarem localizações
    if (result.length > 0 && !selectedUserId) {
      setSelectedUserId(result[0].userId);
    }

    return result;
  }, [locations, users, selectedUserId]);

  const selectedLocation = useMemo(
    () => enrichedLocations.find((loc) => loc.userId === selectedUserId) ?? enrichedLocations[0],
    [enrichedLocations, selectedUserId]
  );

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
          {/* Mapa Google Maps focado no motorista selecionado */}
          <Card className="lg:col-span-2 min-h-[420px] p-0 overflow-hidden border-slate-800 relative">
            {selectedLocation ? (
              <iframe
                title={`Mapa - ${selectedLocation.userName}`}
                src={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`}
                className="w-full h-[420px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[420px] bg-slate-950">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-sm text-slate-400 text-center max-w-md">
                  Assim que recebermos a primeira coordenada de um motorista online, o mapa será exibido aqui com a
                  posição em tempo real.
                </p>
              </div>
            )}
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
                  className={`flex flex-col gap-1 py-2 border-b border-slate-800 last:border-b-0 cursor-pointer rounded ${
                    selectedLocation && selectedLocation.userId === loc.userId ? 'bg-slate-900/60' : 'hover:bg-slate-900/40'
                  }`}
                  onClick={() => setSelectedUserId(loc.userId)}
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
                  <div className="flex justify-end mt-1">
                    <a
                      href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=16`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-widest"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Abrir no Google Maps
                    </a>
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
