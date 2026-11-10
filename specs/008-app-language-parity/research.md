# Research: App Language Parity

## Locale coverage and compatibility

**Decision**: Add nine website locales and keep the existing eight, for 17 app locales.
**Rationale**: `apps/website/content/locales.json` defines 13 codes; `apps/web/nuxt.config.ts` currently registers eight.
Their intersection is `en`, `de`, `es`, and `fr`. Website-only codes are `zh-CN`, `hi`, `ar`, `bn`, `pt-BR`, `id`, `ur`,
`ru`, and `ja`. App-only codes `it`, `nl`, `pl`, and `pt` remain supported to preserve preferences and existing translations.
**Alternatives considered**: Removing app-only languages would regress existing users without a user request. Mapping
`pt` to `pt-BR` would collapse distinct regional options and alter saved preference semantics.

## Metadata ownership

**Decision**: Small app-owned registry, consumed by config/selectors, with a test asserting website-code inclusion.
**Rationale**: App flags, unprefixed routes, and persisted options differ from website metadata. The app must remain
independently buildable without importing website utilities, collections, or Nuxt configuration.
**Alternatives considered**: Shared package extraction expands scope. Copying lists independently into config, selectors,
and tests repeats the existing drift risk. Runtime website lookup adds unnecessary availability coupling.

## Document direction and Nuxt UI

**Decision**: Bind a typed UI-locale mapping to `UApp` and update document language/direction reactively.
**Rationale**: `apps/web/app/app.vue` currently wraps content in bare `UApp`, whereas the website already binds locale
and document attributes. `apps/website/app/utils/locales.ts` demonstrates exports for all nine added languages, including
`zh_cn`, `pt_br`, and `ur`. Installed Nuxt UI contains corresponding locale modules. Arabic/Urdu require RTL.
**Alternatives considered**: Catalog additions alone leave built-in controls in English and direction incorrect. A global
CSS mirror would also mirror technical data/icons incorrectly; use supported direction and focused logical utilities.

Primary upstream reference checked against Nuxt i18n v10.6.0:
[locale object options](https://github.com/nuxt-modules/i18n/blob/v10.6.0/docs/content/docs/04.api/00.options.md) support
`code`, `language`, `file`, and `dir`;
[useLocaleHead](https://github.com/nuxt-modules/i18n/blob/v10.6.0/docs/content/docs/06.composables/04.use-locale-head.md)
provides reactive `lang`/`dir`. Use document attributes without adding website SEO behavior to the SPA.

## Preference and format preservation

**Decision**: Keep `setLocale`, `repovio-locale`, English fallback, and `no_prefix`.
**Rationale**: Existing composable and auth control already await locale changes. The
[setLocale contract](https://github.com/nuxt-modules/i18n/blob/v10.6.0/docs/content/docs/04.api/04.vue-i18n.md) updates the
configured cookie. `use-date-time.ts` already reacts to the selected locale; `utils/date-time.ts` enforces configured
24-hour/ISO policies. Add regressions rather than replacing that behavior.
**Alternatives considered**: Account-level settings, cross-domain cookie sharing, locale-prefixed app URLs, or replacing
formatters introduce unrelated contracts and persistence changes.

## Catalog quality and automated coverage

**Decision**: Complete catalogs with dynamic parity, parameter, syntax, linked-message, metadata, and asset checks.
**Rationale**: English currently has 1,029 leaf messages. `app/i18n/locales.spec.ts` hardcodes seven non-English codes
and checks only leaf keys; English-copy catalogs could pass. Browser suites hardcode eight options/flags and must become
registry-aware while retaining actual behavior assertions. Structural checks need translation review as a separate gate.
**Alternatives considered**: Runtime English fallback as completion fails the user request. Blanket rejection of values
identical to English incorrectly rejects product names/technical tokens. Paid runtime translation adds secrets and coupling.

## Flags, documentation, and acceptance

**Decision**: Extend existing local SVG assets and MIT attribution; update current handbook only; use existing test tools.
**Rationale**: Local flags avoid external requests; native names carry accessible meaning. Existing app GB/website US
flags need not be unified for language coverage. Current localization guidance explicitly lists eight app languages;
all 13 `next` translations need the same corrected facts, while published archives retain their release provenance.
**Alternatives considered**: Emoji-only or remote flags change established presentation. Editing historical archives
misrepresents old releases. A full unrelated layout audit would exceed localization scope.

## Resolution and limitations

All planning decisions have explicit defaults. No substantive clarification remains. Local source and installed modules
were inspected; product tests, browser rendering, full translation quality, Docker, and remote CI were not executed or
validated during planning. Dependency pins remain unchanged. No matching app-language-parity issue was identified before creation. After explicit
approval, [issue #84](https://github.com/repovio/repovio/issues/84) was created and associated with
`codex/84-app-language-parity`. The branch starts at verified `origin/main` `aa0fa7e`; only a version-release commit separates
that base from the original research snapshot `d96d3a8`, with no changes to the inspected application localization sources.
