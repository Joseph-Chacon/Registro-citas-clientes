# Plan de implementación de WhatsApp — Agenda MultiLocal

Actualizado: 22 de octubre de 2026.

Estado: primera etapa implementada localmente el 22 de octubre de 2026; integración con la cuenta de Meta, migración y despliegue pendientes. Los envíos permanecen desactivados.

## Avance de la primera etapa

- Implementados consentimiento por reserva, normalización de teléfono, cola transaccional de confirmación y recordatorio, envío de plantillas desde un único número, comprobación de vigencia y recepción de estados con firma de Meta.
- Añadidos invalidación de avisos pendientes al cambiar o cancelar la cita y consulta de estados por empresa mediante API.
- Las pruebas automáticas usan datos y respuestas simuladas; falta verificar PostgreSQL y Meta reales.
- No se ejecutaron migraciones, no se desplegó ni se modificó la cuenta de Meta. No se enviaron mensajes.
- Configuración y límites pendientes descritos en [backend/WHATSAPP.md](backend/WHATSAPP.md). Los estados inciertos y fallidos requieren revisión; aún no hay reintento manual ni automático, pantalla de seguimiento, gestión de bajas o avisos de reprogramación.

## Ajuste del flujo de autorización

Por indicación del propietario, se eliminó la casilla opcional. El aviso junto al botón de confirmar informa de los mensajes incluidos y de la identidad del remitente central. La aceptación se registra al confirmar la reserva; no se aplica a reservas históricas ni a números ajenos al flujo de reserva.

## Decisiones confirmadas

- Usar directamente WhatsApp Business Platform de Meta, sin intermediario.
- Usar un número que el propietario ya tiene. El número concreto todavía no se ha registrado en este plan.
- Confirmado por el propietario: el número ya está configurado en la aplicación WhatsApp Business. Pendiente verificar su elegibilidad para coexistencia con Cloud API y si esa modalidad está disponible mediante la conexión directa elegida. No dar de baja ni migrar la cuenta antes de resolverlo.
- Todas las tiendas y locales enviarán desde ese mismo número central.
- Cada mensaje identificará expresamente la tienda o local al que corresponde la reserva.
- Enviar confirmación al completar la reserva y un recordatorio unas horas antes.

La confirmación al completar la reserva es la interpretación de trabajo de «finalizar la cita»; no corresponde a marcar como terminada la atención.

## Flujo previsto

1. El cliente confirma la reserva mediante un formulario que informa que esa acción acepta los avisos por WhatsApp. No se pregunta por separado ni se incluye una casilla; todas las reservas de ese flujo incluyen confirmación y recordatorio cuando la integración está activa.
2. Después de guardar correctamente la reserva, se registra un envío pendiente de confirmación y se calcula el recordatorio.
3. Un proceso del servidor envía la confirmación mediante Meta y procesa los recordatorios a su hora, sin depender de que la agenda esté abierta.
4. Antes de enviar, comprueba que la cita siga vigente y conserve el mismo horario.
5. Si se reprograma, actualiza el recordatorio; si se cancela, anula el aviso pendiente.
6. Registra el estado de cada mensaje y procesa las notificaciones de Meta sobre entrega o fallo. La lectura se registra solo cuando esté disponible.

## Etapas pendientes

### 1. Preparar Meta y el número existente

- [ ] Identificar el número central y comprobar su situación actual: uso en WhatsApp, WhatsApp Business o alguna integración previa.
- [ ] Verificar qué procedimiento admite Meta para incorporarlo, incluida la posibilidad de coexistencia o migración, antes de alterar su uso actual.
- [ ] Configurar la cuenta empresarial y la aplicación de Meta, y completar los requisitos que correspondan.
- [ ] Configurar credenciales del servidor, permisos y facturación; mantener las credenciales fuera del navegador y del repositorio.
- [ ] Definir quién atenderá las respuestas al número compartido y cómo distinguirá el local y la reserva asociados. Si no hay una correspondencia única, solicitar aclaración al cliente.

### 2. Preparar datos y mensajes

- [ ] Normalizar teléfonos con código de país y guardar la autorización del cliente y su fecha.
- [ ] Crear y someter a aprobación las plantillas de confirmación y recordatorio, sin contenido promocional.
- [ ] Incluir nombre del cliente, tienda/local, servicio, fecha, hora y ubicación o contacto del local.
- [ ] Asociar cada notificación con su empresa, cita, destinatario y tipo de mensaje, aunque el remitente sea compartido.
- [ ] Mostrar al cliente que los avisos llegarán desde el número central de la agenda.

### 3. Implementar envíos y programación

- [ ] Registrar de forma duradera la notificación junto con la reserva para poder recuperar envíos pendientes después de un fallo.
- [ ] Implementar confirmación posterior al guardado exitoso, sin perder la reserva si WhatsApp falla.
- [ ] Implementar un proceso programado en un alojamiento compatible, independiente de la computadora del propietario.
- [ ] Calcular recordatorios con la zona horaria del negocio.
- [ ] Evitar duplicados por cita y tipo de aviso, controlar reintentos y conciliar estados mediante las notificaciones de Meta.
- [ ] Invalidar mensajes pendientes por cancelación o cambio de horario y evitar recordatorios de citas ya iniciadas.
- [ ] Permitir consultar mensajes pendientes, entregados y fallidos por local, respetando el acceso de cada empresa.
- [ ] Respetar las solicitudes de dejar de recibir mensajes y los límites del número compartido.

### 4. Verificar antes de activar

- [ ] Probar primero con destinatarios de prueba y un comercio piloto.
- [ ] Verificar confirmación, recordatorio, reprogramación, cancelación, reservas de última hora y recuperación tras fallos.
- [ ] Comprobar que una misma persona pueda reservar en distintos locales sin mezclar datos ni mensajes.
- [ ] Validar identificación del negocio, tarifas vigentes y consumo estimado antes de habilitar envíos reales.

## Propuestas todavía por definir

- Anticipación del recordatorio: propuesta inicial de 3 horas, configurable; no es una decisión confirmada.
- Si la reserva se hace dentro del plazo del recordatorio: propuesta de enviar solo confirmación para evitar avisos consecutivos.
- Nombre visible del remitente central y texto definitivo de las plantillas.
- Canal de atención de respuestas y posibilidad futura de confirmar, cancelar o reprogramar desde WhatsApp. Estas acciones por respuesta no forman parte de la primera etapa.

## Costos previstos

La elección acordada evita una suscripción o recargo de un intermediario. Deben presupuestarse los cargos de Meta que apliquen a los mensajes, el alojamiento del proceso automático y el costo de mantener el número. Las tarifas se verificarán al implementar; este plan no fija un precio por mensaje.

## Criterio de implementación terminada

Una reserva real genera una sola confirmación y el recordatorio que corresponda desde el número central, identifica el local correcto, respeta cambios y cancelaciones y deja un estado consultable del envío. El proceso funciona sin que el propietario mantenga abierta la agenda.
