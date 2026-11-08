---
title: 'Configuración de primera ejecución'
description: 'Cree el primer administrador local y comprenda la configuración única.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="before-setup"></a>

## Antes de la configuración

Implemente la API, la aplicación web y PostgreSQL mediante [Despliegue](/docs/v1.0/deployment). Abra la URL de
instalación. Cuando no existe ningún usuario, Repovio dirige el navegador a `/auth/setup`. Las instalaciones existentes
conservan sus cuentas y, en su lugar, abren el inicio de sesión. El programa de instalación crea una cuenta local
Repovio, no una cuenta de proveedor.

<a id="create-the-administrator"></a>

## Crea el administrador

Ingrese un nombre y apellido opcionales, un nombre de usuario único, una contraseña y una confirmación de contraseña.
Las contraseñas requieren al menos 12 caracteres. Envíe el formulario de configuración una vez y espere la solicitud; La
configuración exitosa inicia sesión en el primer administrador del sistema. Los errores de validación dejan el
formulario disponible para su corrección. Si otro operador completó la configuración primero, continúe con
[Iniciar sesión](/docs/v1.0/sign-in) con una cuenta existente.

<a id="continue-configuration"></a>

## Continuar configuración

Conecte un [cuenta de proveedor](/docs/v1.0/provider-accounts), seleccione [repositorios](/docs/v1.0/repositories) e
inspeccione [trabajos de sincronización](/docs/v1.0/guide-jobs). Se pueden crear usuarios locales a través de la API
protegida; la página Usuarios enumera las cuentas y administra la eliminación y el acceso a MCP. Alternativamente,
configure [OIDC](/docs/v1.0/authentication) para cuentas administradas por proveedores de identidades. Los nuevos no
administradores necesitan membresías explícitas en el repositorio.

Si la configuración falla, verifique la disponibilidad de la API/base de datos y los registros de implementación sin
publicar las credenciales. No reinicie la base de datos para repetir la configuración. Consulte
[Recuperación de contraseña](/docs/v1.0/authentication#reset-a-forgotten-password) para conocer un administrador local
existente.
