ALTER TABLE citas ADD COLUMN IF NOT EXISTS whatsapp_autorizado_en TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS notificaciones_whatsapp (
  id_notificacion TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL REFERENCES empresas(id_empresa),
  id_cita TEXT NOT NULL REFERENCES citas(id_cita),
  tipo TEXT NOT NULL CHECK (tipo IN ('confirmacion','recordatorio')),
  inicio_cita TIMESTAMPTZ NOT NULL,
  programado_en TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviando','aceptado','enviado','entregado','leido','fallido','incierto','cancelado')),
  intentos INTEGER NOT NULL DEFAULT 0,
  id_meta TEXT UNIQUE,
  error_codigo TEXT,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_cita,tipo,inicio_cita)
);
CREATE INDEX IF NOT EXISTS indice_whatsapp_pendientes ON notificaciones_whatsapp(programado_en) WHERE estado='pendiente';

CREATE OR REPLACE FUNCTION invalidar_avisos_whatsapp() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado NOT IN ('pendiente','confirmada') OR NEW.fecha_hora_inicio IS DISTINCT FROM OLD.fecha_hora_inicio
     OR NEW.whatsapp_autorizado_en IS NULL THEN
    UPDATE notificaciones_whatsapp SET estado='cancelado',actualizado_en=CURRENT_TIMESTAMP
      WHERE id_cita=NEW.id_cita AND estado='pendiente';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS invalidar_avisos_whatsapp ON citas;
CREATE TRIGGER invalidar_avisos_whatsapp AFTER UPDATE OF estado,fecha_hora_inicio,whatsapp_autorizado_en ON citas
  FOR EACH ROW EXECUTE FUNCTION invalidar_avisos_whatsapp();
