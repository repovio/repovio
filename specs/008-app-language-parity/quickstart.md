# Validation Guide: App Language Parity

This guide describes acceptance after separately approved implementation. These product checks have not run during planning.

## Prerequisites

- Node.js 26.13.0 and Corepack pnpm 11.28.9; preserve the repository's aliases and dependency pins.
- Install dependencies using `corepack pnpm install --frozen-lockfile` in the selected task worktree.
- Use fixture-backed browser responses from the existing Playwright suites; no live provider credential is required.
- Follow [the localization contract](contracts/localization.md) and [data model](data-model.md).
- Before every edit or test, inspect `git status --short` and relevant diffs to preserve unrelated work.

## Focused unit and build checks

Run from the repository root:

```sh
corepack pnpm --filter @repovio/schemas build
corepack pnpm --dir apps/web exec nuxt prepare
corepack pnpm --dir apps/web exec vitest run app/i18n/locales.spec.ts app/utils/date-time.spec.ts
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web build
```

Expected: 17 unique app entries, all 13 website codes included, complete catalogs, matching parameters, compiled messages,
valid direction/UI mapping, local assets, and preserved date/time policies. Run negative fixtures that omit a website code,
message key, parameter, or flag and confirm the relevant assertion fails. Newly added prose requires translation review;
key parity alone does not demonstrate correctness.

## Browser acceptance

Start the app in a separate terminal, then run focused suites against it:

```sh
corepack pnpm --dir apps/web dev
```

```sh
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Existing Playwright configuration uses `http://[::1]:3000`; set `PLAYWRIGHT_BASE_URL` if the local server differs.
Keep API fixtures isolated; browser checks do not prove live-provider behavior.

1. Check sign-in, first-admin setup, and signed-in controls list all 17 native options. Verify every flag loads locally,
   decorative alternatives are empty, and all entries are reachable with scrolling/keyboard.
2. For each language, select it, check known translated labels and a parameterized message, navigate a representative
   authorized screen, reload, and verify cookie persistence. Keep route/query state. Exercise unsupported-cookie English
   fallback and supported browser-language detection, including exact `zh-CN`/`pt-BR` and retained `pt` selection.
3. Delay locale loading and verify the initiating control stays busy until completion. Inject failure and verify accessible
   recovery, no stuck busy state, and no false successful selection.
4. In Arabic and Urdu, check document/UI direction, shell/sidebar, keyboard submenu behavior, forms, tables/pagination,
   tooltips, dialogs, and readable mixed technical data. Return to English and verify immediate LTR restoration.
5. Capture and inspect screenshots for English, Arabic, Urdu, Simplified Chinese, Hindi, and Bengali at 390px and 1440px
   in both themes. Include open menus, auth, representative shell/table, form, and dialog states. Confirm readable glyphs,
   reachable controls, focus visibility, and no page overflow; screenshots require visual review, not only creation.
6. Check localized Nuxt UI built-in text and locale-aware dates/numbers without changing configured 24-hour/ISO behavior.
   Check Viewer/Manager/System Administrator fixtures preserve their existing permitted navigation.

## Documentation and delivery checks

Update `apps/website/content/*/docs/next/localization.md` consistently in all 13 current handbook languages. Confirm all
`v*` archive bytes remain unchanged. Use the existing website documentation check when changing handbook content:

```sh
corepack pnpm --dir apps/website docs:check
corepack pnpm format:check
corepack pnpm documentation:check
git diff --check
```

Use canonical formatting on changed files; two complete write passes must be stable. Run broader affected targets only
when changes or failures justify them. During implementation run `graphify update .` for source changes and retain the
graph with its source commit. No package versioning, publication, deployment, or production migration belongs here.

Record product unit/browser/build results, visual evidence, translation-review coverage, and any unverified Docker,
provider, or remote-CI behavior. Planning validation covers artifact structure, references, formatting, and diffs only.
