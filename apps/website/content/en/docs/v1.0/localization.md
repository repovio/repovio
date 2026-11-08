---
title: Interface localization
description: Supported interface languages, fallback behavior, and the process for maintaining Repovio translations.
---

> Archived source snapshot. Product labels have been normalized to Repovio. For this historical release, use the
> configuration identifiers and container references from its tagged deployment files unchanged.

Repovio ships its web interface in English (`en`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Dutch
(`nl`), Polish (`pl`), and Portuguese (`pt`). The language menu in the application header is available to every
signed-in user. Choosing a language saves the preference in the `ezrepo-locale` browser cookie and applies it on future
visits.

English is the deterministic default and fallback. When a browser preference or saved cookie does not identify a
supported locale, Repovio renders English. Date, time, and number formatting use the selected locale.

<a id="adding-or-updating-a-locale"></a>

## Adding or updating a locale

1. Add or update `apps/web/i18n/locales/<locale>.json` using `en.json` as the complete key reference.
2. Register its locale code, file name, and native display name in `apps/web/nuxt.config.ts`.
3. Keep all message keys present in `en.json`; the web test suite checks this parity for every shipped locale.
4. Add English and German messages for every new user-visible interface string, then add the corresponding translation
   to every shipped locale.
5. Run `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck`, and the affected Playwright test.

Provider names, repository names, workflow names, and other provider-supplied data remain unchanged because they are not
Repovio interface copy.
