# @repovio/website

## 0.2.2

### Patch Changes

- 71a06f7: Refresh the handbook for repository detail navigation, four-step notification channel setup, personal notifications,
  and browser-push enrollment across all supported languages. Correct monorepo documentation ownership and complete the
  API environment reference without modifying published archives.

## 0.2.1

### Patch Changes

- 3c40032: Expand the next handbook with Keycloak, Microsoft Entra ID, and Auth0 setup guides in all 13 languages, including a
  complete Keycloak Compose example and provider-specific group mapping and recovery instructions.
- 574a9cc: Display the website package version on the right side of the footer.

## 0.2.0

### Minor Changes

- 1131ce4: Replace combined handbook pages with versioned feature guides and application-aligned Overview, Operations, and
  Administration navigation. Preserve legacy page bookmarks and keep internal handbook links in the selected language.
- 1131ce4: Add a native, bilingual API reference with local search, schema details, and versioned OpenAPI downloads. Generate and
  verify API snapshots during application documentation publication without contacting a running application.
- 1131ce4: Add seven dedicated product feature pages and an overview in all 13 languages, with reusable product components,
  localized metadata, and synthetic screenshots from the stable application release.

  Add integrations and self-hosting pages that explain provider capability differences and link setup to the stable handbook.

  Add accessible desktop and mobile product navigation, active section indicators, sitemap entries, and product links in the footer.

- 1131ce4: Add the bilingual Repovio product website, versioned documentation and reproducible publication workflow.
- 1131ce4: Translate the complete website and versioned handbook into 13 languages. Share canonical locale metadata across
  routing, collections, SEO, and language controls, support Arabic and Urdu right-to-left layout, and identify English
  screenshots when localized application images are unavailable.

### Patch Changes

- 1131ce4: Remove the obsolete legacy authentication key from current application screenshot captures.
- 1131ce4: Consolidate the website and documentation into the monorepo with affected-area CI and independently versioned website images.
- 1131ce4: Preserve native API reference navigation, schema provenance, and publication recovery across all 13 website languages.
  Keep preview-only API sources unpublished and validate the reference in every locale, theme, and viewport size.
- 1131ce4: Keep API endpoint paths and method links in left-to-right order within Arabic and Urdu documentation so leading
  slashes and parameter braces remain readable.
- 1131ce4: Align Guides navigation with application destinations, expandable feature links, and an equivalent mobile menu.
- 1131ce4: Archive and hash every canonical documentation locale during release promotion. Validate all translations before
  writing the archive, preserve immutable publication content on retries, and stage every language in the publication
  workflow.
- 1131ce4: Fix vulnerable glob, minimatch, esbuild, and Zod dependency paths and replace Rollup's unsafe deepmerge dependency.
