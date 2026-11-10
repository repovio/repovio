---
title: 'Repositorios'
description:
  'Realice un seguimiento de los repositorios, inspeccione la actividad y configure la sincronización y el acceso
  locales.'
---

<a id="browse-and-open-details"></a>

## Explorar y abrir detalles

Abra un repositorio desde la tabla para navegar por Resumen, Ejecuciones de workflows, Issues, Pull requests, Alertas
de seguridad y Configuración. Las páginas de actividad conservan el ámbito del repositorio y ofrecen filtros,
ordenación, paginación y navegación por filas. Las alertas requieren permisos de gestión; Configuración solo está
disponible para administradores del sistema. El enlace del proveedor abre el repositorio externo.

Resumen muestra información general, retención, última sincronización, antigüedad de los datos, intervalo, trabajo
actual y actividad reciente. Los trabajos pendientes o en curso muestran progreso y errores clasificados sin secretos.

<a id="add-and-maintain-tracking"></a>

## Agregar y mantener seguimiento

Sólo los administradores del sistema agregan repositorios. Seleccione una cuenta de proveedor habilitada, espere el
descubrimiento y seleccione uno o más repositorios sin seguimiento. Se excluyen los repositorios ya rastreados. Si parte
de una adición múltiple falla, las selecciones exitosas permanecen agregadas y solo quedan para volver a intentar las
selecciones fallidas. Una lista de proveedores vacía requiere conectar primero un
[cuenta de proveedor](/docs/next/provider-accounts) habilitado.

Los administradores pueden habilitar/deshabilitar el seguimiento, **Actualizar datos del proveedor** y poner en cola una
sincronización de solo lectura. La identidad del repositorio utiliza la cuenta del proveedor y el ID del repositorio
estable del proveedor. Los cambios de nombre/transferencias conservan el historial, los filtros, las membresías y los
canales; La actualización de metadatos rechaza una ID diferente en la ruta anterior en lugar de reasignarla. Los
repositorios deshabilitados conservan los datos almacenados pero dejan de participar en la sincronización.

<a id="repository-settings-sections"></a>

## Secciones de configuración del repositorio

La configuración del repositorio ofrece cinco pestañas secundarias. Cada sección utiliza todo el ancho disponible y los campos se apilan en pantallas estrechas. Los enlaces se pueden compartir y restaurar al recargar o usar Atrás/Adelante. General es la selección predeterminada.

| Sección          | Finalidad                                 | Dirección                    |
| ---------------- | ----------------------------------------- | ---------------------------- |
| General          | Plazos de retención                       | `/repositories/:id/settings` |
| Webhook          | Configuración del webhook del repositorio | `?tab=webhook`               |
| Filtros de flujo | Patrones de permiso y exclusión           | `?tab=workflow-filters`      |
| Miembros         | Acceso directo de usuarios y roles        | `?tab=members`               |
| Acceso de grupos | Acceso adicional de grupos locales        | `?tab=groups`                |

Los datos sin guardar y las solicitudes pendientes se conservan al cambiar de pestaña durante la misma visita. Al salir de la configuración o cambiar de repositorio se descartan los borradores, incluidos los secretos de webhook generados. Use la acción de guardar o asignar de cada sección para conservar los cambios.

El diálogo de detalles rápidos se ha eliminado. Los enlaces antiguos `?repository=` abren el resumen. Las páginas completas conservan actualización, sincronización, enlaces del proveedor y eliminación local. Cambiar la URL no concede acceso a la configuración a lectores ni gestores.

<a id="retention-filters-and-memberships"></a>

## Retención, filtros y membresías

Los administradores establecen anulaciones de retención de solicitudes de extracción, problemas y ejecución de flujo de
trabajo independientes, cada una de 1 a 3650 días. Un valor vacío restaura el
[valor predeterminado del sistema](/docs/next/settings-system) correspondiente. Los filtros de flujo de trabajo aceptan
patrones globales **PERMITIR** y**DENEGAR**; negar tiene prioridad. Agregue patrones que no estén vacíos o elimine los
existentes. Los filtros restrictivos pueden explicar las ejecuciones ausentes.

En las membresías, agregue un usuario que no sea administrador como Visor o Administrador, cambie su función en el
repositorio o elimine el acceso. Los administradores están excluidos de la selección de miembros porque ya tienen acceso
sin restricciones. Un administrador global aún necesita ser miembro de administrador para capacidades de administración
de repositorios, como alertas de seguridad.

<a id="webhooks-and-failures"></a>

## Webhooks y fallos

La tarjeta del webhook del repositorio muestra la URL de devolución de llamada, el estado configurado, las instrucciones
del proveedor y la última entrega. Puede generar/copiar un secreto, guardar la configuración, rotar con confirmación
explícita o eliminar configuración. Una URL pública faltante debe corregirse antes del registro del proveedor. Los
secretos se muestran sólo durante la configuración; guárdelos en un administrador secreto. Siga
[Webhooks del repositorio](/docs/next/provider-webhooks) para configuración y verificación.

Los lectores y gestores consultan metadatos de solo lectura en Resumen; la configuración sigue reservada a administradores. Reintente después de resolver la causa y consulte [Trabajos](/docs/next/guide-jobs) para errores de sincronización.

<a id="local-user-and-group-management"></a>

## Grupos de acceso locales

En Acceso de grupos del repositorio asigne Viewer o Manager y cambie o retire el permiso. Los permisos directos y
heredados se combinan; Manager prevalece. La gestión sigue requiriendo rol global Manager; los administradores tienen
acceso total. La retirada se aplica en la siguiente solicitud salvo otro permiso vigente. Los grupos admiten cuentas
locales y OIDC, sin sincronización de claims OIDC.

[Grupos de acceso locales](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Eliminar el seguimiento local

Los administradores del sistema pueden seleccionar **Eliminar repositorio** en la página de detalles. La confirmación identifica el repositorio y explica que se eliminan permanentemente los workflows,
ejecuciones, issues, pull requests, alertas de seguridad, configuración, permisos, historial de webhooks, estado de
sincronización e historial de notificaciones asociados localmente. La cuenta y los datos del repositorio en el proveedor
permanecen sin cambios.

La eliminación se bloquea durante una sincronización; espere a que termine y vuelva a intentarlo. Las solicitudes
pendientes se eliminan con el repositorio. Las suscripciones pierden su filtro de repositorio; una suscripción limitada
solo a este repositorio se elimina en lugar de convertirse en global. Los canales compartidos se conservan.

El repositorio puede añadirse de nuevo mediante la selección de proveedor existente. El seguimiento comienza desde cero,
sin recuperar el historial ni la configuración local anterior.
