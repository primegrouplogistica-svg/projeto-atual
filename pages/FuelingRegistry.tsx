import React, { useMemo, useState } from 'react';
import { Fueling, User, FuelingStatus } from '../types';
import { Card, Badge } from '../components/UI';

interface FuelingRegistryProps {
  fuelings: Fueling[];
  users: User[];
  onBack: () => void;
}

const FuelingRegistry: React.FC<FuelingRegistryProps> = ({ fuelings, users, onBack }) => {
  const [filterStatus, setFilterStatus] = useState<FuelingStatus | 'todos'>('todos');

  const list = useMemo(() => {
    const base = [...fuelings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filterStatus === 'todos') return base;
    return base.filter(f => f.status === filterStatus);
  }, [fuelings, filterStatus]);

  const getMotoristaNome = (motoristaId: string) => users.find(u => u.id === motoristaId)?.nome ?? '—';

  return (
    <div className="max-w-4xl mx-auto py-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold">Registro de Abastecimentos</h2>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-200">Voltar</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilterStatus('todos')}
          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${filterStatus === 'todos' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Todos ({fuelings.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus(FuelingStatus.PENDENTE)}
          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${filterStatus === FuelingStatus.PENDENTE ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Pendentes ({fuelings.filter(f => f.status === FuelingStatus.PENDENTE).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus(FuelingStatus.APROVADO)}
          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${filterStatus === FuelingStatus.APROVADO ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Aprovados ({fuelings.filter(f => f.status === FuelingStatus.APROVADO).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus(FuelingStatus.REJEITADO)}
          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${filterStatus === FuelingStatus.REJEITADO ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Rejeitados ({fuelings.filter(f => f.status === FuelingStatus.REJEITADO).length})
        </button>
      </div>

      {list.length === 0 ? (
        <Card className="py-16 text-center text-slate-500 border border-dashed border-slate-800">
          Nenhum abastecimento encontrado.
        </Card>
      ) : (
        <div className="space-y-6">
          {list.map(f => (
            <Card key={f.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6">
                {f.fotoNota && (
                  <div className="flex-shrink-0 w-full md:w-56">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Foto da nota</div>
                    <img
                      src={f.fotoNota}
                      alt="Nota fiscal"
                      className="w-full h-40 md:h-36 object-contain rounded-xl bg-slate-950 border border-slate-800"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-lg font-black text-blue-400">{f.placa}</span>
                    <Badge status={f.status}>{f.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-slate-500">Valor:</span>{' '}
                      <span className="font-bold text-slate-200">R$ {Number(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">KM:</span>{' '}
                      <span className="font-bold text-slate-200">{f.kmNoMomento.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Motorista:</span>{' '}
                      <span className="text-slate-300">{getMotoristaNome(f.motoristaId)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Lançado em {new Date(f.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    {f.approvedAt && (
                      <> · Aprovado em {new Date(f.approvedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</>
                    )}
                  </div>
                  {f.motivoRejeicao && (
                    <div className="text-xs text-red-400 bg-red-950/30 px-3 py-2 rounded-lg border border-red-900/50">
                      Motivo rejeição: {f.motivoRejeicao}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuelingRegistry;
