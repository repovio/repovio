---
title: 'Language'
description: 'Choose an application language and distinguish it from documentation languages.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="application-preference"></a>

## Application preference

Every signed-in user can select a language from the application language control/user menu. The application supports
English (`en`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Dutch (`nl`), Polish (`pl`), and
Portuguese (`pt`). The selected language affects interface messages and date, time, and number formatting.
Provider-supplied repository names, workflow names, and descriptions remain unchanged.

The browser stores the preference in `ezrepo-locale` for future visits. English is the deterministic default and
fallback for unsupported values. Another browser/device has its own preference. If a change cannot complete, retry after
navigation recovers. See [Localization](/docs/v1.0/localization) for maintaining application translations.

<a id="website-and-handbook"></a>

## Website and handbook

The website and handbook offer 13 languages independently of the application's eight interface languages. Use the
website language selector to preserve the current documentation version and page while switching language. Arabic and
Urdu use right-to-left layout. Screenshots can show the English application even when surrounding text is translated;
image captions identify that choice. Choosing a documentation language does not add it to the application.
