---
title: 'Configuración del sistema'
description: 'Configure políticas de retención independientes y el formato de fecha/hora predeterminado.'
---

<a id="administrator-access"></a>

## Acceso de administrador

Solo los administradores del sistema pueden abrir **Configuración → Sistema**. La carga muestra un esqueleto; una carga
fallida proporciona un error y un reintento en lugar de valores predeterminados editables inferidos de los datos
faltantes. Espere la solicitud de configuración antes de guardar los cambios.

<a id="retention-defaults"></a>

## Valores predeterminados de retención

Establezca períodos de retención predeterminados separados para ejecuciones de flujos de trabajo, problemas y
solicitudes de extracción. Cada valor debe ser de 1 a 3650 días. Un repositorio puede anular cada valor correspondiente
de forma independiente; una anulación de repositorio vacío restaura el valor predeterminado del sistema. La retención
afecta el historial almacenado localmente, no los registros del lado del proveedor. Acortar la retención puede eliminar
datos almacenados más antiguos, así que verifique primero los requisitos de informes e investigación.

Los controles de seguimiento y retención del repositorio están documentados en [Repositorios](/docs/next/repositories).
Una fila histórica faltante puede reflejar retención en lugar de una sincronización fallida del proveedor.

<a id="datetime-formatting"></a>

## Formato de fecha/hora

Establezca el formato de fecha/hora predeterminado e inspeccione su vista previa en vivo antes de guardar. La selección
de configuración regional aún controla el texto traducido de la interfaz y el formato sensible a la configuración
regional. Guardar una vez; El éxito y los errores de validación/API se informan por separado. Vuelva a intentarlo
después de la corrección o recuperación de API. Una preferencia de formato nunca cambia las marcas de tiempo del
proveedor original.
