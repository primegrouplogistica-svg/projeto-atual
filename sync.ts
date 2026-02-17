/**
 * Envio e leitura de localização em tempo real dos motoristas (GPS do celular).
 * Requer tabela driver_locations no Supabase (migration 00004).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DriverLocation } from '../types';

const TABLE = 'driver_locations';

export async function pushDriverLocation(
  supabase: SupabaseClient | null,
  userId: string,
  lat: number,
  lng: number,
  accuracy?: number
): Promise<void> {
  if (!supabase) return;
  await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      lat,
      lng,
      accuracy: accuracy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

export async function fetchDriverLocations(
  supabase: SupabaseClient | null
): Promise<DriverLocation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, lat, lng, accuracy, updated_at')
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    accuracy: row.accuracy != null ? Number(row.accuracy) : undefined,
    updatedAt: row.updated_at,
  }));
}

export function subscribeDriverLocations(
  supabase: SupabaseClient | null,
  onPayload: (locations: DriverLocation[]) => void
): () => void {
  if (!supabase) return () => {};
  const fetch = () => fetchDriverLocations(supabase).then(onPayload);
  fetch();
  const channel = supabase
    .channel('driver_locations_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      fetch();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
