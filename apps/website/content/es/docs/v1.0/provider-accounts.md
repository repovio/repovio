---
title: 'Cuentas de proveedores'
description: 'Conecte y administre credenciales de proveedor cifradas y de solo lectura.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="access-and-list"></a>

## Acceso y lista

Los administradores del sistema abren **Administración → Cuentas de proveedor**. La tabla muestra el nombre, el tipo de
proveedor, la URL base, el estado habilitado y la última sincronización. Filtrar por tipo/habilitado, ordenar, cambiar
columnas y paginar. Otros roles no administran cuentas de proveedores. Los tokens y los secretos OAuth nunca se
devuelven en los datos de la lista.

<a id="connect-a-provider"></a>

## Conectar un proveedor

Elija **Agregar proveedor** y seleccione GitHub, GitLab, Forgejo o Gitea. Ingrese un nombre reconocible y la URL base de
la instancia correcta; Gitea requiere uno. Elija entre los métodos de autenticación que la API informa según su
configuración. Sin un cliente OAuth coincidente, utilice un token de acceso personal.**Verificar y agregar proveedor**
verifica las credenciales PAT antes de almacenarlas.**Conectar proveedor** redirige al consentimiento del proveedor y
regresa con un aviso de éxito o fracaso.

Utilice únicamente los ámbitos de lectura en [Configuración del proveedor OAuth](/docs/v1.0/provider-oauth). El
proveedor OAuth conecta los datos del repositorio; está separado de
[Inicio de sesión de usuario OIDC](/docs/v1.0/authentication). Repovio cifra las credenciales en reposo y nunca
proporciona mutaciones de recursos del proveedor, incluso cuando un token ascendente podría autorizar escrituras.

<a id="maintain-connections"></a>

## Mantener conexiones

Habilite o deshabilite una fila para controlar la participación. Las acciones de la fila pendiente bloquean las acciones
conflictivas mientras finalizan las solicitudes. La desactivación conserva la configuración. La eliminación se ejecuta
inmediatamente; considere los datos rastreados dependientes antes de seleccionar la acción de eliminación. Cree una
conexión de reemplazo si la propiedad o las credenciales del proveedor deben cambiar a través de un flujo que la
pantalla actual no muestra.

Agregue repositorios por separado de [Repositorios](/docs/v1.0/repositories); La configuración del webhook pertenece a
repositorios rastreados individuales, no a cuentas de proveedores. El descubrimiento vacío puede significar que no hay
repositorios, una instancia incorrecta, alcances de lectura insuficientes o credenciales no válidas. Distinguir fallas
de carga de opciones de autenticación, errores de verificación, avisos de devolución de llamada OAuth y fallas de API;
corrija la causa antes de volver a intentarlo. Inspeccione los trabajos en busca de fallas de sincronización continuas.
