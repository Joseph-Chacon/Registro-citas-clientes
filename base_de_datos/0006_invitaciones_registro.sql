-- Invitaciones de un solo uso para crear nuevos locales.
CREATE TABLE IF NOT EXISTS invitaciones_registro (
  id_invitacion TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  creado_por TEXT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  vence_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ,
  usado_por TEXT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (usado_en IS NULL OR usado_por IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS indice_invitaciones_registro_vigentes
  ON invitaciones_registro (vence_en)
  WHERE usado_en IS NULL;
