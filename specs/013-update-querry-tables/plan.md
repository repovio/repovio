# Implementation plan: Update Querry-Kit tables

**Base:** `main` at `6c63092` · **Specification:** [spec.md](spec.md)

1. Resolve the Prisma configuration dependency on vulnerable Effect using the smallest compatible lockfile change.
   Verify the Nuxt alert against the resolved tree. Inventory other available direct updates separately.
2. Upgrade the API and web Querry-Kit packages together. Validate the installed peers and current flat-table behavior.
3. Extend the four resource query contracts in `libs/schemas` and `apps/api/src/modules`. Apply each existing list's
   authorization, search, repository scope, and specialized predicates to grouped queries and leaf requests.
4. Adapt `apps/web/app/composables/api` and the three shared feature table pages for the four resources. Reuse Querry-Kit
   grouping and loading controls. Preserve existing cell renderers, embedded contexts, and default pagination.
5. Verify the [acceptance scenarios](quickstart.md) and add the feature changeset.

## Technical context and constitution check

Node 26.13.1, pnpm 12.21.0, Nuxt, NestJS, Prisma, PostgreSQL. No database migration or provider writes. Existing
CASL-aware services own authorization before aggregation. Keep explicit DTOs, typed clients, OpenAPI and Bruno
examples aligned; localize the new controls in English and German.
