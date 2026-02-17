import React from 'react';
import { User } from '../types';
import { Card } from '../components/UI';

interface AdminDriverLiveProps {
  users: User[];
  onBack: () => void;
}

export const AdminDriverLive: React.FC<AdminDriverLiveProps> = ({ users, onBack }) => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Localização em tempo real</h2>
          <p className="text-slate-500 text-sm mt-1">
            Este módulo foi desativado porque a integração com banco de dados em tempo real (Supabase) foi removida.
          </p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs text-white shrink-0">
          Voltar
        </button>
      </div>
      <Card className="border-slate-800">
        <p className="text-slate-400 text-sm">
          A tela de monitoramento em tempo real está indisponível nesta versão sem banco de dados em tempo real.
        </p>
      </Card>
    </div>
  );
};

export default AdminDriverLive;
