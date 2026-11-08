---
title: 'Acceso MCP'
description:
  'Conecte clientes MCP configurables por encabezado a las herramientas de flujo de trabajo de solo lectura con
  reconocimiento de permisos de Repovio.'
---

Repovio expone un punto final del protocolo de contexto de modelo sin estado en `/mcp`. Proporciona acceso de solo
lectura a los mismos repositorios, ejecuciones de flujo de trabajo, colas de fallas, colas de aprobación, resúmenes y
tendencias que el usuario autenticado puede ver en Repovio.

El servidor MCP lee la base de datos local Repovio. No llama a las API de mutación del proveedor, no inicia la
sincronización, no aprueba los flujos de trabajo ni cambia la configuración de Repovio.

El mismo endpoint `/mcp` admite el protocolo `2025-06-18` de clientes antiguos como Codex y el protocolo moderno
`2026-07-28`. Los clientes antiguos usan `initialize` seguido de `notifications/initialized`; los modernos envían los
metadatos del protocolo en cada solicitud. Ambos ofrecen las mismas siete herramientas de solo lectura y autentican
cada solicitud con el token Bearer del usuario actual. Cada solicitud usa una instancia nueva sin sesiones MCP persistentes.

<a id="create-an-access-token"></a>

## Crear un token de acceso

Abra **Configuración**, seleccione la pestaña**Acceso MCP** y cree un token con nombre. La caducidad es opcional. Copie
el token completo del cuadro de diálogo de creación porque Repovio lo muestra solo una vez y almacena solo su hash
SHA-256.

La revocación de un token entra en vigor en la siguiente solicitud. Al eliminar su usuario también se elimina el token.
Los cambios en la función del usuario o en la membresía del repositorio se aplican inmediatamente porque cada solicitud
resuelve la autorización actual de la base de datos.

<a id="configure-a-client"></a>

## Configurar un cliente

Utilice el origen público Repovio seguido de `/mcp` y envíe el token en el encabezado de autorización:

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

La primera versión está dirigida a clientes MCP que admiten encabezados HTTP personalizados, como editores y clientes de
línea de comandos. No proporciona descubrimiento OAuth y no afirma compatibilidad con hosts que requieren el flujo MCP
OAuth.

Nunca coloque el token en una URL, parámetro de consulta, archivo de configuración rastreado, historial de shell o
registro. Prefiere el almacenamiento secreto del cliente o una variable de entorno sin versión.

<a id="available-tools"></a>

## Herramientas disponibles

| Herramienta              | Propósito                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `list_repositories`      | Listar los repositorios rastreados visibles.                                             |
| `get_repository`         | Lea un repositorio rastreado visible.                                                    |
| `list_workflow_runs`     | Consulta ejecuciones de flujo de trabajo visibles normalizadas.                          |
| `list_needs_attention`   | Enumere los contextos de flujo de trabajo cuya ejecución de terminal más reciente falló. |
| `list_awaiting_approval` | Enumere las ejecuciones visibles actuales en espera de la aprobación del proveedor.      |
| `get_dashboard_summary`  | Resuma el estado visible del flujo de trabajo para un rango de tiempo inclusivo.         |
| `get_workflow_trend`     | Agregue grupos visibles de tendencias de éxito y fracaso.                                |

Las herramientas de lista tienen de forma predeterminada 25 resultados por página y aceptan como máximo 100. La salida
de la herramienta contiene JSON estructurado y una representación de texto coincidente. Las fechas utilizan valores UTC
ISO 8601.

El servidor no anuncia intencionalmente recursos, mensajes, tareas, suscripciones, acciones del proveedor o herramientas
de configuración de MCP.

<a id="reverse-proxy-requirements"></a>

## Requisitos de proxy inverso

- Reenviar `POST /mcp` al contenedor API sin reescribirlo en `/api/v1/mcp`.
- Delantero `Authorization`, `Origin`, `Content-Type`, `Accept`, `MCP-Protocol-Version`, `Mcp-Method` y `Mcp-Name`.
- Utilice TLS en el proxy inverso y no registre encabezados de autorización ni solicite cadenas de consulta.
- Agregue todos los orígenes de navegador permitidos a `CORS_ORIGIN`. Las solicitudes sin un encabezado `Origin` siguen
  siendo admitidas para clientes nativos; Los orígenes actuales deben coincidir con la lista de permitidos configurada.

<a id="token-administration"></a>

## Administración de tokens

Los usuarios administran sus propios tokens en la pestaña **Acceso MCP** en Configuración. Los administradores del
sistema pueden inspeccionar los metadatos de tokens seguros y revocar un token desde la página Usuarios, pero no pueden
recuperar su secreto hash o de texto sin formato y no pueden crear un token en nombre de otro usuario.

<a id="manage-token-states"></a>

## Administrar estados de tokens

La lista de tokens muestra el nombre, el estado, el prefijo seguro, las marcas de tiempo creadas/últimamente utilizadas
y la caducidad opcional. Los nombres pueden contener como máximo 100 caracteres. Revocar requiere confirmación. Un token
revocado o caducado no puede autenticar solicitudes futuras. Una lista vacía significa que no existen tokens para el
usuario; un error de carga ofrece un reintento. Copie el nuevo token completo antes de cerrar su visualización única.
Los cuadros de diálogo del token de administrador solo permiten la inclusión/revocación, nunca la creación para otro
usuario.
