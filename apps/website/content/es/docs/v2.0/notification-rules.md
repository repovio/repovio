---
title: 'Suscripciones a eventos'
description: 'Elija eventos, filtros de repositorio y patrones de flujo de trabajo dentro de un canal.'
---

<a id="configure-subscriptions"></a>

## Configurar suscripciones

Los administradores del sistema abren un [canal](/docs/v2.0/notifications) y configuran suscripciones a eventos en su
cuadro de diálogo de creación/edición. La ruta heredada `/notifications/rules` redirige a Canales; no hay una pantalla
de administración de reglas separada. Esta página documenta ese flujo de trabajo de diálogo de canal.

Elija el éxito, el fracaso o la recuperación del flujo de trabajo; solicitud de extracción abierta, cerrada, reabierta o
fusionada; asunto abierto, cerrado o reabierto; y eventos abiertos/resueltos de dependencia, código o alerta secreta
admitidos. Seleccione restricciones del repositorio para cada evento. Una selección de repositorio vacía significa todos
los repositorios aplicables, no ninguno. Los patrones de nombres de flujo de trabajo se aplican solo a eventos de flujo
de trabajo. Guarde el canal para conservar sus suscripciones.

<a id="preview-matches"></a>

## Vista previa de partidos

La vista previa está disponible solo cuando se selecciona al menos un evento de flujo de trabajo; las suscripciones que
no son solo de flujo de trabajo lo desactivan. Utilice la vista previa para inspeccionar hasta 20 registros de flujo de
trabajo coincidentes recientes antes de guardarlos. Una coincidencia confirma las condiciones actuales del filtro con
los datos retenidos; no pone en cola una entrega. Distinga las coincidencias de los avisos de datos parciales, de
sincronización fallida o nunca sincronizados. Amplíe la selección de repositorio/patrón o inspeccione
[Tareas de sincronización](/docs/v2.0/guide-jobs) cuando los datos de origen no estén disponibles.

La sincronización inicial establece una línea de base silenciosa para los eventos del ciclo de vida y no inunda los
canales con transiciones abiertas/cerradas antiguas. Las transiciones observadas posteriormente pueden producir
entregas. La disponibilidad del proveedor y los permisos de lectura limitan los eventos de seguridad que se pueden
observar. Repovio nunca cambia los recursos del proveedor para hacer coincidir una regla.

Si la vista previa o el guardado fallan, conserve los valores del formulario, verifique el estado de la API y vuelva a
intentarlo. Una vista previa vacía por sí sola no prueba que ningún evento futuro coincida o que todos los repositorios
seleccionados se hayan sincronizado correctamente.
