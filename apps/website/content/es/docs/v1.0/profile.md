---
title: 'Perfil'
description:
  'Cambie los nombres de las cuentas locales y el nombre de usuario con la verificación de la contraseña actual.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="edit-a-local-profile"></a>

## Editar un perfil local

Abra **Configuración → General**. Los usuarios locales pueden actualizar nombres y apellidos opcionales y su nombre de
usuario de inicio de sesión. Los nombres personales se utilizan como identidad de visualización preferida; el nombre de
usuario permanece disponible para una identificación inequívoca. Los campos tienen una longitud máxima de 255 caracteres
y el nombre de usuario no puede estar vacío.

Cambiar el nombre de usuario requiere la contraseña actual. Ingréselo en el formulario de perfil y seleccione guardar.
Los nombres por sí solos no requieren un cambio de nombre de usuario. Espere la solicitud; El guardado exitoso actualiza
la cuenta actual. Un nombre de usuario duplicado y una contraseña actual incorrecta producen diferentes errores de
validación. Corrija el campo afectado y vuelva a intentarlo.

<a id="identity-managed-accounts"></a>

## Cuentas administradas por identidad

Los usuarios de OIDC no pueden cambiar su nombre de usuario ni sus nombres de perfil localmente. Repovio sincroniza los
nombres de las afirmaciones de identidad verificadas al iniciar sesión correctamente. Cámbielos en el proveedor de
identidad y vuelva a iniciar sesión. El avatar sigue siendo editable por separado en
[Configuraciones de avatar](/docs/v1.0/avatar). Si la solicitud del perfil falla, vuelva a intentarlo después de la
recuperación de la API; no envíe contraseñas a través de canales de soporte.
