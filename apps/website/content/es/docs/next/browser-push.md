---
title: 'Empuje del navegador'
description: 'Habilite las notificaciones por dispositivo y comprenda los requisitos del servidor y del navegador.'
---

<a id="server-requirements"></a>

## Requisitos del servidor

La notificaciones push del navegador es un transporte nativo y no utiliza Apprise. El operador de implementación
configura las tres opciones:

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Genere un par de claves VAPID con `npx web-push generate-vapid-keys`. El asunto es un URI `mailto:` o `https:`. Mantenga
la clave privada en secreto. Sin la configuración completa, la notificaciones push del navegador se muestra como no
disponible. Utilice un contexto de navegador seguro y un navegador que admita trabajadores de servicios y Push API.

<a id="enable-or-disable-this-device"></a>

## Activar o desactivar este dispositivo

Abra la campana de la barra de la aplicación para activar o desactivar el push en este dispositivo. El control
comprueba la suscripción del navegador y su registro para la cuenta actual. Una suscripción existente no demuestra
que esta cuenta esté inscrita. Reintente tras un fallo de registro. Al cerrar sesión, reintente la limpieza del
dispositivo si falla o elija explícitamente continuar cerrando sesión.

Utilice **Habilitar en este dispositivo** y otorgue permiso de notificación al navegador cuando lo solicite. La
suscripción pertenece al usuario y navegador actual. Un administrador selecciona los usuarios destinatarios en un canal
de notificaciones push del navegador; Cada destinatario necesita un dispositivo habilitado. Rechazar el permiso del
navegador impide la suscripción; ajuste el permiso del navegador del sitio y vuelva a intentarlo si lo desea. Verifique
la disponibilidad/recuento de dispositivos y los errores reportados antes de enviar una prueba.

Al deshabilitar la inserción se elimina la suscripción de este dispositivo, no la de otros dispositivos. Los puntos
finales y las claves se cifran y se deduplican con una huella digital no secreta. Las respuestas HTTP 404/410 eliminan
las suscripciones caducadas. Un navegador no disponible, falta de configuración del servidor, permiso denegado o error
en la solicitud de suscripción requieren que se solucione la causa correspondiente; La actualización por sí sola no
puede otorgar permiso al navegador. Consulte [Historial de entrega](/docs/next/notification-history) para ver los
intentos.
