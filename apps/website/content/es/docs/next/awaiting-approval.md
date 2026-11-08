---
title: 'En espera de aprobación'
description: 'Encuentre puertas de aprobación de proveedores y abra sus pantallas de aprobación externas.'
---

<a id="identify-approval-gates"></a>

## Identificar puertas de aprobación

Abra **Ejecuciones de flujo de trabajo → En espera de aprobación** para ver los flujos de trabajo sincronizados en pausa
por una decisión humana. Busque por flujo de trabajo o repositorio e inspeccione el repositorio, el proveedor y el
contexto de solicitud de extracción/fusión relacionado. La insignia de la barra lateral refleja carreras coincidentes
visibles; Las restricciones de membresía se aplican tanto a la insignia como a la mesa.

Utilice **Abrir solicitud de extracción** para contexto o**Aprobar en proveedor** para abrir la página de flujo de
trabajo propiedad del proveedor. GitLab puede llamar al cambio relacionado una solicitud de fusión. La aprobación del
flujo de trabajo es diferente de la revisión de código o la aprobación de fusión.

<a id="complete-the-provider-action"></a>

## Complete la acción del proveedor

Autentíquese con el proveedor y utilice sus controles de aprobación si su cuenta de proveedor está autorizada. Repovio
nunca envía una solicitud de aprobación. Un webhook o una lectura de conciliación deben observar el estado actualizado
del proveedor antes de que desaparezca la fila. Actualice la cola almacenada después; una fila sin cambios
inmediatamente después de la aprobación puede reflejar un retraso en la sincronización.

Una cola vacía significa que ninguna ejecución sincronizada visible necesita aprobación actualmente, no que todos los
repositorios estén conectados o que su cuenta de proveedor tenga derechos de aprobación. Si falla la carga, vuelva a
intentarlo e inspeccione [Tareas de sincronización](/docs/next/guide-jobs).
