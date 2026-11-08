---
title: 'Problemas'
description: 'Explore problemas sincronizados, filtros y detalles de solo lectura.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="browse-and-filter"></a>

## Explorar y filtrar

Abra **Descripción general → Problemas**. Las listas, resúmenes, opciones de filtro y detalles utilizan membresías en
repositorios. Buscar por título o número; filtrar por proveedor, repositorio, ciclo de vida, autor, cesionario, hito,
etiquetas y hora de actualización cuando esté disponible. Los límites de fechas actualizados incluyen UTC. Varias
etiquetas seleccionadas deben coincidir. Cambie la clasificación, las columnas visibles y la paginación con los
controles de la tabla. Las tarjetas de resumen cuentan los problemas abiertos, actualizados recientemente, asignados y
obsoletos. La sincronización inicial lee todos los problemas abiertos y cerrados actualizados en los 90 días anteriores.
El estancamiento ayuda a encontrar trabajos abiertos desatendidos; no cambia el estado del proveedor.

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
inspeccione [Tareas de sincronización](/docs/v1.0/guide-jobs). La retención puede eliminar registros cerrados antiguos.
Una página de detalles inaccesible puede indicar acceso revocado o un registro eliminado; volver a la lista. Errores de
solicitud de reintento después de la recuperación de API.
