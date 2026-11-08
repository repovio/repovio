---
title: 'Localización de interfaz'
description: 'Idiomas de interfaz admitidos, comportamiento alternativo y proceso para mantener las traducciones Repovio.'
---

Repovio incluye su interfaz web en inglés (`en`), alemán (`de`), español (`es`), francés (`fr`), italiano (`it`),
holandés (`nl`), polaco (`pl`) y portugués. (`pt`). El menú de idioma en el encabezado de la aplicación está disponible
para todos los usuarios que hayan iniciado sesión. La elección de un idioma guarda la preferencia en la cookie del
navegador `repovio-locale` y la aplica en futuras visitas.

El inglés es el valor predeterminado y alternativo determinista. Cuando una preferencia del navegador o una cookie
guardada no identifica una configuración regional compatible, Repovio se muestra en inglés. El formato de fecha, hora y
número utiliza la configuración regional seleccionada.

<a id="sign-in-controls-and-language-flags"></a>

## Controles de acceso y banderas

Las páginas de acceso y configuración del primer administrador ofrecen bajo el formulario un selector con idioma activo
y bandera. Permanece ocupado mientras carga el idioma. Un botón separado alterna entre Sistema, Claro y Oscuro y guarda
la preferencia. Su icono muestra la selección actual; la descripción emergente y el nombre accesible describen la
selección y la siguiente acción.

El menú muestra banderas SVG locales decorativas junto a los nombres nativos. Los nombres siguen siendo las etiquetas
accesibles; las banderas no los reemplazan. La correspondencia entre idioma y país es: `en` → GB, `de` → DE, `es` → ES,
`fr` → FR, `it` → IT, `nl` → NL, `pl` → PL, `pt` → PT.

Los archivos de `apps/web/public/flags` proceden de
[flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), bajo la licencia MIT incluida. No necesitan
solicitudes externas de imágenes. Al añadir un idioma, incluir su bandera y correspondencia en `useLocales`.

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
