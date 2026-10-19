-- Impide que dos citas activas se solapen para el mismo recurso reservable.
-- SQLite / Cloudflare D1 ejecuta este disparador dentro de la misma operación
-- INSERT, por lo que el rechazo no depende de lo que vea cada teléfono.

CREATE INDEX indice_citas_recurso_intervalo
  ON citas(id_empresa, id_recurso, fecha_hora_inicio, fecha_hora_fin);

CREATE TRIGGER impedir_solapamiento_al_crear_cita
BEFORE INSERT ON citas
WHEN NEW.estado IN ('pendiente', 'confirmada')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM citas existente
    WHERE existente.id_empresa = NEW.id_empresa
      AND existente.id_recurso IS NEW.id_recurso
      AND existente.estado IN ('pendiente', 'confirmada')
      AND NEW.fecha_hora_inicio < existente.fecha_hora_fin
      AND NEW.fecha_hora_fin > existente.fecha_hora_inicio
  ) THEN RAISE(ABORT, 'El horario ya no está disponible') END;
END;

CREATE TRIGGER impedir_solapamiento_al_actualizar_cita
BEFORE UPDATE OF id_empresa, id_recurso, fecha_hora_inicio, fecha_hora_fin, estado ON citas
WHEN NEW.estado IN ('pendiente', 'confirmada')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM citas existente
    WHERE existente.id_cita <> NEW.id_cita
      AND existente.id_empresa = NEW.id_empresa
      AND existente.id_recurso IS NEW.id_recurso
      AND existente.estado IN ('pendiente', 'confirmada')
      AND NEW.fecha_hora_inicio < existente.fecha_hora_fin
      AND NEW.fecha_hora_fin > existente.fecha_hora_inicio
  ) THEN RAISE(ABORT, 'El horario ya no está disponible') END;
END;
