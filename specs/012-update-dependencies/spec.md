# Feature Specification: Update Dependencies

**Issue:** [#108](https://github.com/repovio/repovio/issues/108)

## User Scenarios & Testing

### User Story 1 - Resolve dependency security findings (Priority P1)

A maintainer can build web and website with patched Nuxt and run the workspace without vulnerable node-forge versions.

**Independent test.** Install from the committed lockfile and inspect the resolved graph for the advisory ranges. Run
web and website builds and dependency security tests.

### User Story 2 - Refresh supported dependencies (Priority P2)

A maintainer can use current compatible production, development, and CI dependencies with unchanged application behavior.

**Independent test.** Compare direct and resolved versions, run the affected build and test targets, and record versions
that require a breaking migration or a change to an explicitly pinned toolchain.

### User Story 3 - Resolve the Dependabot queue (Priority P2)

A maintainer can see which incoming updates merged and which were closed with a reason.

**Independent test.** Verify the final GitHub state of PRs #100 through #104 and the version present on the default branch
for each merged PR.

### User Story 4 - Migrate to supported major versions (Priority P3)

A maintainer can adopt current stable major releases while preserving repository access, browser updates, notification
delivery, and reproducible builds.

**Independent test.** Review each migration independently. Run its affected tests against the new version and record
any unavailable stable target or mutually incompatible peer requirement.

### Edge Cases

- A security package may occur as both a direct dependency and a transitive resolution.
- A patched consumer may reintroduce a vulnerable package or fail after an upstream update.
- A PR can become outdated when another change lands, invalidating its required checks.

## Requirements

- **FR-001:** Resolve open Nuxt-family and node-forge findings wherever the affected versions occur in the workspace.
- **FR-002:** Update stable compatible dependencies and preserve workspace links, compiler aliases, and release-age policy.
- **FR-003:** Plan and verify stable major upgrades in separate compatibility groups after the security updates.
- **FR-004:** Merge or close the five Dependabot PRs with an explicit outcome for each.
- **FR-005:** Preserve application behavior, existing trust settings, and read-only provider integration.

## Success Criteria

- **SC-001:** Fresh frozen install, dependency security checks, affected lint, tests, type checks, and builds pass.
- **SC-002:** Every identified direct update is applied or has a recorded compatibility or release-policy blocker.
- **SC-003:** Every targeted Dependabot PR is merged or closed and any replacement work is traceable.

## Assumptions

Security fixes are delivered first. Stable major upgrades follow in separate increments. Prisma 8 and Node.js 27 enter the
implementation scope once stable releases are available. Toolchain pin changes require explicit approval.
