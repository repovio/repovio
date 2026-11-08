---
title: 'Autenticación'
description:
  'Configure la autenticación local, el inicio de sesión opcional de OpenID Connect y la recuperación de cuenta.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="first-run-setup"></a>

## Configuración de primera ejecución

Después de implementar una nueva instalación, abra su URL pública. Repovio redirige cada solicitud a `/auth/setup` hasta
que exista la primera cuenta. Ingrese un nombre y apellido opcionales, un nombre de usuario único y una contraseña con
al menos 12 caracteres. La cuenta se crea como administrador del sistema y se inicia sesión inmediatamente.

La instalación sólo puede tener éxito una vez. Una vez que existe el primer usuario, `/auth/setup` redirige a
`/auth/signin`. Las instalaciones existentes mantienen a sus usuarios actuales durante las actualizaciones y no muestran
la configuración nuevamente.

<a id="openid-connect-single-sign-on"></a>

## Inicio de sesión único de OpenID Connect

Repovio admite un proveedor OpenID Connect opcional además del inicio de sesión local. Un administrador del sistema lo
configura en **Configuración → Autenticación**. Este inicio de sesión es independiente del proveedor GitHub, GitLab,
Forgejo y Gitea OAuth: OIDC identifica un usuario Repovio, mientras que el proveedor OAuth solo otorga acceso de lectura
a los recursos del proveedor.

Establezca la URL de devolución de llamada API accesible externamente antes de configurar el proveedor:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Registre el valor de `OIDC_CALLBACK_URL` como URI de redireccionamiento permitido en el proveedor de identidad.
Configure su emisor, ID de cliente, secreto de cliente opcional, alcances y notificación de grupo en Repovio. La API
acepta el secreto del cliente al guardar, pero nunca devuelve su valor. Está cifrado en reposo con
`TOKEN_ENCRYPTION_KEY`. Guarde la configuración antes de usar **Verificar conexión**; los cambios no guardados
desactivan esa verificación. Confirme que el descubrimiento se realizó correctamente antes de confiar en el inicio de
sesión de OIDC.

Se requiere HTTPS para el emisor y sus puntos finales. **Permitir emisor HTTP** solo está destinado a redes de
laboratorio aisladas; nunca debe estar habilitado para una implementación accesible a Internet. El inicio de sesión con
contraseña local permanece disponible como ruta de recuperación incluso cuando OIDC está habilitado.

El formulario también muestra la URL de devolución de llamada para copiar, grupos configurados/observados y controles
separados para reemplazar o borrar el secreto del cliente almacenado. Dejar el reemplazo deshabilitado conserva el
secreto guardado. Los errores de carga, guardado y comprobación de conexión se informan por separado. Corrija la
configuración no válida y guárdela nuevamente antes de volver a intentar la verificación de conexión.

<a id="groups-roles-and-identities"></a>

### Grupos, roles e identidades

El reclamo de grupo puede ser un nombre de reclamo exacto o una ruta separada por puntos, como `realm_access.groups`.
Configure valores de grupo exactos que distingan entre mayúsculas y minúsculas para los tres roles Repovio. Si varios
grupos coinciden, Repovio aplica `SYSTEM_ADMIN`, luego `MANAGER` y luego `VIEWER`. Se rechazan las reclamaciones de
grupos no coincidentes, con formato incorrecto, faltantes o excesivamente grandes a menos que **Permitir usuarios no
coincidentes como espectadores** esté explícitamente habilitado.

Una cuenta OIDC está vinculada únicamente por el par de emisor y sujeto verificados. Repovio nunca vincula un inicio de
sesión de OIDC a una cuenta local mediante dirección de correo electrónico o nombre de usuario. Los nombres y apellidos
se sincronizan a partir de reclamos verificados en cada inicio de sesión exitoso; El nombre de inicio de sesión, los
nombres de perfil y la contraseña no se pueden cambiar localmente. Las membresías del repositorio permanecen
administradas en Repovio y nunca se derivan de grupos de proveedores de identidad.

Los cambios de configuración relacionados con la seguridad o los cambios de rol invalidan los tokens bearer de OIDC
existentes. Cambiar únicamente el nombre visible del proveedor no invalida esos tokens. Deshabilitar o eliminar un grupo
del proveedor de identidad impide que la cuenta afectada obtenga una nueva sesión e invalida sus sesiones anteriores
después del siguiente inicio de sesión denegado.

<a id="provider-examples"></a>

### Ejemplos de proveedores

Para Authentik, cree un proveedor OAuth2/OpenID con flujo de código de autorización, la URL de devolución de llamada
exacta anterior y los alcances `openid`, `profile` y `email`. Agregue una asignación de alcance que devuelva la
notificación del grupo elegido como una matriz de nombres de grupo, adjunte el proveedor a una aplicación y luego copie
el emisor, el ID del cliente y el secreto del cliente de la aplicación en Repovio.

Para otro proveedor que cumpla con los estándares, habilite el flujo de código de autorización, requiera S256 PKCE,
registre la URL de devolución de llamada exacta e incluya un `sub` estable más el reclamo de grupo configurado en el
token de identificación o la respuesta de información de usuario. Repovio solo acepta firmas de tokens de identificación
asimétricas y rechaza tokens sin firmar y firmados por HMAC.

<a id="oidc-api-contract"></a>

### Contrato API OIDC

| Método       | Camino                       | Acceso                    | Propósito                                                                            |
| ------------ | ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `GET`        | `/api/v1/auth/oidc/status`   | Público                   | Devuelve solo la disponibilidad efectiva y el nombre del proveedor opcional.         |
| `GET`        | `/api/v1/auth/oidc/start`    | Público                   | Inicia un código de autorización vinculado al navegador y una transacción S256 PKCE. |
| `GET`        | `/api/v1/auth/oidc/callback` | Público                   | Valida la respuesta del proveedor y redirecciona con un código de fragmento único.   |
| `POST`       | `/api/v1/auth/oidc/exchange` | Público                   | Consume el código del fragmento una vez y devuelve el portador normal `AuthResult`.  |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Administrador del sistema | Lee o actualiza la configuración segura de secretos OIDC.                            |
| `POST`       | `/api/v1/auth/oidc/check`    | Administrador del sistema | Comprueba la configuración de descubrimiento guardada sin cambiarla.                 |

La devolución de llamada nunca coloca un JWT portador en una URL. Su código de intercambio opaco caduca después de 60
segundos y solo se puede usar una vez. Los errores del proveedor se reducen a códigos de error estables antes de que
lleguen al navegador o a los registros.

<a id="change-your-password"></a>

## Cambia tu contraseña

Una vez que haya iniciado sesión, abra **Configuración → General → Cambiar contraseña**. Ingrese la contraseña actual,
la nueva contraseña y su confirmación. Repovio mantiene la sesión iniciada en el navegador actual con un token de acceso
de reemplazo e invalida los tokens mantenidos por cada otra sesión iniciada.

<a id="reset-a-forgotten-password"></a>

## Restablecer una contraseña olvidada

Repovio deliberadamente no restablece la contraseña mediante correo electrónico. Un administrador de implementación
puede restablecer una cuenta local desde el directorio que contiene `compose.yml`. Lea la contraseña de reemplazo sin
repetirla ni almacenarla en el historial del shell, luego envíela al contenedor API a través de la entrada estándar:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Reemplace `USERNAME` con el nombre de usuario de inicio de sesión exacto. El comando requiere una contraseña de entre 12
y 256 caracteres, actualiza solo esa cuenta local e invalida todos sus tokens de acceso existentes. Inicie sesión
nuevamente con la nueva contraseña después. El comando rechaza las cuentas administradas por OIDC porque no tienen
contraseña local.
