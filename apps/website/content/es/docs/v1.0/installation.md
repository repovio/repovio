---
title: 'Guía del usuario Repovio'
description:
  'Comience a usar Repovio para ver los repositorios, el estado del flujo de trabajo y las acciones de aprobación
  requeridas.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

Repovio es un panel de estado del flujo de trabajo de solo lectura. Permite a los usuarios autorizados inspeccionar la
actividad del repositorio sin crear, volver a ejecutar, aprobar o eliminar nada en GitHub, GitLab, Forgejo o Gitea.

<a id="before-you-begin"></a>

## Antes de comenzar

Necesita la URL de una instalación de Repovio y una cuenta OIDC local o configurada. El primer administrador completa la
configuración por única vez; Se aprovisionan usuarios locales adicionales a través de la API protegida, o los usuarios
inician sesión a través del OIDC configurado. El acceso a los datos del proveedor depende de su función y de su
membresía en el repositorio; Iniciar sesión no expone automáticamente todos los repositorios configurados.

Repovio utiliza tres roles de aplicación:

- **El espectador** puede inspeccionar repositorios, flujos de trabajo, incidencias y solicitudes de extracción
  asignados explícitamente.
- **Administrador** tiene acceso de lectura y puede inspeccionar alertas de seguridad para repositorios donde la
  membresía también es**Administrador**. Los administradores del sistema administran globalmente los canales de
  notificación, las suscripciones, las pruebas y el historial.
- **Administrador del sistema** puede acceder a todos los repositorios y administrar cuentas de proveedores,
  repositorios, membresías, usuarios, tokens MCP y valores predeterminados de aplicaciones.

Los roles de aplicación nunca otorgan acceso de escritura en GitHub, GitLab, Forgejo o Gitea. Si una acción cambia el
estado del proveedor, Repovio abre la interfaz del proveedor en lugar de realizar la acción.

<a id="recommended-first-session"></a>

## Primera sesión recomendada

1. [Iniciar sesión](/docs/v1.0/sign-in), aprenda [navegación](/docs/v1.0/navigation) y pruebe
   [buscar](/docs/v1.0/search).
2. Revise [Panel](/docs/v1.0/guide-dashboard), [Todas las ejecuciones](/docs/v1.0/workflow-runs),
   [necesita atencion](/docs/v1.0/needs-attention) y [En espera de aprobación](/docs/v1.0/awaiting-approval).
3. Inspeccione [Asuntos](/docs/v1.0/guide-issues) y [Solicitudes de extracción](/docs/v1.0/guide-pull-requests).
4. Abra [Repositorios](/docs/v1.0/repositories) para comprender los datos que puede ver.
5. Los administradores configuran [canales de notificacion](/docs/v1.0/notifications) y
   [suscripciones a eventos](/docs/v1.0/notification-rules).

Luego, los administradores del sistema deberían continuar con
[Administración y configuración](/docs/v1.0/provider-accounts). La implementación, el registro del proveedor, la
configuración del webhook, la copia de seguridad y la recuperación están vinculados desde las páginas del manual
correspondientes.

<a id="when-a-page-is-empty-or-unavailable"></a>

## Cuando una página está vacía o no está disponible

Una página vacía puede significar que no se han sincronizado datos de proveedores coincidentes, que los filtros excluyen
todos los resultados o que su cuenta no tiene membresía en el repositorio. Borre los filtros activos y verifique primero
la selección del repositorio. Un mensaje de error de carga significa que no se pudieron recuperar los datos solicitados;
Vuelva a intentar la acción de la página y solicite al administrador de la instalación que inspeccione la API y los
trabajos de sincronización si el error persiste.
