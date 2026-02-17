
import React from 'react';
import { DailyRoute } from '../types';
import { Card, Badge } from '../components/UI';

interface MyRoutesProps {
  routes: DailyRoute[];
  onBack: () => void;
}

const MyRoutes: React.FC<MyRoutesProps> = ({ routes, onBack }) => {
  // Ordenação defensiva para evitar crash se createdAt estiver ausente
  const sortedRoutes = React.useMemo(() => {
    if (!Array.isArray(routes)) return [];
    return [...routes].sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [routes]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Minhas Saídas</h2>
          <p className="text-slate-500 text-sm italic">Histórico de carregamentos acompanhados</p>
        </div>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-200">Voltar</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedRoutes.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
            <div className="text-4xl mb-4">🚛</div>
            <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">Nenhuma rota vinculada</p>
          </div>
        ) : (
          sortedRoutes.map(r => (
            <Card key={r.id} className="border-l-4 border-l-blue-600">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 px-3 py-1 rounded border border-slate-800 font-mono font-bold text-blue-400 text-lg">
                    {r.placa}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">OC / Pedido</span>
                    <span className="text-xs font-bold text-white">{r.oc || 'Sem OC'}</span>
                  </div>
                </div>
                <Badge status={r.statusFinanceiro || 'vinculado'}>
                  {r.statusFinanceiro ? `Fin: ${r.statusFinanceiro}` : 'Ativa'}
                </Badge>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-4">
                 <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1">
                    <div className="text-slate-600 text-[9px] uppercase font-black tracking-widest mb-1">Cliente</div>
                    <div className="text-slate-200 font-bold">{r.clienteNome || 'Não informado'}</div>
                  </div>
                  <div className="text-slate-700">&rarr;</div>
                  <div className="flex-1">
                    <div className="text-slate-600 text-[9px] uppercase font-black tracking-widest mb-1">Destino</div>
                    <div className="text-slate-200 font-bold">{r.destino || 'Não informado'}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span>{r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Sem data'}</span>
                {typeof r.valorAjudante === 'number' && r.valorAjudante > 0 ? (
                  <span className="text-emerald-500">Saldo: R$ {r.valorAjudante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                ) : (
                  <span className="italic text-slate-700">Aguardando Financeiro</span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyRoutes;
