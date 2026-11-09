# Quickstart: Repository Detail Navigation Validation

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

This guide validates the locally implemented feature for issue #62. Implementation and tests remain uncommitted.
The execution evidence below separates verified frontend behavior from pre-existing baseline failures and unverified
external integrations.

Refer to [contracts/ui.md](contracts/ui.md) for expected routes and interactions and [data-model.md](data-model.md) for
state and scoping behavior. Use existing tests and mocks; do not call real Providers to prepare UI fixtures.

## Prerequisites

- Use the existing task worktree and branch `codex/62-repository-detail-navigation`.
- Node.js 26.13.0 and Corepack pnpm 11.28.9 must be available. Preserve the lockfile and compiler aliases.
- Install this worktree's dependencies with the pinned package manager. Lifecycle scripts invoke `pnpm` internally, so
  its pinned Corepack shim must also precede an incompatible global pnpm on `PATH`.
- Browser scenarios use synthetic mocked Users and data for at least two Repositories, each with distinguishable activity.
  Fixtures must support Viewer, Manager, Administrator, denied Repository, failed request, and security availability cases.
- The Playwright config has no automatic Web server. Start the Web application separately. API routes used by the
  browser fixtures must be intercepted; no production credentials or running database are required for those fixtures.

Run from the repository root:

```sh
node --version
mkdir -p /tmp/repovio-corepack
corepack enable --install-directory /tmp/repovio-corepack
export PATH="/tmp/repovio-corepack:$PATH"
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @repovio/schemas build
corepack pnpm --dir apps/web exec nuxt prepare
corepack pnpm exec playwright install chromium
```

Inspect `git status --short` and relevant diffs before edits and checks. Never stash, reset, or discard unrelated work.

## Focused Automated Checks

Extend the existing table adapter and locale tests. Add behavior-focused tests for custom control opt-outs, typed target
resolution, immutable scope, pagination, persistence identities, and stale detail/support responses. The Repository context, scope, and row-navigation tests now exist alongside the existing suites.

```sh
corepack pnpm --dir apps/web exec vitest run app/composables/api/table.spec.ts app/i18n/locales.spec.ts
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm format:check
corepack pnpm documentation:check
git diff --check
```

Follow the canonical formatter for corrections, then repeat its complete pipeline to verify stable bytes. Review JSDoc
coverage and Vue block/attribute order, not only checker exit status. Root lint may be needed for new test/helper files
outside the package lint globs. Do not modify toolchain configuration to avoid a failing gate.

## Browser Setup and Focused Regression Run

In a separate terminal at the repository root:

```sh
NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1 corepack pnpm --dir apps/web dev --host 127.0.0.1
```

Once the Web server is ready, run from the repository root:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm --dir apps/web e2e \
  tests/e2e/repository-detail.spec.ts tests/e2e/repository-navigation.spec.ts \
  tests/e2e/repository-access.spec.ts tests/e2e/repository-activity.spec.ts \
  tests/e2e/repository-visual.spec.ts tests/e2e/table-row-navigation.spec.ts \
  tests/e2e/table-hover.spec.ts tests/e2e/user-groups.spec.ts
```

Expand changed-boundary coverage with the existing `repository-deletion`, `dashboard`, `awaiting-approval`,
`needs-attention`, `notifications`, `user-groups`, `page-layout`, and `localization` suites as relevant. The dedicated
`table-row-navigation` and `table-hover` suites cover the new interaction boundaries. Keep the complete 16-table inventory as the hover
coverage checklist rather than assuming one styled table proves every table.

## Acceptance Scenarios

| Scenario                    | Procedure and expected result                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sections and history        | Open each permitted route directly, reload, navigate between sections, and use Back/Forward; Repository identity and exactly one active section remain correct            |
| Role access                 | Administrator sees six links, Manager five, Viewer four; direct restricted visits disclose no forbidden content and do not load protected child content                   |
| Overview and Settings       | Overview retains metadata/status/previews without administration forms; Settings retains all existing cards, optional webhook errors, and pending actions                 |
| Repository scope            | With two distinct Repositories, assert fixed Repository constraints in requests after search/filter/sort/page changes; only selected Repository records appear            |
| Global summary omission     | Scoped views issue no global summary or all-Repository selector request; existing global pages retain their previous behavior                                             |
| Stored state and pagination | Seed conflicting global/other-Repository state and a high previous page; scope cannot broaden, category navigation starts page 1, and valid direct/history pages restore  |
| Request races               | Delay A, visit B, then revisit A; earlier A responses cannot overwrite the latest generation; failed queries do not present retained rows as successful results           |
| Security                    | Switch all three categories, share/reload addresses, test invalid/repeated kind and history; verify unavailable, unknown, failed metadata, and available-empty separately |
| Row navigation              | Click noninteractive cells and unused row area for four resource families; each opens the correct existing detail once                                                    |
| Embedded controls           | External links, settings/toggle buttons, menus, checkboxes, inputs, custom controls, and disabled action groups cause zero extra row navigation                           |
| Hover-only tables           | Clicking ordinary cells causes no new navigation, editor, or selection; explicit controls continue to work                                                                |
| Keyboard                    | Tab to native detail links and navigable rows; Enter/Space activate once, repeat does not duplicate, visible focus remains, embedded controls operate independently       |
| Hover rendering             | Every data table highlights hovered rows in both themes, including pinned cells and raw HTML tables; headers/placeholders remain non-navigable                            |
| Compatibility               | Preserve quick-dialog addresses, old Repository links/redirects, Settings anchor behavior, explicit action loading, Provider links, and deletion return path              |
| Layout and locales          | Inspect long names and English/German labels at 375 and 1440 pixels in both themes; all destinations and controls remain reachable without overlap                        |

Store synthetic screenshots under existing Playwright test output paths. Inspect the actual navigation, hovered pinned
cells, role-restricted screens, and narrow layout. Keep screenshots, traces, reports, credentials, and runtime metadata
out of commits.

## Evidence and Completion

- Associate acceptance results with the relevant FR/SC identifiers in [spec.md](spec.md).
- Run the smallest meaningful checks first, then affected Web targets. Broaden testing only for changed shared boundaries
  or unresolved failures. Preserve already passing checks unless new changes justify repeating them.
- A clean mocked browser run verifies frontend state and requests; it does not verify live Provider behavior, server
  authorization, Docker images, deployment, or remote CI. Report those boundaries accurately.
- No migration or data backfill is required. Initial verification preceded the subsequent commit and PR request;
  delivery commits are recorded in Git history. No merge, release, or deployment was requested or performed.

## Implementation Execution Evidence (2026-11-09)

- Official Web test target: 17 files, 55 unit tests passed.
- Dedicated feature browser run: 41 Chromium scenarios passed, zero failed or flaky. It includes six-role/access and
  Settings-lifecycle cases, fixed-scope filtering, all security availability outcomes, scoped retry/error behavior,
  copied/history URLs, native/custom-control isolation, Enter/Space, and existing administration/deletion behavior.
- The eight English/German, light/dark, 375/1440-pixel visual scenarios also passed with a deliberately long Repository
  name applied consistently to detail metadata and table records. Synthetic screenshots were visually inspected.
- Existing regression run: 45 passed, four failed. All four failures were reproduced with the unmodified `main` application
  and its original tests; they were not weakened or fixed outside this issue's scope.
- Successful hover annotations cover all 16 inventoried table components in both themes. There are 17 annotations because
  the User Group table was exercised in English and German. Discovery, member, and Workflow Filter hover checks passed
  before their enclosing legacy scenarios reached unrelated baseline failures.
- Web lint, test-file ESLint, Nuxt typecheck, declaration documentation, canonical formatting, stable formatter passes,
  relative links, and scoped whitespace/diff checks passed. The existing module-type startup warning was retained rather
  than changing the pinned toolchain or package manifests.
- The final feature browser server used a dedicated loopback port with `PLAYWRIGHT_BASE_URL`. The existing Jobs locale
  fixtures use a `localhost` cookie, so the legacy regression run used a `localhost` base URL to honor their fixture setup.

### Final Pinned-Column Follow-up

Visual inspection of long names exposed translucent pinned-column backgrounds. The shared theme now uses opaque
backgrounds for pinned headers and cells while retaining hover colors. Browser checks verify rendered alpha 255 using
actual computed colors, so text scrolling behind pinned columns cannot bleed through.

The final focused follow-up had 11 passing legacy scenarios and the same two known baseline failures in discovery and
Workflow Filter button state. All corresponding hover/opacity checks passed before those baseline assertions. Together
with the shortcut-dialog check, every one of the 16 table components passed both-theme presentation checks. The eight
long-name visual scenarios and both dedicated hover scenarios also passed after this style correction.

### Existing Baseline Browser Failures

These scenarios failed identically on the existing `main` checkout and original test sources:

1. `admin-tables.spec.ts`: multi-Repository discovery expected two selections but retained one.
2. `admin-tables.spec.ts`: Repository dialog expected an empty Workflow Filter submit button to be disabled, but it was
   enabled. Both member/filter table hover checks already passed before that assertion in the feature checkout.
3. `repository-navigation.spec.ts`: sidebar expansion expected the brand text to return, but it remained empty.
4. `repository-navigation.spec.ts`: removing a webhook configuration did not show the expected Not configured text.

These are disclosed baseline gaps, not successful application acceptance tests. Issue #62's new behavior has independent
passing coverage. Real Provider requests, live backend authorization, Docker builds, remote CI, release, and deployment
remain unverified; the browser scenarios use synthetic transport fixtures.

### Traceability

- FR-001/FR-002 and SC-001/SC-002: Repository activity/navigation and access suites cover section URLs, active links,
  direct entry, reload, history, role-derived navigation, and guarded legacy Settings anchors.
- FR-003/FR-004: Overview/detail, Settings, User Group, and deletion scenarios retain existing cards, permissions, actions,
  local deletion behavior, and read-only Overview composition.
- FR-005 through FR-008 and SC-003/SC-004: table unit and Repository activity tests inspect fixed AND constraints, conflicting
  stored filters, page normalization/clamping, category identity/history, and unavailable/unknown/error/empty states.
- FR-009/FR-016 and SC-007: access/context tests prove guarded child mounting, request generations, delayed action loading,
  lazy metadata, error/retry, and no restricted supporting requests in the frontend boundary.
- FR-010 through FR-014 and SC-005/SC-006: row and inventory hover suites cover global/scoped resource destinations,
  noninteractive cells, embedded controls, native keyboard behavior, all-table presentation, and hover-only Workflow Runs.
- FR-015: context A-to-B-to-A tests and actual browser queries/history cover identity isolation and stale response handling.
- FR-017 and SC-008: complete locale-key parity and the eight long-name visual scenarios cover supported presentation.
- FR-018/FR-019: unchanged API/Provider code, existing explicit-control/deletion/dialog regression scenarios, and the scoped
  source diff preserve compatibility and the Provider read-only boundary, subject to the four disclosed baseline gaps.

The AST graph was refreshed without LLM extraction; only `graphify-out/graph.json` is versionable. Local reports, HTML,
caches, screenshots, traces, server logs, and runtime configuration stay outside the reviewed source scope.
