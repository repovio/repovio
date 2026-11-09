---
title: 'Configurar GitHub App'
description: 'Registra y conecta tu GitHub App con credenciales cifradas y acceso de instalación de solo lectura.'
---

<a id="register-app"></a>

## Registrar la aplicación

Usa una GitHub App por instalación de Repovio; PAT y OAuth siguen disponibles. Como propietario, abre Settings,
Developer settings, GitHub Apps y New GitHub App. Elige un nombre único y la página de Repovio. Selecciona Any account
para varios usuarios u organizaciones; una aplicación privada solo se instala en su cuenta propietaria. No se necesitan
secreto de cliente OAuth, URL de retorno ni URL de configuración.

<a id="permissions-and-events"></a>

## Permisos y eventos

Configura los permisos básicos siguientes como Read-only; Metadata se concede automáticamente. Añade los permisos de
seguridad opcionales solo cuando sean necesarios y estén disponibles. Suscríbete a los eventos indicados; GitHub envía
automáticamente los eventos de instalación. Repovio limita los tokens generados a lectura, aunque la aplicación tenga
más permisos.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (vulnerability_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Configurar Repovio

Activa los webhooks y usa el endpoint HTTPS público siguiente. PUBLIC_URL debe señalar a tu instalación accesible
externamente. Genera un secreto aleatorio de al menos 16 caracteres y configura el mismo valor en GitHub y Repovio.
Genera una clave privada RSA en GitHub y descarga el archivo PEM. En Administración, Cuentas de proveedor, GitHub App,
introduce ID, slug, clave completa y secreto; verifica y guarda. La API valida la identidad y cifra ambos secretos en
PostgreSQL. Protege la clave de cifrado de la instalación; los secretos guardados nunca vuelven al navegador.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Instalar y conectar

Instala desde el enlace de GitHub y selecciona la cuenta u organización y solo los repositorios necesarios. Regresa,
actualiza las instalaciones y conecta la cuenta elegida. No se pueden volver a conectar instalaciones suspendidas o ya
conectadas. La lista se obtiene desde la aplicación configurada; no se confía en IDs recibidos por callbacks. Añade los
repositorios desde su pantalla. Los tokens se renuevan automáticamente; la importación inicial y el sondeo periódico
complementan los webhooks.

Cambia el nombre local antes de conectar si coincide con el de una cuenta PAT u OAuth existente.

<a id="rotate-and-disconnect"></a>

## Rotar y desconectar

Genera una clave de reemplazo en GitHub, guárdala y comprueba la sincronización antes de borrar la anterior. Cambia el
secreto del webhook en ambos lados juntos; las firmas antiguas dejan de aceptarse inmediatamente. Los campos vacíos
conservan los secretos. Elimina las cuentas conectadas antes de sustituir la identidad o borrar la configuración;
también se eliminan sus datos dependientes, por lo que debes exportarlos antes. La eliminación local no desinstala la
aplicación en GitHub.

<a id="troubleshooting"></a>

## Resolver problemas

Comprueba ID, slug y formato PEM si falla la configuración. Para firmas inválidas, revisa secreto, HTTPS y conservación
del cuerpo original por el proxy. Si no aparecen repositorios, revisa selección y permisos y actualiza las
instalaciones. Las instalaciones suspendidas o eliminadas conservan los datos; restaura el acceso y actualiza. La falta
de permisos de seguridad opcionales no bloquea otras áreas. Consulta Jobs. El sondeo continúa si fallan los webhooks.
Las pruebas simuladas no verifican una instalación real en GitHub.

## Consulta también

- [Cuentas de proveedor](/docs/next/provider-accounts)
- [Configurar OAuth](/docs/next/provider-oauth)
- [Webhooks del proveedor](/docs/next/provider-webhooks)
