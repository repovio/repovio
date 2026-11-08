---
title: 'Configuración del proveedor OAuth'
description: 'Registre las aplicaciones OAuth y configure la autenticación de proveedor de solo lectura para Repovio.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

Repovio conecta cuentas de proveedores a través de OAuth o un token de acceso personal (PAT). OAuth está disponible
cuando se configura al menos un cliente de proveedor OAuth. Sin ningún cliente OAuth configurado, la pantalla de cuenta
del proveedor solo ofrece autenticación PAT. Repovio utiliza cualquiera de las credenciales resultantes solo para las
API de su proveedor de solo lectura y las cifra antes de escribirlas en PostgreSQL.

<a id="register-oauth-applications"></a>

## Registrar aplicaciones OAuth

Registre una aplicación OAuth para cada instancia de proveedor que deba conectarse Repovio. Establezca la URL de
devolución de llamada exacta de `OAUTH_CALLBACK_URL` en cada registro de aplicación. Para una instalación local, el
valor predeterminado es `http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Configure el ID del cliente y el secreto del cliente en el entorno API, nunca en la aplicación web o Git:

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

Configure solo los proveedores que necesita esta instalación. Los ID de cliente y los secretos siempre deben
configurarse como pares. `GITLAB_OAUTH_BASE_URL` identifica la instancia única de GitLab para la aplicación OAuth
instalada. Forgejo necesita una URL base explícita cuando se configura su cliente OAuth.

<a id="read-scopes"></a>

## Leer alcances

Utilice estos ámbitos al registrar la aplicación:

- GitHub: `repo security_events`. Las cuentas OAuth existentes deben volver a autorizarse antes de que Repovio pueda
  leer las alertas de seguridad.
- GitLab: `read_api read_user`.

Los tokens de acceso personal precisos GitHub necesitan acceso de lectura a las alertas de Dependabot, alertas de
escaneo de códigos y alertas de escaneo secreto. El acceso a las alertas de seguridad GitLab depende además de la
licencia de la instancia y la función del proyecto del propietario del token; Los tipos de alerta no disponibles se
muestran sin fallar en otros ámbitos de sincronización del repositorio.

- Forgejo: `read:repository`.
- Gitea: configurar un token de acceso personal con acceso de lectura en el formulario cuenta-proveedor Gitea,
  incluyendo la URL base de la instancia. Actualmente, Repovio no ofrece un cliente Gitea OAuth compartido porque cada
  instancia autohospedada necesita su propio registro de aplicación.

Los adaptadores de Repovio solo exponen validación, descubrimiento, sincronización de flujo de trabajo y verificación de
webhook. No crean, actualizan, envían, vuelven a ejecutar, cancelan ni eliminan recursos del proveedor. Los secretos del
cliente OAuth permanecen en el entorno API y la API Repovio nunca devuelve los tokens del proveedor.
