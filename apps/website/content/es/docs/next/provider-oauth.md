---
title: 'Configuración del proveedor OAuth'
description: 'Registre las aplicaciones OAuth y configure la autenticación de proveedor de solo lectura para Repovio.'
---

Las instrucciones PAT/OAuth de esta página usan webhooks por repositorio. Las conexiones GitHub App usan un webhook
central y se configuran desde su diálogo.

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

[Configurar GitHub App](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## Ciclo de vida de las conexiones GitLab

Registre una aplicación OAuth confidencial de GitLab con la URL de retorno exacta y los permisos de lectura indicados
arriba. Guarde el secreto del cliente en el entorno de la API. Solo la instancia GitLab configurada puede utilizar esta
aplicación; otra instancia necesita una configuración de despliegue correspondiente.

Para una cuenta de proveedor nueva, elija **Añadir proveedor**, GitLab y OAuth, y complete el consentimiento. En una
conexión GitLab existente, elija **Conectar con GitLab OAuth** para convertirla sin reemplazarla. Las conexiones OAuth
administradas ofrecen **Volver a autorizar**. La conversión vincula el ID numérico del usuario de GitLab; las
autorizaciones posteriores deben utilizar el mismo usuario, aunque cambie su nombre. Se conservan el ID, el nombre
actual y el estado habilitado de la cuenta de proveedor, los repositorios seguidos, las membresías, la configuración y
el historial. Cancelar o fallar el consentimiento no modifica la conexión existente.

Las conexiones existentes sin metadatos de renovación guardados requieren una nueva autorización. Repovio no puede
distinguir estos tokens OAuth antiguos de los PAT, por lo que una actualización no los reclasifica ni convierte
automáticamente.

<a id="gitlab-token-recovery"></a>

## Rotación de tokens y recuperación

Repovio cifra juntos los tokens de acceso y renovación y renueva automáticamente los de acceso cuando quedan 60 segundos
o menos. Cada rotación correcta reemplaza el par anterior. Un rechazo de renovación con `invalid_grant` indica que la
conexión necesita autorización y detiene nuevos intentos automáticos hasta que esta tenga éxito. Use **Volver a
autorizar**; no es necesario eliminar y recrear la conexión.

Los errores de red, tiempos de espera, límites de solicitudes y errores del servidor utilizan los reintentos y las
esperas existentes. Restaure la configuración del cliente si falta; cambiar su identidad requiere una nueva
autorización, y una instancia diferente se rechaza. Nunca se muestran credenciales ni errores sin procesar del
proveedor. Si GitLab rota los tokens pero se pierde la respuesta o falla la confirmación de la base de datos, los tokens
anteriores pueden ser inválidos. Vuelva a autorizar para recuperarse; PostgreSQL y GitLab no pueden confirmar esta
operación de forma atómica.

<a id="gitlab-oauth-rollout"></a>

## Despliegue y reversión

Aplique primero la migración aditiva de la base de datos y después despliegue versiones correspondientes de la API y la
web. Conserve las columnas añadidas al revertir la aplicación. Las versiones anteriores no renuevan automáticamente los
tokens OAuth de GitLab, y una reversión no restaura tokens que GitLab ya haya invalidado.
