-- Aislamiento multiempresa sin crear una base de datos por negocio.
-- Una sesión opera en una empresa activa y las referencias no pueden cruzar empresas.

ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS id_empresa_activa TEXT REFERENCES empresas(id_empresa) ON DELETE SET NULL;

UPDATE sesiones s
SET id_empresa_activa = (
  SELECT ue.id_empresa
  FROM usuarios_empresas ue
  WHERE ue.id_usuario = s.id_usuario
  ORDER BY ue.creado_en
  LIMIT 1
)
WHERE s.id_empresa_activa IS NULL;

CREATE INDEX IF NOT EXISTS indice_sesiones_empresa_activa
  ON sesiones(id_usuario, id_empresa_activa, vence_en);

CREATE UNIQUE INDEX IF NOT EXISTS indice_clientes_empresa_id
  ON clientes(id_empresa, id_cliente);
CREATE UNIQUE INDEX IF NOT EXISTS indice_servicios_empresa_id
  ON servicios(id_empresa, id_servicio);
CREATE UNIQUE INDEX IF NOT EXISTS indice_recursos_empresa_id
  ON recursos_reservables(id_empresa, id_recurso);

ALTER TABLE servicios_recursos
  ADD COLUMN IF NOT EXISTS id_empresa TEXT;

UPDATE servicios_recursos sr
SET id_empresa = s.id_empresa
FROM servicios s
WHERE s.id_servicio = sr.id_servicio AND sr.id_empresa IS NULL;

ALTER TABLE servicios_recursos
  ALTER COLUMN id_empresa SET NOT NULL,
  DROP CONSTRAINT IF EXISTS servicios_recursos_servicio_misma_empresa,
  ADD CONSTRAINT servicios_recursos_servicio_misma_empresa
    FOREIGN KEY (id_empresa, id_servicio)
    REFERENCES servicios(id_empresa, id_servicio) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS servicios_recursos_recurso_misma_empresa,
  ADD CONSTRAINT servicios_recursos_recurso_misma_empresa
    FOREIGN KEY (id_empresa, id_recurso)
    REFERENCES recursos_reservables(id_empresa, id_recurso) ON DELETE CASCADE;

ALTER TABLE horarios_atencion
  DROP CONSTRAINT IF EXISTS horarios_recurso_misma_empresa,
  ADD CONSTRAINT horarios_recurso_misma_empresa
    FOREIGN KEY (id_empresa, id_recurso)
    REFERENCES recursos_reservables(id_empresa, id_recurso) ON DELETE CASCADE;

ALTER TABLE citas
  DROP CONSTRAINT IF EXISTS citas_cliente_misma_empresa,
  ADD CONSTRAINT citas_cliente_misma_empresa
    FOREIGN KEY (id_empresa, id_cliente)
    REFERENCES clientes(id_empresa, id_cliente) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS citas_servicio_misma_empresa,
  ADD CONSTRAINT citas_servicio_misma_empresa
    FOREIGN KEY (id_empresa, id_servicio)
    REFERENCES servicios(id_empresa, id_servicio) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS citas_recurso_misma_empresa,
  ADD CONSTRAINT citas_recurso_misma_empresa
    FOREIGN KEY (id_empresa, id_recurso)
    REFERENCES recursos_reservables(id_empresa, id_recurso) ON DELETE SET NULL;
