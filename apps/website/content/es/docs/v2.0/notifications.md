---
title: 'Canales de notificación'
description: 'Cree destinos de notificación globales, suscríbase a eventos y pruebe la entrega.'
---

<a id="access-and-channel-list"></a>

## Acceso y lista de canales

Abra **Operaciones → Notificaciones → Canales**. Los canales son la configuración global Repovio, no la configuración
del administrador propiedad del repositorio. Los administradores del sistema crean, editan, prueban,
habilitan/deshabilitan y eliminan canales. El estado de administrador del repositorio no otorga administración del
canal. La tabla muestra el nombre, el tipo, los metadatos de destino seguro, los eventos suscritos, el estado habilitado
y la hora de actualización; utilice filtros de tipo/habilitados, clasificación, controles de columnas y paginación.

<a id="create-a-destination"></a>

## Crear un destino

Elija **Agregar canal**, ingrese un nombre, seleccione un tipo y configure el destino:

- **Correo electrónico:** Host/puerto SMTP, seguridad de transporte, remitente, autenticación opcional y destinatarios.
- **Gotify:** URL del servidor, token de aplicación y prioridad.
- **ntfy:** servidor, tema, autenticación/token opcional y prioridad.
- **Discord:** destino del webhook.
- **URL Apprise personalizada:** una URL de servicio Apprise compatible.
- **Notificaciones push del navegador:** usuarios destinatarios; cada destinatario debe habilitar
  [su dispositivo](/docs/v2.0/browser-push).

Configure [suscripciones a eventos y vista previa](/docs/v2.0/notification-rules) en el mismo cuadro de diálogo. Guarde
y espere la solicitud antes de cerrar. Fallos de validación o guardado dejan el formulario disponible para su
corrección.

<a id="edit-test-and-remove"></a>

## Editar, probar y eliminar

El destino está cifrado en reposo. Puede guardarlo, pero no puede volver a leerlo. La edición conserva sus credenciales
almacenadas a menos que se seleccione **Reemplazar configuración de destino**. El tipo de canal no se puede cambiar; En
su lugar, cree un nuevo canal. Un canal migrado marcado**Requiere reconfiguración** no se puede volver a habilitar hasta
que se reemplace su destino. Los canales de notificaciones push del navegador utilizan suscripciones de usuarios y
rechazan un secreto de destino de transporte.

Utilice la acción de prueba de fila para enviar una notificación real al destino configurado; no modifica los datos del
proveedor. Revise el resultado en [Historial de entrega](/docs/v2.0/notification-history). Deshabilite un canal para
pausar la entrega o elimínelo cuando ya no sea necesario. La eliminación se ejecuta inmediatamente. Nunca pegue
credenciales en capturas de pantalla o informes de soporte.

El correo electrónico, Gotify, ntfy, Discord y los destinos personalizados utilizan la CLI Apprise incluida en la API;
No se requiere un servidor Apprise independiente. Si falla una solicitud, vuelva a intentarlo después de la recuperación
de la API. Una lista vacía significa que ningún canal configurado visible coincide con los filtros; borrar los filtros o
crear un canal. Los detalles del error de entrega solo contienen errores desinfectados.
