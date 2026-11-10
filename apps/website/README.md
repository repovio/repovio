# Repovio website and documentation

The Nuxt product website and 13-language documentation live in this workspace package. Documentation sources are ordinary
tracked files in `content/`, not a Git submodule. Run commands from the monorepo root with Node.js 26.13.0 and pnpm 11.28.9.

```sh
pnpm install --frozen-lockfile
pnpm --filter @repovio/website dev
pnpm --filter @repovio/website docs:test
pnpm --filter @repovio/website docs:check
pnpm --filter @repovio/website lint
pnpm --filter @repovio/website typecheck
pnpm --filter @repovio/website test
pnpm --filter @repovio/website build
pnpm --filter @repovio/website exec playwright install chromium
pnpm --filter @repovio/website test:e2e
pnpm --filter @repovio/website test:api-reference
```

## Independent releases and deployment

Add a root `.changeset/*.md` entry for `@repovio/website` when changing the website or published documentation. Add `repovio`
only when the application itself needs a release. Changesets maintains independent package versions in one release PR;
merge that PR manually. A website-only release builds only the website image. Application releases build the API and
web images and run their smoke test. No application service or database is required by the website deployment.

The website image is `ghcr.io/repovio/repovio-website:<website-version>` and uses the unprefixed semantic package version,
plus `latest`. Its Git release tag is `@repovio/website@<website-version>`; application tags remain `repovio@<version>`.
The previous standalone website tags and container package are historical and are not renamed or overwritten.

```sh
REPOVIO_WEBSITE_VERSION=0.2.0 docker compose -f apps/website/compose.yaml -f apps/website/compose.build.yaml build
REPOVIO_WEBSITE_VERSION=0.2.0 docker compose -f apps/website/compose.yaml up -d
```

Set the exact website version from its release, configure `NUXT_PUBLIC_SITE_URL`, and terminate TLS through a reverse
proxy. The container binds to loopback port 3002, runs unprivileged, and supports a read-only filesystem. To verify a
local image, run `CONTAINER_IMAGE=repovio-website:local pnpm --filter @repovio/website test:container`.

## Versioned application documentation

`content/versions.json`, `content/locales.json`, and `content/navigation.json` define releases, locales, and navigation.
Historical pages and their OpenAPI schemas retain their provenance and bytes. `next` is unpublished editorial content:
it is excluded from website routes, search, and bundled assets, but its source is visible in the public repository.

After an application release passes its image smoke test, `DOCS_PUBLICATION_ENABLED=true` enables the reusable archive
workflow. It checks out that exact application tag, consumes the documentation from the same commit, exports OpenAPI,
and captures the application with synthetic fixtures. It opens a documentation PR containing the validated archive,
captures, publication record, and a website-only Changeset. The website publishes after that PR and the subsequent
Changesets release PR are reviewed and merged. An application release never directly bumps the website version.

For recovery or an explicitly selected application version, dispatch `promote-docs.yml` with `repovio@x.y.z`. Publication
identity is immutable; completed requests are idempotent. A missing translation, source mismatch, modified archive, or
invalid schema fails the workflow. Keep `next.revision` at the reviewed application source revision and remove any
`workingTreeSource` marker only after review. Old application tags predating this migration retain their original layout;
archive those using the historical publication tooling, not the monorepo workflow.

`CHANGESETS_PR_TOKEN` must permit contents and pull-request writes in this repository so bot-created PRs trigger CI.
The old cross-repository `DOCS_APP_ID`, `DOCS_APP_PRIVATE_KEY`, and `WEBSITE_RELEASE_ENABLED` settings are no longer used.
Repository visibility and existing standalone repositories are managed separately; migrating files does not change them.

## CI and contribution

`ci.yml` detects changed areas and exposes a stable `Test applications` result. Website or handbook changes run the website
checks, production browser tests, and container validation without starting PostgreSQL or building application images.
Shared dependency/configuration changes check all consumers. CodeQL retains its required job names, skips scans for
unaffected languages, and keeps its scheduled full scan. CI-generated archive commits explicitly skip the local Graphify
hook; normal implementation commits rebuild the staged-source graph.

Edit `content/<locale>/docs/<version>/<slug>.md`; update every supported translation and preserve executable examples,
technical identifiers, and heading anchors. The canonical terminology is in the root `GLOSSARY.md`. Run root formatting
and documentation checks as well as package checks. Released handbook archives are excluded from reformatting because
their bytes form part of the publication identity. New source follows `docs/coding-guidelines.md`.

## Application release notes

Root `CHANGELOG.md` is the canonical application history. A dedicated Nuxt Content collection reads it at build time,
without copying prose into locale folders or querying GitHub. The source checker rejects unavailable files, duplicate
versions, invalid headings, and incorrect semantic ordering; a valid empty changelog is supported. Docker builds include
the same source. Website publication stays independent: new application entries appear with the next website build
containing that changelog revision. Pending Changesets and the website package changelog are not application releases.

The public release-history route is `/docs/release-notes`, with normal non-English locale prefixes. Interface labels
and metadata are translated into all website languages; the canonical release descriptions remain English and are
marked accordingly. The page spans application versions, so it has no handbook version selector. Release heading links
use the content renderer's IDs and remain valid across language switches. Sitemap discovery is independent of handbook
archive versions. There is no browser-time GitHub request or need for application/provider credentials.

The root changelog is an explicit external input to website Nx build, container, test, and typecheck targets. Its changes
invalidate those caches and select website CI validation, without changing independently approved publication triggers.

Isolated API-reference validation preserves the website's repository-relative root changelog input in its disposable
fixture. It continues to create synthetic API archives only in that fixture and never modifies real release content.
