-- Esquema de producción para PostgreSQL 18: db_citas.
-- Los identificadores se generan por la aplicación para no depender de extensiones.

CREATE TABLE empresas (
  id_empresa TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  identificador_publico TEXT NOT NULL UNIQUE,
  ubicacion TEXT,
  telefono TEXT,
  zona_horaria TEXT NOT NULL DEFAULT 'America/Costa_Rica',
  intervalo_minutos INTEGER NOT NULL DEFAULT 30 CHECK (intervalo_minutos >= 15),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
  id_usuario TEXT PRIMARY KEY,
  correo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  contrasena_hash TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios_empresas (
  id_usuario_empresa TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('propietario', 'administrador', 'colaborador')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_usuario, id_empresa)
);

CREATE TABLE recursos_reservables (
  id_recurso TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'profesional',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios (
  id_servicio TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
  duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios_recursos (
  id_servicio TEXT NOT NULL REFERENCES servicios(id_servicio) ON DELETE CASCADE,
  id_recurso TEXT NOT NULL REFERENCES recursos_reservables(id_recurso) ON DELETE CASCADE,
  PRIMARY KEY (id_servicio, id_recurso)
);

CREATE TABLE horarios_atencion (
  id_horario TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  id_recurso TEXT REFERENCES recursos_reservables(id_recurso) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  CHECK (hora_inicio < hora_fin)
);

CREATE TABLE clientes (
  id_cliente TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_empresa, telefono)
);

CREATE TABLE citas (
  id_cita TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  id_cliente TEXT NOT NULL REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
  id_servicio TEXT NOT NULL REFERENCES servicios(id_servicio) ON DELETE RESTRICT,
  id_recurso TEXT REFERENCES recursos_reservables(id_recurso) ON DELETE SET NULL,
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  fecha_hora_fin TIMESTAMPTZ NOT NULL,
  precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  notas TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (fecha_hora_inicio < fecha_hora_fin)
);

CREATE TABLE sesiones (
  id_sesion TEXT PRIMARY KEY,
  id_usuario TEXT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  vence_en TIMESTAMPTZ NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX indice_servicios_empresa ON servicios(id_empresa, activo);
CREATE INDEX indice_clientes_empresa ON clientes(id_empresa, telefono);
CREATE INDEX indice_citas_empresa_fecha ON citas(id_empresa, fecha_hora_inicio);
CREATE INDEX indice_citas_recurso_fecha ON citas(id_recurso, fecha_hora_inicio);
CREATE INDEX indice_sesiones_usuario ON sesiones(id_usuario, vence_en);

CREATE OR REPLACE FUNCTION impedir_solapamiento_de_cita()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('pendiente', 'confirmada') AND EXISTS (
    SELECT 1 FROM citas existente
    WHERE existente.id_cita IS DISTINCT FROM NEW.id_cita
      AND existente.id_empresa = NEW.id_empresa
      AND existente.id_recurso IS NOT DISTINCT FROM NEW.id_recurso
      AND existente.estado IN ('pendiente', 'confirmada')
      AND NEW.fecha_hora_inicio < existente.fecha_hora_fin
      AND NEW.fecha_hora_fin > existente.fecha_hora_inicio
  ) THEN
    RAISE EXCEPTION 'El horario ya no está disponible';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER impedir_solapamiento_de_cita
BEFORE INSERT OR UPDATE OF id_empresa, id_recurso, fecha_hora_inicio, fecha_hora_fin, estado ON citas
FOR EACH ROW EXECUTE FUNCTION impedir_solapamiento_de_cita();
