# Data Model: Website Release Notes

No Prisma changes, migrations, credentials, or new public API.

## ApplicationReleaseDocument

A dedicated Nuxt Content `page` collection backed by exactly root `CHANGELOG.md`.

| Field            | Meaning                                            | Validation                                                     |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `body`           | Parsed Markdown AST with complete release sections | Preserve nested blocks, continuation paragraphs, links, code   |
| `body.toc.links` | H2 release headings and nested category links      | Use renderer-generated IDs, unique release headings            |
| `title`          | Source heading metadata                            | Do not display source Changelog H1 alongside localized page H1 |
| `path`           | Content collection's internal document path        | Never use as public route or handbook slug                     |

Root source order is authoritative and must be descending semantic version order. Validation must identify complete
`major.minor.patch` release headings rather than accidentally counting category headings. Current source contains stable
published versions only; pending Changesets are excluded. Do not reinterpret website package versions as application versions.

## ReleaseNavigationEntry

Derived view of each H2 TOC item: original version title, generated heading ID, fragment destination. Category children may
appear inside the desktop TOC. Mobile navigation links identify releases. No independently persisted release index.

## LocalizedReleaseHistoryPage

Locale comes from the existing website registry. Interface includes title, description, tab label, TOC label, source-language
notice, and empty-state copy. Shared English body uses explicit language markup. Public route is locale-prefixed
`/docs/release-notes`; page is independent of handbook versions.

## States

- Source available with releases: SSR history and navigation; hydrate without content loss or external requests.
- Valid source without release headings: localized empty state.
- Source missing/unreadable or duplicate/invalid release headings: validation failure before publication.
- Language change: preserve public route and valid fragment; translate chrome only.
- New source revision: included in the next website build; no runtime polling or source synchronization.
