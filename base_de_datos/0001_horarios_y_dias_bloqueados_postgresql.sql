-- Configuración de disponibilidad por empresa para PostgreSQL 18.

CREATE TABLE dias_bloqueados (
  id_dia_bloqueado TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  id_recurso TEXT REFERENCES recursos_reservables(id_recurso) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE NULLS NOT DISTINCT (id_empresa, id_recurso, fecha)
);

CREATE INDEX indice_dias_bloqueados_empresa_fecha
  ON dias_bloqueados(id_empresa, fecha);
