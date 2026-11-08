---
title: 'Solicitudes de extracción'
description: 'Explore solicitudes de extracción, filtros y detalles de solo lectura sincronizados.'
---

<a id="browse-and-filter"></a>

## Explorar y filtrar

Abra **Descripción general → Solicitudes de extracción**. Las listas, resúmenes, opciones de filtro y detalles utilizan
membresías en repositorios. Buscar por título o número; filtre por proveedor, repositorio, ciclo de vida, autor,
cesionario, estado del borrador, estado del flujo de trabajo, requisito de aprobación, etiquetas y hora de
actualización. Los límites de fechas actualizados incluyen UTC. Varias etiquetas seleccionadas deben coincidir. Cambie
la clasificación, las columnas visibles y la paginación con los controles de la tabla. Las tarjetas de resumen cuentan
los cambios abiertos, borradores, flujos de trabajo fallidos y aprobaciones de flujos de trabajo. GitLab utiliza el
término solicitud de fusión. Los detalles muestran las ramas de origen/destino, el estado del borrador, el ciclo de vida
y el estado del flujo de trabajo agregado. El agregado utiliza la ejecución más reciente para cada flujo de trabajo
vinculado; Los resultados fallidos tienen prioridad sobre los resultados en ejecución, pendientes, cancelados, exitosos
y desconocidos. Un requisito de aprobación de flujo de trabajo no es una aprobación de revisión de código, una
aprobación de fusión ni un indicador de conflicto de fusión.

<a id="inspect-details"></a>

## Inspeccionar detalles

Seleccione una fila para abrir su página de detalles Repovio. Revise la identidad, el repositorio, el autor, los
asignados, las etiquetas, los hitos, el estado del proveedor, las marcas de tiempo y la descripción de Markdown saneada.
El contexto del flujo de trabajo vinculado se muestra cuando está disponible. Se eliminan el HTML incrustado y el
marcado inseguro. Los comentarios, reacciones, archivos adjuntos y diferencias de código no están sincronizados. Utilice
el enlace del proveedor para comentar, asignar, etiquetar, cerrar, revisar, aprobar o fusionar. Repovio no realiza
ninguna de esas escrituras.

<a id="synchronization-and-failures"></a>

## Sincronización y fallos

Los webhooks firmados ponen en cola lecturas específicas del repositorio después de una ventana de fusión de 15
segundos; La conciliación de 30 minutos cubre los eventos perdidos. Una actualización del navegador recarga los datos
almacenados. Si falta un registro, borre los filtros, verifique la habilitación y la membresía del repositorio e
inspeccione [Tareas de sincronización](/docs/v2.0/guide-jobs). La retención puede eliminar registros cerrados antiguos.
Una página de detalles inaccesible puede indicar acceso revocado o un registro eliminado; volver a la lista. Errores de
solicitud de reintento después de la recuperación de API.
