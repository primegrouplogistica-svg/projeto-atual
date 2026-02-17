/**
 * Envia a localização do celular do motorista para o Supabase em tempo real.
 * Só atua quando o usuário logado é motorista e o Supabase está configurado.
 */

import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { pushDriverLocation } from '../supabase/driverLocation';
import { User, UserRole } from '../types';

const INTERVAL_MS = 25 * 1000; // 25 segundos (economia de bateria)

interface DriverLocationSenderProps {
  user: User | null;
}

export const DriverLocationSender: React.FC<DriverLocationSenderProps> = ({ user }) => {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || user.perfil !== UserRole.MOTORISTA || !supabase) return;
    if (!('geolocation' in navigator)) return;

    const sendPosition = (position: GeolocationPosition) => {
      pushDriverLocation(
        supabase,
        user.id,
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? undefined
      );
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('[DriverLocation] Erro ao obter localização:', err.message);
    };

    // Usar getCurrentPosition em intervalo para economizar bateria
    const tick = () => {
      navigator.geolocation.getCurrentPosition(sendPosition, onError, {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      });
    };

    // Primeira posição após permissão
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendPosition(pos);
        intervalRef.current = setInterval(tick, INTERVAL_MS);
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, user?.perfil]);

  return null;
};
