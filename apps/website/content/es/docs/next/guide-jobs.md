---
title: 'Trabajos de sincronización de repositorios'
description: 'Supervise e inicie manualmente los trabajos de sincronización del repositorio Repovio.'
---

Abra **Trabajos** en la sección**Operaciones** para inspeccionar el trabajo de sincronización de cada repositorio
habilitado al que pueda acceder. El resumen muestra trabajos en ejecución, en espera, fallidos e inactivos. La tabla
identifica el repositorio, el proveedor, los dominios sincronizados, la fase actual, el progreso del elemento, el
intento y el mensaje de error seguro más reciente.

<a id="read-job-state"></a>

## Leer estado del trabajo

- **Inactivo** significa que no hay sincronización en cola ni en ejecución para el repositorio.
- **Pendiente** significa que la solicitud duradera está esperando su hora programada o un trabajador disponible.
- **En ejecución** muestra la fase activa y el progreso del elemento cuando el proveedor informa un total mensurable.
- **Error** conserva un resumen de errores seguro y un recuento de intentos hasta que el repositorio vuelva a ponerse en
  cola.
- **Advertencia** significa que otros ámbitos se completaron mientras uno o más tipos de alertas de seguridad no estaban
  disponibles.

La columna de alcances identifica si el trabajo lee flujos de trabajo, problemas, solicitudes de extracción, alertas de
seguridad o una combinación. Un tiempo de espera puede reflejar la fusión de webhooks, reintentos retrasados ​​o
instrucciones de límite de velocidad del proveedor; Actualizar la página repetidamente no adelanta el tiempo programado.

<a id="start-or-retry-synchronization"></a>

## Iniciar o reintentar la sincronización

Un administrador del sistema puede iniciar cada trabajo actualmente inactivo, fallido o de advertencia con **Ejecutar
todo**, o usar**Ejecutar** o**Reintentar** en una fila del repositorio. Los trabajos que ya están pendientes o en
ejecución no se vuelven a poner en cola. El botón de inicio permanece en su estado de carga hasta que se completa la
solicitud; luego siga la fila a medida que avanza entre pendiente, en ejecución e inactiva o fallida.

Los trabajos manuales utilizan la misma cola de sincronización de proveedores duradera y de solo lectura que la
conciliación programada y los webhooks verificados. Recuperan datos de proveedores pero no pueden modificar
repositorios, flujos de trabajo, incidencias ni solicitudes de extracción.

Los trabajos exitosos vuelven a **Inactivo** y no se conservan como historial de ejecución. Los trabajos fallidos
permanecen visibles hasta que un webhook posterior, un ciclo de conciliación o un reintento manual los pongan en cola
nuevamente. Si un reintento continúa fallando, verifique la cuenta del proveedor, lea los alcances, la URL base y el
estado del límite de velocidad en [Administración y configuración](/docs/next/provider-accounts) antes de volver a
intentarlo.

<a id="refresh-and-table-controls"></a>

## Actualizar y controlar la tabla

Los trabajos se actualizan automáticamente cada cinco segundos. La tabla tiene por defecto diez filas por página y
recuerda el tamaño de la página. Ejecutar todo incluye trabajos inactivos, fallidos y de advertencia; Las filas
pendientes/en ejecución no se pueden volver a poner en cola. Los errores de carga inicial y en segundo plano se muestran
por separado de los errores de trabajo. La clasificación y paginación ayudan a inspeccionar instalaciones más grandes.
