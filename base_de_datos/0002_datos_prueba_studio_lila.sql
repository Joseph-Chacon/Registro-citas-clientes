INSERT INTO empresas (id_empresa, nombre, identificador_publico, ubicacion)
VALUES ('studio-lila', 'Studio Lila', 'studio-lila', 'Barrio Escalante')
ON CONFLICT (id_empresa) DO NOTHING;

INSERT INTO servicios (id_servicio, id_empresa, nombre, precio_centavos, duracion_minutos)
VALUES
  ('cut', 'studio-lila', 'Corte y peinado', 18000, 60),
  ('nails', 'studio-lila', 'Manicure gel', 15000, 75),
  ('brows', 'studio-lila', 'Diseno de cejas', 8000, 30)
ON CONFLICT (id_servicio) DO NOTHING;

INSERT INTO horarios_atencion (id_horario, id_empresa, dia_semana, hora_inicio, hora_fin)
SELECT 'studio-lila-' || dia, 'studio-lila', dia, '09:00', '16:00'
FROM generate_series(1, 6) AS dia
ON CONFLICT DO NOTHING;
