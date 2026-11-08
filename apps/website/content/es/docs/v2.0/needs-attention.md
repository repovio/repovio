---
title: 'necesita atencion'
description: 'Investigue los contextos de flujo de trabajo cuya ejecución completa más reciente falló.'
---

<a id="current-failures"></a>

## Fallos actuales

Abra **Ejecuciones de flujo de trabajo → Necesita atención**. A diferencia de las ejecuciones fallidas históricas, esta
cola mantiene contextos de flujo de trabajo procesables cuya ejecución completa más reciente falló. Una ejecución
exitosa más nueva, un cambio relacionado cerrado o un cambio combinado elimina el contexto después de la sincronización.
Las ejecuciones más antiguas con alcance de rama se pueden asociar con la solicitud de extracción/fusión activa cuando
comenzaron. La insignia de la barra lateral utiliza la misma cola con alcance de permisos.

Busque y utilice los controles de tabla disponibles para limitar el contexto del flujo de trabajo/repositorio. Abra su
enlace de ejecución externa para registros y corrección. Abra el cambio relacionado cuando esté presente. Repovio nunca
vuelve a ejecutar, cancela, edita ni distribuye flujos de trabajo.

<a id="diagnose-missing-or-stale-entries"></a>

## Diagnosticar entradas faltantes o obsoletas

Un resultado vacío puede ser correcto después de una ejecución de reemplazo exitosa. Para fallas más antiguas, use
[Todas las ejecuciones](/docs/v2.0/workflow-runs). Borre los filtros y verifique las membresías del repositorio antes de
tratar un contexto ausente como datos faltantes. Las acciones del proveedor se observan de forma asincrónica;
inspeccione [Tareas de sincronización](/docs/v2.0/guide-jobs) si el estado permanece obsoleto. Los errores de carga y
solicitud son independientes de una cola vacía; Vuelva a intentarlo después de la recuperación de la API.
