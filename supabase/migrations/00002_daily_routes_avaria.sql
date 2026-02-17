-- Avaria nova na rota do dia (motorista)
ALTER TABLE daily_routes ADD COLUMN IF NOT EXISTS avaria_nova BOOLEAN DEFAULT false;
ALTER TABLE daily_routes ADD COLUMN IF NOT EXISTS avaria_descricao TEXT;
ALTER TABLE daily_routes ADD COLUMN IF NOT EXISTS avaria_foto TEXT;
