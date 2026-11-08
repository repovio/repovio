---
title: 'Localización de interfaz'
description:
  'Idiomas de interfaz admitidos, comportamiento alternativo y proceso para mantener las traducciones Repovio.'
---

> Instantánea de origen archivada. Las etiquetas de los productos se han normalizado a Repovio. Para esta versión
> histórica, utilice los identificadores de configuración y las referencias de contenedor de sus archivos de
> implementación etiquetados sin cambios.

Repovio incluye su interfaz web en inglés (`en`), alemán (`de`), español (`es`), francés (`fr`), italiano (`it`),
holandés (`nl`), polaco (`pl`) y portugués. (`pt`). El menú de idioma en el encabezado de la aplicación está disponible
para todos los usuarios que hayan iniciado sesión. La elección de un idioma guarda la preferencia en la cookie del
navegador `ezrepo-locale` y la aplica en futuras visitas.

El inglés es el valor predeterminado y alternativo determinista. Cuando una preferencia del navegador o una cookie
guardada no identifica una configuración regional compatible, Repovio se muestra en inglés. El formato de fecha, hora y
número utiliza la configuración regional seleccionada.

<a id="adding-or-updating-a-locale"></a>

## Agregar o actualizar una configuración regional

1. Agregue o actualice `apps/web/i18n/locales/<locale>.json` utilizando `en.json` como referencia clave completa.
2. Registre su código local, nombre de archivo y nombre para mostrar nativo en `apps/web/nuxt.config.ts`.
3. Mantenga todas las claves de mensajes presentes en `en.json`; el conjunto de pruebas web comprueba esta paridad para
   cada configuración regional enviada.
4. Agregue mensajes en inglés y alemán para cada nueva cadena de interfaz visible para el usuario, luego agregue la
   traducción correspondiente a cada configuración regional enviada.
5. Ejecute `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck` y la prueba de Dramaturgo afectada.

Los nombres de los proveedores, los nombres de los repositorios, los nombres de los flujos de trabajo y otros datos
proporcionados por los proveedores permanecen sin cambios porque no son una copia de la interfaz Repovio.
