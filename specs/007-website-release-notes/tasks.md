# Tasks: Website Release Notes

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/ui.md), and [validation guide](quickstart.md).
**Approval**: Task generation and issue/planning-commit approval received on 2026-11-10.
**Issue**: [#83](https://github.com/repovio/repovio/issues/83).
**Branch**: `codex/83-website-release-notes`, reusing the existing Codex worktree. Implementation approved on 2026-11-10; merge and deployment remain separately gated.
**Tests**: Required by the specification and repository rules; each behavior increment includes its focused tests.
**Organization**: Seven coherent tasks, grouped by story. Do not split failing tests and their implementation into commits.

## Format and Execution Rules

- Tasks use `- [ ] TNNN [P?] [USN?] description with file paths`.
- Paths are repository-relative. Referenced new source/test paths are planned deliverables, not existing files.
- Before each edit, test, and commit, inspect working status and the relevant diff. Read owning instructions and use
  Graphify before new source exploration. Preserve unrelated work and pinned dependencies.
- During separately approved implementation, each T002–T006 gets its own working, verified commit containing code,
  focused tests, attached documentation, exactly one focused Changeset, and the corresponding graph update. Generate
  Changesets with the pinned workspace CLI; include `repovio` and the independently affected `@repovio/website` in the
  same file as appropriate. Never version or publish packages during task work. Push each authorized commit.
- T001 and T007 are verification-only: record evidence without an empty implementation commit or fabricated Changeset.
- Task checkboxes represent completed and verified implementation, including required commits; leave all unchecked now.
- Canonical function/type documentation and Vue layout apply to new code. Resolve the recorded documentation-tag conflict
  against current explicit instructions before source edits; do not modify repository standards as part of this feature.

## Phase 1: Setup

**Purpose**: Confirm approved feature context and the website validation baseline without toolchain changes.

- [x] T001 Verify `specs/007-website-release-notes/{spec,plan,tasks}.md` resolve through `.specify/feature.json`; after issue
      association and planning-commit approval, confirm the issue checklist matches these IDs and the selected task branch
      reuses this worktree; inspect `apps/website/package.json`, `docs/coding-guidelines.md`, and current CI/check commands;
      run the smallest website baseline checks and record failures and environment prerequisites in
      `specs/007-website-release-notes/evidence.md` without changing product code or dependency pins.

**Acceptance**: Correct feature and issue association, explicit implementation approval, Node.js 26.13.0/pnpm 11.28.9,
and usable website checks or concrete baseline limitations documented. No new worktree or speculative refactoring.

## Phase 2: Foundational

**Purpose**: Make canonical release content available to every story and to production builds.

- [x] T002 Add the exact root `CHANGELOG.md` source as a dedicated page collection in `apps/website/content.config.ts`,
      resolving `source.cwd` relative to the configuration file; add narrowly scoped build validation in
      `apps/website/scripts/check-release-notes.mjs` and wire it into `apps/website/package.json` development/build paths;
      include that root source and required checker inputs in `apps/website/Dockerfile`; add isolated input fixtures and
      focused coverage in `apps/website/tests/unit/release-notes.test.ts`; document source ownership and independent website
      publication timing in `apps/website/README.md`; include `.changeset/website-release-source.md`.

**Data constraints**: Enforce “Root source order is authoritative and must be descending semantic version order,”
“Preserve nested blocks, continuation paragraphs, links, code,” and “Source missing/unreadable or duplicate/invalid release
headings: validation failure before publication.” Validate complete `major.minor.patch` H2 headings and unique versions;
never treat H3 categories as releases. A valid source with no release sections is allowed. Missing/unreadable input must
fail both ordinary and Docker builds. Validation may inspect headings but must not become a custom Markdown-body parser.

**Acceptance/checks**: Focused Vitest cases cover valid source, semantic order (including 2.10 versus 2.9), duplicate and
invalid headings, unreadable/missing input, and valid-empty source using disposable fixtures. Build Nuxt content and the
website container. Confirm source prose remains canonical, no archive edits occur, and no new dependency is introduced.

## Phase 3: User Story 1 - Find Release History (Priority: P1, MVP)

**Goal**: Reach readable release history from the fourth documentation tab.
**Independent test**: Navigate from current and archived handbook pages, then directly reload the history destination.

- [x] T003 [US1] Create `apps/website/app/pages/docs/release-notes.vue` with SSR collection loading and a thin page shell;
      compose `apps/website/app/components/modules/docs/release-history.vue` for the complete ContentRenderer body and valid
      empty state; append the localized fourth destination and optional version-selector visibility prop in
      `apps/website/app/components/DocsToolbar.vue`; add initial interface translations in
      `apps/website/i18n/locales/{ar,bn,de,en,es,fr,hi,id,ja,pt-BR,ru,ur,zh-CN}.json`; extend
      `apps/website/tests/unit/navigation.test.ts`, add `apps/website/tests/e2e/release-notes.spec.ts`, and extend
      `apps/website/scripts/check-container.mjs` for history in the read-only container; cover direct SSR reload,
      active tab, existing tabs, conditional API visibility, and no browser-time external release requests; include
      `.changeset/website-release-tab.md`.

**Data constraints**: The collection path must “Never use as public route or handbook slug”; public route is the explicit
static `/docs/release-notes` with locale prefixes. “Do not display source Changelog H1 alongside localized page H1.”

**Acceptance/checks**: Current handbook shows Get Started, Guides, API, Release Notes in order. Older handbooks retain
existing API visibility and append history. History has no handbook version selector; original pages retain it. From
history, other tabs target the stable handbook; from an archive, their existing version remains selected. No immutable
version manifests or archive bytes change. Run focused navigation tests, website lint/typecheck, build, and focused
production Playwright checks. Verify valid-empty UI using an isolated fixture, not the shared canonical file.

## Phase 4: User Story 2 - Read and Link Releases (Priority: P1)

**Goal**: Read complete newest-first release descriptions and navigate directly to release headings.
**Independent test**: Compare actual history and multiline upgrade guidance with canonical source; follow and reload a
release fragment in English and German.

- [x] T004 [US2] Add desktop `UContentToc`, mobile release anchor navigation, and accessible heading permalinks in
      `apps/website/app/components/modules/docs/release-history.vue`; derive links from the actual ContentRenderer H2 TOC;
      extend `apps/website/tests/unit/release-notes.test.ts` with real renderer-generated heading IDs and nested Markdown
      preservation fixtures, and `apps/website/tests/e2e/release-notes.spec.ts` with first/last release, complete multiline
      migration text, heading hierarchy, deep-link reload, and English/German fragment assertions; document component
      contracts and include `.changeset/website-release-links.md`.

**Data constraints**: “Use renderer-generated IDs, unique release headings.” Preserve the original version order, original
Changesets categories, complete prose, links, and code; do not reconstruct bodies from line-based bullet extraction. No
independently persisted release index, invented dates, pending Changesets, or website package releases.

**Acceptance/checks**: Each release has one unique permalink whose target exists before and after hydration/reload. Mobile
links and desktop TOC target the same rendered headings, with correct sticky-header offsets. Empty history has no release
navigation. Run focused unit checks and production browser checks; compare against canonical source content.

## Phase 5: User Story 3 - Language and Viewport (Priority: P2)

**Goal**: Retain locale, readable source prose, and accessible navigation across desktop/mobile and both directions.
**Independent test**: EN/DE/RTL history pages at 375 px and 1440 px in light and dark themes; language switching retains
route and valid fragment.

- [x] T005 [US3] Complete responsive toolbar/history spacing, keyboard focus, English body `lang` and direction isolation,
      and mobile TOC behavior in `apps/website/app/components/DocsToolbar.vue` and
      `apps/website/app/components/modules/docs/release-history.vue`; verify all 13 locale keys introduced by T003 and correct
      any translations in `apps/website/i18n/locales/*.json`; add production visual/locale/focus assertions in
      `apps/website/tests/e2e/release-notes-visual.spec.ts`; document language and accessibility contracts in component comments
      and include `.changeset/website-release-accessibility.md`.
- [ ] T006 [P] [US3] Add localized history URLs to `apps/website/server/routes/sitemap.xml.ts`, reactive localized page
      metadata in `apps/website/app/pages/docs/release-notes.vue`, and narrowly scoped route/hash preservation in
      `apps/website/app/components/LanguageSwitch.vue` only if existing switching loses them; add metadata, all-locale route,
      sitemap uniqueness, and language-switch fragment assertions in `apps/website/tests/e2e/release-notes-seo.spec.ts`;
      document source-language/publication behavior in `apps/website/README.md` and include
      `.changeset/website-release-discovery.md`.

**Acceptance/checks**: T005 captures and inspects 12 screenshots: EN, DE, one supported RTL locale, two widths, two themes.
No page horizontal overflow; all tabs reachable; English prose readable; visible keyboard focus. T006 proves exactly one
history sitemap destination per supported locale, no handbook-version duplicates, translated metadata, and preserved
history route/hash after switching language. Both run their focused browser checks, website lint/typecheck/build, and
translation-key coverage. Locale destinations remain available even if their archived handbook lacks API content.

## Phase 6: Cross-Cutting Verification

**Purpose**: Prove all stories and packaging without extending product scope.

- [ ] T007 Execute `specs/007-website-release-notes/quickstart.md`; run the history assertions in
      `apps/website/scripts/check-container.mjs` added by T003; verify production history under the existing
      read-only container setup, original-tab regression suite, documentation checks, canonical formatting stability, sitemap,
      metadata, zero external release requests, and screenshot evidence; record commands/results, commit SHAs, screenshots,
      baseline failures, and any genuinely unverified browser/container/CI behavior in
      `specs/007-website-release-notes/evidence.md`; reconcile completion against all FR/SC IDs in `spec.md`.

**Acceptance/checks**: All relevant website targets from the validation guide pass; formatting is stable over two complete
passes, `git diff --check` passes, and source/graph diffs contain only approved work. No live provider calls, deployment,
release, merge, or production mutation occurs. Do not mark acceptance complete with unexplained failures.

## Requirements Coverage

| Requirement                                                  | Owning tasks     |
| ------------------------------------------------------------ | ---------------- |
| FR-001 fourth tab and original navigation                    | T003, T005       |
| FR-002 direct localized public route and active state        | T003, T006       |
| FR-003 canonical complete released history                   | T002, T003, T004 |
| FR-004 release anchors and desktop/mobile TOC                | T004, T005       |
| FR-005 theme, keyboard, focus, responsive layout             | T005             |
| FR-006 all locale chrome and English prose markup            | T003, T005       |
| FR-007 global history and handbook selector semantics        | T003             |
| FR-008 canonical source and zero external requests           | T002, T003, T007 |
| FR-009 empty state and invalid source failure                | T002, T003, T004 |
| FR-010 sitemap and localized metadata                        | T006             |
| SC-001 one activation from every published toolbar           | T003             |
| SC-002 full canonical history and descending unique versions | T002, T004       |
| SC-003 reloadable deep links and 13 locale destinations      | T004, T006       |
| SC-004 responsive EN/DE/RTL, both themes                     | T005             |
| SC-005 no external release requests or credentials           | T003, T007       |

## Dependencies and Execution Order

```text
T001
  T002
    T003 (US1 MVP)
      T004 (US2)
        T005 (US3 visual/accessibility)
        T006 (US3 discovery/locale switching; parallel-capable with T005)
          T007 (requires both T005 and T006)
```

- T002 blocks all stories because the page needs canonical content in development and production.
- US1 is independently testable after T002 and supplies the MVP, including readable history and basic translated chrome.
- US2 depends on US1's real route and renderer; it adds release navigation without duplicating content.
- US3 builds on that page; T005 and T006 touch distinct source/test/documentation paths after T004.
- T007 requires both US3 tasks and includes full original-navigation/container regression evidence.
- `[P]` denotes file-disjoint work that could run concurrently, not permission to create agents or combine commits.
  Serialize shared build/container/browser resources and graph updates; use separate commits in dependency order.

## Parallel Execution Examples

- **US1**: Keep its single implementation task sequential. After its build, independent read-only unit and static analysis
  checks can run together; production browser checks wait for the build.
- **US2**: Keep its single implementation task sequential. Unit TOC/content verification and lint/type checks can run
  independently; do not split the shared release-history component across writers.
- **US3**: After T004, T005 can own toolbar/history/visual tests while T006 owns sitemap/page/SEO tests and README. If a
  discovered fix needs another task's file, serialize the work and remove the parallel assumption.
- Prefer sequential implementation by default. This task list does not authorize delegation.

## Implementation Strategy

1. Issue/planning-commit approval received; obtain separate implementation approval. Confirm selected branch and feature context.
2. Complete T001–T003 for the MVP: fourth tab, direct route, full canonical history, basic locales, and production source input.
3. Complete T004 for desktop/mobile release navigation and stable deep links.
4. Complete T005 and T006 for responsive/accessibility evidence and localized discoverability.
5. Complete T007 and reconcile every requirement with recorded evidence; report limitations honestly.
6. Commit each substantive task separately only within approved implementation authority. No deployment is implied by a
   working MVP, a green check, or task completion.

## Notes

- No new API, database migration, dependency, custom Markdown parser, release coupling, or archived handbook edit.
- Root changelog prose remains English and unmodified; historical content is not translated or rewritten.
- Task generation itself creates no issue, product code, branch, commit, push, release, or deployment.
- Before issue creation, recheck the tracker for a matching issue; reuse an existing one rather than creating a duplicate.
- Extension hooks: `.specify/extensions.yml` is absent; no before/after-tasks hooks to dispatch.
