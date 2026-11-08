---
title: 'Usuarios'
description:
  'Revise los usuarios locales y administrados por identidad, las funciones, la eliminación y la administración del
  token MCP.'
---

<a id="review-accounts"></a>

## Revisar cuentas

Los administradores del sistema abren **Administración → Usuarios**. La tabla muestra el nombre de usuario, el
avatar/nombre para mostrar, la función, el origen local/OIDC y las marcas de tiempo creadas/actualizadas. Filtrar por
función, ordenar, cambiar columnas o paginar. El acceso al repositorio para un Visor o Administrador requiere un
[membresía del repositorio](/docs/next/repositories) separado; los grupos de proveedores de identidad no crean esas
membresías.

<a id="provisioning-and-deletion"></a>

## Aprovisionamiento y eliminación

En Administración → Usuarios, elija Nuevo usuario en la barra. Indique nombre único, nombres opcionales, contraseña de
12–256 caracteres y confirmación, y rol; el valor inicial es Viewer. También funciona con OIDC activo. Las identidades
OIDC se crean mediante su proveedor y nunca se vinculan por coincidencia de nombre local.

La acción de eliminación está disponible para otros usuarios y se ejecuta inmediatamente; revise la cuenta antes de
seleccionarla. No puede eliminar su propia cuenta a través de esta API o pantalla. Al eliminar un usuario Repovio se
elimina el acceso local; no elimina ninguna cuenta de proveedor en GitHub, GitLab, Forgejo o Gitea. Revise el acceso del
usuario afectado antes de eliminarlo.

<a id="user-mcp-tokens"></a>

## Fichas de usuario MCP

Abra el cuadro de diálogo token MCP de un usuario para enumerar los metadatos del token o revocar un token con
confirmación. Los administradores no pueden recuperar valores de token de texto sin formato ni crear el token de otro
usuario a través de este cuadro de diálogo. Los usuarios crean sus propios tokens en
[Configuración de MCP](/docs/next/mcp). Las listas vacías y los errores de carga son distintos; Vuelva a intentarlo
después de la recuperación de la API. Nunca copie valores de tokens en informes de soporte o capturas de pantalla.

<a id="local-user-api"></a>

## Aprovisionar un usuario local a través de la API

Utilice un cliente API a través de HTTPS para enviar `POST /api/v1/users` con autenticación de portador de administrador
y `Content-Type: application/json`. Proporcione este cuerpo de solicitud, reemplazando los marcadores de posición en las
entradas protegidas del cliente:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Los roles válidos son `VIEWER`, `MANAGER` y `SYSTEM_ADMIN`. Asigne solo el rol requerido y luego otorgue membresías al
repositorio por separado. La respuesta contiene metadatos de usuario seguros, no la contraseña ni su hash. Se debe
corregir un nombre de usuario duplicado o una solicitud no válida antes de volver a intentarlo. No almacene contraseñas
ni tokens de portador en archivos rastreados, historial de shell, capturas de pantalla o informes de problemas.

<a id="create-and-reset-local-accounts"></a>

## Crear y restablecer cuentas locales

La acción de fila Restablecer contraseña permite al administrador fijar una nueva sin conocer la anterior. Escriba
contraseña y confirmación. Las sesiones JWT anteriores dejan de funcionar; cambiar la propia cierra la sesión. No
aparece para cuentas OIDC. Los tokens MCP se conservan.

<a id="local-access-groups"></a>

## Grupos de acceso locales

Abra Administración → Grupos de usuarios para crear, renombrar o eliminar grupos y gestionar miembros. Los nombres deben
ser únicos y no vacíos. La selección permite buscar y paginar; un usuario puede estar en varios grupos. No hay grupos
anidados. Eliminar requiere confirmación y retira miembros y permisos heredados, conservando asignaciones directas.

En Acceso de grupos del repositorio asigne Viewer o Manager y cambie o retire el permiso. Los permisos directos y
heredados se combinan; Manager prevalece. La gestión sigue requiriendo rol global Manager; los administradores tienen
acceso total. La retirada se aplica en la siguiente solicitud salvo otro permiso vigente. Los grupos admiten cuentas
locales y OIDC, sin sincronización de claims OIDC.

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
