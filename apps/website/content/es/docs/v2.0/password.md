---
title: 'Contraseña'
description: 'Cambie una contraseña local y comprenda la invalidación y recuperación de sesiones.'
---

<a id="change-a-password"></a>

## Cambiar una contraseña

Para una cuenta local, abra **Configuración → General → Cambiar contraseña**. Ingrese la contraseña actual, una nueva
contraseña de 12 a 256 caracteres y la confirmación correspondiente. Envíelo una vez y espere a que se complete. Se debe
corregir una contraseña actual no válida, una contraseña corta o una confirmación que no coincide antes de volver a
intentarlo.

Un cambio exitoso devuelve un token de reemplazo para el navegador actual e invalida las otras sesiones existentes de la
cuenta. Otros dispositivos deben iniciar sesión nuevamente con la nueva contraseña. Esto cambia solo la cuenta Repovio,
no las PAT del proveedor, las credenciales de OAuth, las credenciales de notificación o la configuración del token MCP.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC y contraseñas olvidadas

Las cuentas administradas por OIDC no tienen un formulario de contraseña local. Cambie la contraseña del proveedor de
identidad en ese proveedor. Repovio deliberadamente no tiene un flujo de reinicio basado en correo electrónico. Un
operador de implementación puede utilizar el documento
[comando de recuperación local](/docs/v2.0/authentication#reset-a-forgotten-password); rechaza cuentas OIDC e invalida
sesiones existentes. Nunca coloque una contraseña de reemplazo en el historial del shell ni en un informe de problemas.

<a id="local-user-and-group-management"></a>

## Crear y restablecer cuentas locales

La acción de fila Restablecer contraseña permite al administrador fijar una nueva sin conocer la anterior. Escriba
contraseña y confirmación. Las sesiones JWT anteriores dejan de funcionar; cambiar la propia cierra la sesión. No
aparece para cuentas OIDC. Los tokens MCP se conservan.

[Grupos de acceso locales](/docs/v2.0/users#local-access-groups)
