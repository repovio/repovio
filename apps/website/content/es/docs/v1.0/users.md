---
title: 'Usuarios'
description:
  'Revise los usuarios locales y administrados por identidad, las funciones, la eliminación y la administración del
  token MCP.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="review-accounts"></a>

## Revisar cuentas

Los administradores del sistema abren **Administración → Usuarios**. La tabla muestra el nombre de usuario, el
avatar/nombre para mostrar, la función, el origen local/OIDC y las marcas de tiempo creadas/actualizadas. Filtrar por
función, ordenar, cambiar columnas o paginar. El acceso al repositorio para un Visor o Administrador requiere un
[membresía del repositorio](/docs/v1.0/repositories) separado; los grupos de proveedores de identidad no crean esas
membresías.

<a id="provisioning-and-deletion"></a>

## Aprovisionamiento y eliminación

La página Usuarios no tiene formulario para crear o editar usuarios. Se crean usuarios locales adicionales a través de
la API de usuario protegido solo para administradores utilizando nombre de usuario, contraseña y función. Los usuarios
de OIDC se aprovisionan mediante el inicio de sesión de identidad configurado. Consulte
[Autenticación](/docs/v1.0/authentication) para conocer la asignación y la separación de cuentas. No infiera una acción
de edición del usuario a partir de la presencia de un perfil editable en su propia página de Configuración.

La acción de eliminación está disponible para otros usuarios y se ejecuta inmediatamente; revise la cuenta antes de
seleccionarla. No puede eliminar su propia cuenta a través de esta API o pantalla. Al eliminar un usuario Repovio se
elimina el acceso local; no elimina ninguna cuenta de proveedor en GitHub, GitLab, Forgejo o Gitea. Revise el acceso del
usuario afectado antes de eliminarlo.

<a id="user-mcp-tokens"></a>

## Fichas de usuario MCP

Abra el cuadro de diálogo token MCP de un usuario para enumerar los metadatos del token o revocar un token con
confirmación. Los administradores no pueden recuperar valores de token de texto sin formato ni crear el token de otro
usuario a través de este cuadro de diálogo. Los usuarios crean sus propios tokens en
[Configuración de MCP](/docs/v1.0/mcp). Las listas vacías y los errores de carga son distintos; Vuelva a intentarlo
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
