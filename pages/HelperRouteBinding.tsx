
import React, { useMemo } from 'react';
import { DailyRoute, User, UserSession } from '../types';
import { Card, BigButton } from '../components/UI';

interface HelperRouteBindingProps {
  session: UserSession;
  user: User;
  dailyRoutes: DailyRoute[];
  users: User[];
  onBind: (routeId: string) => void;
  onBack: () => void;
}

const HelperRouteBinding: React.FC<HelperRouteBindingProps> = ({ session, user, dailyRoutes, users, onBind, onBack }) => {
  // Filtra rotas do dia que pertencem ao veículo que o ajudante selecionou
  // E que ainda não possuem ajudante vinculado
  const activeRoutesForVehicle = useMemo(() => {
    return dailyRoutes.filter(dr => 
      dr.placa === session.placa && 
      !dr.ajudanteId
    );
  }, [dailyRoutes, session.placa]);

  const getUserName = (id: string) => users.find(u => u.id === id)?.nome || 'Motorista';

  return (
    <div className="max-w-xl mx-auto py-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Vínculo de Equipe</h2>
          <p className="text-slate-500 text-sm">Confirme o carregamento que você acompanhará</p>
        </div>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-200">Cancelar</button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-2xl flex items-center justify-between">
           <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Sua Placa Selecionada:</span>
           <span className="font-mono text-xl font-black text-white">{session.placa}</span>
        </div>

        {activeRoutesForVehicle.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-bold text-slate-300">Aguardando Motorista</h3>
            <p className="text-slate-500 text-xs px-8 mt-2">
              Nenhuma rota ativa encontrada para a placa <span className="text-blue-400 font-bold">{session.placa}</span>. 
              Peça para o motorista realizar a "Rota do Dia" primeiro.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 text-blue-500 font-black text-[10px] uppercase tracking-widest hover:underline"
            >
              Atualizar Lista
            </button>
          </Card>
        ) : (
          activeRoutesForVehicle.map(route => (
            <Card key={route.id} className="border-l-4 border-l-emerald-600 hover:bg-slate-900/80 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Motorista Responsável</div>
                    <div className="text-lg font-bold text-white">{getUserName(route.motoristaId)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">OC / Pedido</div>
                    <div className="font-mono font-bold text-white">{route.oc}</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destino do Carregamento</div>
                  <div className="text-sm font-bold text-slate-200">{route.clienteNome} • {route.destino}</div>
                </div>

                <div className="pt-2">
                  <BigButton 
                    onClick={() => onBind(route.id)} 
                    variant="primary"
                  >
                    CONFIRMAR MEU VÍNCULO
                  </BigButton>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HelperRouteBinding;
