---
title: 'Repositorios'
description:
  'Realice un seguimiento de los repositorios, inspeccione la actividad y configure la sincronización y el acceso
  locales.'
---

<a id="browse-and-open-details"></a>

## Explorar y abrir detalles

Todos los usuarios que hayan iniciado sesión pueden enumerar los repositorios que pueden leer. La tabla muestra el
propietario/nombre, el estado habilitado, los miembros, el recuento de ejecuciones retenidas, la retención y la última
sincronización. Utilice filtrado, clasificación, controles de columnas y paginación habilitados. Abra el enlace del
proveedor para el repositorio externo, la página de detalles para la actividad sincronizada o el cuadro de diálogo de
configuración para la configuración. Una membresía faltante o un repositorio eliminado pueden producir un estado de
detalle inaccesible.

La página de detalles combina información general, retención, última sincronización/antigüedad de los datos, intervalo
configurado, trabajo actual y flujos de trabajo recientes, problemas y solicitudes de extracción. Los administradores
con acceso a la administración del repositorio y los administradores también ven la actividad de alertas de seguridad.
Los trabajos pendientes/en ejecución muestran el progreso; Las advertencias y fallas incluyen errores seguros
categorizados.

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

Los espectadores y administradores reciben un resumen de la configuración del repositorio de solo lectura. Vuelva a
intentar cargar/guardar errores después de la recuperación; Inspeccione
[Tareas de sincronización](/docs/next/guide-jobs) para detectar errores de acceso, límite de velocidad o sincronización
del proveedor.

<a id="local-user-and-group-management"></a>

## Grupos de acceso locales

En Acceso de grupos del repositorio asigne Viewer o Manager y cambie o retire el permiso. Los permisos directos y
heredados se combinan; Manager prevalece. La gestión sigue requiriendo rol global Manager; los administradores tienen
acceso total. La retirada se aplica en la siguiente solicitud salvo otro permiso vigente. Los grupos admiten cuentas
locales y OIDC, sin sincronización de claims OIDC.

[Grupos de acceso locales](/docs/next/users#local-access-groups)
