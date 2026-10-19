# Rutas del servidor

Estas rutas se implementarán sobre el Worker del sitio. Todas responden JSON y
usan nombres de dominio en español.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | /api/registro | Público | Crea empresa, usuario propietario y sesión. |
| POST | /api/iniciar-sesion | Público | Verifica correo y contraseña; crea una sesión. |
| POST | /api/cerrar-sesion | Autenticado | Invalida la sesión activa. |
| GET | /api/panel/empresa | Autenticado | Devuelve el negocio del usuario. |
| PUT | /api/panel/empresa | Administrador | Actualiza información pública. |
| GET | /api/panel/servicios | Autenticado | Lista servicios de la empresa. |
| POST | /api/panel/servicios | Administrador | Crea un servicio. |
| GET | /api/publico/:empresa/servicios | Público | Lista el catálogo público. |
| POST | /api/publico/:empresa/citas | Público | Registra una solicitud de cita. |

## Reglas obligatorias

1. El servidor obtiene la empresa desde la sesión; nunca desde un id enviado
   libremente por el navegador en rutas privadas.
2. Las contraseñas se validan y se procesan con el módulo autenticacion.mjs.
3. La cookie de sesión será HttpOnly, Secure, SameSite=Lax y tendrá vencimiento.
4. Antes de crear una cita, el servidor valida horario, servicio, recurso y
   ausencia de traslape de horarios.
