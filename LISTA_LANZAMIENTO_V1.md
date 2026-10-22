# Lista de lanzamiento — Agenda MultiLocal V1

Última revisión: 19 de octubre de 2026.

## Leyenda

- [x] Funciona en el prototipo actual.
- [~] Avance parcial; no está listo para clientes reales.
- [ ] Pendiente.

> Estado general: **prototipo funcional de interfaz**. Aún no debe usarse con
> clientes reales porque las citas, usuarios y configuración viven en el
> navegador del dispositivo, no en una base de datos compartida.

## Experiencia del cliente

- [x] Página pública de reservas sin botones administrativos.
- [x] Catálogo de servicios con precio y duración.
- [x] Activar o inactivar servicios desde el panel, conservando el historial de citas.
- [x] Selección de fecha en calendario mensual.
- [x] Selección de horario.
- [x] Solicitud de nombre y WhatsApp.
- [x] Pantalla de confirmación visual.
- [x] Horarios ocupados mostrados y deshabilitados en la interfaz de ejemplo.
- [x] Disponibilidad calculada desde el horario configurado del comercio, la duración del servicio y las citas locales existentes.
- [x] Prevención de doble reserva conectada: la reserva pública usa PostgreSQL y el disparador rechaza horarios solapados.
- [~] Almacenamiento permanente disponible en PostgreSQL; falta conectar la reserva y el panel para verlo desde otro dispositivo.
- [ ] Enlace público único por empresa, por ejemplo: /reservar/nombre-del-negocio.

## Panel del comercio

- [x] Vista separada de la página pública.
- [x] Agenda mensual de demostración.
- [x] Configuración de nombre, ubicación y servicios.
- [x] Agregar servicios desde celular en el prototipo.
- [x] API local de registro e inicio de sesión conectada a PostgreSQL.
- [~] Registro transaccional de empresa, usuario propietario y contraseña implementado en la API local; falta el formulario completo de alta de comercios.
- [x] Inicio de sesión real conectado a la interfaz local; el cierre de sesión queda pendiente en la interfaz.
- [ ] Agenda con citas reales de la empresa autenticada.
- [~] API local permite listar, reprogramar y cancelar citas dentro de la empresa de la sesión; listar y cancelar ya están conectados al panel local, falta reprogramar visualmente.
- [~] Horarios laborales y días de atención configurables desde el panel y guardados en PostgreSQL; falta la pantalla para bloquear fechas puntuales (feriados/vacaciones).

## Datos, seguridad y multiempresa

- [x] Esquema SQL multiempresa en español.
- [x] Tablas definidas para empresas, usuarios, servicios, clientes, citas y sesiones.
- [x] Módulo de hash de contraseña y verificación con PBKDF2.
- [x] Diseño de rutas de API en español.
- [~] Aislamiento de empresas diseñado en el esquema, pero no aplicado aún por un servidor.
- [x] Base de datos PostgreSQL 18 local `db_citas` creada con el esquema y las restricciones aplicadas.
- [x] Backend local conectado a `db_citas` para reservas y panel; falta desplegarlo para la aplicación publicada.
- [x] Cookies HttpOnly/SameSite y validación de sesión/permisos activas en el backend local.
- [~] Contraseñas con PBKDF2 y sesiones persistidas en PostgreSQL usadas por la API local; falta conectarlas a la pantalla publicada.
- [ ] Pruebas de seguridad: un comercio no puede leer ni editar datos de otro.

## Preparación para lanzamiento

- [ ] Confirmación y recordatorios por WhatsApp: seguir [el plan de implementación](PLAN_WHATSAPP.md). Decisión del 22 de octubre de 2026: conexión directa con Meta y un número existente compartido por todas las tiendas y locales.

- [x] Diseño móvil Playful Pastel.
- [x] Publicación privada de demostración.
- [ ] Página pública accesible para clientes externos sin cuenta de ChatGPT.
- [ ] URL definitiva o dominio propio.
- [ ] Política de privacidad y términos básicos.
- [ ] Prueba completa en Android y iPhone.
- [ ] Prueba de flujo: crear comercio → configurar → reservar → revisar agenda.
- [ ] Datos iniciales de un comercio piloto real.

## Orden recomendado de trabajo

1. [ ] Convertir el sitio estático a aplicación con servidor y D1.
2. [ ] Aplicar la migración de base de datos en español.
3. [ ] Implementar registro e inicio de sesión con usuario y contraseña.
4. [ ] Conectar servicios, empresa y agenda del panel a la base de datos.
5. [ ] Conectar la reserva pública a la disponibilidad real y evitar doble reserva.
6. [ ] Probar aislamiento multiempresa y flujo completo en celular.
7. [ ] Habilitar acceso público y realizar una prueba con un comercio piloto.

## Criterio de “listo para clientes reales”

La V1 se considera lista únicamente cuando estén terminados los siete pasos del
orden recomendado y un comercio piloto pueda completar, desde teléfonos
distintos, una reserva pública que aparezca en el panel del administrador sin
que otro comercio pueda verla.
