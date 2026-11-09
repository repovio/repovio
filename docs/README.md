# Repovio documentation

The user and operations handbook is maintained in [apps/website/content](../apps/website/content) and rendered at
[repovio.de/docs](https://repovio.de/docs). Choose the release matching your installation.

## User and operations handbook

- [Installation](https://repovio.de/docs/installation)
- [Authentication](https://repovio.de/docs/authentication)
- [Deployment and backups](https://repovio.de/docs/deployment)
- [Runtime theming and branding](theming.md)
- [MCP access](https://repovio.de/docs/mcp)

The following links point to the editable `next` handbook sources. `next` is excluded from website routes, search, and
bundled assets until a reviewed archive is published. Released versions retain their original content:

- [Branding upgrade](../apps/website/content/en/docs/next/branding-upgrade.md)
- [PostgreSQL 18 upgrade](../apps/website/content/en/docs/next/postgresql-18-upgrade.md)
- [Interface localization](../apps/website/content/en/docs/next/localization.md)

See the [website package guide](../apps/website/README.md) for translation checks, archive promotion, and independent
website releases. Edit all supported translations together; do not rewrite published archives to match newer behavior.

## Repository development and maintenance

Keep source-specific contributor guidance and maintenance records alongside the implementation:

- [Coding guidelines](coding-guidelines.md)
- [Dependency security maintenance](dependency-security.md)
- [GitHub security setup record](security-setup.md)
- [Prisma notes](../apps/api/prisma/README.md)
- [Bruno API collection](../apps/api/bruno/README.md)

Product architecture and implementation plans remain in the repository root and planning directory.
