# Research: Website Release Notes

## Reference: ezSWM

- Decision: Reuse the reading pattern: one Markdown history, newest versions first, category headings, complete bullet
  descriptions, heading links, and a right-side TOC. Use Repovio styling and a fourth docs toolbar item.
- Evidence: ezSWM's English wrapper includes `../CHANGELOG/en.md`; its German wrapper includes `../../CHANGELOG/de.md`.
  Source was inspected at commit `16d49b69db6ab91e5634e657c8a1387433752e46`; live HTML was also read on 2026-11-10.
- Rationale: Content inclusion avoids a second manually maintained release history. No card grid or custom timeline is
  necessary. ezSWM includes Unreleased and dated headings; Repovio does not have equivalent source data, so omit them.
- Alternatives considered: Copying VitePress or reference code would introduce an unrelated stack and unnecessary licensing
  obligations; a custom release explorer would exceed the request.
- Sources: [live page](https://slgfire.github.io/ezswm/release-notes),
  [English wrapper](https://github.com/slgfire/ezswm/blob/16d49b69db6ab91e5634e657c8a1387433752e46/docs/release-notes.md),
  [English changelog](https://github.com/slgfire/ezswm/blob/16d49b69db6ab91e5634e657c8a1387433752e46/CHANGELOG/en.md),
  [VitePress configuration](https://github.com/slgfire/ezswm/blob/16d49b69db6ab91e5634e657c8a1387433752e46/docs/.vitepress/config.ts).

## Canonical source and rendering

- Decision: Add a dedicated Nuxt Content collection reading only root `CHANGELOG.md`, using an absolute configuration-file
  relative `source.cwd`. Reuse ContentRenderer and generated TOC IDs; preserve original release order and Markdown bodies.
- Rationale: Root history already powers the application's changelog dialog, but that dialog's line-based reduction drops
  continuation paragraphs. Nuxt Content is already installed and preserves structured Markdown without a new parser.
- Alternatives considered: Browser GitHub API calls add availability and rate-limit dependencies; duplicating content per
  locale drifts; concatenating pending Changesets misrepresents unreleased work. A copied generated file is unnecessary.
- Evidence: `apps/web/app/components/layout/changelog-dialog.vue`, root `CHANGELOG.md`, and
  `apps/website/content.config.ts`. Nuxt Content documents `source.cwd` for files outside its normal content directory.
- Source: [Nuxt Content collection sources](https://content.nuxt.com/docs/collections/sources), checked via Context7.

## Routing and version semantics

- Decision: Public static `/docs/release-notes`, with normal non-English locale prefixes, independently of handbook versions.
- Rationale: Historical changes span application versions and do not map one-to-one to archived handbook majors. Static
  route avoids `docs/[slug].vue` treating Release Notes as an invalid handbook slug. Hide version selector on history only.
- Alternatives considered: Adding a slug to every version manifest would rewrite released archives; a top-level-only page
  would weaken the requested docs-tab relationship. Existing tabs retain their version-dependent behavior.
- Evidence: `DocsToolbar.vue`, `DocsVersionSwitch.vue`, `app/pages/docs/[slug].vue`, `shared/docs.ts`.

## Localization and missing data

- Decision: Translate interface keys in all 13 supported locales; identify canonical body as English. Preserve the source's
  Changesets category labels and omit dates because the source does not provide them.
- Rationale: Website locale support exceeds EN/DE; English fallback prose is explicit and avoids invented translations.
- Alternatives considered: Translating historical release prose is separate editorial scope; extracting dates from Git or
  remote release APIs would add unrequested source synchronization and build dependencies.
- Decision: Missing/unreadable source fails build validation. Valid changelog with zero release sections gets a localized
  empty state. Duplicate versions or invalid release ordering fail source validation.

## Packaging, publication, and verification

- Decision: Copy root changelog into Docker build inputs; retain the immutable content database at runtime. Keep website
  publishing independent; do not change release workflows or auto-merge generated version PRs.
- Rationale: Docker currently copies only workspace manifests and `apps/website`; root history would otherwise be absent.
  `PLAN.md` explicitly keeps application and website packages independently versioned and published.
- Alternatives considered: Coupled image publishing or runtime fetching broadens scope and changes approved architecture.
- Evidence: `apps/website/Dockerfile`, `nuxt.config.ts`, `.github/workflows/website.yml`, `.github/workflows/deploy.yml`,
  `PLAN.md`, `.changeset/config.json`.
- Verification: Unit checks for release headings/content/navigation, production Playwright checks, localized sitemap and
  metadata checks, visual evidence at mobile/desktop widths and both themes, Docker read-only container validation.

## Resolution

No unresolved design questions. Product behavior, source provenance, locale policy, route ownership, and publication
boundary are explicit. Implementation compatibility and live browser/container behavior remain future acceptance work.
