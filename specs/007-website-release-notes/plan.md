# Implementation Plan: Website Release Notes

**Branch**: `codex/83-website-release-notes` (base `5f568b0`, verified against `origin/main`) | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)
**Input**: `specs/007-website-release-notes/spec.md`
**Tracking**: [Issue #83](https://github.com/repovio/repovio/issues/83); task generation and planning commit/push approved.
Implementation, release, and deployment require separate approval.

## Summary

Add a fourth Release Notes item to `DocsToolbar.vue`, pointing to a global localized `/docs/release-notes` route.
Follow ezSWM's plain Markdown release history with version headings, complete change prose, permalinks, and a TOC.
Read root `CHANGELOG.md` through a dedicated Nuxt Content page collection at build time, reusing ContentRenderer and
existing documentation styling. No custom release API, database, runtime GitHub fetch, or new dependency is needed.

## Technical Context

**Language/Version**: Existing TypeScript aliases and Vue SFC conventions; Node.js 26.13.0, pnpm 11.28.9.
**Primary Dependencies**: Nuxt 4.6.3, Nuxt Content 3.16.2, Nuxt UI 4.12.0, Nuxt i18n 10.6.0; preserve all pins.
**Storage**: Root Markdown input and existing immutable Nuxt Content build database; no application persistence changes.
**Testing**: Existing website Vitest, Playwright, documentation checks, production build, and container verification.
**Target Platform**: Independently published website container, read-only runtime, SSR and hydrated desktop/mobile browsers.
**Project Type**: Monorepo website feature only.
**Performance Goals**: No added browser-time external requests; one local content query per SSR page; no custom parsing
or client-side duplication of release bodies. Validate the complete current history in production browser tests.
**Constraints**: All 13 locale interfaces; English source prose; no archive edits; no provider calls or release workflow changes.
**Scale/Scope**: One global page, one toolbar item, localized chrome, source collection, sitemap entry, focused tests and
Docker source packaging. Existing three-tab behavior and handbook version routing remain intact.

## Constitution Check

| Gate                                        | Before research                                                   | After design                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Approved architecture and bounded scope     | Pass: website docs only; issue #83 assigned; implementation gated | Pass: reuse website package and content system                                   |
| Read-only provider behavior                 | Pass: no integration changes                                      | Pass: no provider request at build or runtime                                    |
| Authorization and secrets                   | Pass: public local changelog only                                 | Pass: no credentials, API, or database added                                     |
| Durable synchronization and notifications   | Not affected                                                      | Not affected                                                                     |
| Verification, documentation, localization   | Pass: acceptance checks defined                                   | Pass: full locale chrome, focused unit/browser/container checks planned          |
| Toolchain and archived content preservation | Pass: existing pins and archives retained                         | Pass: separate collection; no handbook promotion                                 |
| Delivery gates                              | Pass: planning requested                                          | Pass: tasks, issue, implementation, commits and merges remain separate decisions |

No constitutional exception required. Issue #83 records this scope; this design does not authorize implementation before
its separate approval. Current checkout was provisioned by Codex and is reused without creating another worktree.

## Project Structure

### Documentation (this feature)

```text
specs/007-website-release-notes/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/ui.md
```

`tasks.md` records the separately approved task-generation phase. Implementation remains gated.

### Source Code (repository root)

```text
CHANGELOG.md                                      # canonical application history, consumed without editing
apps/website/
├── content.config.ts                             # dedicated application release collection
├── Dockerfile                                    # copy root changelog into build image
├── app/components/DocsToolbar.vue                 # fourth item; optional version-control visibility
├── app/components/modules/docs/release-history.vue # release body, empty state and TOC presentation
├── app/pages/docs/release-notes.vue                # dedicated static route, SSR content loading and metadata
├── i18n/locales/*.json                            # all 13 interface translations
├── server/routes/sitemap.xml.ts                   # global localized history URLs
├── tests/unit/                                   # source/navigation/TOC contracts
└── tests/e2e/release-notes.spec.ts                 # production navigation, content, locale and visual evidence
```

**Structure Decision**: Keep the route thin and presentation in the existing docs feature folder. The dedicated static
route takes precedence over `docs/[slug].vue`; do not route this page through handbook redirects or add it to immutable
version manifests. Add a toolbar prop with existing behavior as the default to hide `DocsVersionSwitch` on history only.
Existing toolbar links from history resolve to the stable handbook; links from versioned handbook pages retain their
selected version. Keep conditional API visibility.

## Phase 0: Research

See [research.md](research.md). All design questions have resolved defaults. ezSWM's source inclusion pattern maps to
Nuxt Content's local collection `source.cwd`, resolved from `content.config.ts` to the repository root, with an exact
`CHANGELOG.md` include. Resolve paths from the configuration file, never from the process working directory.

## Phase 1: Design

1. Define a single application-release content collection alongside existing per-locale handbook collections. Query that
   collection directly rather than adding release prose to every locale folder. Use ContentRenderer for complete Markdown;
   do not copy the dashboard dialog's line-based parser, which loses multiline structure.
2. Load the single document on `/docs/release-notes`; derive release links from its H2 TOC. Use Nuxt Content's generated
   heading IDs verbatim, including their existing punctuation normalization. Test actual IDs instead of guessing slugs.
   Preserve source order, validating descending semantic versions and unique release headings in focused checks.
3. Display localized H1, description, English-source notice, and empty state. Render the canonical body's H2/H3 sections
   without a second visible source H1. Keep original Changesets category labels and source links. Do not invent dates,
   badges, translated release prose, or unreleased sections.
4. Use existing docs article width, sticky toolbar offsets, theme tokens, and `UContentToc`. Provide a compact mobile
   release navigation control with ordinary anchor links. Ensure keyboard focus, heading hierarchy, and `lang="en"` on
   source prose. Translate new keys across all 13 locale JSON files, including RTL layouts.
5. Add localized history URLs to sitemap and reactive title/description metadata. Verify language switching retains the
   static route and hashes; preserve existing site-level canonical/alternate-link conventions.
6. Copy root `CHANGELOG.md` into the website Docker build stage at the same repository-relative location. Runtime serves
   the immutable content dump and needs neither the source file nor a writable database. Validate missing-source failure
   explicitly; a deliberate valid empty history remains a localized UI state.
7. Run focused source/navigation/browser checks, website targets, formatting checks, and the production container check.
   Capture desktop/mobile screenshots for English, German, and RTL in both themes. Update website contributor guidance
   to explain the canonical source and independent publication timing during implementation.

## Risks and Boundaries

- Application and website versions are independent. A new application changelog entry reaches the live website only after
  the next independently approved website build/publication; do not couple releases or change deployment triggers here.
- Root source inclusion must work in development, CI, and Docker. A container build check is required acceptance evidence.
- The canonical changelog currently has no publication dates. A reliable date source would be a separate enhancement.
- Nuxt Content collection path generation is internal to the source collection; public URL is the explicit static route.
- Changeset policy applies per substantive implementation commit: exactly one focused root `repovio` Changeset as required
  by AGENTS.md; include the independent website package bump in that same file when the task changes website behavior.
  Planning-only artifacts need no fabricated package release entry.
- Existing coding-guidelines and constitution disagree on typed documentation tags. No executable source changes occur
  during planning; resolve against current agent instructions before implementation rather than modifying standards here.

## Complexity Tracking

No violations or additional infrastructure. Reuse the content pipeline rather than creating a parser or release service.
