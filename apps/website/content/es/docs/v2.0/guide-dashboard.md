---
title: 'Panel de control'
description: 'Lea el estado actual del flujo de trabajo, resúmenes de trabajo y gráficos históricos.'
---

<a id="scope-and-date-range"></a>

## Alcance y rango de fechas

Cada tarjeta y gráfico utiliza únicamente repositorios que el usuario que ha iniciado sesión puede leer. Seleccione
**Últimos 7 días**,**Últimos 30 días** o**Últimos 90 días** para obtener estadísticas históricas. El rango de tiempo
cambia los totales de ejecución completada, las tendencias de éxito/error, la duración y la distribución del estado. Los
recuentos actuales de colas y elementos de trabajo siguen siendo resúmenes del estado actual. Seleccione**Actualizar**
para recargar el panel; el control permanece ocupado hasta que se liquiden sus solicitudes.

<a id="summary-and-navigation"></a>

## Resumen y navegación

El resumen del flujo de trabajo contiene la tasa de éxito/recuento completado, el recuento activo en cola/en ejecución,
la duración media completada, los errores actuales, el recuento en espera de aprobación y los totales de tiempo de
ejecución. Siga las fallas actuales hasta [necesita atencion](/docs/v2.0/needs-attention) o las aprobaciones pendientes
hasta [En espera de aprobación](/docs/v2.0/awaiting-approval). Los resúmenes de problemas y solicitudes de extracción se
vinculan a sus propias listas filtradas. Los gerentes y administradores también ven resúmenes de alertas de seguridad
para los repositorios que administran.

La tarjeta de funcionamiento activo abre un filtro `preset=active` extraíble; Las tarjetas de elementos de trabajo
actuales también abren ajustes preestablecidos extraíbles. Los cambios de filtro manuales liberan el valor
preestablecido.

El gráfico de tendencias compara ejecuciones completadas exitosas y fallidas a lo largo del tiempo. Grupos de
distribución de estados estados normalizados. **Últimas ejecuciones** muestra la actividad reciente del flujo de trabajo
con enlaces al proveedor. No es un visor de registros de proveedores integrado. Repovio no puede aprobar ni volver a
ejecutar flujos de trabajo desde ningún widget del panel.

<a id="empty-and-partial-results"></a>

## Resultados vacíos y parciales

Ninguna ejecución completada en el período seleccionado produce gráficos vacíos. Cero fallas actuales es diferente de
una conexión de proveedor faltante. Si una solicitud falla, un banner de error identifica la carga parcial mientras las
secciones disponibles permanecen visibles. Actualice después de la recuperación o inspeccione
[Tareas de sincronización](/docs/v2.0/guide-jobs) y la última sincronización del repositorio.
