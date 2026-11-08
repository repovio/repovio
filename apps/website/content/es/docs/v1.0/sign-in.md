---
title: 'Iniciar sesión'
description: 'Utilice credenciales locales u OpenID Connect y finalice una sesión de forma segura.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="local-sign-in"></a>

## Inicio de sesión local

Abra `/auth/signin`, ingrese el nombre de usuario y la contraseña locales y seleccione **Iniciar sesión**. Espere hasta
que finalice la autenticación. Las credenciales rechazadas te dejan en el formulario; verifique el nombre de usuario y
pregunte al operador de implementación sobre
[recuperación de contraseña](/docs/v1.0/authentication#reset-a-forgotten-password). Repovio no tiene un flujo de
restablecimiento de contraseña de correo electrónico.

En su lugar, se abre una nueva instalación [Configuración de primera ejecución](/docs/v1.0/setup). Una vez autenticado,
la navegación y los resultados dependen de su función y de su membresía en el repositorio. Un panel vacío no significa
que el inicio de sesión haya fallado.

<a id="openid-connect"></a>

## Conexión OpenID

Cuando un administrador habilita OIDC, use el botón de inicio de sesión de proveedor adicional. Complete la
autenticación en la propia página del proveedor de identidad y deje que finalice la devolución de llamada. Una
asignación de grupo denegada, una transacción vencida o una falla del proveedor devuelven un error; iniciar un nuevo
intento de inicio de sesión. OIDC nunca vincula una cuenta local existente haciendo coincidir su correo electrónico.

El inicio de sesión OIDC es independiente de las conexiones del proveedor OAuth. Autentica a un usuario Repovio; no
conecta los repositorios GitHub, GitLab, Forgejo o Gitea. Los nombres y contraseñas administrados por identidad se deben
cambiar en el proveedor de identidad.

<a id="sign-out"></a>

## Cerrar sesión

Elija cerrar sesión en el menú de usuario. Cerrar sesión elimina la sesión del navegador sin eliminar repositorios,
cambiar las credenciales del proveedor ni modificar los recursos del proveedor. En un dispositivo compartido, cierre
sesión cuando haya terminado. Si una sesión de API caduca, inicie sesión nuevamente antes de volver a intentar la acción
fallida. El inicio de sesión con contraseña local permanece disponible cuando OIDC está habilitado.
