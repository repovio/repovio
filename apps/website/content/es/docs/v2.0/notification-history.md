---
title: 'Historial de entrega'
description: 'Inspeccione los resultados de las notificaciones y los detalles de entrega segura por intento.'
---

<a id="review-deliveries"></a>

## Revisar entregas

Solo los administradores del sistema pueden abrir **Notificaciones → Historial de entrega**. La tabla distingue las
entregas de eventos de las pruebas y muestra el tipo de evento, el repositorio, el enlace del sujeto/proveedor, el
canal, el estado, el recuento de intentos, el siguiente intento y el error final saneado. Filtre por tipo/estado y
utilice clasificación, controles de columnas y paginación.

Abra una entrega por su asunto, solicitante cuando esté presente, canal, estado y marca de tiempo por intento, etiqueta
de dispositivo y error. Los secretos, los destinos de transporte sin procesar y las credenciales de proveedores nunca se
devuelven. Las entregas push del navegador pueden contener intentos para dispositivos suscritos por separado.

<a id="interpret-outcomes"></a>

## Interpretar los resultados

El tiempo pendiente/reintento describe un trabajo de entrega duradero, no una cola de flujo de trabajo del proveedor. Un
intento exitoso confirma que el transporte aceptó la entrega; una falla requiere una investigación de la configuración
del canal y del servicio de destino. No hay acciones de repetición, cancelación o reintento manual en esta vista del
historial. Corrija el [canal](/docs/v2.0/notifications) y utilice su acción de prueba para verificar la configuración.

Una tabla vacía puede reflejar filtros o no haber entregas retenidas. Una solicitud de lista/detalle fallida se muestra
por separado; Vuelva a intentarlo después de la recuperación. La sincronización inicial puede producir intencionalmente
entregas sin ciclo de vida. El enlace externo del asunto abre el contexto del proveedor sin otorgar acceso de escritura
a Repovio.
