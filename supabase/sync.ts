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
  mapTollToDb,
  mapTicketFromDb,
  mapTicketToDb
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
  tickets: any[];
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
      tollsRes,
      ticketsRes
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
      supabase.from('tolls').select('*'),
      supabase.from('tickets').select('*')
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
    if (ticketsRes.error) throw ticketsRes.error;

    return {
      users: (usersRes.data ?? []).filter((row: any) => !row.excluido).map(mapUserFromDb).filter(Boolean),
      vehicles: (vehiclesRes.data ?? []).map(mapVehicleFromDb).filter(Boolean),
      customers: (customersRes.data ?? []).filter((row: any) => !row.excluido).map(mapCustomerFromDb).filter(Boolean),
      fuelings: (fuelingsRes.data ?? []).map(mapFuelingFromDb).filter(Boolean),
      maintenances: (maintenancesRes.data ?? []).map(mapMaintenanceFromDb).filter(Boolean),
      dailyRoutes: (dailyRoutesRes.data ?? []).map(mapDailyRouteFromDb).filter(Boolean),
      routes: (routesRes.data ?? []).map(mapRouteDepartureFromDb).filter(Boolean),
      fixedExpenses: (fixedExpensesRes.data ?? []).map(mapFixedExpenseFromDb).filter(Boolean),
      agregados: (agregadosRes.data ?? []).map(mapAgregadoFromDb).filter(Boolean),
      agregadoFreights: (agregadoFreightsRes.data ?? []).map(mapAgregadoFreightFromDb).filter(Boolean),
      tolls: (tollsRes.data ?? []).map(mapTollFromDb).filter(Boolean),
      tickets: (ticketsRes.data ?? []).map(mapTicketFromDb).filter(Boolean)
    };
  } catch (e) {
    console.error('loadAllFromSupabase:', e);
    throw e;
  }
}

export async function syncAllToSupabase(supabase: SupabaseClient, data: AllData): Promise<void> {
  try {
    // Para agregado_freights: remover do Supabase os que não estão no estado local
    // (evita que lançamentos excluídos voltem por race condition no sync)
    const idsToKeep = new Set(data.agregadoFreights.map((f: any) => f.id).filter(Boolean));
    const { data: existingRows } = await supabase.from('agregado_freights').select('id');
    const idsToRemove = (existingRows ?? []).map((r: any) => r.id).filter((id: string) => !idsToKeep.has(id));
    if (idsToRemove.length > 0) {
      await Promise.all(idsToRemove.map((id: string) => supabase.from('agregado_freights').delete().eq('id', id)));
    }

    const results = await Promise.all([
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
      data.tolls.length ? supabase.from('tolls').upsert(data.tolls.map(mapTollToDb), { onConflict: 'id' }) : Promise.resolve({ error: null }),
      data.tickets.length ? supabase.from('tickets').upsert(data.tickets.map(mapTicketToDb), { onConflict: 'id' }) : Promise.resolve({ error: null })
    ]);
    const labels = [
      'users',
      'vehicles',
      'customers',
      'fuelings',
      'maintenance_requests',
      'daily_routes',
      'route_departures',
      'fixed_expenses',
      'agregados',
      'agregado_freights',
      'tolls',
      'tickets'
    ];
    results.forEach((res: any, idx: number) => {
      if (res?.error) {
        console.error(`[Prime] Supabase sync error (${labels[idx]}):`, res.error?.message || res.error);
      }
    });
  } catch (e) {
    console.error('syncAllToSupabase:', e);
  }
}

/** Soft delete: marca excluido=true (FK constraints impedem DELETE fisico em users/customers) */
export async function deleteUserFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('users').update({ excluido: true }).eq('id', id);
  if (error) console.error('deleteUserFromSupabase:', error);
}

export async function deleteAgregadoFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('agregados').delete().eq('id', id);
  if (error) console.error('deleteAgregadoFromSupabase:', error);
}

/** Soft delete: marca excluido=true (FK constraints impedem DELETE fisico) */
export async function deleteCustomerFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('customers').update({ excluido: true }).eq('id', id);
  if (error) console.error('deleteCustomerFromSupabase:', error);
}

/** Remove do Supabase (central de pendências / histórico) */
export async function deleteFuelingFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('fuelings').delete().eq('id', id);
  if (error) console.error('deleteFuelingFromSupabase:', error);
}

export async function deleteMaintenanceFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id);
  if (error) console.error('deleteMaintenanceFromSupabase:', error);
}

export async function deleteDailyRouteFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('daily_routes').delete().eq('id', id);
  if (error) console.error('deleteDailyRouteFromSupabase:', error);
}

export async function deleteRouteFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('route_departures').delete().eq('id', id);
  if (error) console.error('deleteRouteFromSupabase:', error);
}

export async function deleteTollFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('tolls').delete().eq('id', id);
  if (error) console.error('deleteTollFromSupabase:', error);
}

export async function deleteFixedExpenseFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) console.error('deleteFixedExpenseFromSupabase:', error);
}

export async function deleteAgregadoFreightFromSupabase(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from('agregado_freights').delete().eq('id', id);
  if (error) {
    console.error('deleteAgregadoFreightFromSupabase:', error);
    return false;
  }
  return true;
}

export async function deleteTicketFromSupabase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) console.error('deleteTicketFromSupabase:', error);
}

