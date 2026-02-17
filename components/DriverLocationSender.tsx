import React from 'react';
import type { User } from '../types';

interface DriverLocationSenderProps {
  user: User | null;
}

/**
 * Componente placeholder: a funcionalidade de envio de localização em tempo real
 * foi desativada porque a integração com Supabase foi removida.
 *
 * Mantemos o componente para não quebrar o layout nem os imports.
 */
export const DriverLocationSender: React.FC<DriverLocationSenderProps> = () => {
  return null;
};
