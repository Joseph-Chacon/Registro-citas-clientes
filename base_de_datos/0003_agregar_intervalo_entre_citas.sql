-- Guarda la separación, en minutos, usada para generar los horarios públicos.
-- Es segura para bases de datos que ya tengan esta columna.

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS intervalo_minutos INTEGER NOT NULL DEFAULT 30
  CHECK (intervalo_minutos >= 15);
