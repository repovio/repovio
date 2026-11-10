# Data Model: App Language Parity

This feature adds static presentation metadata and translations, not database entities or API DTOs.

## AppLocale

| Field         | Constraint                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| `code`        | Unique exact locale code, preserving `zh-CN`, `pt-BR`, and legacy `pt`              |
| `language`    | Valid regional language tag for document/formatting metadata                        |
| `name`        | Nonempty native name; Brazilian Portuguese distinguishable from existing Portuguese |
| `file`        | Matching local JSON catalog, resolved using existing Nuxt locale-file conventions   |
| `dir`         | `rtl` only for `ar` and `ur`; `ltr` for all others                                  |
| `flagCountry` | Existing flag file basename; local licensed SVG must exist                          |
| `ui`          | Explicit existing Nuxt UI locale export identifier                                  |

AppLocale is the app registration and selector source. Website registry codes must be a subset. Existing app entries
keep their code, label, and country mapping. Registration order preserves existing options; additions follow website
order for missing entries. Selector tests compare sets and explicit compatibility entries instead of fragile indices.

## MessageCatalog

One catalog per AppLocale. English defines leaf paths and message parameter contracts. All leaves are nonempty strings;
every locale has the exact current English leaf set. Message compilation, interpolation, plural meaning, escape rules,
and linked targets remain valid. Technical literals may legitimately be equal across languages.

No frozen 1,029-key assumption: source changes during implementation must be reflected in every shipped catalog.

## LocalePreference

Existing browser cookie `repovio-locale` stores one supported app code. No new server persistence, account field, migration,
or cross-domain website cookie is introduced. Preserve the existing detection algorithm; supported explicit selections
survive navigation and reload, and unsupported preferences resolve to English.

### Selection transition

1. Initiating selector enters loading/disabled state.
2. Await existing locale switch and catalog loading.
3. On success, selected messages, UI locale, document language/direction, formatting, and persisted preference agree.
4. On failure, release loading, expose accessible feedback, and retain/recover a usable supported language. Never report
   an uncompleted selection as successful; verify recovery against the installed locale loader.
5. Switching between RTL and LTR refreshes document and component direction, including overlays.

Current route/query, permissions, provider data, and date/time display policy remain unchanged throughout selection.
