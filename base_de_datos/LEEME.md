# Base de datos

Este directorio contiene las migraciones del producto. El esquema usa nombres
en español y está diseñado para una plataforma multiempresa.

## Seguridad

El campo contrasena_hash nunca contiene la contraseña original. El backend
generará un hash con sal usando Argon2id o PBKDF2 antes de crear un usuario.

El campo token_hash almacena solamente el hash de la sesión enviada como
cookie segura. Las sesiones vencidas se eliminarán de forma programada.

## Aislamiento por empresa

Todas las entidades operativas incluyen id_empresa, directa o indirectamente.
Cada consulta del panel deberá filtrar por la empresa del usuario autenticado;
ese filtro es obligatorio en el servidor, no en el navegador.

## Próxima migración

La migración `0001_impedir_solapamientos_de_citas.sql` protege el recurso y el
intervalo de cada cita activa. Una inserción o modificación que se cruce con
otra cita pendiente o confirmada se rechaza dentro de D1.

Para activar estas migraciones en producción, el sitio debe usar un backend
con la vinculación D1 `db_citas`. El sitio actual aún es estático: la siguiente
etapa técnica es migrarlo a ese backend y aplicar estas migraciones allí.
