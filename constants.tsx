
import { User, UserRole, Vehicle, VehicleStatus, Customer } from './types';

export const INITIAL_USERS: User[] = [
  { id: '00000000-0000-0000-0000-000000000001', nome: 'Guilherme', email: 'guilherme@prime.com', senha: 'prime123', perfil: UserRole.ADMIN, ativo: true },
  { id: '00000000-0000-0000-0000-000000000002', nome: 'Danilo', email: 'danilo@prime.com', senha: 'prime123', perfil: UserRole.ADMIN, ativo: true },
  { id: '00000000-0000-0000-0000-000000000003', nome: 'João Pinheiro', email: 'joao@prime.com', senha: '123', perfil: UserRole.MOTORISTA, ativo: true },
  { id: '00000000-0000-0000-0000-000000000004', nome: 'José Clemente', email: 'jose@prime.com', senha: '123', perfil: UserRole.MOTORISTA, ativo: true },
  { id: '00000000-0000-0000-0000-000000000005', nome: 'Carlos Eduardo', email: 'carlos@prime.com', senha: '123', perfil: UserRole.MOTORISTA, ativo: true },
  { id: '00000000-0000-0000-0000-000000000006', nome: 'Sérgio Medeiros', email: 'sergio@prime.com', senha: '123', perfil: UserRole.MOTORISTA, ativo: true },
  { id: '00000000-0000-0000-0000-000000000007', nome: 'André Luiz', email: 'andre@prime.com', senha: '123', perfil: UserRole.MOTORISTA, ativo: true },
  { id: '00000000-0000-0000-0000-000000000008', nome: 'Renan', email: 'renan@prime.com', senha: '123', perfil: UserRole.AJUDANTE, ativo: true },
  { id: '00000000-0000-0000-0000-000000000009', nome: 'Junior', email: 'junior@prime.com', senha: '123', perfil: UserRole.AJUDANTE, ativo: true },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: '11111111-1111-1111-1111-111111111111', placa: 'LQB2B76', modelo: 'Mercedes-Benz Atego', kmAtual: 154200, status: VehicleStatus.RODANDO, proximaManutencaoKm: 160000 },
  { id: '11111111-1111-1111-1111-111111111112', placa: 'LUX9A15', modelo: 'Volvo FH 540', kmAtual: 89000, status: VehicleStatus.RODANDO, proximaManutencaoKm: 95000 },
  { id: '11111111-1111-1111-1111-111111111113', placa: 'INZ6I09', modelo: 'Scania R450', kmAtual: 210000, status: VehicleStatus.MANUTENCAO, proximaManutencaoKm: 210500 },
  { id: '11111111-1111-1111-1111-111111111114', placa: 'KVN8790', modelo: 'Volkswagen Constellation', kmAtual: 125600, status: VehicleStatus.RODANDO, proximaManutencaoKm: 130000 },
  { id: '11111111-1111-1111-1111-111111111115', placa: 'DLA3I85', modelo: 'Iveco Stralis', kmAtual: 340000, status: VehicleStatus.PARADO, proximaManutencaoKm: 345000 },
  { id: '11111111-1111-1111-1111-111111111116', placa: 'LNN4760', modelo: 'Ford Cargo', kmAtual: 45000, status: VehicleStatus.RODANDO, proximaManutencaoKm: 50000 },
  { id: '11111111-1111-1111-1111-111111111117', placa: 'LNX4C34', modelo: 'Mercedes-Benz Axor', kmAtual: 178000, status: VehicleStatus.RODANDO, proximaManutencaoKm: 185000 },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '22222222-2222-2222-2222-222222222221', nome: 'Frigocopa', ativo: true },
  { id: '22222222-2222-2222-2222-222222222222', nome: 'King Ouro', ativo: true },
  { id: '22222222-2222-2222-2222-222222222223', nome: 'Ortobom', ativo: true },
];

export const APP_THEME = {
  primary: 'bg-blue-900',
  secondary: 'bg-slate-900',
  accent: 'text-blue-400',
  background: 'bg-slate-950',
  card: 'bg-slate-900/50',
  border: 'border-slate-800'
};
