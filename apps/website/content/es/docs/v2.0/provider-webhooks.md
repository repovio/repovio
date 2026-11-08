---
title: 'Configuración del webhook del repositorio'
description: 'Configure webhooks firmados de solo lectura para los repositorios GitHub, GitLab, Forgejo y Gitea.'
---

Las instrucciones PAT/OAuth de esta página usan webhooks por repositorio. Las conexiones GitHub App usan un webhook
central y se configuran desde su diálogo.

Repovio puede recibir webhooks firmados para sincronizar un repositorio rastreado antes de su intervalo de sondeo
normal. Nunca crea, actualiza, elimina ni prueba webhooks a través de las API del proveedor. Un administrador configura
manualmente cada webhook del repositorio en GitHub, GitLab, Forgejo o Gitea.

Abra **Repositorios**, seleccione un repositorio rastreado y use su tarjeta**Webhook del repositorio**. La tarjeta
muestra la URL de devolución de llamada específica del repositorio, genera o acepta un secreto de firma e informa la
última entrega aceptada. Repovio nunca envía esa configuración al proveedor.

Los webhooks son una optimización, no la fuente de la verdad. La carga útil firmada debe identificar el repositorio
seleccionado por la URL de devolución de llamada. Luego, Repovio lee los datos actuales a través del adaptador de
proveedor de solo lectura configurado. Las entregas aceptadas ponen en cola una sincronización duradera del repositorio;
Se combinan las entregas recibidas en un plazo de 15 segundos. El intervalo de sondeo alternativo predeterminado es de
30 minutos.

<a id="configure-a-repository-webhook"></a>

## Configurar un webhook de repositorio

1. Agregue el repositorio a Repovio y abra su tarjeta **Webhook del repositorio**.
2. Copie la URL de devolución de llamada.
3. Genere un secreto de firma único y de alta entropía o pegue el token de firma exacto proporcionado por el proveedor.
   Nunca reutilice un token de acceso ni el secreto de otro repositorio.
4. Guarda el secreto. Repovio lo cifra con AES-256-GCM y nunca lo devuelve a través de la API.
5. Configure la URL de devolución de llamada y el secreto en la configuración del proveedor de ese repositorio.
6. Mantenga habilitada la verificación TLS y envíe una entrega de prueba.

Las devoluciones de llamada estables utilizan `/api/webhooks/<provider>/<repository-id>`. También están disponibles
devoluciones de llamada versionadas `/api/v1/webhooks/<provider>/<repository-id>`. Ya no se aceptan URL de devolución de
llamadas de cuentas de proveedores de Repovio 0.2.9 y versiones anteriores. Después de la actualización, vuelva a crear
cada webhook con su devolución de llamada del repositorio y un nuevo secreto del repositorio.

Las entregas exitosas devuelven HTTP `202` con `{ "accepted": true }`. Los ID de entrega de proveedor repetidos
devuelven `{ "accepted": true, "duplicate": true }` y no ponen en cola otra sincronización. Los repositorios
desconocidos o deshabilitados, las cuentas de proveedores deshabilitadas, los secretos faltantes, las firmas no válidas,
los ID de repositorios de proveedores que no coinciden y los ID de entrega faltantes se rechazan sin exponer los
detalles de configuración.

La sincronización en cola sobrevive a los reinicios de API. Varias instancias utilizan concesiones de bases de datos y
no sincronizan la misma cuenta de proveedor al mismo tiempo. Los encabezados de límite de velocidad retrasan el trabajo
de la cuenta afectada, mientras que los reintentos limitados manejan fallas transitorias.

<a id="github-actions"></a>

## GitHub Acciones

1. Abra **Configuración → Webhooks** del repositorio y elija**Agregar webhook**.
2. Utilice `https://repovio.example.com/api/webhooks/github/<repository-id>` como URL de carga útil.
3. Seleccione `application/json`, pegue el secreto del repositorio y suscríbase a **Ejecuciones de flujo de trabajo**
   (`workflow_run`).
4. Mantenga habilitada la verificación SSL y guarde el webhook.

Repovio verifica `X-Hub-Signature-256` sobre el cuerpo sin procesar y utiliza `X-GitHub-Delivery` para idempotencia.
Consulte [documentación del evento webhook](https://docs.github.com/en/webhooks/webhook-events-and-payloads) de GitHub.

<a id="gitlab-pipelines"></a>

## Tuberías GitLab

1. Abra **Configuración → Webhooks** del proyecto y seleccione**Agregar nuevo webhook**.
2. Utilice `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` como URL.
3. Genere un **token de firma** y guarde su valor completo, incluido `whsec_`, en la tarjeta del repositorio Repovio.
4. Seleccione **Eventos de canalización**, mantenga habilitada la verificación SSL, guarde y envíe una entrega de
   prueba.

Repovio verifica las firmas de Webhooks estándar HMAC-SHA256 y prefiere `webhook-id` para idempotencia. Los encabezados
`X-Gitlab-Token` y `X-Gitlab-Event-UUID` heredados siguen siendo compatibles con instancias más antiguas. Consulte
[documentación de webhook](https://docs.gitlab.com/user/project/integrations/webhooks/) de GitLab.

<a id="forgejo-actions"></a>

## Forgejo Acciones

1. Abra **Configuración → Webhooks** del repositorio y agregue un webhook JSON nativo**Forgejo**.
2. Utilice `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` como URL de destino.
3. Pegue el secreto del repositorio y seleccione **Eventos push** más cualquier evento de acciones disponible.
4. Mantenga habilitada la verificación TLS y guarde el webhook.

Repovio verifica `X-Forgejo-Signature` y utiliza `X-Forgejo-Delivery` para idempotencia. Los encabezados compatibles con
Gitea siguen siendo aceptados para la compatibilidad con Forgejo. Consulte el Forgejo
[documentación de webhook](https://forgejo.org/docs/latest/user/repository/webhooks/).

<a id="gitea-actions"></a>

## Gitea Acciones

1. Abra **Configuración → Webhooks** del repositorio y agregue un webhook JSON nativo**Gitea**.
2. Utilice `https://repovio.example.com/api/webhooks/gitea/<repository-id>` como URL de destino.
3. Pegue el secreto del repositorio y seleccione **Eventos push** más cualquier evento de flujo de trabajo disponible.
4. Mantenga habilitada la verificación TLS y guarde el webhook.

Repovio verifica `X-Gitea-Signature` sobre el cuerpo sin procesar y utiliza `X-Gitea-Delivery` para idempotencia.
Consulte el Gitea [documentación de webhook](https://docs.gitea.com/usage/repository/webhooks/).

<a id="troubleshooting"></a>

## Solución de problemas

- `401` significa que Repovio no pudo verificar el repositorio, el tipo de proveedor, el secreto, la firma, el ID del
  repositorio de carga útil o el ID de entrega. Confirme el UUID del repositorio de la devolución de llamada y el
  secreto exacto.
- Se espera `202` con `duplicate: true` cuando un proveedor vuelve a intentar una entrega.
- Una entrega exitosa solo activa la sincronización de solo lectura; nunca modifica el flujo de trabajo del proveedor.
- Verifique `/api/health` para conocer el estado de sincronización del proveedor persistente.
- Establezca `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` para el respaldo de 30 minutos.
- `SCHEDULER_ENABLED=false` retiene las solicitudes en cola pero detiene el procesamiento y la puesta en cola de
  reserva.

[Configurar GitHub App](/docs/v2.0/github-app)
