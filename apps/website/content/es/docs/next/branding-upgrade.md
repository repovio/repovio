---
title: 'Actualización de marca Repovio'
description: 'Conserve los datos y las credenciales de la base de datos al pasar al nombre Repovio.'
---

Este cambio de nombre es un cambio de configuración importante. Actualice todas las variables de entorno anteriores con
el prefijo del producto al prefijo `REPOVIO_`, incluidos `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`, `REPOVIO_API_PORT` y
`REPOVIO_WEB_PORT`. Utilice la API y las imágenes web en `ghcr.io/repovio/repovio-api` y `ghcr.io/repovio/repovio-web`.

Complete primero el cambio de marca con la versión anterior de PostgreSQL 17. La configuración Compose actual usa
PostgreSQL 18; siga la [actualización independiente a PostgreSQL 18](/docs/next/postgresql-18-upgrade) antes de usarla.
Nunca monte archivos PostgreSQL 17 en el servicio PostgreSQL 18. Los pasos siguientes usan la configuración PostgreSQL
17 conservada, incluidos `compose.yml` y `compose.upgrade.yml`. Solo el cambio de marca no requiere conversión de datos;
actualizar la versión principal es una operación separada.

## Preservar datos PostgreSQL

1. Haga una copia de seguridad de la base de datos existente y confirme que la copia de seguridad se puede restaurar
   antes de cambiar la implementación.
2. Inspeccione el contenedor PostgreSQL en ejecución con `docker inspect <postgres-container>` y registre el volumen con
   nombre exacto montado en `/var/lib/postgresql/data`. Detenga la aplicación anterior y los contenedores PostgreSQL sin
   eliminar volúmenes.
3. Configure `REPOVIO_POSTGRES_VOLUME` en el nuevo entorno de implementación con ese nombre de volumen exacto. Confirme
   que existe usando `docker volume inspect <recorded-volume>`. El valor predeterminado de la nueva instalación es
   `repovio-postgres`; no debe sustituir accidentalmente el volumen de una instalación existente.
4. Mantener `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` y `AUTH_JWT_SECRET` sin cambios.
   Mantenga PostgreSQL en la misma versión principal. Revise `docker compose config` en privado antes de comenzar; su
   salida contiene secretos resueltos y nunca debe compartirse ni confirmarse.
5. Utilice `docker compose -f compose.yml -f compose.upgrade.yml` para la actualización. Esta anulación requiere que
   exista el volumen nombrado, por lo que un volumen mal escrito no puede inicializar silenciosamente un reemplazo
   vacío. Primero inicie PostgreSQL y verifique la base de datos existente, luego inicie el servicio y la aplicación de
   migración. Nunca ejecute `docker compose down --volumes`, elimine el volumen antiguo ni inicialice una base de datos
   en blanco como parte de este cambio de nombre.

La marca no requiere conversión de datos. Las credenciales de la base de datos y la clave de cifrado siguen siendo
esenciales para leer los datos existentes. Se puede restaurar una implementación anterior utilizando su configuración y
volumen retenido; Evite escritores concurrentes.

## Autenticación y estado del navegador

El emisor JWT predeterminado ahora es `repovio`; inicie sesión nuevamente después de la actualización. Un emisor
configurado explícitamente también debe actualizarse deliberadamente. Las preferencias del navegador, el estado de las
notificaciones, las cookies y las claves de almacenamiento existentes no se importan. Seleccione su idioma/tema
nuevamente, reinstale la PWA si es necesario y vuelva a habilitar las notificaciones del navegador. Actualizar los
nombres para mostrar del proveedor de identidad y la configuración de la aplicación externa cuando corresponda; Las
rutas de devolución de llamada no cambian. Borre los datos obsoletos del sitio solo después de confirmar que la nueva
instalación funciona.

Revocar tokens MCP anteriores y crear reemplazos: el prefijo de token renombrado no se acepta intencionalmente como
alias.
