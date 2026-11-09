---
title: 'Autenticación'
description: 'Configure la autenticación local, el inicio de sesión opcional de OpenID Connect y la recuperación de cuenta.'
---

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

El claim de grupos puede ser un nombre exacto o una ruta con puntos como `realm_access.groups`. Use valores exactos que
distingan mayúsculas. Con varias coincidencias, la prioridad es `SYSTEM_ADMIN`, después `MANAGER` y `VIEWER`. Los grupos
ausentes o sin coincidencia se rechazan salvo que se active explícitamente el acceso Viewer sin coincidencia. Los claims
malformados y excesos de grupos siempre se rechazan.

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

Guías de proveedores: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Para Authentik, cree un proveedor OAuth2/OpenID con flujo de código de autorización, la URL de devolución de llamada
exacta anterior y los alcances `openid`, `profile` y `email`. Agregue una asignación de alcance que devuelva la
notificación del grupo elegido como una matriz de nombres de grupo, adjunte el proveedor a una aplicación y luego copie
el emisor, el ID del cliente y el secreto del cliente de la aplicación en Repovio.

Para otro proveedor que cumpla con los estándares, habilite el flujo de código de autorización, requiera S256 PKCE,
registre la URL de devolución de llamada exacta e incluya un `sub` estable más el reclamo de grupo configurado en el
token de identificación o la respuesta de información de usuario. Repovio solo acepta firmas de tokens de identificación
asimétricas y rechaza tokens sin firmar y firmados por HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

En la consola de Keycloak, cree el realm repovio y un cliente OpenID Connect repovio. Active Client authentication y
Standard flow; desactive Implicit flow y Direct access grants. Registre el callback exacto inferior en Valid redirect
URIs, exija S256 y mantenga RS256. Copie el secreto desde Credentials.

En el scope dedicado del cliente, añada un mapper Group Membership: Token Claim Name groups, Full group path desactivado
y Add to ID token activado. Añada profile y email como scopes predeterminados. Cree repovio-admins, repovio-managers y
repovio-viewers, asigne usuarios y vincule los nombres completos a sus roles en Repovio. Los roles del realm no son
pertenencias a grupos.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

Referencias: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

En Entra ID → App registrations, registre una aplicación de un solo tenant con plataforma Web y el callback exacto
inferior, sin emisión implícita de tokens. Copie Application (client) ID y Directory (tenant) ID. Cree un secreto de
cliente y copie Value, no su ID. Use el tenant en el issuer v2; no common ni organizations.

En Token configuration, añada groups a los ID tokens para grupos de seguridad usando Group ID. Cree tres grupos, asigne
usuarios y vincule sus identificadores de objeto a SYSTEM_ADMIN, MANAGER y VIEWER. Los nombres visibles no coinciden con
los GUID. El filtrado de grupos asignados puede requerir una licencia Entra adecuada. Use S256 PKCE y firmas
asimétricas; renueve el secreto antes de caducar.

Repovio rechaza los indicadores de exceso de grupos incluso con acceso Viewer para usuarios sin coincidencia. No sigue
fuentes externas de claims ni consulta Microsoft Graph. Reduzca las pertenencias emitidas o filtre grupos; conceder
permisos Graph no lo soluciona.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

Referencias:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Cree una Regular Web Application, registre el callback exacto en Allowed Callback URLs, active Authorization Code con
S256 PKCE y elija RS256. Establezca Token Endpoint Authentication Method en Basic. Copie client ID y secreto. Use el
issuer de discovery del tenant o dominio personalizado con la barra final; no mezcle dominios.

Cree una Action Login / Post Login con el ejemplo inferior, sustituya REPLACE_WITH_REPOVIO_CLIENT_ID, despliéguela y
añádala al Login flow. Un administrador debe configurar app_metadata.repovio_groups de cada usuario como un array con
repovio-admins, repovio-managers o repovio-viewers; no use user_metadata modificable por el usuario. Auth0 no emite
estos grupos automáticamente; un claim solo en el access token no basta. En Repovio, use el nombre completo del claim
namespaced y vincule los tres valores a sus roles.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

Referencias: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Validación y diagnóstico

Para cada proveedor, registre OIDC_CALLBACK_URL exactamente, solicite openid profile email y use Authorization Code con
S256 PKCE y firma asimétrica. Guarde issuer, client ID, secreto, scopes y claim de grupos en Configuración →
Autenticación y compruebe la conexión. Discovery no comprueba los grupos de un usuario.

Pruebe SYSTEM_ADMIN, MANAGER, VIEWER y un usuario sin asignación, que debe ser rechazado con el acceso Viewer sin
coincidencia desactivado. Revise nombres exactos, rutas Keycloak, IDs Entra y el claim namespaced de Auth0 en el ID
token. Conserve un administrador local. Los grupos OIDC solo otorgan roles globales; los repositorios requieren permisos
Repovio independientes. Configure un único proveedor a la vez.

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

<a id="local-user-and-group-management"></a>

## Grupos de acceso locales

En Acceso de grupos del repositorio asigne Viewer o Manager y cambie o retire el permiso. Los permisos directos y
heredados se combinan; Manager prevalece. La gestión sigue requiriendo rol global Manager; los administradores tienen
acceso total. La retirada se aplica en la siguiente solicitud salvo otro permiso vigente. Los grupos admiten cuentas
locales y OIDC, sin sincronización de claims OIDC.

[Grupos de acceso locales](/docs/next/users#local-access-groups)
