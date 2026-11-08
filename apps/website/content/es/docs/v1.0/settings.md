---
title: 'Configuración'
description: 'Encuentre configuraciones personales y controles del sistema y autenticación solo para administradores.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="settings-tabs"></a>

## Pestañas de configuración

Abra **Configuración** desde el menú de usuario. Cada usuario autenticado puede acceder a**General** y**MCP**. Los
administradores del sistema también ven**Autenticación** y**Sistema**. La agrupación de administradores de la barra
lateral no impide que otros usuarios que hayan iniciado sesión abran su configuración personal a través del menú de
usuario.

General contiene [Perfil](/docs/v1.0/profile), [Avatar](/docs/v1.0/avatar) y, para cuentas locales,
[Contraseña](/docs/v1.0/password). Los usuarios administrados por OIDC ven un aviso de administración de identidad en
lugar de formularios de perfil/contraseña local, pero aún pueden editar su avatar. [MCP](/docs/v1.0/mcp) administra
tokens de acceso personales de solo lectura.

<a id="related-preferences"></a>

## Preferencias relacionadas

[Idioma](/docs/v1.0/language) y [Apariencia](/docs/v1.0/appearance) se seleccionan desde la aplicación/controles de
usuario. Los administradores configuran [Autenticación OIDC](/docs/v1.0/authentication) y
[Valores predeterminados del sistema](/docs/v1.0/settings-system) en sus respectivas pestañas. Una pestaña que falta
puede ser correcta para su función; cambiar una URL no otorga autorización. Vuelva a intentar las solicitudes de
configuración fallidas solo después de verificar la conectividad API.
