---
title: 'Interface localization'
description: 'Supported interface languages, fallback behavior, and the process for maintaining Repovio translations.'
---

Repovio supports all 13 website languages and retains its existing Italian, Dutch, Polish, and Portuguese translations.
The app offers 17 languages: English, German, Spanish, French, Italian, Dutch, Polish, Portuguese, Simplified Chinese,
Hindi, Arabic, Bengali, Brazilian Portuguese, Indonesian, Urdu, Russian, and Japanese. Portuguese (`pt`) and Brazilian
Portuguese (`pt-BR`) remain separate options.

English is the default and fallback. A saved `repovio-locale` browser cookie takes precedence over a supported browser
language; unsupported preferences fall back to English. Language changes preserve the current route and query parameters.
Date, time, and number formatting follow the selected language while retaining the configured 24-hour and ISO policies.

Arabic and Urdu use right-to-left layouts. Other languages use left-to-right layouts. Provider-authored names, repository
identifiers, URLs, and code retain their source values and readable direction.

<a id="sign-in-controls-and-language-flags"></a>

## Sign-in controls and language flags

Sign-in, first-administrator setup, and the signed-in user menu expose the same native language names and decorative local
SVG flags. Names remain the accessible labels. Long menus scroll and remain keyboard accessible. The initiating control
stays busy for the complete language download; repeated selections are disabled. If a download fails, Repovio restores the
previous language and shows a localized error. Reload and select the language again to retry a failed asset download.

Public authentication pages also provide a theme button cycling System, Light, and Dark. Its icon shows the preference;
its tooltip and accessible name describe the current preference and next action.

The locale-to-country flag mapping is:

| Locale | Country | Locale  | Country |
| ------ | ------- | ------- | ------- |
| `en`   | GB      | `zh-CN` | CN      |
| `de`   | DE      | `hi`    | IN      |
| `es`   | ES      | `ar`    | SA      |
| `fr`   | FR      | `bn`    | BD      |
| `it`   | IT      | `pt-BR` | BR      |
| `nl`   | NL      | `id`    | ID      |
| `pl`   | PL      | `ur`    | PK      |
| `pt`   | PT      | `ru`    | RU      |
| `ja`   | JP      |         |         |

Assets in `apps/web/public/flags` come from [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), under
the included MIT license. They require no external image or translation service.

<a id="adding-or-updating-a-locale"></a>

## Adding or updating a locale

1. Use `apps/web/i18n/locales/en.json` as the current complete message reference. Translate every shipped catalog,
   including accessible labels, validation, empty/error/loading states, parameters, and plural meaning.
2. Register metadata in `apps/web/shared/locales.ts`: exact code, language tag, native name, catalog file, direction, flag
   country, and Nuxt UI locale identifier. Preserve existing codes and distinguish `pt` from `pt-BR`.
3. Map the installed Nuxt UI locale export in `apps/web/app/utils/locales.ts`; examples are `zh_cn` and `pt_br`.
4. Add the licensed local flag asset and preserve its attribution. Do not import website implementation into the app.
5. Run catalog checks and browser scenarios. Tests compare the actual website registry with app support and reject missing
   messages, incompatible parameters, malformed syntax, missing UI mappings, and missing flag assets. English fallback
   does not replace a completed translation. Unchanged product names and technical literals are valid.

Activate the pinned Node.js 26.13.0 and pnpm 11.28.9 toolchain, start the local app, then run:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Inspect relevant screenshots in light/dark and narrow/wide layouts, especially RTL, CJK, and Indic scripts. Update current
`next` handbook translations consistently; published version archives remain unchanged.
