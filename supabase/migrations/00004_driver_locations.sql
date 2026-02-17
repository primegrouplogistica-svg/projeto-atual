-- Localização em tempo real dos motoristas (GPS do celular)
CREATE TABLE IF NOT EXISTS driver_locations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para listar por última atualização
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at DESC);

-- Habilitar RLS (opcional: política permite leitura para todos autenticados e escrita do próprio user_id)
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all driver_locations" ON driver_locations;
CREATE POLICY "Allow all driver_locations" ON driver_locations FOR ALL USING (true) WITH CHECK (true);
