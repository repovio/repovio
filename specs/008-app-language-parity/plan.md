# Implementation Plan: App Language Parity

**Branch**: `codex/84-app-language-parity`; base `aa0fa7eb525f7226c32f6b49cbb7807f6bb269ec`, verified against `origin/main`.
**Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)
**Input**: `specs/008-app-language-parity/spec.md`
**Tracking**: [Issue #84](https://github.com/repovio/repovio/issues/84). Planning, tasks, issue creation, and the
planning-only commit/push approved on 2026-11-10. Implementation remains separately gated.

## Summary

Support every website language in the app, preserving all existing app locales: 13 website locales plus `it`, `nl`, `pl`,
and `pt` give 17 app locales. Add nine complete catalogs, native language options, local flags, Nuxt UI translations,
and correct Arabic/Urdu direction. Keep English fallback, the existing cookie, route strategy, and formatting policies.

Use the current website registry as the parity reference, with a small app-owned metadata registry consumed by app config
and selectors. A test compares the two sets without introducing a runtime website dependency or shared package migration.

## Technical Context

**Language/Version**: Existing TypeScript compiler aliases and Vue SFC conventions; Node.js 26.13.0, pnpm 11.28.9.
**Primary Dependencies**: Nuxt 4.6.3, Vue 3.5.44, Nuxt i18n 10.6.0, Vue I18n 11.4.17, Nuxt UI 4.12.0; preserve pins.
**Storage**: Checked-in JSON catalogs and existing `repovio-locale` browser cookie; no schema or account changes.
**Testing**: Existing Vitest and Playwright, canonical format/documentation checks, web lint/typecheck/build.
**Target Platform**: Existing Nuxt SPA (`ssr: false`), desktop/mobile browsers and deployed web container.
**Project Type**: Frontend localization within the existing monorepo.
**Performance Goals**: Preserve on-demand locale loading; no external translation/flag requests or duplicate bundled catalogs.
**Constraints**: No dependency changes, provider writes, API/schema changes, locale removal, or published archive edits.
**Scale/Scope**: 17 locales; nine added catalogs against 1,029 current English leaf messages each. This count is a baseline,
not a frozen implementation target: use the current English catalog when implementing.

## Constitution Check

| Gate                                      | Before research                             | After design                                                             |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Architecture and scope                    | Pass: user-authorized localization planning | Pass: app feature only; issue #84 associated                             |
| Read-only providers                       | Pass: no provider work                      | Pass: source values and integration calls unchanged                      |
| Authorization and secrets                 | Pass: presentation only                     | Pass: role filtering and credentials remain untouched                    |
| Durable synchronization and notifications | Not affected                                | No delivery or synchronization changes                                   |
| Verification and localization             | Pass: complete catalogs required            | Pass: structural, message, browser, and visual acceptance defined        |
| Existing engineering standards            | Pass: preserve pins and layout              | Pass: typed helpers, attached docs, focused Vue ownership                |
| Delivery gates                            | Pass: planning authorized                   | Pass: issue and planning commit approved; implementation and merge gated |

The constitution requires English/German messages; this feature extends that minimum without changing its governance.
No constitutional waiver is needed. Issue #84 records this bounded scope. Implementation is not approved; verify issue
priority before starting it. Do not modify constitution, templates, or unrelated guidelines.

## Project Structure

### Documentation (this feature)

```text
specs/008-app-language-parity/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── checklists/requirements.md
└── contracts/localization.md
```

[tasks.md](tasks.md) records the separately approved task-generation phase. No implementation has started.

### Source Code (repository root)

```text
apps/web/
├── shared/locales.ts                          # planned app metadata registry
├── nuxt.config.ts                            # derive locale registration from registry
├── i18n/i18n.config.ts                        # retain English fallback
├── i18n/locales/*.json                        # nine new complete catalogs; retain eight existing
├── app/app.vue                               # reactive UApp locale and document lang/dir
├── app/utils/locales.ts                       # planned typed Nuxt UI locale mapping
├── app/composables/app/locales.ts             # shared native-name/flag selectors
├── app/components/layout/                    # focused direction fixes where browser checks require them
├── app/i18n/locales.spec.ts                   # dynamic parity and message/metadata validation
├── app/utils/date-time.spec.ts               # existing formatting policy regression coverage
├── public/flags/*.svg                        # nine local assets and retained MIT attribution
└── tests/e2e/{localization,auth-preferences}.spec.ts
apps/website/
├── content/locales.json                       # read-only website coverage reference for tests
└── content/*/docs/next/localization.md         # current localized handbook guidance only
```

**Structure Decision**: Reuse existing app configuration, composable, shell, catalogs, and tests. App registry owns only
app metadata; website registration, content collections, SEO, and independent deployment remain unchanged. Parity checks
read the website registry at test time. Do not import website implementation into the app or add a shared package.

## Phase 0: Research

[research.md](research.md) records current evidence and decisions. Research resolves the locale set, compatibility,
right-to-left integration, Nuxt UI mapping, catalog completeness, documentation scope, and validation needs.

## Phase 1: Design

1. Define typed app locale metadata: code, regional language tag, native name, file, direction, flag country, and Nuxt UI
   identifier. Preserve existing eight codes/names/flags; add nine website codes with exact casing. Config and selectors
   consume this one app list. Tests ensure website codes are a subset and app entries are unique and complete.
2. Translate the full current English message tree into `zh-CN`, `hi`, `ar`, `bn`, `pt-BR`, `id`, `ur`, `ru`, and `ja`.
   Preserve leaf paths, interpolation parameters, linked-message targets, escape syntax, and plural meaning. Validate
   compiled messages using existing Vue I18n capabilities; do not add a parser dependency solely for testing.
3. Add flags for CN, IN, SA, BD, BR, ID, PK, RU, and JP from the existing licensed asset source. Preserve app English GB
   and existing PT. Keep decorative empty alternative text and native names as accessible labels.
4. Resolve Nuxt UI exports explicitly (`zh_cn`, `pt_br`, and direct mappings for other codes) and bind the active locale
   to `UApp`. Set reactive document `lang` and `dir` using supported locale metadata. Confirm installed export contracts
   rather than relying on string transforms. Test translated built-in control text and direction after every switch.
5. Review auth forms, shell/sidebar, menus, dialogs, tables/pagination, tooltips, and technical identifiers under RTL.
   Replace physical alignment utilities only where required, using logical direction-aware equivalents. Isolate technical
   mixed-direction content locally without mutating provider values or forcing whole tables to the wrong direction.
6. Preserve cookie key `repovio-locale`, English fallback, `no_prefix`, route/query state, and current date/time settings,
   including 24-hour and ISO policies. Preserve full-await loading on auth controls; ensure every initiating language
   control covers its own awaited operation and accessible failure recovery.
7. Expand locale tests from a hardcoded list to actual registry coverage. Validate nonempty string leaves, exact key sets,
   parameters, message compilation, linked targets, metadata, UI mappings, and local assets. Include intentional failing
   fixtures to prove checks detect omissions. Review new translations for untranslated prose; identical technical terms
   are valid, so do not blindly reject every English-equal value.
8. Update current localization guidance in all 13 `next` handbook locales. Describe 17 app options, the registry, flags,
   RTL, persistence, fallback, and maintenance commands; preserve all published `v*` handbook bytes.
9. Verify all 17 selections with fixture-backed browser smoke and authentication/signed-in navigation. Visually inspect
   Arabic, Urdu, Simplified Chinese, Hindi, Bengali, and English across both themes and 390px/1440px widths. Capture
   representative forms, shell, table, dialog, and menu states. No live-provider validation is implied by fixtures.

## Risks and Boundaries

- Nine catalogs exceed 9,000 message values. Structural parity cannot prove linguistic quality; review representative
  translated prose, terminology, parameter placement, and plural meaning in every added language before acceptance.
- A 17-option menu must scroll and remain keyboard reachable; tests must not require every option visible simultaneously.
- RTL can expose existing physical CSS assumptions; limit repairs to the affected localization flows and shared shell.
- Keep fonts local/system-based unless actual rendering proves a missing-script problem. Any extra font asset needs
  a concrete scoped solution and license review; do not introduce external font services speculatively.
- The website registry is a test reference only. Future website language additions should fail the parity check until the
  app provides translations; do not auto-register a language without its catalog.
- New source declarations require attached documentation and typed boundaries; Vue block/attribute rules apply. Existing
  constitution and coding-guidelines differ on typed JSDoc tags; resolve against current explicit instructions before
  source edits without rewriting unrelated standards.
- Each substantive implementation task needs its own verified commit and exactly one focused `repovio` Changeset after
  explicit commit authorization. Keep graph updates with approved source changes; no release or deployment is implied.

## Complexity Tracking

No violations, migrations, new packages, or translation services. Preserve existing runtime/build architecture.
