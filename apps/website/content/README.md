# Repovio documentation

<img src="branding/logo.svg" width="64" height="64" alt="Repovio" />

Public documentation sources in 13 languages for https://repovio.de.

Use the [canonical Repovio glossary](https://github.com/repovio/repovio/blob/main/GLOSSARY.md) for product and domain
terminology. These sources are maintained alongside the application and website.

Edit `<locale>/docs/<version>/<slug>.md`. English is the editorial reference. Every page requires title and description
frontmatter. Update every supported language together and preserve executable examples and technical identifiers.

The [feature coverage matrix](COVERAGE.md) maps the complete handbook to both reviewed application versions.
`navigation.json` defines explicit tab, section, subgroup, and order metadata, plus legacy-page redirects. Never
classify pages by their position in a version slug list. `locales.json` is the locale registry shared with the website
consumer. Stable heading anchors are identical across translations.

`versions.json` records exact application revisions, released page sets and the stable version. `next` is an internal
editorial source, excluded from website routes, search, assets and indexing. The initial historical snapshot comes from
application release 1.0.1; its original Git tag is recorded by exact commit rather than renamed or recreated. Product
labels are normalized; archived deployments must use configuration and image references from their tagged source.

The website consumes these sources directly from `apps/website/content` in the monorepo. Review content and renderer changes together. Release promotion validates exact application and documentation revisions, creates immutable minor archives and
records publication identity. Historical pages do not automatically acquire new functionality.

Screenshots are published only with matching source provenance. Existing screenshots without capture provenance are not
reused as evidence for a release. See the website deployment guide for capture and promotion configuration.

## Contributing

Report documentation problems in the monorepo issue tracker. Do not include tokens, private repository data or
other credentials. Report vulnerabilities using the security policy. Support development at
https://buymeacoffee.com/tobiaswaelde.

## Supported languages

English, German, Simplified Chinese, Hindi, Spanish, Arabic, French, Bengali, Brazilian Portuguese, Indonesian, Urdu,
Russian, and Japanese. Arabic and Urdu use right-to-left presentation on the website. Application interface languages
are independent; see the versioned localization guide.

Run `node --test tests/*.test.mjs` and `node scripts/validate.mjs` before delivery. Validation rejects missing pages,
changed technical examples, broken links/anchors, duplicate navigation entries, and untranslated English page copies.

Guide entries in `navigation.json` reference an application destination in `groups`. Each group defines its section,
translated title key, Lucide icon, and optional landing-page slug. A null landing page defines an expandable group. The
website nests the remaining pages under that destination and derives function links from localized H2 headings; existing
explicit anchors and page URLs remain intact. Group IDs must be unique, and pages must match their group's section. Keep
this metadata compatible with the website consumer in the same change.

## API reference

The `next` API pages are unpublished drafts. Before release, record the reviewed application merge revision and remove
`workingTreeSource` only after checking the documentation against that revision. Release promotion generates
`openapi/<version>.json` from the exact released application. Its path, application revision, and SHA-256 digest are
recorded in `versions.json`; `scripts/validate.mjs` validates released schemas and their local references. Existing
archives without API pages do not require an OpenAPI snapshot. Never copy a deployment's secrets or server URL into an
archive. The website bundles only released snapshots.
