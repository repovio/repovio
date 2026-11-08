---
title: 'Descripción general de Repovio'
description:
  'Ejecuciones de flujo de trabajo de solo lectura, trabajo de repositorio y alertas de seguridad entre sus proveedores.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

Repovio es un panel autohospedado para acciones GitHub, canalizaciones GitLab, acciones Forgejo y acciones Gitea.
Realice un seguimiento de las ejecuciones de flujos de trabajo seleccionados, problemas y solicitudes de extracción,
identifique fallas actuales y envíe notificaciones sin modificar los recursos del proveedor.

<a id="one-permission-scoped-overview"></a>

## Una descripción general con alcance de permiso

- Inspeccionar el estado del flujo de trabajo, las últimas ejecuciones, las tendencias, las colas de aprobación y el
  trabajo que necesita atención.
- Leer problemas y extraer o fusionar solicitudes junto con su actividad de flujo de trabajo relacionada.
- Revisar los metadatos de alertas de seguridad admitidos sin almacenar valores secretos.
- Administre membresías de repositorios, destinos de notificaciones cifradas y conexiones de proveedores de solo
  lectura.
- Utilice cuentas locales, OpenID Connect opcional y tokens de acceso personales MCP de solo lectura.

Los cambios de proveedores, las aprobaciones, las revisiones y las repeticiones del flujo de trabajo siguen siendo
acciones externas. Los controles de administración propios de Repovio configuran su seguimiento y notificaciones
locales; no otorgan acceso de escritura al proveedor.

Comience con [instalación](/docs/v1.0/installation), luego siga con [inicio de sesión y navegación](/docs/v1.0/sign-in).
Para operaciones de producción, consulte [implementación y copias de seguridad](/docs/v1.0/deployment).
