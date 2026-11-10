---
title: 'Localización de interfaz'
description: 'Idiomas de interfaz admitidos, comportamiento alternativo y proceso para mantener las traducciones Repovio.'
---

Repovio admite los 13 idiomas del sitio web y conserva italiano, neerlandés, polaco y portugués: 17 idiomas en la app.
Portugués (`pt`) y portugués de Brasil (`pt-BR`) siguen siendo opciones independientes. La tabla incluye todos los códigos.

El inglés es el idioma predeterminado y de reserva. La cookie `repovio-locale` tiene prioridad sobre un idioma del navegador
compatible; las preferencias no compatibles usan inglés. Cambiar de idioma conserva la ruta y los parámetros de consulta.
Fechas, horas y números siguen el idioma elegido sin alterar las políticas configuradas de 24 horas e ISO. Árabe y urdu
usan disposición de derecha a izquierda; los demás idiomas, de izquierda a derecha. Los nombres, identificadores de
repositorio, URL y código procedentes del proveedor conservan sus valores y un orden legible.

<a id="sign-in-controls-and-language-flags"></a>

## Controles de acceso y banderas

Inicio de sesión, configuración inicial y menú de usuario ofrecen los mismos nombres nativos y banderas SVG locales
decorativas. Los nombres siguen siendo las etiquetas accesibles. Los menús largos permiten desplazamiento y teclado.
El control permanece ocupado durante toda la descarga y bloquea nuevas selecciones. Si falla, Repovio restaura el idioma
anterior y muestra un error traducido. Recarga la página y selecciona de nuevo el idioma para reintentar la descarga.

Las páginas públicas de autenticación incluyen un botón de tema que alterna Sistema, Claro y Oscuro. Su icono muestra
la preferencia; el texto emergente y el nombre accesible explican la preferencia actual y la siguiente acción.

Correspondencia entre idioma y país de la bandera:

| Idioma | País | Idioma  | País |
| ------ | ---- | ------- | ---- |
| `en`   | GB   | `zh-CN` | CN   |
| `de`   | DE   | `hi`    | IN   |
| `es`   | ES   | `ar`    | SA   |
| `fr`   | FR   | `bn`    | BD   |
| `it`   | IT   | `pt-BR` | BR   |
| `nl`   | NL   | `id`    | ID   |
| `pl`   | PL   | `ur`    | PK   |
| `pt`   | PT   | `ru`    | RU   |
| `ja`   | JP   |         |      |

Los recursos de `apps/web/public/flags` proceden de [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), con la licencia MIT incluida. No requieren servicios externos de imágenes ni traducción.

<a id="adding-or-updating-a-locale"></a>

## Añadir o actualizar un idioma

1. Usa `apps/web/i18n/locales/en.json` como referencia completa actual. Traduce todos los catálogos distribuidos,
   incluidas etiquetas accesibles, validación, estados, parámetros y significado de los plurales.
2. Registra código, etiqueta de idioma, nombre nativo, archivo, dirección, país y código de Nuxt UI en
   `apps/web/shared/locales.ts`. Conserva los códigos existentes y distingue `pt` de `pt-BR`.
3. Asocia el export de Nuxt UI instalado en `apps/web/app/utils/locales.ts`, por ejemplo `zh_cn` o `pt_br`.
4. Añade la bandera local con su licencia y atribución. No importes la implementación del sitio web en la app.
5. Ejecuta las comprobaciones y los escenarios de navegador. Los tests comparan idiomas del sitio y de la app y rechazan
   mensajes ausentes, parámetros incompatibles, sintaxis inválida, asignaciones UI y banderas ausentes. El inglés de
   reserva no sustituye una traducción completa; los nombres de producto y literales técnicos pueden permanecer iguales.

Activa Node.js 26.13.0 y pnpm 11.28.9, inicia la app local y ejecuta:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Inspecciona capturas claras/oscuras y estrechas/amplias, especialmente RTL y escrituras CJK e índicas. Actualiza de forma coherente todas las traducciones actuales de `next`; los archivos de versiones publicadas no se modifican.
