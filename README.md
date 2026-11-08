# Repovio

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/tobiaswaelde)

Repovio is a read-only dashboard for GitHub Actions, GitLab pipelines, Forgejo
Actions, and Gitea Actions. It tracks selected workflow runs, issues, and pull requests, shows failures and trends,
and sends notifications without modifying provider resources.

[Read the Repovio documentation](https://repovio.de/docs/).

Use the [Repovio glossary](GLOSSARY.md) for canonical product and domain terminology.

## Status

The repository contains the API and web dashboard. Ongoing work is tracked in [GitHub Issues](https://github.com/repovio/repovio/issues).

See [branding upgrade](https://github.com/repovio/docs/blob/75e5fd90af4384cb85259772d5bd0e92ab5aade7/en/docs/next/branding-upgrade.md) before upgrading an existing deployment.
Customize colors, typography, logos, metadata, links, and PWA icons through
[runtime theming and branding](docs/theming.md); environment variables and read-only mounts work without image rebuilds.

## Prerequisites

- Node.js 26.13.0, managed through [nvm](https://github.com/nvm-sh/nvm) or an
  equivalent Node version manager.
- Corepack-enabled pnpm 11.28.9.
- Docker and Docker Compose for the future local PostgreSQL and application
  stack.

## Setup

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm nx show projects
```

Copy `.env.example` to `.env` before using Docker Compose. Never commit `.env`
or provider, database, encryption, JWT, or notification URL credentials.

## Environment configuration

The API loads the root `.env` file before startup and validates its runtime
configuration with `envalid`. It refuses to start when a required value is
missing or violates a listed constraint. For a local setup, begin with:

```bash
cp .env.example .env
```

Replace every placeholder before sharing or deploying an environment. The
template deliberately contains no usable passwords, tokens, or encryption
keys, so the API will reject it until you provide real deployment values. The
API accepts the following variables:

| Variable                          | Required | Default                 | Purpose and constraints                                                                                |
| --------------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                        | No       | `development`           | One of `development`, `production`, or `test`.                                                         |
| `PORT`                            | No       | `3001`                  | HTTP port as a number.                                                                                 |
| `DATABASE_URL`                    | Yes      | —                       | PostgreSQL connection URL used by the API.                                                             |
| `SHADOW_DATABASE_URL`             | Yes      | —                       | PostgreSQL shadow database URL used for Prisma migrations.                                             |
| `CORS_ORIGIN`                     | No       | `http://localhost:3000` | One origin, comma-separated origins, or `*`.                                                           |
| `PUBLIC_URL`                      | No       | `http://localhost:3000` | Public Repovio URL; must use HTTP or HTTPS.                                                            |
| `OIDC_CALLBACK_URL`               | No       | Local API callback      | Exact public API callback URL registered with the optional OpenID Connect provider.                    |
| `AUTH_JWT_ISSUER`                 | No       | `repovio`               | JWT issuer identifier.                                                                                 |
| `AUTH_JWT_SECRET`                 | Yes      | —                       | Long, unique secret used to sign JWTs.                                                                 |
| `AUTH_JWT_EXPIRATION`             | No       | `7d`                    | JWT lifetime accepted by the Nest JWT module.                                                          |
| `TOKEN_ENCRYPTION_KEY`            | Yes      | —                       | Canonical Base64 value decoding to exactly 32 bytes; encrypts provider and repository webhook secrets. |
| `SCHEDULER_ENABLED`               | No       | `true`                  | Enables scheduled polling and retention jobs. Set `false` for one-off commands.                        |
| `SCHEDULER_SYNC_INTERVAL_SECONDS` | No       | `1800`                  | Positive integer fallback polling interval in seconds.                                                 |

`REPOVIO_ENV_FILE` is an optional local loader setting. When set, the API
loads that file after the root `.env` file, allowing a local override without
changing the shared template.

The following variables are used by the Docker Compose deployment rather than
by the Nest API's `envalid` configuration:

| Variable            | Default   | Purpose                                               |
| ------------------- | --------- | ----------------------------------------------------- |
| `POSTGRES_DB`       | `repovio` | PostgreSQL database name.                             |
| `POSTGRES_USER`     | `repovio` | PostgreSQL user.                                      |
| `POSTGRES_PASSWORD` | —         | PostgreSQL password; replace the example value.       |
| `REPOVIO_VERSION`   | `latest`  | API and web image version selected by Docker Compose. |

OIDC provider settings are managed under **Settings → Authentication**. The client secret is encrypted with
`TOKEN_ENCRYPTION_KEY`; see [authentication](https://repovio.de/docs/authentication) for provider setup and recovery behavior.

OIDC profile pictures are refreshed from the verified `picture` claim at sign-in and stored as normalized WebP images.
Custom uploads take precedence; removing a custom picture restores the OIDC image. Remote images must satisfy the
existing HTTPS, public-address, size, and image-format restrictions. Download failures do not prevent sign-in.

The OIDC-avatar migration only adds a separate table and foreign key; existing users and manual images are preserved.
Operators must apply migrations before starting the updated API. Application rollback can retain the added table;
dropping it would discard cached OIDC images. No production migration is performed by this change.

Provider access tokens, repository webhook secrets, and notification credentials
are not environment variables. Repovio stores them encrypted in PostgreSQL
through its application configuration. See [notification configuration](https://repovio.de/docs/notifications) for Apprise URL handling and migration guidance.

On a new installation, open Repovio in a browser and complete the one-time
[first-run setup](https://repovio.de/docs/authentication) to create the first system administrator.

## Commands

Read [coding guidelines](docs/coding-guidelines.md) before contributing code, tests, scripts, or configuration.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm branding:check
pnpm changeset status
```

Public documentation is maintained in `repovio/docs` and rendered by the private `repovio/website` project.

## OpenAPI export

The installed API serves its interactive Scalar reference at `/docs` on the API server (locally
`http://localhost:3001/docs`). REST endpoints use `/api/v1`; configure your reverse proxy explicitly to expose `/docs`.

Export the same Zod-cleaned contract without starting a listener, database connection, scheduler, or provider request:

```bash
pnpm --filter @repovio/api openapi:export /absolute/path/openapi.json
pnpm --filter @repovio/api test:openapi
```

The exporter uses synthetic configuration, skips local environment files, and emits deterministic JSON with a relative
server URL. The website release publisher runs it against the exact released application revision, archives the schema
in `repovio/docs`, and bundles it into the static, versioned reference. Never generate a release snapshot from a running
production instance or an unreviewed working tree.

## Changesets and releases

Repovio uses one private root package and Changesets for release management.
Add exactly one focused Changeset for every substantive implementation commit:

```bash
pnpm changeset
```

The GitHub deployment workflow will create or update a release pull request.
After that pull request is merged, it creates the release tag and publishes
matching API and web Docker images to GitHub Container Registry.

## Dependency updates

Dependabot checks the root pnpm workspace, both application manifests, and the
GitHub Actions workflows every Monday. A single npm configuration covers all
three workspace directories and groups matching dependencies by name, so each
update retains a consistent root lockfile. Routine version updates are grouped
by production or development scope; major updates remain individual for focused
review, and security updates remain separate. TypeScript is intentionally
excluded because compiler aliases and their version ranges are deliberately retained in the workspace manifests.

Review each update against its lockfile changes and run the affected checks. At
minimum, run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`,
and `pnpm test`; run application-specific build or Docker checks when a runtime
dependency or build tooling changes. Add exactly one focused Changeset when a
dependency update changes released runtime behavior. Lockfile-only, tooling,
and GitHub Actions updates do not need a Changeset.

Changesets CLI v3 and `changesets/action` v2 are upgraded together. Review the
corresponding deployment workflow run before accepting a future major update.

## Security scanning

The prepared CodeQL workflow analyzes JavaScript/TypeScript and GitHub Actions workflow files for pull
requests targeting `main`, pushes to `main`, and every Monday. Those languages
are analyzed directly from source, so no Node, pnpm, or application build is
needed in the CodeQL workflow. The workflow uses `pull_request`, never
`pull_request_target`; GitHub therefore downgrades the token for fork pull
requests and does not expose repository secrets.

For a private repository, it runs only when `CODEQL_ENABLED=true` and the required GitHub feature is already available.
No paid feature is activated automatically. Review actual CodeQL results in the repository Security view. Fix verified findings
promptly; dismiss a false positive or accepted risk only with a concise,
auditable justification in GitHub.

## Architecture

- `apps/api`: NestJS with Fastify, Prisma, PostgreSQL, CASL, and the Query Kit core/Zod integrations.
- `libs/schemas`: shared Zod request, query, response, and form contracts; no server dependencies.
- `/mcp`: permission-aware, read-only MCP v2 endpoint using user-owned bearer tokens.
- `apps/web`: Nuxt 4 SPA, Pinia, Nuxt UI, and `@querry-kit/nuxt`.
- [Documentation](https://repovio.de/docs/): deployment, MCP access, providers, notifications, repositories, and localization.
- `PLAN.md`: approved architecture and release design.
- [GitHub Issues](https://github.com/repovio/repovio/issues): ordered
  implementation epics and tasks.
- `AGENTS.md`: repository-specific instructions for coding agents.

Schema changes belong in `libs/schemas`; API DTO classes are thin Nest metadata bridges. Use inferred schema types in
clients and derive form schemas from the request contract. Keep UI-only fields out of request payloads. Public mapping
functions normalize dates to ISO strings before response validation and retain CASL filtering and field projection.
Application scripts build the schema package before starting, testing, typechecking, or building either application.

## Development toolchain

Use Node.js 26.13.0 LTS and the package manager pinned in `package.json`. Node-based application runtimes require Node.js 26. Builds use TypeScript 7; ESLint and compiler-API consumers use the TypeScript 6 compatibility package. Dependency overrides, where present, pin security fixes for transitive packages; validate tests and documentation builds when changing them.

## Website and public documentation

The product website and handbook are maintained in [`apps/website`](apps/website/README.md). The website has its own
Changesets package version, container image, and Compose deployment. Documentation sources are ordinary tracked files
under `apps/website/content`. See the package README for validation, archive promotion, and deployment instructions.
