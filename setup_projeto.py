
import os

# Dicionário com todos os arquivos do projeto PRIME GROUP
files = {
    "package.json": """{
  "name": "prime-group-gestao",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.12.7",
    "lucide-react": "^0.378.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.2.2",
    "vite": "^5.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4"
  }
}""",
    "vite.config.ts": """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ 
  plugins: [react()],
  server: { port: 5173, host: true }
});""",
    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false
  },
  "include": ["**/*.ts", "**/*.tsx"]
}""",
    "index.html": """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PRIME GROUP - Gestão Operacional</title>
    <meta name="theme-color" content="#020617">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        @media print { .no-print { display: none !important; } body { background: white; color: black; } }
    </style>
</head>
<body class="antialiased">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>""",
    "index.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}""",
    "types.ts": """export enum UserRole { ADMIN = 'admin', CUSTOM_ADMIN = 'custom_admin', MOTORISTA = 'motorista', AJUDANTE = 'ajudante' }
export enum VehicleStatus { RODANDO = 'rodando', MANUTENCAO = 'manutencao', PARADO = 'parado' }
export enum FuelingStatus { PENDENTE = 'pendente', APROVADO = 'aprovado', REJEITADO = 'rejeitado' }
export enum MaintenanceStatus { PENDENTE = 'pendente', ASSUMIDA = 'assumida', EM_EXECUCAO = 'em_execucao', FEITA = 'feita', REPROVADA = 'reprovada' }
export enum RouteStatus { EM_ROTA = 'em_rota', FINALIZADA = 'finalizada', CANCELADA = 'cancelada' }
export enum FinanceiroStatus { PENDENTE = 'pendente', APROVADO = 'aprovado' }

export interface User { id: string; nome: string; email: string; senha?: string; perfil: UserRole; ativo: boolean; permissoes?: string[]; }
export interface Customer { id: string; nome: string; cnpj?: string; ativo: boolean; }
export interface Agregado { id: string; nome: string; placa: string; ativo: boolean; }
export interface FixedExpense { id: string; categoria: 'funcionario' | 'contador' | 'manobra' | 'sistema' | 'imposto' | 'outros'; descricao: string; valor: number; dataCompetencia: string; createdAt: string; }
export interface AgregadoFreight { id: string; agregadoId: string; nomeAgregado: string; placa: string; valorFrete: number; valorAgregado: number; oc: string; data: string; createdAt: string; }
export interface PreventiveTask { id: string; descricao: string; kmAlvo: number; dataProgramada?: string; }
export interface Vehicle { id: string; placa: string; modelo: string; kmAtual: number; status: VehicleStatus; preventiveTasks?: PreventiveTask[]; proximaManutencaoKm?: number; trackerId?: string; isOnline?: boolean; }
export interface UserSession { userId: string; vehicleId: string; placa: string; updatedAt: string; }
export interface DailyRoute { id: string; motoristaId: string; ajudanteId?: string; ajudanteNome?: string; vehicleId: string; placa: string; clienteId: string; clienteNome?: string; destino: string; oc: string; valorFrete?: number; valorMotorista?: number; valorAjudante?: number; statusFinanceiro?: FinanceiroStatus; adminFinanceiroId?: string; createdAt: string; fotoFrente?: string; fotoLateralEsquerda?: string; fotoLateralDireita?: string; fotoTraseira?: string; nivelOleo?: 'no_nivel' | 'abaixo_do_nivel'; nivelAgua?: 'no_nivel' | 'abaixo_do_nivel'; }
export interface Fueling { id: string; vehicleId: string; placa: string; motoristaId: string; kmNoMomento: number; valor: number; fotoNota: string; status: FuelingStatus; motivoRejeicao?: string; adminAprovadorId?: string; createdAt: string; approvedAt?: string; }
export interface MaintenanceRequest { id: string; vehicleId: string; placa: string; motoristaId: string; tipo: 'preventiva' | 'corretiva'; descricao: string; kmNoMomento: number; foto: string; status: MaintenanceStatus; adminResponsavelId?: string; assumedAt?: string; startedAt?: string; doneAt?: string; oficina?: string; valor?: number; notaFoto?: string; observacaoAdmin?: string; createdAt: string; }
export interface RouteDeparture { id: string; vehicleId: string; placa: string; motoristaId: string; ajudanteId: string; ajudanteNome?: string; clienteId: string; clienteNome?: string; destino: string; oc: string; valorFrete?: number; valorMotorista?: number; valorAjudante?: number; statusFinanceiro?: FinanceiroStatus; adminFinanceiroId?: string; observacao?: string; status: RouteStatus; createdAt: string; finishedAt?: string; }
export interface Toll { id: string; vehicleId: string; placa: string; valor: number; data: string; createdAt: string; }""",
    "supabase.ts": """export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ error: null }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  })
} as any;
export const mapFromDb = (item: any) => item;
export const mapToDb = (item: any) => item;""",
    "LEAME.md": """# PRIME GROUP - Gestão Operacional

Este projeto está em modo **Offline** (salva no LocalStorage do navegador).

## Como rodar:
1. Instale o Node.js.
2. No terminal: `npm install`
3. Depois: `npm run dev`
4. Acesse: `http://localhost:5173`
"""
}

def create_structure():
    print("🚀 Reconstruindo projeto PRIME GROUP...")
    for path, content in files.items():
        folder = os.path.dirname(path)
        if folder and not os.path.exists(folder):
            os.makedirs(folder)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Arquivo: {path}")
    print("\n🎉 Tudo pronto! Agora rode 'npm install' e 'npm run dev'.")

if __name__ == "__main__":
    create_structure()
