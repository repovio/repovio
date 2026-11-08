---
title: 'Configuración'
description: 'Encuentre configuraciones personales y controles del sistema y autenticación solo para administradores.'
---

<a id="settings-tabs"></a>

## Pestañas de configuración

Abra **Configuración** desde el menú de usuario. Cada usuario autenticado puede acceder a**General** y**MCP**. Los
administradores del sistema también ven**Autenticación** y**Sistema**. La agrupación de administradores de la barra
lateral no impide que otros usuarios que hayan iniciado sesión abran su configuración personal a través del menú de
usuario.

General contiene [Perfil](/docs/next/profile), [Avatar](/docs/next/avatar) y, para cuentas locales,
[Contraseña](/docs/next/password). Los usuarios administrados por OIDC ven un aviso de administración de identidad en
lugar de formularios de perfil/contraseña local, pero aún pueden editar su avatar. [MCP](/docs/next/mcp) administra
tokens de acceso personales de solo lectura.

<a id="related-preferences"></a>

## Preferencias relacionadas

[Idioma](/docs/next/language) y [Apariencia](/docs/next/appearance) se seleccionan desde la aplicación/controles de
usuario. Los administradores configuran [Autenticación OIDC](/docs/next/authentication) y
[Valores predeterminados del sistema](/docs/next/settings-system) en sus respectivas pestañas. Una pestaña que falta
puede ser correcta para su función; cambiar una URL no otorga autorización. Vuelva a intentar las solicitudes de
configuración fallidas solo después de verificar la conectividad API.
