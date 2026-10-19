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

La siguiente migración creará los datos iniciales de una empresa y conectará
esta estructura con las rutas de registro, inicio de sesión y reservas.
