import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { supabase, isSupabaseOnline } from './supabase';
import { loadAllFromSupabase, syncAllToSupabase, deleteUserFromSupabase, deleteAgregadoFromSupabase, deleteCustomerFromSupabase, deleteFuelingFromSupabase, deleteMaintenanceFromSupabase, deleteDailyRouteFromSupabase, deleteRouteFromSupabase, deleteTollFromSupabase, deleteFixedExpenseFromSupabase, deleteAgregadoFreightFromSupabase } from './supabase/sync';
import { RefreshCw } from 'lucide-react';
import AdminFuelingForm from './pages/AdminFuelingForm';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('login');

  const [users, setUsers] = useState<User[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_users') : null;
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_vehicles') : null;
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_customers') : null;
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [fuelings, setFuelings] = useState<Fueling[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_fuelings') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenances, setMaintenances] = useState<MaintenanceRequest[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_maintenances') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [routes, setRoutes] = useState<RouteDeparture[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_routes') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyRoutes, setDailyRoutes] = useState<DailyRoute[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_daily_routes') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_fixed_expenses') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [agregados, setAgregados] = useState<Agregado[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_agregados') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [agregadoFreights, setAgregadoFreights] = useState<AgregadoFreight[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_agregado_freights') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [tolls, setTolls] = useState<Toll[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pg_tolls') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const placasAntonioSet = useMemo(() => {
    return new Set(
      (vehicles || [])
        .filter(v => v.faturamentoAntonio)
        .map(v => (v.placa || '').toUpperCase())
        .filter(Boolean)
    );
  }, [vehicles]);
  const placasAntonio = useMemo(() => Array.from(placasAntonioSet.values()), [placasAntonioSet]);
  const isAntonioPlaca = useCallback((placa?: string) => {
    if (!placa) return false;
    return placasAntonioSet.has(placa.toUpperCase());
  }, [placasAntonioSet]);

  const routesGeral = useMemo(() => routes.filter(r => !isAntonioPlaca(r.placa)), [routes, isAntonioPlaca]);
  const routesAntonio = useMemo(() => routes.filter(r => isAntonioPlaca(r.placa)), [routes, isAntonioPlaca]);
  const dailyRoutesGeral = useMemo(() => dailyRoutes.filter(r => !isAntonioPlaca(r.placa)), [dailyRoutes, isAntonioPlaca]);
  const dailyRoutesAntonio = useMemo(() => dailyRoutes.filter(r => isAntonioPlaca(r.placa)), [dailyRoutes, isAntonioPlaca]);
  const fuelingsGeral = useMemo(() => fuelings.filter(f => !isAntonioPlaca(f.placa)), [fuelings, isAntonioPlaca]);
  const fuelingsAntonio = useMemo(() => fuelings.filter(f => isAntonioPlaca(f.placa)), [fuelings, isAntonioPlaca]);
  const maintenancesGeral = useMemo(() => maintenances.filter(m => !isAntonioPlaca(m.placa)), [maintenances, isAntonioPlaca]);
  const maintenancesAntonio = useMemo(() => maintenances.filter(m => isAntonioPlaca(m.placa)), [maintenances, isAntonioPlaca]);
  const tollsGeral = useMemo(() => tolls.filter(t => !isAntonioPlaca(t.placa)), [tolls, isAntonioPlaca]);
  const tollsAntonio = useMemo(() => tolls.filter(t => isAntonioPlaca(t.placa)), [tolls, isAntonioPlaca]);
  const agregadoFreightsGeral = useMemo(() => agregadoFreights.filter(a => !isAntonioPlaca(a.placa)), [agregadoFreights, isAntonioPlaca]);
  const agregadoFreightsAntonio = useMemo(() => agregadoFreights.filter(a => isAntonioPlaca(a.placa)), [agregadoFreights, isAntonioPlaca]);

  const [dbOnline, setDbOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const applyLoadedData = useCallback((data: Awaited<ReturnType<typeof loadAllFromSupabase>>) => {
    if (!data) return;
    const uniqById = <T extends { id?: string }>(list: T[]) => {
      const seen = new Set<string>();
      return list.filter((item) => {
        if (!item?.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };
    const mergeById = <T extends { id?: string }>(prev: T[], incoming: T[]) => {
      const byId = new Map<string, T>();
      uniqById(incoming).forEach((item) => {
        if (item?.id) byId.set(item.id, item);
      });
      prev.forEach((item) => {
        if (!item?.id) return;
        if (!byId.has(item.id)) byId.set(item.id, item);
      });
      return Array.from(byId.values());
    };
    const mergeAgregadoFreights = (prev: AgregadoFreight[], incoming: AgregadoFreight[]) => {
      const byId = new Map<string, AgregadoFreight>();
      uniqById(incoming).forEach((item) => {
        if (item?.id) byId.set(item.id, item);
      });
      prev.forEach((item) => {
        if (!item?.id) return;
        const existing = byId.get(item.id);
        if (!existing) {
          byId.set(item.id, item);
          return;
        }
        byId.set(item.id, {
          ...existing,
          rota: existing.rota?.trim() ? existing.rota : item.rota
        });
      });
      return Array.from(byId.values());
    };
    const supabaseVazio =
      !data.users.length && !data.vehicles.length && !data.customers.length &&
      !data.fuelings.length && !data.maintenances.length && !data.routes.length &&
      !data.dailyRoutes.length && !data.fixedExpenses.length && !data.agregados.length &&
      !data.agregadoFreights.length && !data.tolls.length;
    if (!supabaseVazio) {
      setUsers(data.users);
      setVehicles(data.vehicles);
      setCustomers(data.customers);
      setFuelings(data.fuelings);
      setMaintenances(data.maintenances);
      setRoutes(data.routes);
      setDailyRoutes(data.dailyRoutes);
      setFixedExpenses(data.fixedExpenses);
      setAgregados((prev) => mergeById(prev, data.agregados));
      setAgregadoFreights((prev) => mergeAgregadoFreights(prev, data.agregadoFreights));
      setTolls(data.tolls);
    }
    setDbOnline(true);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    loadAllFromSupabase(supabase)
      .then((data) => {
        applyLoadedData(data);
      })
      .catch((err) => {
        console.error('[Prime] Erro ao conectar no Supabase:', err?.message || err);
        setDbOnline(false);
      });
  }, [applyLoadedData]);

  const refreshData = useCallback(() => {
    if (!supabase || isRefreshing) return;
    setIsRefreshing(true);
    loadAllFromSupabase(supabase)
      .then((data) => {
        applyLoadedData(data);
      })
      .catch((err) => {
        console.error('[Prime] Erro ao sincronizar:', err?.message || err);
        setDbOnline(false);
      })
      .finally(() => setIsRefreshing(false));
  }, [applyLoadedData, isRefreshing]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    if (supabase && dbOnline) {
      syncAllToSupabase(supabase, {
        users, vehicles, customers, fuelings, maintenances,
        routes, dailyRoutes, fixedExpenses, agregados, agregadoFreights, tolls
      });
    }
  }, [users, vehicles, customers, fuelings, maintenances, routes, dailyRoutes, fixedExpenses, agregados, agregadoFreights, tolls, dbOnline]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUser) return;
    const savedUserId = localStorage.getItem('prime_group_user_id');
    const savedSession = localStorage.getItem('prime_group_session');
    if (savedUserId && users.length) {
      const user = users.find(u => u.id === savedUserId);
      if (user && user.ativo) {
        setCurrentUser(user);
        if (savedSession) try { setSession(JSON.parse(savedSession)); } catch { /* ignora */ }
        setCurrentPage('operation');
      }
    }
  }, [users, currentUser]);

  const navigate = (page: string) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') localStorage.setItem('prime_group_user_id', user.id);
    navigate('operation');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prime_group_user_id');
      localStorage.removeItem('prime_group_session');
    }
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
  const AdminTeamReport = React.lazy(() => import('./pages/AdminTeamReport'));
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
  const AdminPreventiveMaintenance = React.lazy(() => import('./pages/AdminPreventiveMaintenance'));
  const AdminAgregadoReport = React.lazy(() => import('./pages/AdminAgregadoReport'));
  const AdminMaintenanceHistory = React.lazy(() => import('./pages/AdminMaintenanceHistory'));
  const AdminMaintenanceDone = React.lazy(() => import('./pages/AdminMaintenanceDone'));
  const FuelingRegistry = React.lazy(() => import('./pages/FuelingRegistry'));
  const HelperRouteBinding = React.lazy(() => import('./pages/HelperRouteBinding'));
  const TechnicalDocs = React.lazy(() => import('./pages/TechnicalDocs'));

  const renderPage = () => {
    if (!currentUser) {
      return (
        <React.Suspense fallback={null}>
          <Login onLogin={handleLogin} users={users} syncStatus={isSupabaseOnline() && dbOnline ? 'online' : 'ok'} />
        </React.Suspense>
      );
    }

    const isOp = currentUser.perfil === UserRole.MOTORISTA || currentUser.perfil === UserRole.AJUDANTE;
    if (isOp && ['fueling', 'maintenance', 'route', 'daily-route', 'helper-binding'].includes(currentPage) && !session) {
      return (
        <React.Suspense fallback={null}>
          <VehicleSelection
            vehicles={vehicles}
            onSelect={(vId, pl) => {
              const s = { userId: currentUser.id, vehicleId: vId, placa: pl, updatedAt: new Date().toISOString() };
              setSession(s);
              if (typeof window !== 'undefined') localStorage.setItem('prime_group_session', JSON.stringify(s));
              navigate('operation');
            }}
            onBack={() => navigate('operation')}
          />
        </React.Suspense>
      );
    }

    switch (currentPage) {
      case 'fueling':
        return <FuelingForm session={session!} user={currentUser} onBack={() => navigate('operation')} onSubmit={(f) => { saveRecord(setFuelings, f); navigate('operation'); }} />;
      case 'maintenance':
        return <MaintenanceForm session={session!} user={currentUser} onBack={() => navigate('operation')} onSubmit={(m) => { saveRecord(setMaintenances, m); navigate('operation'); }} />;
      case 'route':
        return <RouteForm session={session!} user={currentUser} drivers={users.filter(u => u.perfil === UserRole.MOTORISTA)} customers={customers} onBack={() => navigate('operation')} onSubmit={(r) => { saveRecord(setRoutes, r); navigate('operation'); }} />;
      case 'daily-route':
        return <DriverDailyRoute session={session!} user={currentUser} customers={customers} onBack={() => navigate('operation')} onSubmit={(dr) => { saveRecord(setDailyRoutes, dr); navigate('operation'); }} />;
      case 'helper-binding':
        return <HelperRouteBinding session={session!} user={currentUser} dailyRoutes={dailyRoutes} users={users} onBack={() => navigate('operation')} onBind={(rId) => { updateRecord(setDailyRoutes, rId, { ajudanteId: currentUser.id, ajudanteNome: currentUser.nome }); navigate('operation'); }} />;
      case 'select-vehicle':
        return <VehicleSelection vehicles={vehicles} onSelect={(vId, pl) => { const s = { userId: currentUser.id, vehicleId: vId, placa: pl, updatedAt: new Date().toISOString() }; setSession(s); if (typeof window !== 'undefined') localStorage.setItem('prime_group_session', JSON.stringify(s)); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'my-requests':
        return <MyRequests fuelings={fuelings.filter(f => f.motoristaId === currentUser.id)} maintenances={maintenances.filter(m => m.motoristaId === currentUser.id)} onBack={() => navigate('operation')} />;
      case 'my-routes':
        return <MyRoutes routes={dailyRoutes.filter(r => r.ajudanteId === currentUser.id)} onBack={() => navigate('operation')} />;
      case 'admin-dashboard':
        return <AdminDashboard fuelings={fuelingsGeral} maintenances={maintenancesGeral} vehicles={vehicles} fixedExpenses={fixedExpenses} dailyRoutes={dailyRoutesGeral} routes={routesGeral} agregadoFreights={agregadoFreightsGeral} tolls={tollsGeral} onBack={() => navigate('operation')} />;
      case 'admin-pending':
        return <AdminPending fuelings={fuelings} maintenances={maintenances} dailyRoutes={dailyRoutes} routes={routes} vehicles={vehicles} users={users} currentUser={currentUser} onUpdateFueling={(id, up) => updateRecord(setFuelings, id, up)} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} onDeleteFueling={async (id) => { if (supabase) await deleteFuelingFromSupabase(supabase, id); deleteRecord(setFuelings, id); }} onDeleteMaintenance={async (id) => { if (supabase) await deleteMaintenanceFromSupabase(supabase, id); deleteRecord(setMaintenances, id); }} onDeleteDailyRoute={async (id) => { if (supabase) await deleteDailyRouteFromSupabase(supabase, id); deleteRecord(setDailyRoutes, id); }} onDeleteRoute={async (id) => { if (supabase) await deleteRouteFromSupabase(supabase, id); deleteRecord(setRoutes, id); }} onBack={() => navigate('operation')} />;
      case 'user-mgmt':
        return <UserManagement users={users} onSaveUser={onSaveUser} onDeleteUser={async (id) => { if (supabase) await deleteUserFromSupabase(supabase, id); setUsers(prev => prev.filter(u => u.id !== id)); }} onBack={() => navigate('operation')} />;
      case 'vehicle-mgmt':
        return <VehicleManagement vehicles={vehicles} onSaveVehicle={onSaveVehicle} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-customers':
        return <AdminCustomerManagement customers={customers} setCustomers={setCustomers} onDeleteCustomer={async (id) => { if (supabase) await deleteCustomerFromSupabase(supabase, id); setCustomers(prev => prev.filter(c => c.id !== id)); }} onBack={() => navigate('operation')} />;
      case 'admin-agregado-mgmt':
        return <AdminAgregadoManagement agregados={agregados} onUpdateAgregados={setAgregados} onDeleteAgregado={async (id) => { if (supabase) await deleteAgregadoFromSupabase(supabase, id); setAgregados(prev => prev.filter(a => a.id !== id)); }} onBack={() => navigate('operation')} />;
      case 'admin-agregado-freight':
        return <AdminAgregadoFreight agregados={agregados} onSubmit={(f) => saveRecord(setAgregadoFreights, f)} onBack={() => navigate('operation')} />;
      case 'admin-agregado-report':
        return <AdminAgregadoReport freights={agregadoFreights} onBack={() => navigate('operation')} />;
      case 'admin-tolls':
        return <AdminTollManagement tolls={tolls} vehicles={vehicles} onUpdateTolls={setTolls} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-fixed-expenses':
        return <AdminFixedExpenses fixedExpenses={fixedExpenses} onUpdateExpenses={setFixedExpenses} onBack={() => navigate('operation')} />;
      case 'admin-create-route':
        return <AdminCreateDailyRoute users={users} vehicles={vehicles} customers={customers} onSubmit={(r) => { saveRecord(setDailyRoutes, r); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'admin-fueling':
        return <AdminFuelingForm vehicles={vehicles} users={users} onSubmit={(f) => { saveRecord(setFuelings, f); navigate('operation'); }} onBack={() => navigate('operation')} />;
      case 'admin-fueling-registry':
        return <FuelingRegistry fuelings={fuelings} users={users} onBack={() => navigate('operation')} />;
      case 'admin-preventive':
        return <AdminPreventiveMaintenance vehicles={vehicles} currentUser={currentUser} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onAddMaintenance={(m) => saveRecord(setMaintenances, m)} onBack={() => navigate('operation')} />;
      case 'admin-maintenance-history':
        return <AdminMaintenanceHistory maintenances={maintenances} users={users} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onDeleteMaintenance={async (id) => { if (supabase) await deleteMaintenanceFromSupabase(supabase, id); deleteRecord(setMaintenances, id); }} onBack={() => navigate('operation')} />;
      case 'admin-maintenance-done':
        return <AdminMaintenanceDone maintenances={maintenances} vehicles={vehicles} currentUser={currentUser} onAddMaintenance={(m) => saveRecord(setMaintenances, m)} onBack={() => navigate('operation')} />;
      case 'admin-tracking':
        return <AdminTracking vehicles={vehicles} onUpdateVehicle={(id, up) => updateRecord(setVehicles, id, up)} onBack={() => navigate('operation')} />;
      case 'admin-driver-live':
        return <AdminDriverLive users={users} onBack={() => navigate('operation')} />;
      case 'admin-checklists':
        return <AdminChecklistReport dailyRoutes={dailyRoutes} users={users} vehicles={vehicles} onBack={() => navigate('operation')} />;
      case 'admin-payments-team':
        return <AdminTeamReport dailyRoutes={dailyRoutes} routes={routes} users={users} onBack={() => navigate('operation')} />;
      case 'admin-consolidated-finance':
        return <AdminConsolidatedFinancialReport dailyRoutes={dailyRoutesGeral} routes={routesGeral} fuelings={fuelingsGeral} maintenances={maintenancesGeral} tolls={tollsGeral} agregadoFreights={agregadoFreightsGeral} fixedExpenses={fixedExpenses} users={users} onBack={() => navigate('operation')} onDeleteMovement={async (m) => {
          const id = m.id;
          if (id.startsWith('route-motorista-') || id.startsWith('route-ajudante-')) { const routeId = id.replace('route-motorista-', '').replace('route-ajudante-', ''); updateRecord(setRoutes, routeId, { valorMotorista: 0, valorAjudante: 0 }); }
          else if (id.startsWith('route-')) { const rid = id.replace('route-', ''); if (supabase) await deleteRouteFromSupabase(supabase, rid); deleteRecord(setRoutes, rid); }
          else if (id.startsWith('daily-motorista-') || id.startsWith('daily-ajudante-')) { const dailyId = id.replace('daily-motorista-', '').replace('daily-ajudante-', ''); updateRecord(setDailyRoutes, dailyId, { valorMotorista: 0, valorAjudante: 0 }); }
          else if (id.startsWith('daily-')) { const did = id.replace('daily-', ''); if (supabase) await deleteDailyRouteFromSupabase(supabase, did); deleteRecord(setDailyRoutes, did); }
          else if (id.startsWith('agr-p-')) updateRecord(setAgregadoFreights, id.replace('agr-p-', ''), { valorAgregado: 0 });
          else if (id.startsWith('agr-')) { const aid = id.replace('agr-', ''); if (supabase) await deleteAgregadoFreightFromSupabase(supabase, aid); deleteRecord(setAgregadoFreights, aid); }
          else if (id.startsWith('fuel-')) { const fid = id.replace('fuel-', ''); if (supabase) await deleteFuelingFromSupabase(supabase, fid); deleteRecord(setFuelings, fid); }
          else if (id.startsWith('maint-')) { const mid = id.replace('maint-', ''); if (supabase) await deleteMaintenanceFromSupabase(supabase, mid); deleteRecord(setMaintenances, mid); }
          else if (id.startsWith('toll-')) { const tid = id.replace('toll-', ''); if (supabase) await deleteTollFromSupabase(supabase, tid); deleteRecord(setTolls, tid); }
          else if (id.startsWith('fix-')) { const fid = id.replace('fix-', ''); if (supabase) await deleteFixedExpenseFromSupabase(supabase, fid); deleteRecord(setFixedExpenses, fid); }
        }} />;
      case 'admin-consolidated-finance-antonio':
        return <AdminConsolidatedFinancialReport
          dailyRoutes={dailyRoutesAntonio}
          routes={routesAntonio}
          fuelings={fuelingsAntonio}
          maintenances={maintenancesAntonio}
          tolls={tollsAntonio}
          agregadoFreights={agregadoFreightsAntonio}
          fixedExpenses={[]}
          users={users}
          title="Faturamento Antonio"
          placasInfo={placasAntonio}
          onBack={() => navigate('operation')}
        />;
      case 'admin-vehicle-report':
        return <AdminVehicleReport fuelings={fuelings} maintenances={maintenances} vehicles={vehicles} dailyRoutes={dailyRoutes} routes={routes} tolls={tolls} fixedExpenses={fixedExpenses} onBack={() => navigate('operation')} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} />;
      case 'admin-activity-report':
        return <AdminActivityReport dailyRoutes={dailyRoutes} routes={routes} fuelings={fuelings} maintenances={maintenances} users={users} onUpdateDailyRoute={(id, up) => updateRecord(setDailyRoutes, id, up)} onUpdateRoute={(id, up) => updateRecord(setRoutes, id, up)} onUpdateFueling={(id, up) => updateRecord(setFuelings, id, up)} onUpdateMaintenance={(id, up) => updateRecord(setMaintenances, id, up)} onBack={() => navigate('operation')} />;
      case 'tech-docs':
        return <TechnicalDocs onBack={() => navigate('operation')} />;
      default:
        return <OperationHome user={currentUser} session={session} fuelings={fuelings} maintenances={maintenances} dailyRoutes={dailyRoutes} routes={routes} onNavigate={navigate} onLogout={handleLogout} />;
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
              <span className={`w-1 h-1 rounded-full pulse-emerald ${isSupabaseOnline() && dbOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{isSupabaseOnline() && dbOnline ? 'Online' : 'Local Mode'}</span>
            </div>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2 md:gap-4">
            {supabase && (
              <button onClick={refreshData} disabled={isRefreshing} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 text-slate-200 transition-all active:scale-95" title="Buscar dados novos do servidor">
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            )}
            <div className="hidden md:block text-right">
              <div className="text-xs font-black text-white uppercase tracking-tight">{currentUser.nome}</div>
              <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{currentUser.perfil}</div>
            </div>
            <button onClick={handleLogout} className="bg-red-950/20 text-red-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-950/40 transition-all active:scale-95">Sair</button>
          </div>
        )}
      </header>
      {currentUser && <DriverLocationSender user={currentUser} />}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <ErrorBoundary onRetry={() => navigate('operation')}>
          <React.Suspense fallback={<div className="flex flex-col items-center justify-center h-[60vh] gap-4"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><div className="text-[10px] font-black animate-pulse text-slate-600 uppercase tracking-[0.3em]">Carregando Sistemas...</div></div>}>
            {renderPage()}
          </React.Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
