---
title: 'Todas las ejecuciones'
description:
  'Busque, filtre e inspeccione el historial de flujo de trabajo retenido sin cambiar los recursos del proveedor.'
---

<a id="browse-retained-runs"></a>

## Examinar ejecuciones retenidas

Abra **Descripción general → Ejecuciones de flujo de trabajo → Todas las ejecuciones**. Los resultados tienen como
alcance los repositorios accesibles y el historial retenido. Utilice filtros de repositorio, proveedor, estado y
duración (la duración se ingresa en segundos). Todas las ejecuciones no tienen cuadro de búsqueda de texto; Necesita
atención agrega búsqueda y columnas detalladas creadas/iniciadas. Ordene columnas, cambie las columnas visibles y pagina
los resultados. Borre los filtros si falta una ejecución esperada.

Las filas identifican el flujo de trabajo y el repositorio, el proveedor, el estado normalizado, las marcas de tiempo
del proveedor y la duración del suministro. Las ejecuciones en cola o sin terminar pueden carecer de tiempo de
finalización o duración final. Los estados normalizados son `queued`, `running`, `success`, `failed`, `cancelled`,
`skipped` y `unknown`. Si el estado es desconocido, el proveedor debe comprobarlo.

<a id="open-a-run"></a>

## Abrir una carrera

Utilice la acción de fila externa para abrir la ejecución del proveedor y sus registros. Repovio no proporciona una
pantalla de ejecución editable separada, descarga artefactos del proveedor ni sincroniza registros completos. Apruebe,
vuelva a ejecutar, cancele o envíe solo al proveedor con su cuenta de proveedor. Para fallas actuales utilice
[necesita atencion](/docs/v2.0/needs-attention); para puertas utilice
[En espera de aprobación](/docs/v2.0/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Historial faltante o obsoleto

Una tabla vacía significa que ningún registro retenido coincide con los filtros y sus permisos. La retención puede
eliminar ejecuciones más antiguas. Verifique la habilitación del repositorio, las membresías, los patrones de
permitir/denegar el flujo de trabajo y [Tareas de sincronización](/docs/v2.0/guide-jobs). Una actualización de página
recarga los datos almacenados; no omite la cola de sincronización duradera. Vuelva a intentar cargar errores después de
la recuperación de la API.
