# Configuración de WhatsApp con Meta

La integración está desactivada por defecto. No se ha desplegado ni conectado ningún número.

## Preparación

1. El propietario confirmó que el número existente ya usa la aplicación WhatsApp Business. Verificar elegibilidad para coexistencia con Cloud API y disponibilidad de ese procedimiento en una integración directa con Meta. No asumir que agregar el número mediante el registro normal preserva el uso en la aplicación. No dar de baja la cuenta ni migrarla antes de acordar el procedimiento y sus efectos.
2. Configurar en el servidor las variables de `.env.whatsapp.example`. El servidor lee variables del entorno, no carga automáticamente archivos `.env`. No guardar tokens en Git ni en la página pública.
3. Crear dos plantillas de utilidad aprobadas, con idioma coincidente con `WHATSAPP_IDIOMA`, sin encabezado ni botones, y seis parámetros posicionales en el cuerpo: cliente, local, servicio, fecha, hora, ubicación.
4. Registrar `https://DOMINIO/api/whatsapp/webhook` como callback en Meta, usar el valor de `WHATSAPP_VERIFY_TOKEN` para verificar y suscribir el campo `messages`. `WHATSAPP_APP_SECRET` es el secreto de la aplicación, distinto del token de acceso y del token de verificación.
5. Ejecutar `npm run migrar` antes de iniciar la versión nueva. La migración añade el consentimiento de la cita y una cola de notificaciones; no genera mensajes para citas históricas.
6. Probar con un destinatario autorizado y activar `WHATSAPP_ACTIVO=true` solo tras aprobar las plantillas y configurar facturación, permisos y token de acceso apropiado.

## Cuerpos propuestos para las plantillas

Confirmación (`confirmacion_cita`):

Hola {{1}}, tu cita en {{2}} para {{3}} quedó confirmada para el {{4}} a las {{5}}. Ubicación: {{6}}.

Recordatorio (`recordatorio_cita`):

Hola {{1}}, te recordamos tu cita en {{2}} para {{3}} el {{4}} a las {{5}}. Ubicación: {{6}}.

## Funcionamiento y límites de esta etapa

- Un número remitente configurado en el servidor se comparte entre todas las empresas. Cada mensaje incluye el local.
- El formulario no pregunta por separado ni incluye casilla: informa que al pulsar «Confirmar cita» el cliente acepta los avisos de esa reserva y registra esa aceptación. Todas las reservas realizadas desde ese formulario programan los avisos cuando la integración está activa. La API conserva el requisito de recibir esa aceptación explícita para no asumirla en otros clientes o integraciones. Los números nacionales de ocho dígitos se interpretan como Costa Rica; otros destinos requieren código de país.
- Confirmación y recordatorio se guardan en la misma transacción que la cita. El proceso revisa la cola cada 30 segundos mientras el servidor permanezca activo.
- El recordatorio usa 3 horas como valor inicial configurable. No se programa si su plazo ya pasó. No se envían mensajes de citas vencidas, canceladas o cuyo horario cambió respecto al aviso.
- El estado `aceptado` indica que Meta recibió la solicitud; no significa entregado. Los webhooks firmados actualizan el estado sin retroceder de entregado a enviado.
- Si la respuesta de Meta es ambigua, el envío queda `incierto` y requiere revisión; no se reintenta automáticamente para evitar duplicados. Los errores explícitos quedan `fallido`. No hay todavía una pantalla ni un mecanismo de reintento manual.
- `GET /api/panel/whatsapp` permite al administrador consultar los últimos 100 avisos de su empresa. No revela credenciales ni avisos de otras empresas.
- Las respuestas entrantes no cancelan ni reprograman citas y no se ofrecen esas acciones en las plantillas. La atención de respuestas y bajas aún debe definirse antes del piloto.
- El backend actual no implementa cambios de horario; esta etapa invalida avisos de horarios modificados y no implementa aún el nuevo aviso posterior a una reprogramación.
- Una cancelación recibida cuando Meta ya está procesando un envío no puede retirar ese mensaje.

## Alojamiento

`render.yaml` usa actualmente un servicio gratuito. Un servicio que duerme o se pausa no garantiza recordatorios puntuales: configurar un servidor siempre activo o un trabajador programado compatible antes del piloto. No se ha cambiado el plan de alojamiento ni contratado servicios.

## Verificación

Ejecutar `node --test whatsapp.test.mjs` desde `backend`. Además, antes de producción probar la migración en PostgreSQL y el flujo real con Meta: guardado, autorización, cancelación, separación entre empresas, webhooks y recuperación después de reiniciar.

Referencias: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/messages/template/ y https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/.
