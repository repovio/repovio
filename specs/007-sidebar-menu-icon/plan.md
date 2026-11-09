# Implementation Plan: Sidebar Menu Icon

**Branch**: `codex/sidebar-menu-icon`, based on `779265e` in the existing Codex task worktree.
**Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)
**Input**: `specs/007-sidebar-menu-icon/spec.md`
**Issue**: None assigned. Local implementation and verification were explicitly requested, followed by commit, push,
and PR creation. Issue creation and merge remain outside scope.

## Summary

Replace `ui.icons.menu: 'i-tabler-menu'` with `ui.icons.menu: 'i-tabler-menu-2'` in
`apps/web/app/app.config.ts`. The default Nuxt UI navbar toggle consumes this mapping for the closed sidebar and will
show the requested three lines. Retain framework-owned interactions, localization, open-state close icon, and desktop
collapse/expand controls. Add focused browser coverage and one patch Changeset for `repovio` during implementation.

## Technical Context

**Language/Version**: TypeScript/Vue; Node.js 26.13.0, pnpm 11.28.9; preserve compiler aliases and manifest ranges.
**Primary Dependencies**: Existing Nuxt 4, Nuxt UI 4, Nuxt Icon, installed Tabler collection; no dependency changes.
**Storage**: No persistence changes; reuse sidebar state and preferences.
**Testing**: Existing Playwright shell fixtures, rendered icon assertion, screenshots, web lint and typecheck.
**Target Platform**: Browser SPA; 982 × 1134 reported viewport, 390 × 844 narrow viewport, 1440 × 900 desktop.
**Project Type**: Existing pnpm/Nx monorepo; frontend presentation correction.
**Performance Goals**: Locally bundled icon with no additional external icon request.
**Constraints**: Preserve accessible labels, EN/DE, themes, routing, responsive behavior, and desktop panel controls.
**Scale/Scope**: One existing shared menu mapping and a focused browser regression scenario.

## Constitution Check

| Gate                          | Before research                             | After design                                              |
| ----------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Architecture and scope        | PASS: user-requested icon planning          | PASS: reuse existing UI config                            |
| Issue and delivery order      | Planning only; no matching open issue found | Direct local implementation request; no issue creation    |
| Provider read-only            | PASS: no provider changes                   | PASS: no provider calls                                   |
| Authorization and secrets     | PASS: no data/auth changes                  | PASS: existing shell remains authoritative                |
| Durable operations            | Not affected                                | No retries, delivery, or persistence changes              |
| Verification and localization | Browser verification required               | Focused EN/DE, theme, interaction, bundle checks planned  |
| Engineering standards         | Preserve pinned tools and conventions       | One mapping, existing tests, one implementation Changeset |

The user explicitly requested local implementation after task generation. This supersedes the earlier inferred issue
and planning-commit prerequisite for local work. Commit, push, and PR creation were subsequently requested; merge and
provider resource changes remain outside scope.

## Project Structure

### Documentation (this feature)

```text
specs/007-sidebar-menu-icon/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui.md
├── quickstart.md
└── tasks.md
```

[tasks.md](tasks.md) contains the ordered breakdown generated on 2026-11-10. `.specify/feature.json` selects this feature
locally and remains ignored runtime metadata. Implementation, commit, push, and PR creation are authorized.

### Source Code (repository root)

```text
apps/web/app/app.config.ts                  # menu mapping
apps/web/app/components/layout/navbar.vue  # existing consumer; retain behavior
apps/web/nuxt.config.ts                     # existing bundle setup; change only if proven necessary
apps/web/tests/e2e/page-layout.spec.ts       # focused browser coverage
apps/web/tests/e2e/admin-tables.spec.ts      # reference for rendered bundled-icon assertions
.changeset/                                # one focused repovio patch entry during implementation
```

**Structure Decision**: Reuse app-wide Nuxt UI configuration. No new component, utility, state owner, API, or data model.

## Design and Validation

- Apply the literal `i-tabler-menu-2` mapping. Existing close and desktop panel mappings remain intact.
- Extend shell browser coverage to verify a rendered three-line icon, pointer and keyboard opening, dismissal, and
  unchanged routing. Exercise the reported viewport, narrow layout, desktop, English/German, and light/dark themes.
- Block external icon services and inspect the actual mask/background, then visually review screenshots.
- Follow [quickstart.md](quickstart.md) for focused tests, affected web checks, formatting, documentation, and diff checks.
- Implementation and local verification are complete; see [evidence.md](evidence.md). The completed scope is prepared for the requested commit, push, and PR.

## Complexity Tracking

No additional architectural complexity or justified violations.
