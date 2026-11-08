---
title: 'Implementación de Repovio'
description:
  'Guía de implementación de producción, proxy TLS, copia de seguridad, restauración, actualización y reversión para
  Repovio.'
---

> Instantánea de origen archivada. Las etiquetas de los productos se han normalizado a Repovio. Para esta versión
> histórica, utilice los identificadores de configuración y las referencias de contenedor de sus archivos de
> implementación etiquetados sin cambios.

La pila Compose de Repovio inicia PostgreSQL, aplica las migraciones de Prisma una vez y luego inicia la API y las
aplicaciones web. No finaliza TLS. Coloque los servicios web y API detrás de un proxy inverso que posea el nombre de
host público y los certificados.

<a id="prerequisites"></a>

## Requisitos previos

- Motor Docker con Docker Compose v2.
- Un registro DNS para el nombre de host público.
- Un proxy inverso que obtiene y renueva certificados TLS.
- Un directorio de servidor privado legible solo por los administradores de implementación.

La pila de Compose conserva los datos de PostgreSQL, incluidas las imágenes de perfil de usuario normalizadas, en su
volumen PostgreSQL configurado en el archivo de Compose etiquetado. No elimine este volumen a menos que desee eliminar
intencionalmente todos los datos de Repovio.

<a id="first-deployment"></a>

## Primera implementación

### Paso 1: consulte una versión publicada de Repovio y cree el archivo de entorno privado:

```bash
cp .env.example .env
chmod 600 .env
```

### Paso 2: Reemplace todos los marcadores de posición en `.env`, especialmente `POSTGRES_PASSWORD`, ambas URL de la base de datos, `AUTH_JWT_SECRET` y

`TOKEN_ENCRYPTION_KEY`. Genere la clave de cifrado con:

```bash
openssl rand -base64 32
```

### Paso 3: Establezca las URL visibles externamente. Para una implementación en `https://repovio.example.com`, utilice:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Paso 4: Vincular los puertos del contenedor al loopback cuando el proxy inverso se ejecute en el mismo host:

Utilice las variables API y de puerto web en `.env.example` de la versión, con valores `127.0.0.1:3001` y
`127.0.0.1:3000` respectivamente. Los nombres de las variables históricas difieren de las versiones actuales de Repovio.

De lo contrario, restrinja el acceso a los puertos 3000 y 3001 con el firewall del host. Nunca exponga el contenedor
PostgreSQL.

### Paso 5: Establezca la variable de selección de publicación del `.env.example` etiquetado en `.env` en un par de imágenes publicadas exactas, luego inicie la pila:

```bash
docker compose pull
docker compose up --detach --wait
```

Mantenga ese valor en `.env` para que cada comando de redacción posterior utilice la misma API y versión web.

### Paso 6: Confirme el punto final de estado de la API localmente:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Paso 7: Abra la URL pública Repovio y complete el [configuración única de primera ejecución](/docs/v1.0/authentication) para crear el primero

administrador del sistema.

<a id="reverse-proxy-and-tls"></a>

## Proxy inverso y TLS

Proporcione el origen web público al puerto 3000 y las rutas API y Socket.IO al puerto 3001. Por ejemplo, un bloque de
sitio Caddy puede usar:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

El proxy debe redirigir HTTP a HTTPS, validar las conexiones ascendentes de acuerdo con su política local y preservar el
nombre de host público. Configure los proveedores OAuth con la misma URL de devolución de llamada HTTPS configurada en
`OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## Actualización

Utilice la configuración exacta y las referencias de imágenes enviadas con esta versión histórica. Las instrucciones
actuales de actualización de marca se aplican solo cuando se pasa a una versión más reciente de Repovio; nunca copie
identificadores de configuración renombrados en un archivo Compose más antiguo.

### Paso 1: Cree y verifique una copia de seguridad de la base de datos antes de cambiar las imágenes.

### Paso 2: Establezca la variable de selección de versión del `.env.example` etiquetado a la versión de lanzamiento exacta en `.env`.

### Paso 3: Tire y aplique el liberador:

```bash
docker compose pull
docker compose up --detach --wait
```

El servicio `migrate` se aplica a las migraciones de Prisma pendientes antes de que se inicie la API. Inspeccionarlo
después de cada actualización:

```bash
docker compose logs migrate
```

### Paso 4: Verifique el punto final de estado y el panel de control servido por proxy antes de considerar que la actualización se ha completado.

<a id="database-backup"></a>

## Copia de seguridad de la base de datos

Ejecute copias de seguridad desde el directorio de implementación. Esto escribe un volcado de formato personalizado
PostgreSQL en el host sin imprimir las credenciales ni colocarlas en la línea de comando:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Almacene copias cifradas fuera del host y pruebe periódicamente las restauraciones en un sistema separado.

<a id="database-restore"></a>

## Restauración de base de datos

La restauración reemplaza los objetos de la base de datos actual. Primero realice una nueva copia de seguridad y
programe un tiempo de inactividad.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Luego, verifique `docker compose logs migrate` y el punto final de estado de la API. Restaure un volcado realizado por
una versión compatible de Repovio al revertir cambios de esquema.

<a id="rollback"></a>

## Revertir

### Paso 1: Mantenga la copia de seguridad realizada inmediatamente antes de la actualización fallida.

### Paso 2: Establezca la variable de selección de versión del `.env.example` etiquetado en `.env` a la última versión de imagen en buen estado conocida.

### Paso 3: Ejecute `docker compose pull` y `docker compose up --detach --wait`.

### Paso 4: Si la versión más reciente migró la base de datos de manera incompatible, detenga la API y la web, restaure la copia de seguridad compatible y luego

inicie nuevamente la versión de la imagen anterior.

Nunca utilice `docker compose down --volumes` como comando de actualización o reversión: elimina el volumen denominado
PostgreSQL.
