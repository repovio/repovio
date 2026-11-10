# Localization Contract

## Supported app language set

| Code    | Native name        | Direction | New local flag | Nuxt UI export |
| ------- | ------------------ | --------- | -------------- | -------------- |
| `zh-CN` | 简体中文           | ltr       | `cn.svg`       | `zh_cn`        |
| `hi`    | हिन्दी             | ltr       | `in.svg`       | `hi`           |
| `ar`    | العربية            | rtl       | `sa.svg`       | `ar`           |
| `bn`    | বাংলা              | ltr       | `bd.svg`       | `bn`           |
| `pt-BR` | Português (Brasil) | ltr       | `br.svg`       | `pt_br`        |
| `id`    | Bahasa Indonesia   | ltr       | `id.svg`       | `id`           |
| `ur`    | اردو               | rtl       | `pk.svg`       | `ur`           |
| `ru`    | Русский            | ltr       | `ru.svg`       | `ru`           |
| `ja`    | 日本語             | ltr       | `jp.svg`       | `ja`           |

Retain `en`, `de`, `es`, `fr`, `it`, `nl`, `pl`, and `pt`, including existing native labels, GB/PT flags, and saved codes.
Total: 17 unique options. `apps/website/content/locales.json` supplies the 13-code coverage reference at test time;
registration must not depend on the website runtime. New native labels match that registry exactly.

## User interface behavior

- Sign-in, first-administrator setup, and signed-in controls expose the same set through shared locale metadata.
- Native names label options. Flags are decorative, locally loaded, and never replace accessible text.
- Menu/select options remain scrollable and keyboard reachable with 17 entries.
- Every selector remains loading/disabled throughout the operation it initiates; failure clears loading and leaves a
  usable interface with accessible feedback. Test delayed and failed loading explicitly.
- Successful selection persists `repovio-locale`, keeps route/query state, and survives reload.
- English remains default/fallback. Preserve supported browser-language detection and malformed/unsupported fallback.
- Document `lang` reflects the selected language tag; document and Nuxt UI direction agree. `ar`/`ur` are RTL.
- Switching back to English restores LTR in shell and overlays without changing provider data.
- Built-in table/select/calendar/pagination messages use the mapped Nuxt UI locale where those controls are present.
- Date/time formatting remains reactive and preserves administrator-selected format and 24-hour/ISO policies.

## Catalog acceptance

Every catalog has exactly the English leaf paths, nonempty values, compatible named parameters and linked-message targets,
and valid Vue I18n message syntax. Plural alternatives may differ by language; test meaning and supported runtime rules
rather than enforcing an identical number of branches. No raw keys, missing substitutions, or English placeholders are
accepted as translated prose. Human/linguistic review must distinguish valid unchanged technical vocabulary.

## Layout and data

At 390px/1440px in light/dark, selected text and controls remain readable, focusable, and free from page overflow.
Arabic/Urdu, CJK, and Indic scripts require visual inspection. Technical URLs, repository/workflow names, code, user names,
and provider-authored content retain original values and readable bidirectional order. Role-based visibility is unchanged.

## Maintenance and boundaries

Tests derive app coverage from shipped metadata and reject missing website codes, catalogs, keys, parameters, UI mappings,
direction values, and flag assets. Current `next` handbook translations describe actual support; published `v*` archives
remain unchanged. No public API, database, outbound notification-template, provider, release, or deployment contract changes.
