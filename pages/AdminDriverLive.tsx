import React, { useState, useEffect } from 'react';
import { User, UserRole, DriverLocation } from '../types';
import { Card } from '../components/UI';
import { supabase } from '../supabase';
import { fetchDriverLocations, subscribeDriverLocations } from '../supabase/driverLocation';
import { MapPin } from 'lucide-react';

interface AdminDriverLiveProps {
  users: User[];
  onBack: () => void;
}

export const AdminDriverLive: React.FC<AdminDriverLiveProps> = ({ users, onBack }) => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError('Configure o Supabase para monitoramento em tempo real.');
      setLoading(false);
      return;
    }
    setLoading(false);
    const unsubscribe = subscribeDriverLocations(supabase, (list) => {
      setLocations(list);
    });
    return unsubscribe;
  }, []);

  const motoristasMap = new Map(
    users.filter(u => u.perfil === UserRole.MOTORISTA).map(u => [u.id, u])
  );

  const list = locations.map(loc => ({
    ...loc,
    userName: motoristasMap.get(loc.userId)?.nome ?? 'Motorista',
  })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Localização dos motoristas</h2>
          <p className="text-slate-500 text-sm mt-1">
            Tempo real via GPS do celular. Atualiza automaticamente.
          </p>
        </div>
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white shrink-0"
        >
          Voltar
        </button>
      </div>

      {error && (
        <Card className="border-amber-900/40 bg-amber-950/20">
          <p className="text-amber-200 text-sm">{error}</p>
        </Card>
      )}

      {!supabase && !error && (
        <Card className="border-slate-800">
          <p className="text-slate-400 text-sm">
            Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente para ativar o monitoramento.
          </p>
        </Card>
      )}

      {supabase && (
        <Card className="border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-emerald-500" size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Motoristas com localização ativa
            </h3>
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Nenhum motorista enviou localização ainda. Peça para o motorista abrir o app no celular
              e permitir acesso à localização.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((loc) => (
                <li
                  key={loc.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="font-bold text-white">{loc.userName}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                      {formatTime(loc.updatedAt)} · {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInMaps(loc.lat, loc.lng)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    <MapPin size={14} />
                    Ver no mapa
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminDriverLive;
