---
title: 'Navegación'
description: 'Encuentre destinos de aplicaciones, estados, configuraciones personales e información de versión.'
---

<a id="sidebar"></a>

## Barra lateral

**Descripción general** contiene paneles, ejecuciones de flujos de trabajo, problemas, solicitudes de extracción y
alertas de seguridad admitidas.**Operaciones** contiene repositorios, trabajos y notificaciones.**Administración**
contiene cuentas de proveedores, usuarios y configuraciones para administradores del sistema. Las ejecuciones del flujo
de trabajo se expanden a Todas las ejecuciones, En espera de aprobación y Necesita atención; La navegación de
notificaciones expone los canales y, para los administradores, el historial de entrega.

La barra lateral solo ofrece destinos a los que puede acceder su función. Las alertas de seguridad requieren permiso de
administración. Al contraer la barra lateral se conservan los destinos etiquetados. En pantallas estrechas, utilice el
control de navegación para abrir la barra lateral. El manual documenta cada área de función incluso cuando su cuenta no
puede verla.

<a id="status-and-search"></a>

## Estado y búsqueda

Utilice [Buscar](/docs/next/search) en la barra de aplicaciones para buscar destinos y recursos sincronizados. La barra
de estado informa la conectividad API, la actividad de sincronización y el recuento de flujos de trabajo en ejecución.
Su contador de flujo de trabajo en ejecución abre [Tareas de sincronización](/docs/next/guide-jobs); La actividad de
sincronización puede incluir el progreso del elemento. La recuperación de la conexión actualiza el estado. Un indicador
desconectado significa que las actualizaciones en vivo pueden estar obsoletas; inspeccione la API y vuelva a intentarlo
antes de confiar en los recuentos mostrados.

<a id="personal-notifications"></a>

## Notificaciones personales

La campana abre los controles del dispositivo y hasta cinco entregas push recientes dirigidas a usted. Las entradas
respetan los permisos actuales de repositorios y alertas; una lista vacía no revela el historial de otros usuarios.
Entregado significa que el servicio push aceptó la notificación, no que alguien la haya leído. Los administradores
del sistema pueden abrir el historial administrativo de entregas desde el mismo panel.

<a id="user-menu-and-footer"></a>

## Menú de usuario y pie de página

El menú de usuario abre [Ajustes](/docs/next/settings) personal, controles de idioma y apariencia, y cierra sesión. El
pie de página enlaza con el proyecto y el manual. Al seleccionar la versión mostrada se abre el cuadro de diálogo del
registro de cambios. Sus notas de la versión y su indicador de actualización ayudan a identificar una versión
disponible; la aplicación de una actualización sigue siendo una operación de implementación. Los enlaces de proveedores
abren recursos externos. Las acciones allí requieren los permisos propios del proveedor y están fuera de Repovio.

<a id="table-controls"></a>

## Controles de tabla compartida

Cuando se ofrecen, las opciones de tabla configuran la visibilidad, el orden y la fijación de las columnas; la columna
de acciones permanece fijada a la derecha. Las opciones persisten por tabla en el navegador. La paginación utiliza la
consulta de página. Las listas de flujo de trabajo, problemas, solicitudes de extracción y alertas comienzan en 25
filas; Los trabajos, los repositorios, los proveedores, los usuarios, los canales y el historial de entrega comienzan
en 10. Los controles de filtro se pueden desactivar mientras se cargan sus opciones. Borre los ajustes preestablecidos
del panel o cambie los filtros para volver a su propia consulta. Estos controles cambian la vista local, nunca los
registros del proveedor.
