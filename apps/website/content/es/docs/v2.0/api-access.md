---
title: 'Acceso API'
description:
  'Abra la documentación de la API instalada y utilice la referencia de la API estática específica de la versión.'
---

<a id="installed-api-documentation"></a>

## Documentación API instalada

Cada servidor API Repovio ofrece su documentación API interactiva en `/docs`. En desarrollo local, abra
`http://localhost:3001/docs`. Los puntos finales REST utilizan la ruta base `/api/v1`.

Para una implementación, utilice el origen de API accesible externamente y la ruta configurada por su proxy inverso. Por
ejemplo, si el servidor API está expuesto en `https://repovio.example.com`, su documentación puede estar expuesta en
`https://repovio.example.com/docs`. La aplicación web no representa automáticamente esta ruta; configure su proxy
explícitamente si desea exponerlo. `/api/v1/docs` no es la ruta de documentación.

La referencia instalada describe la aplicación en ejecución. Las solicitudes realizadas desde esa referencia interactiva
utilizan su instancia y requieren la autenticación y los permisos documentados para cada operación. Consulte
[Autenticación](/docs/v2.0/authentication) para iniciar sesión y configurar la cuenta. Los tokens de acceso MCP están
destinados a [Clientes MCP](/docs/v2.0/mcp), no como tokens portadores REST generales.

<a id="static-release-reference"></a>

## Referencia de lanzamiento estático

El [Referencia API](/docs/v2.0/api-reference) en este sitio web es una instantánea de solo lectura generada a partir de
la revisión exacta de la aplicación de la versión seleccionada. No necesita ninguna instancia Repovio en ejecución y no
envía solicitudes de API. Elija la versión que coincida con su instalación; la página `/docs` instalada sigue teniendo
autoridad para la compilación en ejecución.

Busque por método, ruta o descripción, inspeccione parámetros y esquemas de respuesta, o descargue el OpenAPI JSON
completo desde la página de referencia. Los identificadores de esquema y las descripciones de API conservan el idioma
del contrato generado.
