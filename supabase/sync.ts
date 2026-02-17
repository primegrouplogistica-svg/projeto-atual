/**
 * Carrega todos os dados do Supabase e sincroniza o estado do app com o banco.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapUserFromDb,
  mapUserToDb,
  mapVehicleFromDb,
  mapVehicleToDb,
  mapCustomerFromDb,
  mapCustomerToDb,
  mapAgregadoFromDb,
  mapAgregadoToDb,
  mapFixedExpenseFromDb,
  mapFixedExpenseToDb,
  mapFuelingFromDb,
  mapFuelingToDb,
  mapMaintenanceFromDb,
  mapMaintenanceToDb,
  mapDailyRouteFromDb,
  mapDailyRouteToDb,
  mapRouteDepartureFromDb,
  mapRouteDepartureToDb,
  mapAgregadoFreightFromDb,
  mapAgregadoFreightToDb,
  mapTollFromDb,
  mapTollToDb
} from './dbMaps';

export interface AllData {
  users: any[];
  vehicles: any[];
  customers: any[];
  fuelings: any[];
  maintenances: any[];
  dailyRoutes: any[];
  routes: any[];
  fixedExpenses: any[];
  agregados: any[];
  agregadoFreights: any[];
  tolls: any[];
}

export async function loadAllFromSupabase(supabase: SupabaseClient): Promise<AllData | null> {
  try {
    const [
      usersRes,
      vehiclesRes,
      customersRes,
      fuelingsRes,
      maintenancesRes,
      dailyRoutesRes,
      routesRes,
      fixedExpensesRes,
      agregadosRes,
      agregadoFreightsRes,
      tollsRes
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('fuelings').select('*'),
      supabase.from('maintenance_requests').select('*'),
      supabase.from('daily_routes').select('*'),
      supabase.from('route_departures').select('*'),
      supabase.from('fixed_expenses').select('*'),
      supabase.from('agregados').select('*'),
      supabase.from('agregado_freights').select('*'),
      supabase.from('tolls').select('*')
    ]);

    if (usersRes.error) throw usersRes.error;
    if (vehiclesRes.error) throw vehiclesRes.error;
    if (customersRes.error) throw customersRes.error;
    if (fuelingsRes.error) throw fuelingsRes.error;
    if (maintenancesRes.error) throw maintenancesRes.error;
    if (dailyRoutesRes.error) throw dailyRoutesRes.error;
    if (routesRes.error) throw routesRes.error;
    if (fixedExpensesRes.error) throw fixedExpensesRes.error;
    if (agregadosRes.error) throw agregadosRes.error;
    if (agregadoFreightsRes.error) throw agregadoFreightsRes.error;
    if (tollsRes.error) throw tollsRes.error;

    return {
      users: (usersRes.data ?? []).map(mapUserFromDb).filter(Boolean),
      vehicles: (vehiclesRes.data ?? []).map(mapVehicleFromDb).filter(Boolean),
      customers: (customersRes.data ?? []).map(mapCustomerFromDb).filter(Boolean),
      fuelings: (fuelingsRes.data ?? []).map(mapFuelingFromDb).filter(Boolean),
      maintenances: (maintenancesRes.data ?? []).map(mapMaintenanceFromDb).filter(Boolean),
      dailyRoutes: (dailyRoutesRes.data ?? []).map(mapDailyRouteFromDb).filter(Boolean),
      routes: (routesRes.data ?? []).map(mapRouteDepartureFromDb).filter(Boolean),
      fixedExpenses: (fixedExpensesRes.data ?? []).map(mapFixedExpenseFromDb).filter(Boolean),
      agregados: (agregadosRes.data ?? []).map(mapAgregadoFromDb).filter(Boolean),
      agregadoFreights: (agregadoFreightsRes.data ?? []).map(mapAgregadoFreightFromDb).filter(Boolean),
      tolls: (tollsRes.data ?? []).map(mapTollFromDb).filter(Boolean)
    };
  } catch (e) {
    console.error('loadAllFromSupabase:', e);
    throw e;
  }
}

export async function syncAllToSupabase(supabase: SupabaseClient, data: AllData): Promise<void> {
  try {
    await Promise.all([
      data.users.length ? supabase.from('users').upsert(data.users.map(mapUserToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.vehicles.length ? supabase.from('vehicles').upsert(data.vehicles.map(mapVehicleToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.customers.length ? supabase.from('customers').upsert(data.customers.map(mapCustomerToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.fuelings.length ? supabase.from('fuelings').upsert(data.fuelings.map(mapFuelingToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.maintenances.length ? supabase.from('maintenance_requests').upsert(data.maintenances.map(mapMaintenanceToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.dailyRoutes.length ? supabase.from('daily_routes').upsert(data.dailyRoutes.map(mapDailyRouteToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.routes.length ? supabase.from('route_departures').upsert(data.routes.map(mapRouteDepartureToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.fixedExpenses.length ? supabase.from('fixed_expenses').upsert(data.fixedExpenses.map(mapFixedExpenseToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.agregados.length ? supabase.from('agregados').upsert(data.agregados.map(mapAgregadoToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.agregadoFreights.length ? supabase.from('agregado_freights').upsert(data.agregadoFreights.map(mapAgregadoFreightToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.tolls.length ? supabase.from('tolls').upsert(data.tolls.map(mapTollToDb), { onConflict: 'id' }) : Promise.resolve({ error: null })
    ]);
  } catch (e) {
    console.error('syncAllToSupabase:', e);
  }
}
