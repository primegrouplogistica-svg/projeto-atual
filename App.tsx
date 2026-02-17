import React, { useState, useEffect, useRef } from 'react';
import {
  User, UserSession, UserRole, Fueling, MaintenanceRequest,
  RouteDeparture, Vehicle, DailyRoute, Toll, Customer,
  FixedExpense, AgregadoFreight, Agregado,
  FuelingStatus, MaintenanceStatus, RouteStatus, FinanceiroStatus
} from './types';
import { INITIAL_USERS, INITIAL_VEHICLES, INITIAL_CUSTOMERS } from './constants';
import { Logo } from './components/UI';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DriverLocationSender } from './components/DriverLocationSender';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('login');

  // Estados dos Dados com Inicialização do LocalStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pg_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('pg_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pg_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [fuelings, setFuelings] = useState<Fueling[]>(() => {
    const saved = localStorage.getItem('pg_fuelings');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenances, setMaintenances] = useState<MaintenanceRequest[]>(() => {
    const saved = localStorage.getItem('pg_maintenances');
    return saved ? JSON.parse(saved) : [];
  });

  const [routes, setRoutes] = useState<RouteDeparture[]>(() => {
    const saved = localStorage.getItem('pg_routes');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyRoutes, setDailyRoutes] = useState<DailyRoute[]>(() => {
    const saved = localStorage.getItem('pg_daily_routes');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem('pg_fixed_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [agregados, setAgregados] = useState<Agregado[]>(() => {
    const saved = localStorage.getItem('pg_agregados');
    return saved ? JSON.parse(saved) : [];
  });

  const [agregadoFreights, setAgregadoFreights] = useState<AgregadoFreight[]>(() => {
    const saved = localStorage.getItem('pg_agregado_freights');
    return saved ? JSON.parse(saved) : [];
  });

  const [tolls, setTolls] = useState<Toll[]>(() => {
    const saved = localStorage.getItem('pg_tolls');
    return saved ? JSON.parse(saved) : [];
  });
  const maintenancesRef = useRef<MaintenanceRequest[]>(maintenances);
  const vehiclesRef = useRef<Vehicle[]>(vehicles);
  const lastReminder9Ref = useRef<string>('');
  const lastReminder18Ref = useRef<string>('');
  const lastPreventive9Ref = useRef<string>('');
  const lastPreventive18Ref = useRef<string>('');

  maintenancesRef.current = maintenances;
  vehiclesRef.current = vehicles;

  const countPreventivasVencidas = () => {
    let count = 0;
    vehiclesRef.current.forEach((v) => {
      v.preventiveTasks?.forEach((task) => {
        const kmOverdue = task.kmAlvo > 0 && v.kmAtual >= task.kmAlvo;
        const dateOverdue = task.dataProgramada && new Date() >= new Date(task.dataProgramada);
        if (kmOverdue || dateOverdue) count += 1;
      });
    });
    return count;
  };

  // Lembrete de manutenção solicitada: 2x ao dia (9h e 18h) até ser feita — só para admin logado
  useEffect(() => {
    const isAdmin = currentUser && (currentUser.perfil === UserRole.ADMIN || currentUser.perfil === UserRole.CUSTOM_ADMIN);
    if (!isAdmin) return;

    const pendingMaintenancesCount = () =>
      maintenancesRef.current.filter(
        (m) => m.status !== MaintenanceStatus.FEITA && m.status !== MaintenanceStatus.REPROVADA
      ).length;

    const tryReminder = () => {
      if (pendingMaintenancesCount() === 0) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const hour = now.getHours();
      const minute = now.getMinutes();
      if (hour === 9 && minute < 2 && lastReminder9Ref.current !== dateStr) {
        const n = pendingMaintenancesCount();
        try {
          new Notification('Prime Group – Lembrete de Manutenção', {
            body: `${n} manutenção(ões) solicitada(s) aguardando conclusão. Acesse Pendências para resolver.`,
            icon: '/favicon.ico',
          });
        } catch {
          new Notification('Prime Group – Lembrete de Manutenção', {
            body: `${n} manutenção(ões) solicitada(s) aguardando conclusão. Acesse Pendências para resolver.`,
          });
        }
        lastReminder9Ref.current = dateStr;
      }
      if (hour === 18 && minute < 2 && lastReminder18Ref.current !== dateStr) {
        const n = pendingMaintenancesCount();
        try {
          new Notification('Prime Group – Lembrete de Manutenção', {
            body: `${n} manutenção(ões) solicitada(s) aguardando conclusão. Acesse Pendências para resolver.`,
            icon: '/favicon.ico',
          });
        } catch {
          new Notification('Prime Group – Lembrete de Manutenção', {
            body: `${n} manutenção(ões) solicitada(s) aguardando conclusão. Acesse Pendências para resolver.`,
          });
        }
        lastReminder18Ref.current = dateStr;
      }
    };

    tryReminder();
    const interval = setInterval(tryReminder, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.perfil]);

  // Alerta de manutenção preventiva vencida: 2x ao dia (9h e 18h) — só para admin logado
  useEffect(() => {
    const isAdmin = currentUser && (currentUser.perfil === UserRole.ADMIN || currentUser.perfil === UserRole.CUSTOM_ADMIN);
    if (!isAdmin) return;

    const tryPreventiveAlert = () => {
      if (countPreventivasVencidas() === 0) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const hour = now.getHours();
      const minute = now.getMinutes();
      if (hour === 9 && minute < 2 && lastPreventive9Ref.current !== dateStr) {
        const n = countPreventivasVencidas();
        try {
          new Notification('Prime Group – Preventiva vencida', {
            body: `${n} manutenção(ões) preventiva(s) vencida(s). Acesse Plano Preventivo.`,
            icon: '/favicon.ico',
          });
        } catch {
          new Notification('Prime Group – Preventiva vencida', {
            body: `${n} manutenção(ões) preventiva(s) vencida(s). Acesse Plano Preventivo.`,
          });
        }
        lastPreventive9Ref.current = dateStr;
      }
      if (hour === 18 && minute < 2 && lastPreventive18Ref.current !== dateStr) {
        const n = countPreventivasVencidas();
        try {
          new Notification('Prime Group – Preventiva vencida', {
            body: `${n} manutenção(ões) preventiva(s) vencida(s). Acesse Plano Preventivo.`,
            icon: '/favicon.ico',
          });
        } catch {
          new Notification('Prime Group – Preventiva vencida', {
            body: `${n} manutenção(ões) preventiva(s) vencida(s). Acesse Plano Preventivo.`,
          });
        }
        lastPreventive18Ref.current = dateStr;
      }
    };

    tryPreventiveAlert();
    const interval = setInterval(tryPreventiveAlert, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.perfil]);

  // Persistência: localStorage
  useEffect(() => {
    localStorage.setItem('pg_users', JSON.stringify(users));
    localStorage.setItem('pg_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('pg_customers', JSON.stringify(customers));
    localStorage.setItem('pg_fuelings', JSON.stringify(fuelings));
    localStorage.setItem('pg_maintenances', JSON.stringify(maintenances));
    localStorage.setItem('pg_routes', JSON.stringify(routes));
    localStorage.setItem('pg_daily_routes', JSON.stringify(dailyRoutes));
    localStorage.setItem('pg_fixed_expenses', JSON.stringify(fixedExpenses));
    localStorage.setItem('pg_agregados', JSON.stringify(agregados));
    localStorage.setItem('pg_agregado_freights', JSON.stringify(agregadoFreights));
    localStorage.setItem('pg_tolls', JSON.stringify(tolls));
  }, [users, vehicles, customers, fuelings, maintenances, routes, dailyRoutes, fixedExpenses, agregados, agregadoFreights, tolls]);

  // Login Persistente: restaura sessão quando há user_id salvo; roda de novo quando users é preenchido (ex.: após carregar do Supabase)
  useEffect(() => {
    if (currentUser) return;
    const savedUserId = localStorage.getItem('prime_group_user_id');
    const savedSession = localStorage.getItem('prime_group_session');
    if (savedUserId && users.length) {
      const user = users.find(u => u.id === savedUserId);
      if (user && user.ativo) {
        setCurrentUser(user);
        if (savedSession) try { setSession(JSON.parse(savedSession)); } catch { /* ignora sessão inválida */ }
        setCurrentPage('operation');
      }
    }
  }, [users, currentUser]);

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('prime_group_user_id', user.id);
    navigate('operation');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSession(null);
    localStorage.removeItem('prime_group_user_id');
    localStorage.removeItem('prime_group_session');
    navigate('login');
  };

  const saveRecord = (setFn: any, record: any) => {
    setFn((prev: any) => [record, ...prev]);
  };

  const updateRecord = (setFn: any, id: string, update: any) => {
    setFn((prev: any[]) => prev.map(i => i.id === id ? { ...i, ...update } : i));
  };

  const deleteRecord = (setFn: any, id: string) => {
    setFn((prev: any[]) => prev.filter(i => i.id !== id));
  };

  const onSaveUser = async (u: User) => {
    const exists = users.find(x => x.id === u.id);
    setUsers(prev => exists ? prev.map(x => x.id === u.id ? u : x) : [u, ...prev]);
  };

  const onSaveVehicle = async (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
  };

  // Lazy Pages
  const Login = React.lazy(() => import('./pages/Login'));
  const OperationHome = React.lazy(() => import('./pages/OperationHome'));
  const FuelingForm = React.lazy(() => import('./pages/FuelingForm'));
  const MaintenanceForm = React.lazy(() => import('./pages/MaintenanceForm'));
  const RouteForm = React.lazy(() => import('./pages/RouteForm'));
  const MyRequests = React.lazy(() => import('./pages/MyRequests'));
  const MyRoutes = React.lazy(() => import('./pages/MyRoutes'));
  const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
  const AdminPending = React.lazy(() => import('./pages/AdminPending'));
  const UserManagement = React.lazy(() => import('./pages/UserManagement'));
  const VehicleManagement = React.lazy(() => import('./pages/VehicleManagement'));
  const DriverDailyRoute = React.lazy(() => import('./pages/DriverDailyRoute'));
  const AdminVehicleReport = React.lazy(() => import('./pages/AdminVehicleReport'));
  const AdminActivityReport = React.lazy(() => import('./pages/AdminActivityReport'));
  const AdminChecklistReport = React.lazy(() => import('./pages/AdminChecklistReport'));
  const AdminFixedExpenses = React.lazy(() => import('./pages/AdminFixedExpenses'));
  const AdminTracking = React.lazy(() => import('./pages/AdminTracking'));
  const AdminDriverLive = React.lazy(() => import('./pages/AdminDriverLive'));
  const AdminConsolidatedFinancialReport = React.lazy(() => import('./pages/AdminConsolidatedFinancialReport'));
  const VehicleSelection = React.lazy(() => import('./pages/VehicleSelection'));
  const AdminCustomerManagement = React.lazy(() => import('./pages/AdminCustomerManagement'));
  const AdminAgregadoManagement = React.lazy(() => import('./pages/AdminAgregadoManagement'));
  const AdminAgregadoFreight = React.lazy(() => import('./pages/AdminAgregadoFreight'));
  const AdminTollManagement = React.lazy(() => import('./pages/AdminTollManagement'));
  const AdminCreateDailyRoute = React.lazy(() => import('./pages/AdminCreateDailyRoute'));
  const AdminFuelingForm = React.lazy(() => import('./pages/AdminFuelingForm'));
  const AdminPreventiveMaintenance = React.lazy(() => import('./pages/AdminPreventiveMaintenance'));
  const AdminAgregadoReport = React.lazy(() => import('./pages/AdminAgregadoReport'));
  const AdminMaintenanceHistory = React.lazy(() => import('./pages/AdminMaintenanceHistory'));
  const AdminMaintenanceDone = React.lazy(() => import('./pages/AdminMaintenanceDone'));
  const HelperRouteBinding = React.lazy(() => import('./pages/HelperRouteBinding'));
  const TechnicalDocs = React.lazy(() => import('./pages/TechnicalDocs'));

  const renderPage = () => {
    if (!currentUser) return <React.Suspense fallback={null}><Login onLogin={handleLogin} users={users} syncStatus="ok" /></React.Suspense>;

    const isOp = currentUser.perfil === UserRole.MOTORISTA || currentUser.perfil === UserRole.AJUDANTE;
    if (isOp && ['fueling', 'maintenance', 'route', 'daily-route', 'helper-binding'].includes(currentPage) && !session) {
      return <React.Suspense fallback={null}><VehicleSelection vehicles={vehicles} onSelect={(vId, pl) => {
        const s = { userId: currentUser.id, vehicleId: vId, placa: pl, updatedAt: new Date().toISOString() };
        setSession(s); localStorage.setItem('prime_group_session', JSON.stringify(s)); navigate('operation');
      }} onBack={() => navigate('operation')} /></React.Suspense>;
    }

    switch (currentPage) {
      case 'fueling': return <FuelingForm session={session!} user={currentUser} onBack={() => navigate('operation')} onSubmit={(f) => { saveRecord(setFuelings, f); navigate('operation'); }} />;
      case 'maintenance': return <MaintenanceForm session={session!} user={currentUser} onBack={() => navigate('operation')} onSubmit={(m) => { saveRecord(setMaintenances, m); navigate('operation'); }} />;
      case 'route': return <RouteForm session={session!} user={currentUser} drivers={users.filter(u => u.perfil === UserRole.MOTORISTA)} customers={customers} onBack={() => navigate('operation')} onSubmit={(r) => { saveRecord(setRoutes, r); navigate('operation'); }} />;
      case 'daily-route': return <DriverDailyRoute session={session!} user={currentUser} customers={customers} onBack={() => navigate('operation')} onSubmit={(dr) => { saveRecord(setDailyRoutes, dr); navigate('operation'); }} />;
      case 'helper-binding': return <HelperRouteBinding session={session!} user={currentUser} dailyRoutes={dailyRoutes} users={users} onBack={() => navigate('operation')} onBind={(rId) => { updateRecord(setDailyRoutes, rId, { ajudanteId: currentUser.id, ajudanteNome: currentUser.nome }); navigate('operation'); }} />;
      case 'select-vehicle': return <VehicleSelection vehicles={vehicles} onSelect={(vId, pl) => { const s = { userId: currentUser.id, vehicleId: vId, placa: pl, updatedAt: new Date().toISOString() }; setSession(s); localStorage.setItem('prime_group_session', JSON.stringify(s)); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'my-requests': return <MyRequests fuelings={fuelings.filter(f => f.motoristaId === currentUser.id)} maintenances={maintenances.filter(m => m.motoristaId === currentUser.id)} onBack={() => navigate('operation')} />;
      case 'my-routes': return <MyRoutes routes={dailyRoutes.filter(r => r.ajudanteId === currentUser.id)} onBack={() => navigate('operation')} />;
      
      // Admin
      case 'admin-dashboard': return <AdminDashboard fuelings={fuelings} maintenances={maintenances} vehicles={vehicles} fixedExpenses={fixedExpenses} dailyRoutes={dailyRoutes} routes={routes} agregadoFreights={agregadoFreights} tolls={tolls} onBack={() => navigate('operation')} />;
      case 'admin-pending': return <AdminPending fuelings={fuelings} maintenances={maintenances} dailyRoutes={dailyRoutes} routes={routes} vehicles={vehicles} users={users} currentUser={currentUser} onUpdateFueling={(id, up) => updateRecord(setFuelings, id, up)} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} onDeleteFueling={(id) => deleteRecord(setFuelings, id)} onDeleteMaintenance={(id) => deleteRecord(setMaintenances, id)} onDeleteDailyRoute={(id) => deleteRecord(setDailyRoutes, id)} onDeleteRoute={(id) => deleteRecord(setRoutes, id)} onBack={() => navigate('operation')} />;
      case 'user-mgmt': return <UserManagement users={users} onSaveUser={onSaveUser} onBack={() => navigate('operation')} />;
      case 'vehicle-mgmt': return <VehicleManagement vehicles={vehicles} onSaveVehicle={onSaveVehicle} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-customers': return <AdminCustomerManagement customers={customers} setCustomers={setCustomers} onBack={() => navigate('operation')} />;
      case 'admin-agregado-mgmt': return <AdminAgregadoManagement agregados={agregados} onUpdateAgregados={setAgregados} onBack={() => navigate('operation')} />;
      case 'admin-agregado-freight': return <AdminAgregadoFreight agregados={agregados} onSubmit={(f) => saveRecord(setAgregadoFreights, f)} onBack={() => navigate('operation')} />;
      case 'admin-agregado-report': return <AdminAgregadoReport freights={agregadoFreights} onBack={() => navigate('operation')} />;
      case 'admin-tolls': return <AdminTollManagement tolls={tolls} vehicles={vehicles} onUpdateTolls={setTolls} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-fixed-expenses': return <AdminFixedExpenses fixedExpenses={fixedExpenses} onUpdateExpenses={setFixedExpenses} onBack={() => navigate('operation')} />;
      case 'admin-create-route': return <AdminCreateDailyRoute users={users} vehicles={vehicles} customers={customers} onSubmit={(r) => { saveRecord(setDailyRoutes, r); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'admin-fueling': return <AdminFuelingForm vehicles={vehicles} users={users} onSubmit={(f) => { saveRecord(setFuelings, f); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'admin-preventive': return <AdminPreventiveMaintenance vehicles={vehicles} currentUser={currentUser} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onAddMaintenance={(m) => saveRecord(setMaintenances, m)} onBack={() => navigate('operation')} />;
      case 'admin-maintenance-history': return <AdminMaintenanceHistory maintenances={maintenances} users={users} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onDeleteMaintenance={(id) => deleteRecord(setMaintenances, id)} onBack={() => navigate('operation')} />;
      case 'admin-maintenance-done': return <AdminMaintenanceDone maintenances={maintenances} vehicles={vehicles} currentUser={currentUser} onAddMaintenance={(m) => saveRecord(setMaintenances, m)} onBack={() => navigate('operation')} />;
      case 'admin-tracking': return <AdminTracking vehicles={vehicles} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-driver-live': return <AdminDriverLive users={users} onBack={() => navigate('operation')} />;
      case 'admin-checklists': return <AdminChecklistReport dailyRoutes={dailyRoutes} users={users} vehicles={vehicles} onBack={() => navigate('operation')} />;
      case 'admin-consolidated-finance': return <AdminConsolidatedFinancialReport dailyRoutes={dailyRoutes} routes={routes} fuelings={fuelings} maintenances={maintenances} tolls={tolls} agregadoFreights={agregadoFreights} fixedExpenses={fixedExpenses} users={users} onBack={() => navigate('operation')} onDeleteMovement={(m) => {
        const id = m.id;
        if (id.startsWith('route-motorista-') || id.startsWith('route-ajudante-')) {
          const routeId = id.replace('route-motorista-', '').replace('route-ajudante-', '');
          updateRecord(setRoutes, routeId, { valorMotorista: 0, valorAjudante: 0 });
        } else if (id.startsWith('route-')) {
          deleteRecord(setRoutes, id.replace('route-', ''));
        } else if (id.startsWith('daily-motorista-') || id.startsWith('daily-ajudante-')) {
          const dailyId = id.replace('daily-motorista-', '').replace('daily-ajudante-', '');
          updateRecord(setDailyRoutes, dailyId, { valorMotorista: 0, valorAjudante: 0 });
        } else if (id.startsWith('daily-')) {
          deleteRecord(setDailyRoutes, id.replace('daily-', ''));
        } else if (id.startsWith('agr-p-')) {
          updateRecord(setAgregadoFreights, id.replace('agr-p-', ''), { valorAgregado: 0 });
        } else if (id.startsWith('agr-')) {
          deleteRecord(setAgregadoFreights, id.replace('agr-', ''));
        } else if (id.startsWith('fuel-')) {
          deleteRecord(setFuelings, id.replace('fuel-', ''));
        } else if (id.startsWith('maint-')) {
          deleteRecord(setMaintenances, id.replace('maint-', ''));
        } else if (id.startsWith('toll-')) {
          deleteRecord(setTolls, id.replace('toll-', ''));
        } else if (id.startsWith('fix-')) {
          deleteRecord(setFixedExpenses, id.replace('fix-', ''));
        }
      }} />;
      case 'admin-vehicle-report': return <AdminVehicleReport fuelings={fuelings} maintenances={maintenances} vehicles={vehicles} dailyRoutes={dailyRoutes} routes={routes} tolls={tolls} fixedExpenses={fixedExpenses} onBack={() => navigate('operation')} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} />;
      case 'admin-activity-report': return <AdminActivityReport dailyRoutes={dailyRoutes} routes={routes} fuelings={fuelings} maintenances={maintenances} users={users} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} onUpdateFueling={(id, up) => updateRecord(setFuelings, id, up)} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onBack={() => navigate('operation')} />;
      case 'tech-docs': return <TechnicalDocs onBack={() => navigate('operation')} />;

      default: return (
        <OperationHome 
          user={currentUser} 
          session={session} 
          fuelings={fuelings}
          maintenances={maintenances}
          dailyRoutes={dailyRoutes}
          routes={routes}
          onNavigate={navigate} 
          onLogout={handleLogout} 
        />
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('operation')}>
          <Logo size="sm" showText={false} />
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-[0.1em] text-white uppercase group-hover:text-blue-400 transition-colors">PRIME GROUP</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full pulse-emerald bg-amber-500"></span>
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Local Mode</span>
              </div>
            </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-xs font-black text-white uppercase tracking-tight">{currentUser.nome}</div>
              <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{currentUser.perfil}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-red-950/20 text-red-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-950/40 transition-all active:scale-95"
            >
              Sair
            </button>
          </div>
        )}
      </header>
      {currentUser && <DriverLocationSender user={currentUser} />}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <ErrorBoundary onRetry={() => navigate('operation')}>
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-[10px] font-black animate-pulse text-slate-600 uppercase tracking-[0.3em]">Carregando Sistemas...</div>
            </div>
          }>
            {renderPage()}
          </React.Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
