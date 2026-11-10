# Tasks: App Language Parity

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[localization contract](contracts/localization.md), and [validation guide](quickstart.md).
**Approval**: Planning, task generation, issue creation, and planning-only commit/push approved on 2026-11-10.
Implementation and per-task commit/push approved on 2026-11-10.
**Tracking**: [Issue #84](https://github.com/repovio/repovio/issues/84), branch `codex/84-app-language-parity`, reusing the
current Codex worktree. Planning commit `7910243` is pushed and recorded in the issue.
**Tests**: Required by the specification and repository rules; included with each behavior increment.
**Organization**: Eight tasks, grouped by user story; all remain unchecked until approved work is verified and recorded.

## Format and Execution Rules

- Task format: `- [ ] TNNN [P?] [USN?] description with file paths`.
- Paths are repository-relative; paths described as new are planned deliverables, not existing sources.
- Before edits, tests, or commits, inspect status and the relevant diff. Query the existing Graphify graph before new
  source exploration; read owning guidelines and the glossary before changing product copy or domain terminology.
- Use Node.js 26.13.0 and Corepack pnpm 11.28.9. Preserve aliases, dependency pins, cookie/route contracts, and permissions.
- Write focused regression tests first within each behavior task; demonstrate failure for the intended omission, then
  implement and verify. Keep failing tests and their implementation in the same working task commit.
- After separate implementation and commit authorization, T002–T007 each receive their own verified commit with exactly
  one focused `repovio` Changeset, generated through the existing CLI; preserve required affected-package entries in that
  same file. Push each authorized commit. Do not combine tasks, version packages, publish, release, or deploy.
- T001 and T008 are verification-only. Record evidence without empty implementation commits or fabricated Changesets.
- Document new handwritten declarations and preserve canonical Vue block/attribute order. Resolve the recorded JSDoc-tag
  instruction discrepancy against current explicit instructions before source edits; do not rewrite standards here.
- Update the graph with approved source changes and keep it in the same commit. Serialize graph updates, shared builds,
  and browser resources. `[P]` identifies file-disjoint opportunities, not authorization to spawn agents.

## Phase 1: Setup

**Purpose**: Establish the approved feature context and a usable baseline before any product changes.

- [x] T001 Verify `specs/008-app-language-parity/{spec,plan,tasks}.md` resolve through `.specify/feature.json`; after separate
      issue/planning-commit and implementation approvals, confirm the selected task branch, issue checklist, current base,
      existing worktree, toolchain pins, and actual test/CI commands; inspect `apps/web/package.json`,
      `docs/coding-guidelines.md`, and existing localization tests; run the smallest locale/date-time baseline checks and
      record results, preexisting failures, and environment prerequisites in `specs/008-app-language-parity/evidence.md`.

**Acceptance**: Intended issue and task IDs agree, required approvals exist, and baseline limitations are concrete.
Do not change product code, install new dependencies, or create another worktree for this task.

## Phase 2: Foundational

**Purpose**: Establish reusable locale metadata and UI integration while preserving the existing eight languages.

- [x] T002 Create the typed app-owned registry in `apps/web/shared/locales.ts` for the existing eight locales; consume it
      from `apps/web/nuxt.config.ts` and `apps/web/app/composables/app/locales.ts`; add the explicit Nuxt UI locale resolver
      in `apps/web/app/utils/locales.ts` and bind it with reactive document language/direction in `apps/web/app/app.vue`;
      extend `apps/web/app/i18n/locales.spec.ts` for metadata, UI-export, and current asset coverage; preserve all existing
      selectors and behavior, add directly attached documentation, and include one focused `.changeset/*.md` entry.

**Metadata constraints from the data model**:

- `code`: "Unique exact locale code, preserving `zh-CN`, `pt-BR`, and legacy `pt`".
- `language`: "Valid regional language tag for document/formatting metadata".
- `name`: "Nonempty native name; Brazilian Portuguese distinguishable from existing Portuguese".
- `file`: "Matching local JSON catalog, resolved using existing Nuxt locale-file conventions".
- `dir`: "`rtl` only for `ar` and `ur`; `ltr` for all others".
- `flagCountry`: "Existing flag file basename; local licensed SVG must exist".
- `ui`: "Explicit existing Nuxt UI locale export identifier".

T002 establishes these constraints for current entries; T003 applies them to new entries. Preserve existing code/name/flag
and registration order, GB for English and PT for Portuguese. Do not register missing catalogs or enable the final website
subset assertion until T003 supplies all nine additions. Do not add a shared package or runtime website dependency.

**Checks**: Focused locale unit tests, existing localization/auth browser regressions, web lint/typecheck/build, and
canonical changed-file formatting/documentation checks. Verify reactive Nuxt UI text in English/German and the same eight
selectable options at this checkpoint. This is an internal prerequisite, not completed language parity.

## Phase 3: User Story 1 - Use the App in a Website Language (Priority: P1)

**Goal**: Every website language is selectable and fully translated; existing app-only languages remain supported.
**Independent Test**: Select every language on sign-in/setup and in the signed-in app; inspect translated messages and
navigate representative authorized screens. Expected set is all 13 website codes plus four app-only codes.

### Catalogs, registration, and contract tests

- [ ] T003 [US1] Add complete `apps/web/i18n/locales/{zh-CN,hi,ar,bn,pt-BR,id,ur,ru,ja}.json` catalogs from the current English
      reference; register them in `apps/web/shared/locales.ts`, extend `apps/web/app/utils/locales.ts`, and add
      `apps/web/public/flags/{cn,in,sa,bd,br,id,pk,ru,jp}.svg` with existing MIT attribution; expand
      `apps/web/app/i18n/locales.spec.ts` to derive all shipped entries, compare the website registry at
      `apps/website/content/locales.json` only at test time, and validate exact leaf keys, nonempty strings, named
      parameters, message compilation, linked targets, metadata, UI mappings, and assets; include one `.changeset/*.md`.

**Catalog constraints from the data model**: "All leaves are nonempty strings"; "every locale has the exact current
English leaf set"; "Message compilation, interpolation, plural meaning, escape rules, and linked targets remain valid";
"Technical literals may legitimately be equal across languages". Use the actual current English catalog, not a fixed
1,029-key count. Existing eight catalogs remain complete if in-scope copy changes add messages.

**Registration constraints**: Exactly 17 unique app codes; website codes are a subset. New native labels and flag/UI
mappings follow `contracts/localization.md`, including distinct `pt`/`pt-BR` and explicit `zh_cn`/`pt_br` UI exports.
Existing options retain their order; additions follow website order. Arabic/Urdu metadata is RTL, all others LTR.

**Checks**: Add negative fixtures for a missing website code, catalog/key, parameter, invalid syntax/linked target,
direction/UI mapping, or flag. Confirm each check rejects its fixture without mutating checked-in catalogs. Run focused
locale tests, then web tests/lint/types/build. Review representative translated prose, glossary usage, parameters, and
plural meaning for each of the nine new languages; record coverage and limitations. Do not ship copied English prose as
translated content or reject legitimate unchanged technical vocabulary.

### Browser integration and accessible selection

- [ ] T004 [US1] Expand `apps/web/tests/e2e/localization.spec.ts` and
      `apps/web/tests/e2e/auth-preferences.spec.ts` from hardcoded eight-option checks to registry-derived 17-language
      coverage; verify sign-in, first-administrator setup, and signed-in selectors, native names, all local decorative
      flags, scroll/keyboard reachability, known translated and parameterized labels, built-in Nuxt UI text, and
      representative navigation/table/form/dialog states for each language; inspect Viewer/Manager/System Administrator
      fixtures for unchanged permitted navigation, repair only discovered in-scope defects in their owning presentation
      components, record browser evidence in `specs/008-app-language-parity/evidence.md`, and include one `.changeset/*.md`.

**Checks**: Fixture-backed Playwright suites pass; compare option sets instead of indices or simultaneous visibility.
Cover dashboard, repositories, workflow runs, work items, security alerts, notifications, settings, and permitted admin
screens across the test matrix, including app-owned validation/empty/error/loading text and accessible labels. Assert
no runtime translation/flag requests leave the app origin and source provider values remain unchanged. RTL visual
acceptance is completed in T005; browser fixtures do not establish live-provider behavior.

**Checkpoint / MVP**: T001–T004 prove language availability and catalog/browser integration as an internal milestone.
Arabic/Urdu layout acceptance remains mandatory P1 work; this checkpoint does not authorize release or deployment.

## Phase 4: User Story 2 - Read Right-to-Left Languages (Priority: P1)

**Goal**: Arabic/Urdu layouts and mixed technical text remain usable; switching to English restores LTR everywhere.
**Independent Test**: Exercise Arabic and Urdu auth/shell/forms/tables/menus/dialogs, then switch to English at both widths.

- [ ] T005 [US2] Extend `apps/web/tests/e2e/localization.spec.ts` and
      `apps/web/tests/e2e/auth-preferences.spec.ts` with Arabic/Urdu direction, overlay, keyboard, and mixed-text assertions;
      inspect and repair only demonstrated direction defects in `apps/web/app/app.vue`,
      `apps/web/app/components/layout/*.vue`, and affected feature components under `apps/web/app/components/modules/`;
      use logical alignment utilities and scoped bidirectional isolation for URLs, identifiers, and code without rewriting
      provider values or mirroring whole data tables; inspect screenshots and record evidence in
      `specs/008-app-language-parity/evidence.md`; include one `.changeset/*.md`.

**Checks**: Assert reactive document and component `lang`/`dir`, correct submenu keyboard direction, focus, pagination,
readable technical tokens, and direction reversal to English including open overlays. Visually inspect English, Arabic,
Urdu, Simplified Chinese, Hindi, and Bengali at 390px and 1440px in light/dark themes, including auth, open locale menu,
shell/table, form, and dialog. Verify glyphs, focus visibility, reachable controls, and no page overflow. Add local font
assets only if a concrete script-rendering defect requires them; preserve licensing and avoid new external services.
Run focused browser regressions and affected web unit/lint/type/build targets after fixes.

**Checkpoint**: US1 language coverage plus US2 direction and visual acceptance pass; provider content remains unchanged.

## Phase 5: User Story 3 - Keep Language Preferences Reliable (Priority: P2)

**Goal**: Selections persist and recover predictably, with full-duration loading and existing formatting policies.
**Independent Test**: Select each locale, navigate/reload, test browser preference and invalid-cookie fallback, then delay
or fail a locale load and verify coherent recovery.

- [ ] T006 [US3] Extend `apps/web/tests/e2e/localization.spec.ts`,
      `apps/web/tests/e2e/auth-preferences.spec.ts`, and `apps/web/app/utils/date-time.spec.ts` for all-locale selection
      persistence, navigation/query retention, supported browser preferences, unsupported/malformed fallback, exact
      `zh-CN`/`pt-BR` plus legacy `pt`, delayed and rejected locale changes, and locale-aware date/number/message rendering;
      repair discovered gaps in `apps/web/app/composables/app/locales.ts`,
      `apps/web/app/components/layout/{auth-preferences,user-menu}.vue`, or existing formatting owners as appropriate;
      add any required accessible loading/error messages to every `apps/web/i18n/locales/*.json`, document behavior, and
      include one `.changeset/*.md`.

**Preference constraints**: "Existing browser cookie `repovio-locale` stores one supported app code"; "No new server
persistence, account field, migration, or cross-domain website cookie is introduced"; "Current route/query, permissions,
provider data, and date/time display policy remain unchanged throughout selection". Retain `no_prefix` and English
fallback. Existing English/German messages and all other shipped catalogs stay complete.

**State-transition checks**: Every initiating control stays loading/disabled throughout its awaited operation. Successful
messages, UI locale, document attributes, formatting, and cookie agree. Rejection releases loading, exposes accessible
feedback, and retains/recovers a usable supported language without reporting false success. Delay/reject the actual
loader boundary using deterministic fixtures; do not rely solely on fast cached loads. Preserve administrator-selected
24-hour and ISO formatting; exercise `zh-CN`, `pt-BR`, Arabic, and Urdu with fixed timestamps/timezones and suitable number
examples. Run focused unit/browser tests, then web test/lint/typecheck/build as changes require.

**Checkpoint**: All three stories pass independently testable acceptance scenarios with no preference regression.

## Phase 6: Documentation and Cross-Cutting Verification

**Purpose**: Publish accurate current guidance and verify the complete bounded feature before review.

- [ ] T007 [P] Update `apps/website/content/{ar,bn,de,en,es,fr,hi,id,ja,pt-BR,ru,ur,zh-CN}/docs/next/localization.md` to
      describe all 17 app options, the app registry, nine added flag mappings, Arabic/Urdu direction, distinct Portuguese
      variants, preference/fallback/loading behavior, and actual maintenance commands; preserve localized prose and every
      published `apps/website/content/*/docs/v*/` archive byte; run `corepack pnpm --dir apps/website docs:check` and
      canonical changed-file formatting/reference checks; include one focused `.changeset/*.md` under repository policy.

T007 depends on T003's metadata and catalogs; start its draft alongside browser work only after that prerequisite.
Reconcile final loading/recovery facts after T006 before marking it complete. This handbook-only task does not change
website routing, UI translations, registry, release timing, or archived documentation.

- [ ] T008 Reconcile all FR/SC requirements below against `specs/008-app-language-parity/evidence.md`; execute the
      applicable `specs/008-app-language-parity/quickstart.md` checks for final app tests/lint/types/build, focused browser
      scenarios, documentation, canonical formatting stable over two passes, and `git diff --check`; verify final scope,
      unchanged published archives, retained toolchain/provider/authorization contracts, task commits and focused
      Changesets when authorized, then record linguistic-review coverage, screenshot inspection, remaining limitations,
      and actual Docker/provider/remote-CI evidence without claiming unrun checks or performing release/deployment.

**Acceptance**: Focused tests precede affected targets; repeat broader checks only after changes or unresolved failures.
No task is complete merely because files exist. Fix in-scope failures, preserve unrelated work, and report environment or
preexisting limitations honestly. T008 is verification-only unless a discovered defect returns to its responsible task.

## Requirement Coverage

| Requirement                                                      | Tasks                  |
| ---------------------------------------------------------------- | ---------------------- |
| FR-001 website language coverage                                 | T002, T003, T004       |
| FR-002 preserve existing options                                 | T002, T003, T004, T006 |
| FR-003 complete app messages/states                              | T003, T004, T006       |
| FR-004 shared accessible selectors and local flags               | T002, T003, T004, T005 |
| FR-005 RTL and readable technical data                           | T002, T003, T005       |
| FR-006 preference/fallback/navigation/loading                    | T004, T006             |
| FR-007 message and built-in control formatting                   | T002, T003, T004, T006 |
| FR-008 maintenance rejection checks                              | T003                   |
| FR-009 current documentation, immutable archives                 | T007, T008             |
| FR-010 provider values, secrets, permissions, read-only behavior | T004, T005, T006, T008 |
| SC-001 17 unique options                                         | T003, T004             |
| SC-002 complete catalogs and valid rendered parameters           | T003, T004, T006       |
| SC-003 every-language browser flows and persistence              | T004, T006             |
| SC-004 RTL/keyboard/visual/script acceptance                     | T005                   |
| SC-005 no external translation/flag calls or provider mutation   | T004, T005, T008       |
| SC-006 negative maintenance fixtures                             | T003                   |

## Dependencies and Execution Order

```text
T001 (approved context and baseline)
  T002 (existing-locale metadata and UI foundation)
    T003 (nine additions and complete parity contract)
      T004 (US1 browser coverage)
        T005 (US2 RTL and visual acceptance)
          T006 (US3 preferences, loading/failure, formatting)
      T007 (handbook draft; final review after T006)
        T008 (requires T001–T007, all stories and documentation)
```

- All user-story work depends on T002. US1 T003 supplies actual new locales needed by the other stories.
- Default sequence follows task IDs. T004–T006 share app/browser files and must run sequentially.
- T007 is the only `[P]` task: its handbook files are disjoint from T004–T006 after T003; its final wording waits for T006.
- T008 requires both T006 and T007 and all preceding evidence. No scope expansion or provider/API/database work belongs here.
- Each substantive task is one verified commit under separate authorization. Verification tasks need no empty commit.

## Parallel Execution Examples

- **US1**: Keep T003 catalogs/registration/contract tests together. After its green build, read-only unit/static checks can
  run independently; browser T004 waits for the usable application. T007 may draft handbook prose in disjoint files.
- **US2**: Run T005 edits and browser checks sequentially. Disjoint T007 handbook drafting can continue from known metadata;
  do not let it change app files or share browser/build outputs.
- **US3**: Within T006, independent unit/static checks may run together after edits; browser failure fixtures use isolated
  contexts. T007 final factual review waits for the verified recovery contract. Serialize graph updates and commits.

These opportunities describe dependencies, not a request to delegate work or create agents.

## Implementation Strategy

1. Issue creation and planning-only commit/push approved. Issue #84 and `codex/84-app-language-parity` are established in
   this existing worktree from verified `origin/main` at `aa0fa7e`; record the planning commit in the issue after push.
2. Present the issue and planning commit; obtain separate implementation approval before T001 product baseline execution
   or T002 source edits. Confirm any required implementation commit authorization explicitly.
3. Complete T001–T004 as the internal language-coverage MVP; do not present Arabic/Urdu as visually accepted before T005.
4. Complete mandatory US2 RTL/visual work, then US3 preference/failure/formatting work; reconcile the handbook.
5. Complete T008, record actual acceptance evidence, and continue through the separately authorized review workflow.
   Issue creation, implementation, commits, merge, release, and deployment are not authorized by task generation.

## Notes

- Total: eight tasks; US1 has two, US2 one, US3 one, setup one, foundation one, and cross-cutting work two.
- No new dependency, translation service, database, account setting, provider call, or published archive rewrite.
- Extension hooks: `.specify/extensions.yml` is absent; no before/after-tasks hooks are registered to dispatch.
- Task generation itself changes only planning artifacts. All implementation checkboxes remain unchecked.
