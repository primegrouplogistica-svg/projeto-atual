-- PRIME GROUP - Schema inicial
-- Execute no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor)

-- Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha TEXT,
  perfil TEXT NOT NULL DEFAULT 'motorista' CHECK (perfil IN ('admin', 'custom_admin', 'motorista', 'ajudante')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  permissoes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agregados
CREATE TABLE IF NOT EXISTS agregados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  placa TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL,
  modelo TEXT NOT NULL,
  km_atual INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rodando' CHECK (status IN ('rodando', 'manutencao', 'parado')),
  preventive_tasks JSONB DEFAULT '[]'::jsonb,
  proxima_manutencao_km INTEGER,
  ultima_revisao_data DATE,
  tracker_id TEXT,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Despesas fixas
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('funcionario', 'contador', 'manobra', 'sistema', 'imposto', 'outros')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_competencia TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Abastecimentos
CREATE TABLE IF NOT EXISTS fuelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  motorista_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  km_no_momento INTEGER NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  foto_nota TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  admin_aprovador_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

-- Solicitações de manutenção
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  motorista_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('preventiva', 'corretiva')),
  descricao TEXT NOT NULL,
  km_no_momento INTEGER NOT NULL,
  foto TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'assumida', 'em_execucao', 'feita', 'reprovada')),
  admin_responsavel_id UUID REFERENCES users(id),
  assumed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  oficina TEXT,
  valor NUMERIC(12,2),
  nota_foto TEXT,
  observacao_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rotas do dia (motorista)
CREATE TABLE IF NOT EXISTS daily_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  ajudante_id UUID REFERENCES users(id),
  ajudante_nome TEXT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  destino TEXT NOT NULL,
  oc TEXT NOT NULL,
  valor_frete NUMERIC(12,2) DEFAULT 0,
  valor_motorista NUMERIC(12,2) DEFAULT 0,
  valor_ajudante NUMERIC(12,2) DEFAULT 0,
  status_financeiro TEXT CHECK (status_financeiro IN ('pendente', 'aprovado')),
  admin_financeiro_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  foto_frente TEXT,
  foto_lateral_esquerda TEXT,
  foto_lateral_direita TEXT,
  foto_traseira TEXT,
  nivel_oleo TEXT CHECK (nivel_oleo IN ('no_nivel', 'abaixo_do_nivel')),
  nivel_agua TEXT CHECK (nivel_agua IN ('no_nivel', 'abaixo_do_nivel'))
);

-- Saídas / OC (ajudante)
CREATE TABLE IF NOT EXISTS route_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  motorista_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  ajudante_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  ajudante_nome TEXT,
  cliente_id UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  destino TEXT NOT NULL,
  oc TEXT NOT NULL,
  valor_frete NUMERIC(12,2) DEFAULT 0,
  valor_motorista NUMERIC(12,2) DEFAULT 0,
  valor_ajudante NUMERIC(12,2) DEFAULT 0,
  status_financeiro TEXT CHECK (status_financeiro IN ('pendente', 'aprovado')),
  admin_financeiro_id UUID REFERENCES users(id),
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'em_rota' CHECK (status IN ('em_rota', 'finalizada', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Fretes agregados
CREATE TABLE IF NOT EXISTS agregado_freights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado_id UUID NOT NULL REFERENCES agregados(id) ON DELETE CASCADE,
  nome_agregado TEXT NOT NULL,
  placa TEXT NOT NULL,
  valor_frete NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_agregado NUMERIC(12,2) NOT NULL DEFAULT 0,
  oc TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedágios
CREATE TABLE IF NOT EXISTS tolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas por data e por entidade
CREATE INDEX IF NOT EXISTS idx_fuelings_created_at ON fuelings(created_at);
CREATE INDEX IF NOT EXISTS idx_fuelings_vehicle ON fuelings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_routes_created_at ON daily_routes(created_at);
CREATE INDEX IF NOT EXISTS idx_route_departures_created_at ON route_departures(created_at);
CREATE INDEX IF NOT EXISTS idx_agregado_freights_data ON agregado_freights(data);
CREATE INDEX IF NOT EXISTS idx_tolls_data ON tolls(data);

-- Habilitar RLS (Row Level Security) mas com política permissiva para o app usar anon key
-- Você pode restringir depois com políticas por perfil
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE agregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE agregado_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir tudo para anon (o app controla acesso por login interno)
CREATE POLICY "Allow all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fixed_expenses" ON fixed_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fuelings" ON fuelings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all maintenance_requests" ON maintenance_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all daily_routes" ON daily_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all route_departures" ON route_departures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agregados" ON agregados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agregado_freights" ON agregado_freights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tolls" ON tolls FOR ALL USING (true) WITH CHECK (true);
