# Research: Repository Settings Navigation and Dialog Removal

## Canonical Repository entry points

**Decision**: Use existing full detail pages and keep role-aware list links. Convert legacy dialog URLs using the
existing route middleware.

**Rationale**: The list currently owns modal selection/history state; command-palette Repository results also generate
its query URLs. Full detail shell and Settings already reuse the same administration cards.

**Evidence**: `apps/web/app/pages/repositories/index.vue`, `apps/web/app/components/layout/command-palette.vue`,
`apps/web/app/middleware/repository-paths.global.ts`, and Repository detail shell/Settings components.

**Alternatives considered**: Removing the explicit action loses a convenient administrator Settings entry. Ignoring
legacy links breaks saved destinations. Both were rejected by the user's explicit choices.

## Settings navigation pattern

**Decision**: Use five full-width sections with secondary navigation and a `tab` query parameter.

**Rationale**: Repository Alerts already uses a secondary `UNavigationMenu` and query-selected categories. Settings
currently renders all cards and squeezes filters/members/groups into two columns. Five tabs preserve card ownership and
make every configuration task directly addressable.

**Evidence**: `apps/web/app/pages/repositories/[id]/security-alerts.vue` and
`apps/web/app/components/modules/repositories/details/settings-page.vue`.

**Alternatives considered**: Nested child routes add unnecessary routing structure; local-only tabs cannot restore
shared links; grouping Members and Group access side by side repeats the reported width problem.

## Draft and request lifetime

**Decision**: Mount sections lazily once per Settings visit, then hide inactive panels without unmounting them.

**Rationale**: Feature cards own local forms, request flags, errors, and generated webhook secrets. Unmount-on-switch
would discard input and detach feedback from pending operations. Client memory is sufficient; no secret persistence.

**Alternatives considered**: Persistent browser storage is unnecessary and unsuitable for secrets. Blocking every tab
change during requests reduces usability without addressing unsaved drafts.

## Form presentation and labels

**Decision**: Full-width cards, visible field labels, stacked narrow layouts, flexible inputs, labeled primary actions,
and contained table overflow. Shorten only the Repository navigation text to Alerts/Warnungen.

**Rationale**: Current filter/member forms switch to fixed-width horizontal layouts at the small breakpoint, even
inside half-width cards. The supplied 1102-pixel screenshot shows clipped controls. Existing Security Alert terminology
remains accurate and must not be renamed across schemas or routes for a navigation-label request.

**Alternatives considered**: Merely changing a grid breakpoint leaves a long unfocused page; wholesale design-system
or domain renaming would exceed scope.

## Verification and prerequisites

**Decision**: Reuse existing Playwright fixtures and migrate dialog assertions to canonical pages. Add tab-specific
coverage and responsive evidence. No new dependencies or external library research is needed for existing patterns.

**Evidence**: Repository navigation/deletion/admin-table/layout and search/command-palette suites already exercise the
removed dialog, so changing only the component would leave substantial regressions.

**Resolved uncertainties**: No product or implementation clarifications remain. Issue/planning-commit approval is
recorded for [#88](https://github.com/repovio/repovio/issues/88); product implementation remains a separate gate. Explicit
user/project instructions take precedence over conflicting inherited documentation conventions; no standards changes
belong to this feature.
