-- Soft delete para users e customers (FK constraints impedem DELETE fisico)
-- Ao excluir, marcamos excluido=true; no load filtramos esses registros
ALTER TABLE users ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT false;
