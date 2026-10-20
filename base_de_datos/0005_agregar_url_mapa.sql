-- Guarda el enlace exacto compartido desde Google Maps o Apple Maps.
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS url_mapa TEXT;
