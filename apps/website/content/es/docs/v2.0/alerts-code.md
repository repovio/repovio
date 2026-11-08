---
title: 'Alertas de escaneo de código'
description: 'Revise las alertas de escaneo de código con acceso de administración con ámbito de repositorio.'
---

<a id="access-and-provider-support"></a>

## Acceso y soporte del proveedor

Abra **Descripción general → Alertas de seguridad → Alertas de escaneo de código**. Los administradores necesitan acceso
de administración al repositorio; Los administradores del sistema pueden inspeccionar todos los repositorios. Los
espectadores no pueden acceder a los datos de alerta. Las listas, opciones de filtro, contadores, detalles, actividad
del repositorio y métricas del panel aplican las mismas restricciones de acceso.

GitHub admite este tipo de alerta a través de sus API de seguridad. GitLab asigna vulnerabilidades de escaneo de
dependencias, SAST y detección de secretos a las vistas de alerta correspondientes, sujetas a permisos de
instancia/licencia y token. Actualmente, Forgejo y Gitea informan que estos tipos no son compatibles. Una advertencia
para un tipo no disponible no falla en otros ámbitos de sincronización.

<a id="review-findings"></a>

## Revisar los resultados

Utilice filtros de búsqueda y repositorio disponible, proveedor, gravedad y estado, clasificación, columnas visibles y
paginación. Los estados incluyen `OPEN`, `RESOLVED` y `DISMISSED`; La gravedad incluye crítica, alta, media, baja,
informativa y desconocida. Los filtros de código incluyen además un escáner, una regla y un selector de ruta de archivo
dedicado. Los límites de fecha actualizados y la búsqueda de texto por tipo específico ayudan a limitar las listas
grandes. Seleccione un hallazgo para inspeccionar el analizador, la regla, la gravedad, la ubicación segura del archivo
y el estado del hallazgo. Repovio almacena metadatos incluidos en la lista permitida únicamente; las cargas útiles del
proveedor sin procesar, las credenciales, los fragmentos de token y los valores secretos nunca se conservan. Los campos
faltantes pueden reflejar las capacidades del proveedor en lugar de un error de procesamiento.

Utilice **Abrir en proveedor** para investigar y corregir. Repovio no descarta, resuelve, vuelve a abrir ni edita
alertas. La primera lectura exitosa por repositorio y tipo de alerta establece una línea de base silenciosa. Las
transiciones abiertas, resueltas, descartadas o reabiertas posteriores pueden activar la suscripción a
[canales de notificacion](/docs/v2.0/notifications).

<a id="empty-unavailable-and-stale-data"></a>

## Datos vacíos, no disponibles y obsoletos

Borre los filtros y verifique la membresía de la administración si no aparecen hallazgos. Inspeccione
[Tareas de sincronización](/docs/v2.0/guide-jobs) en busca de tipos no admitidos o advertencias de permisos. Es posible
que las cuentas GitHub OAuth existentes necesiten reautorización con `security_events`; ver
[Proveedor OAuth](/docs/v2.0/provider-oauth). Reintentar cargas fallidas después de la recuperación; La ausencia de
hallazgos visibles no es prueba de que el proveedor haya escaneado el repositorio o de que todos los tipos de alerta
sean compatibles.
