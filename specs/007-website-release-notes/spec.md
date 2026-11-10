# Feature Specification: Website Release Notes

**Feature Branch**: `codex/83-website-release-notes`
**Created**: 2026-11-10
**Status**: Implemented and locally verified on 2026-11-10; awaiting PR review and merge approval
**Input**: Add a fourth "Release Notes" tab to website documentation, inspired by ezSWM.
**Tracking**: [Issue #83](https://github.com/repovio/repovio/issues/83). Implementation and task commits/pushes approved and completed.
Merge and publication remain separately gated.

## User Scenarios & Testing

### User Story 1 - Find release history from documentation (Priority: P1)

As a documentation reader, I can open Release Notes alongside Get Started, Guides, and API to understand changes
between Repovio application releases.

**Why this priority**: Release history must be discoverable from the existing documentation navigation.
**Independent Test**: Open published documentation, activate the fourth tab, and reload its destination directly.

**Acceptance Scenarios**:

1. **Given** current documentation with all three existing tabs, **When** navigation renders, **Then** Release Notes
   appears fourth, after API, and the original destinations remain usable.
2. **Given** Release Notes is opened, **When** the page loads or reloads, **Then** its tab is active and release history
   is visible without authentication.
3. **Given** an older handbook without API documentation, **When** its toolbar renders, **Then** Release Notes remains
   available after the existing tabs; API visibility retains its existing rules.

### User Story 2 - Read and link individual releases (Priority: P1)

As an operator, I can read newest releases first and link another person to a particular release heading.

**Why this priority**: Upgrade decisions depend on complete, accurate change descriptions.
**Independent Test**: Compare displayed history with the canonical application changelog, then reload a release permalink.

**Acceptance Scenarios**:

1. **Given** multiple published releases, **When** I open the page, **Then** versions appear newest first with their
   original categories, complete multiline entries, links, and upgrade guidance.
2. **Given** a release heading, **When** I follow its permalink or table-of-contents link, **Then** that release remains
   addressable after reload.
3. **Given** no publication dates in the source, **When** history renders, **Then** no release dates are invented.

### User Story 3 - Read in the current website language and viewport (Priority: P2)

As a website visitor, I retain my language and readable navigation on mobile, desktop, and right-to-left layouts.

**Why this priority**: The fourth tab must fit the existing multilingual website.
**Independent Test**: Visit English, German, and one right-to-left locale at desktop and mobile widths.

**Acceptance Scenarios**:

1. **Given** a supported locale, **When** I open or switch language on Release Notes, **Then** navigation, page chrome,
   and empty-state text use that locale; canonical English release prose is identified as English.
2. **Given** a 375 px viewport, **When** the four tabs render, **Then** all remain reachable without page overflow.
3. **Given** Release Notes, **When** I inspect navigation, **Then** handbook version controls do not imply that release
   history is filtered to one handbook version.

### Edge Cases

- No published release entries: localized empty state, working documentation navigation, no fabricated release.
- Missing or unreadable canonical source during a build: fail validation rather than silently publish empty history.
- Long entries, nested lists, code, links, and migration paragraphs: preserve readable formatting and full meaning.
- Source headings or duplicate version sections: reject duplicate release identifiers; preserve unique deep links.
- Older handbook versions: continue to expose the global history without altering archived content bytes.
- Direct localized links and hashes: survive server rendering, hydration, and language switching.

## Requirements

### Functional Requirements

- **FR-001**: Add Release Notes after the existing documentation tabs, preserving their current order and availability.
- **FR-002**: Provide a public, directly reloadable, localized release-history destination with correct active navigation.
- **FR-003**: Present all published application release entries in the canonical changelog, newest first, with original
  category names and complete Markdown content. Do not mix in independently versioned website releases.
- **FR-004**: Provide release-heading permalinks and a release table of contents; on mobile provide an accessible
  equivalent without requiring a permanently visible sidebar.
- **FR-005**: Reuse the website's typography, theme, keyboard navigation, and responsive layout. Preserve focus visibility.
- **FR-006**: Localize new interface text in all 13 supported website locales, including English and German. Retain
  canonical English release prose with an explicit language notice and appropriate language markup.
- **FR-007**: Display one global history independently of handbook version selection. Hide the handbook version selector
  on the release-history page; existing handbook selectors retain their behavior.
- **FR-008**: Use the canonical changelog without manually maintained duplicate release prose or browser-time external
  requests. New published entries appear in the next website build containing those entries.
- **FR-009**: Display a localized empty state for a valid source containing no releases; reject missing or invalid source
  during build validation. Do not publish pending changesets or preview handbook content.
- **FR-010**: Include localized release-history URLs in the sitemap and localized page metadata.

### Key Entities

- **Application release**: A version and its categorized change descriptions from the canonical application changelog.
- **Release heading**: A unique link target for a release and its corresponding table-of-contents entry.
- **Localized release-history page**: Translated interface surrounding the same English application release history.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Readers reach release history in one activation from every published handbook toolbar.
- **SC-002**: Every released version and complete change description in the canonical source is readable on the page,
  in descending version order, with no duplicate versions.
- **SC-003**: Release deep links survive direct reloads in English and German; all 13 locales expose the new destination.
- **SC-004**: At 375 px and 1440 px widths, all tabs remain reachable and the page has no horizontal overflow in English,
  German, and one right-to-left locale, in light and dark themes.
- **SC-005**: Reading history triggers zero external release-service requests and works without provider credentials.

## Assumptions

- Scope is the Repovio website documentation toolbar, not the authenticated application's changelog dialog.
- ezSWM supplies the reading pattern, not its VitePress stack or its release text.
- Root `CHANGELOG.md` is the authoritative application release history; website package history remains separate.
- Source prose remains English; translating past release entries is outside scope.
- Public history contains published versions only; pending changesets are not release notes.
- Automatic deployment on every application release is outside scope. Website publication remains independent and manual
  release-PR review remains required. Website history reflects the source revision used for its build.
