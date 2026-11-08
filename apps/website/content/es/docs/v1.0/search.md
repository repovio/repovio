---
title: 'búsqueda global'
description: 'Busque destinos, repositorios, cuentas de proveedores y ejecuciones de flujo de trabajo.'
---

> Instantánea de origen archivada. Las etiquetas de los productos utilizan Repovio. Utilice los identificadores de
> configuración y las referencias de contenedor de los archivos de implementación etiquetados de esta versión sin
> cambios.

<a id="search-the-installation"></a>

## Buscar la instalación

Abra la búsqueda desde la barra de aplicaciones o use el método abreviado de teclado que se muestra. Introduzca al menos
dos caracteres. Los resultados se agrupan en destinos de navegación, repositorios, cuentas de proveedores y ejecuciones
de flujo de trabajo. Las coincidencias de navegación utilizan las etiquetas traducidas de los destinos a los que puede
acceder su cuenta; Los resultados de recursos utilizan nombres de proveedores sincronizados.

Desplácese por los resultados con el teclado o seleccione uno con el puntero. Las coincidencias de repositorio y cuenta
de proveedor abren la vista Repovio correspondiente; Las coincidencias del flujo de trabajo abren la URL de ejecución
del proveedor. Presione **Escape** para cerrar la búsqueda y regresar a la página anterior. La búsqueda no realiza
descubrimiento del lado del proveedor ni inicia sincronización.

<a id="access-and-failure-states"></a>

## Estados de acceso y fallo

La búsqueda de recursos utiliza los permisos del repositorio del usuario actual. Los resultados de la cuenta de
proveedor están limitados a los administradores. La falta de resultados puede significar una consulta breve, no hay
registros retenidos coincidentes o una membresía insuficiente. Pruebe con un nombre más específico e inspeccione el
repositorio/trabajo si faltan datos sincronizados. La carga se muestra mientras se ejecuta una consulta. En caso de
error de solicitud, vuelva a intentar la consulta después de que se recupere la conectividad API. La búsqueda nunca
revela tokens de proveedores ni credenciales de notificación.
