-- Enlace directo a la ubicación seleccionada por el negocio.
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS url_mapa TEXT;
