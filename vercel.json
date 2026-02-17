-- Dia do vencimento (1-31) para despesas fixas e parceladas
ALTER TABLE fixed_expenses
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31);
