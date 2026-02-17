
import React, { useMemo, useEffect, useRef } from 'react';
import { User, UserSession, UserRole, Fueling, MaintenanceRequest, DailyRoute, RouteDeparture, FuelingStatus, MaintenanceStatus, FinanceiroStatus } from '../types';
import { BigButton, Card } from '../components/UI';
import { 
  Route, 
  Fuel, 
  Wrench, 
  ClipboardList, 
  Link as LinkIcon, 
  Bell, 
  Radio, 
  BarChart3, 
  Camera, 
  PlusCircle, 
  Truck, 
  Milestone, 
  Building2, 
  LineChart, 
  History, 
  Users, 
  ShieldCheck, 
  Handshake, 
  Wallet,
  LayoutDashboard,
  Terminal,
  MapPin
} from 'lucide-react';

interface OperationHomeProps {
  user: User;
  session: UserSession | null;
  fuelings?: Fueling[];
  maintenances?: MaintenanceRequest[];
  dailyRoutes?: DailyRoute[];
  routes?: RouteDeparture[];
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const OperationHome: React.FC<OperationHomeProps> = ({ 
  user, 
  session, 
  fuelings = [], 
  maintenances = [], 
  dailyRoutes = [], 
  routes = [], 
  onNavigate, 
  onLogout 
}) => {
  const isAdminTotal = user.perfil === UserRole.ADMIN;
  const isCustomAdmin = user.perfil === UserRole.CUSTOM_ADMIN;
  const isAnyAdmin = isAdminTotal || isCustomAdmin;

  const pendingCount = useMemo(() => {
    const f = fuelings.filter(x => x.status === FuelingStatus.PENDENTE).length;
    const m = maintenances.filter(x => x.status === MaintenanceStatus.PENDENTE).length;
    const d = dailyRoutes.filter(x => x.statusFinanceiro === FinanceiroStatus.PENDENTE).length;
    const r = routes.filter(x => x.statusFinanceiro === FinanceiroStatus.PENDENTE).length;
    return f + m + d + r;
  }, [fuelings, maintenances, dailyRoutes, routes]);

  const pendingFuelMaintCount = useMemo(() => {
    const f = fuelings.filter(x => x.status === FuelingStatus.PENDENTE).length;
    const m = maintenances.filter(x => x.status === MaintenanceStatus.PENDENTE).length;
    return f + m;
  }, [fuelings, maintenances]);

  const lastNotifiedCountRef = useRef(0);

  useEffect(() => {
    if (!isAnyAdmin || pendingFuelMaintCount <= lastNotifiedCountRef.current) return;
    const run = async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;
      const f = fuelings.filter(x => x.status === FuelingStatus.PENDENTE).length;
      const m = maintenances.filter(x => x.status === MaintenanceStatus.PENDENTE).length;
      const parts = [];
      if (f > 0) parts.push(`${f} abastecimento(s)`);
      if (m > 0) parts.push(`${m} manutenção(ões)`);
      if (parts.length === 0) return;
      try {
        new Notification('Prime Group – Pendências', {
          body: `${parts.join(' e ')} aguardando aprovação.`,
          icon: '/favicon.ico',
        });
      } catch (_) {
        new Notification('Prime Group – Pendências', { body: `${parts.join(' e ')} aguardando aprovação.` });
      }
      lastNotifiedCountRef.current = pendingFuelMaintCount;
    };
    run();
  }, [isAnyAdmin, pendingFuelMaintCount, fuelings, maintenances]);

  const hasPermission = (pageId: string) => {
    if (isAdminTotal) return true;
    if (isCustomAdmin) return user.permissoes?.includes(pageId);
    return false;
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="col-span-full mt-10 mb-4 first:mt-0">
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4">
        <span className="flex-1 h-px bg-slate-800"></span>
        {title}
        <span className="flex-1 h-px bg-slate-800"></span>
      </h3>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Session Banner */}
      <Card className={`flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 ${isAnyAdmin ? 'border-l-indigo-600' : 'border-l-blue-600'} bg-slate-900/40`}>
        <div className="text-center md:text-left">
          <h2 className="text-xl font-black uppercase tracking-tight">Painel de Controle</h2>
          <div className="mt-2 flex flex-wrap justify-center md:justify-start items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status: Online</span>
            </div>
            <span className="hidden md:block w-px h-3 bg-slate-800"></span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Perfil:</span>
              <span className="text-indigo-400 font-black tracking-widest text-[10px] uppercase">
                {user.perfil === UserRole.CUSTOM_ADMIN ? 'Admin Custom' : user.perfil}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3">
          {session ? (
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <div className="flex items-center gap-3 bg-slate-950 px-5 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Placa Vinculada:</span>
                <span className="font-mono text-xl font-black text-blue-400 tracking-[0.2em]">{session.placa}</span>
              </div>
              <button onClick={() => onNavigate('select-vehicle')} className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:text-blue-400 transition-colors">Trocar Unidade</button>
            </div>
          ) : !isAnyAdmin && (
            <button 
              onClick={() => onNavigate('select-vehicle')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              Vincular Placa
            </button>
          )}

          {isAnyAdmin && (
            <div className="text-center md:text-right">
              <div className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em]">Ambiente Administrativo</div>
              <div className="text-[10px] text-indigo-400 font-medium italic">Monitorando {pendingCount} pendência(s)</div>
            </div>
          )}
        </div>
      </Card>

      {!session && !isAnyAdmin && (
        <div className="bg-slate-900/30 p-16 rounded-3xl text-center border-2 border-dashed border-slate-800/50">
          <Truck className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-40" />
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Aguardando Vinculação</h3>
          <p className="text-slate-600 max-w-xs mx-auto mt-3 text-xs leading-relaxed font-medium">
            Selecione o veículo que você operará hoje para liberar as funcionalidades do sistema.
          </p>
        </div>
      )}

      {(session || isAnyAdmin) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Menu para Motoristas */}
          {user.perfil === UserRole.MOTORISTA && (
            <>
              <SectionHeader title="Minha Operação" />
              <BigButton onClick={() => onNavigate('daily-route')} icon={<Route size={32} />} variant="primary">Rota do Dia</BigButton>
              <BigButton onClick={() => onNavigate('fueling')} icon={<Fuel size={32} />} variant="primary">Abastecer</BigButton>
              <BigButton onClick={() => onNavigate('maintenance')} icon={<Wrench size={32} />} variant="secondary">Manutenção</BigButton>
              <SectionHeader title="Histórico" />
              <BigButton onClick={() => onNavigate('my-requests')} icon={<ClipboardList size={32} />} variant="secondary">Solicitações</BigButton>
            </>
          )}

          {/* Menu para Ajudantes */}
          {user.perfil === UserRole.AJUDANTE && (
            <>
              <SectionHeader title="Minha Operação" />
              <BigButton onClick={() => onNavigate('helper-binding')} icon={<LinkIcon size={32} />} variant="primary">Vincular Rota</BigButton>
              <SectionHeader title="Histórico" />
              <BigButton onClick={() => onNavigate('my-routes')} icon={<History size={32} />} variant="secondary">Minhas Saídas</BigButton>
            </>
          )}

          {/* Menu Organizado para Administradores */}
          {isAnyAdmin && (
            <>
              {/* CATEGORIA 1: CONTROLE CRÍTICO */}
              <SectionHeader title="Controle & Auditoria" />
              {hasPermission('admin-pending') && (
                <BigButton 
                  onClick={() => onNavigate('admin-pending')} 
                  icon={<Bell size={32} />} 
                  variant="primary"
                  notificationCount={pendingCount > 0 ? pendingCount : undefined}
                >
                  Pendências
                </BigButton>
              )}
              {hasPermission('admin-tracking') && <BigButton onClick={() => onNavigate('admin-tracking')} icon={<Radio size={32} />} variant="primary">Rastreamento</BigButton>}
              {hasPermission('admin-driver-live') && <BigButton onClick={() => onNavigate('admin-driver-live')} icon={<MapPin size={32} />} variant="primary">Localização motoristas</BigButton>}
              {hasPermission('admin-dashboard') && <BigButton onClick={() => onNavigate('admin-dashboard')} icon={<LayoutDashboard size={32} />} variant="secondary">Dashboard</BigButton>}
              {hasPermission('admin-checklists') && <BigButton onClick={() => onNavigate('admin-checklists')} icon={<Camera size={32} />} variant="secondary">Checklists</BigButton>}

              {/* CATEGORIA 2: LANÇAMENTOS FINANCEIROS */}
              <SectionHeader title="Operacional" />
              {hasPermission('admin-create-route') && <BigButton onClick={() => onNavigate('admin-create-route')} icon={<PlusCircle size={32} />} variant="indigo">Lançar Rota</BigButton>}
              {hasPermission('admin-fueling') && <BigButton onClick={() => onNavigate('admin-fueling')} icon={<Fuel size={32} />} variant="indigo">Lançar combustível</BigButton>}
              {hasPermission('admin-agregado-freight') && <BigButton onClick={() => onNavigate('admin-agregado-freight')} icon={<Truck size={32} />} variant="indigo">Frete Agregado</BigButton>}
              {hasPermission('admin-tolls') && <BigButton onClick={() => onNavigate('admin-tolls')} icon={<Milestone size={32} />} variant="indigo">Pedágios</BigButton>}

              {/* CATEGORIA 3: RELATÓRIOS DE PERFORMANCE */}
              <SectionHeader title="Financeiro" />
              {hasPermission('admin-consolidated-finance') && <BigButton onClick={() => onNavigate('admin-consolidated-finance')} icon={<Wallet size={32} />} variant="success">Faturamento</BigButton>}
              {hasPermission('admin-vehicle-report') && <BigButton onClick={() => onNavigate('admin-vehicle-report')} icon={<BarChart3 size={32} />} variant="secondary">Desempenho</BigButton>}
              {hasPermission('admin-agregado-report') && <BigButton onClick={() => onNavigate('admin-agregado-report')} icon={<LineChart size={32} />} variant="secondary">Agregados</BigButton>}
              {hasPermission('admin-fixed-expenses') && <BigButton onClick={() => onNavigate('admin-fixed-expenses')} icon={<LineChart size={32} />} variant="secondary">Custos Fixos</BigButton>}

              {/* CATEGORIA 4: MANUTENÇÃO E FROTA */}
              <SectionHeader title="Frota" />
              {hasPermission('admin-maintenance-done') && <BigButton onClick={() => onNavigate('admin-maintenance-done')} icon={<Wrench size={32} />} variant="primary">Manutenções feitas</BigButton>}
              {hasPermission('admin-preventive') && <BigButton onClick={() => onNavigate('admin-preventive')} icon={<ShieldCheck size={32} />} variant="success">Preventiva</BigButton>}
              {hasPermission('admin-maintenance-history') && <BigButton onClick={() => onNavigate('admin-maintenance-history')} icon={<History size={32} />} variant="secondary">Histórico</BigButton>}
              {hasPermission('vehicle-mgmt') && <BigButton onClick={() => onNavigate('vehicle-mgmt')} icon={<Truck size={32} />} variant="secondary">Placas</BigButton>}

              {/* CATEGORIA 5: CONFIGURAÇÕES E CADASTROS */}
              <SectionHeader title="Sistema" />
              {hasPermission('admin-agregado-mgmt') && <BigButton onClick={() => onNavigate('admin-agregado-mgmt')} icon={<Handshake size={32} />} variant="primary">Agregados</BigButton>}
              {hasPermission('admin-customers') && <BigButton onClick={() => onNavigate('admin-customers')} icon={<Building2 size={32} />} variant="primary">Clientes</BigButton>}
              {hasPermission('user-mgmt') && <BigButton onClick={() => onNavigate('user-mgmt')} icon={<Users size={32} />} variant="secondary">Equipe</BigButton>}
              {isAdminTotal && <BigButton onClick={() => onNavigate('tech-docs')} icon={<Terminal size={32} />} variant="secondary">Documentação</BigButton>}
            </>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-12 pb-6 text-center">
        <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] mb-2">PRIME GROUP OPERATIONAL SYSTEMS</p>
        <div className="flex justify-center gap-4 text-[9px] text-slate-800 font-bold uppercase tracking-widest">
          <span>v2.1.1</span>
          <span>•</span>
          <span>Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};

export default OperationHome;
