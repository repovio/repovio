---
title: 'Configuración de primera ejecución'
description: 'Cree el primer administrador local y comprenda la configuración única.'
---

<a id="before-setup"></a>

## Antes de la configuración

Implemente la API, la aplicación web y PostgreSQL mediante [Despliegue](/docs/next/deployment). Abra la URL de
instalación. Cuando no existe ningún usuario, Repovio dirige el navegador a `/auth/setup`. Las instalaciones existentes
conservan sus cuentas y, en su lugar, abren el inicio de sesión. El programa de instalación crea una cuenta local
Repovio, no una cuenta de proveedor.

<a id="create-the-administrator"></a>

## Crea el administrador

Ingrese un nombre y apellido opcionales, un nombre de usuario único, una contraseña y una confirmación de contraseña.
Las contraseñas requieren al menos 12 caracteres. Envíe el formulario de configuración una vez y espere la solicitud; La
configuración exitosa inicia sesión en el primer administrador del sistema. Los errores de validación dejan el
formulario disponible para su corrección. Si otro operador completó la configuración primero, continúe con
[Iniciar sesión](/docs/next/sign-in) con una cuenta existente.

<a id="continue-configuration"></a>

## Continuar configuración

Conecte un [cuenta de proveedor](/docs/next/provider-accounts), seleccione [repositorios](/docs/next/repositories) e
inspeccione [trabajos de sincronización](/docs/next/guide-jobs). Se pueden crear usuarios locales a través de la API
protegida; la página Usuarios enumera las cuentas y administra la eliminación y el acceso a MCP. Alternativamente,
configure [OIDC](/docs/next/authentication) para cuentas administradas por proveedores de identidades. Los nuevos no
administradores necesitan membresías explícitas en el repositorio.

Si la configuración falla, verifique la disponibilidad de la API/base de datos y los registros de implementación sin
publicar las credenciales. No reinicie la base de datos para repetir la configuración. Consulte
[Recuperación de contraseña](/docs/next/authentication#reset-a-forgotten-password) para conocer un administrador local
existente.

<a id="local-user-and-group-management"></a>

## Crear y restablecer cuentas locales

En Administración → Usuarios, elija Nuevo usuario en la barra. Indique nombre único, nombres opcionales, contraseña de
12–256 caracteres y confirmación, y rol; el valor inicial es Viewer. También funciona con OIDC activo. Las identidades
OIDC se crean mediante su proveedor y nunca se vinculan por coincidencia de nombre local.

[Grupos de acceso locales](/docs/next/users#local-access-groups)
