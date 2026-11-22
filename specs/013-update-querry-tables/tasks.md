# Tasks: Update Querry-Kit tables

## Dependency security and compatibility

- [x] T001 [US1] Resolve Effect in `pnpm-lock.yaml` and, if needed, `pnpm-workspace.yaml`. Add regression coverage
  in `scripts/check-dependency-security.test.mjs`. Verify audit, frozen installation, and Prisma configuration loading.
- [x] T002 [US1] Update Querry-Kit in `apps/api/package.json`, `apps/web/package.json`, and `pnpm-lock.yaml`.
  Verify peer resolution, schema generation, API and web tests, and the current paginated lists.

## Authorized grouping

- [ ] T003 [US2] Define validated group requests and responses in `libs/schemas/src` and implement read endpoints in
  `apps/api/src/modules/{workflow-runs,issues,pull-requests,security-alerts}`. Reuse scoped predicates, update OpenAPI
  and Bruno examples, and test filtered counts, leaf consistency, invalid fields, and repository separation.

## Table controls

- [ ] T004 [US2] Connect the three `table-page.vue` components under `apps/web/app/components/modules` to the four
  resources through `apps/web/app/composables/api`. Add grouping controls and localized labels. Verify opening and
  closing groups preserves filters, row interactions, and authorized scope.
- [ ] T005 [US3] Enable pagination and infinite scroll on those tables. Cover switching modes, stale requests,
  deduplication, append failures, retry, and group-local loading. Verify EN/DE, desktop, and narrow browser layouts.

## Integration

- [ ] T006 Verify `quickstart.md` against the finished implementation and add one `.changeset/` entry for `repovio`.

Deliver T001 first as an independent security fix, then T002–T006 in order. Within T003, resource-specific service tests
can run independently; within T005, browser scenarios for the four tables can run independently.
