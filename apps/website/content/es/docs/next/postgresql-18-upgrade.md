---
title: Actualizar PostgreSQL 17 a 18
description: Migrar a un volumen nuevo de PostgreSQL 18 y comprobar la restauración de los datos.
---

La pila Compose utiliza `postgres:18-alpine` y monta su volumen con nombre en `/var/lib/postgresql`. PostgreSQL 18
guarda el clúster en un subdirectorio específico de su versión. Los archivos de PostgreSQL 17 no se pueden reutilizar
directamente. Consulte la [documentación oficial de la imagen](https://hub.docker.com/_/postgres).

Este procedimiento genera un volcado de la base de datos y lo restaura en un **volumen nuevo independiente**. Requiere
una ventana de mantenimiento. No combinar con el [cambio de marca](/docs/next/branding-upgrade); completar primero ese
cambio con la versión anterior de PostgreSQL 17. Actualizar el código no ejecuta automáticamente migraciones de
producción.

<a id="before-maintenance"></a>

## Antes del mantenimiento

- Conservar toda la configuración anterior, su `.env` y el nombre exacto del volumen PostgreSQL 17. Mantener su archivo
  Compose en el directorio anterior para resolver correctamente montajes relativos y archivos de entorno.
- Mantener `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` y `AUTH_JWT_SECRET` sin cambios.
  La clave descifra las credenciales existentes de proveedores y notificaciones.
- Reservar espacio para el volcado y ambos volúmenes. Proteger copias de seguridad y `.env` como secretos.
- Se presupone el único rol de base de datos de Repovio. Inventariar por separado roles, permisos, extensiones y bases
  adicionales; el volcado de la aplicación no garantiza su respaldo.
- Ensayar restauración y verificación con una copia desechable. `pnpm test:postgres-upgrade` usa migraciones reales y
  solo datos sintéticos; no valida el respaldo de una instalación concreta.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Detener escrituras y respaldar PostgreSQL 17

Ejecutar estos comandos desde el **directorio de la versión anterior**, con su configuración Compose de PostgreSQL 17.
Detener también otros escritores externos. No iniciar la nueva aplicación hasta terminar restauración y verificación.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

Registrar los recuentos iniciales de forma privada. Validar el volcado restaurándolo, no solo comprobando su tamaño.
Conservar volumen y configuración anteriores. Nunca ejecutar `docker compose down --volumes` ni eliminar ninguno de los
volúmenes de datos.

<a id="restore-into-postgresql-18"></a>

## Restaurar en PostgreSQL 18

En el **directorio de la nueva versión**, conservar credenciales y clave. Asignar a `backup` la ruta absoluta del
respaldo. Elegir un nombre de volumen nuevo y único y guardarlo como `REPOVIO_POSTGRES_VOLUME` en el nuevo `.env`; debe
diferir del volumen PostgreSQL 17. Usar la configuración de volumen externo para rechazar nombres incorrectos o
inexistentes.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

Usar un volumen realmente nuevo y vacío; si el nombre existe, elegir otro. El punto de entrada rechaza formatos
antiguos, incluido un volumen PostgreSQL 17 montado por error en la nueva raíz; no convierte datos. Si falla la
restauración, conservar volcado y volumen anterior, investigar y repetir con otro volumen vacío nuevo. No restaurar
repetidamente sobre una base parcialmente restaurada.

Comparar recuentos iniciales y relaciones representativas. Comprobar inicio de sesión, permisos, notificaciones y
descifrado con la clave conservada. Revisar estado de API y registros en privado. Reiniciar PostgreSQL 18 y confirmar
persistencia antes de terminar. El directorio predeterminado probado es `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Recuperación

Antes de nuevas escrituras, detener la pila nueva y reiniciar la versión anterior completa con su volumen PostgreSQL 17
y configuración originales. Nunca permitir escrituras simultáneas de ambas pilas. Conservar el volumen nuevo para
diagnóstico; PostgreSQL 17 nunca debe abrir archivos de PostgreSQL 18.

Después de nuevas escrituras, el volumen anterior está desactualizado; volver a él pierde esos cambios. Planificar
reconciliación o recuperación probada por separado. Restaurar un volcado PostgreSQL 18 en 17 no garantiza una reversión
de versión. Conservar ambos volúmenes y respaldos hasta que el operador cierre explícitamente la ventana de
recuperación.

<a id="disposable-verification"></a>

## Verificación con recursos desechables

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

La prueba crea contenedores, red y volúmenes con nombres únicos; aplica migraciones Prisma reales en ambas versiones;
verifica inicialización y base sombra; rechaza un volumen antiguo mal montado; restaura un volcado; compara todas las
tablas públicas; descifra una credencial sintética y comprueba persistencia tras reinicio y datos antiguos intactos. La
limpieza elimina solo sus recursos. No usa contenedores, volúmenes, bases ni credenciales existentes. Definir
`REPOVIO_TEST_API_IMAGE` para usar otra imagen de aplicación construida localmente.
