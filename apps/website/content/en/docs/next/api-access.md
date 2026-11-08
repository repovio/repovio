---
title: API access
description: Open the installed API documentation and use the release-specific static API reference.
---

<a id="installed-api-documentation"></a>

## Installed API documentation

Every Repovio API server serves its interactive API documentation at `/docs`. In local development, open
`http://localhost:3001/docs`. The REST endpoints use the `/api/v1` base path.

For a deployment, use the externally reachable API origin and the path configured by your reverse proxy. For example, if
the API server is exposed at `https://repovio.example.com`, its documentation can be exposed at
`https://repovio.example.com/docs`. The web application does not automatically proxy this route; configure your proxy
explicitly if you want to expose it. `/api/v1/docs` is not the documentation route.

The installed reference describes the running application. Requests made from that interactive reference use your
instance and require the authentication and permissions documented for each operation. See
[Authentication](/docs/next/authentication) for sign-in and account configuration. MCP access tokens are intended for
[MCP clients](/docs/next/mcp), not as general REST bearer tokens.

<a id="static-release-reference"></a>

## Static release reference

The [API reference](/docs/next/api-reference) on this website is a read-only snapshot generated from the exact
application revision of the selected release. It needs no running Repovio instance and does not send API requests.
Choose the version matching your installation; the installed `/docs` page remains authoritative for your running build.

Search by method, path, or description, inspect parameters and response schemas, or download the complete OpenAPI JSON
from the reference page. Schema identifiers and API descriptions retain the language of the generated contract.
