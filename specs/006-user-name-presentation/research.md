# Research: App-Wide User Name Presentation

## Shared Identity Formatting

**Decision**: Reuse `apps/web/app/utils/user-identity.ts` and existing tests. `getUserDisplayName` supplies compact names;
`getUserIdentityLabel` supplies `Name (@username)`. Trim retained name parts before joining. Preserve partial-name and
username-only fallback; suppress a redundant username suffix when the display name equals the username.

**Rationale**: Repository member selection already uses this convention. Current helpers filter whitespace-only parts
but join retained parts without trimming. Existing local and OIDC accounts permit missing names.

**Alternatives considered**: Per-component formatting causes drift; a new service/component is unnecessary; requiring
names would introduce a separate account migration. Preserve avatar initials unless directly affected by normalization.

## Surface Inventory

Paths below are relative to `apps/web/app/`.

| Surface            | Evidence                                                                           | Design                                                 |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Repository access  | `components/modules/repositories/details/members-card.vue` already formats options | Align secondary username and removal confirmation      |
| Group selection    | `components/modules/user-groups/resource-picker.vue` labels Users by username      | Shared identity labels; preserve group-name branch     |
| Group members      | `components/modules/user-groups/members-dialog.vue` has username rows/actions      | Name-first rows, accessible removal text, confirmation |
| Browser recipients | `composables/app/notification-channel-draft.ts` reduces User to ID/username        | Preserve names in props/options and selected labels    |
| Channel summaries  | `pages/notifications/index.vue` drops names and renders bare usernames             | Preserve and format recipient identities               |
| Delivery requester | `components/modules/notifications/delivery-details-dialog.vue` uses username       | Add safe requester identity projection                 |
| Administration     | `pages/admin/users.vue` has bare secondary usernames and confirmation              | Parenthesized username and formatted target identity   |
| Account dialog     | `components/modules/users/account-dialog.vue` has username reset text              | Format person reference; retain username inputs        |
| MCP token dialog   | `components/modules/mcp/user-token-dialog.vue` uses username description           | Format target identity                                 |
| Account navigation | `components/layout/user-menu.vue` already prefers personal name                    | Verify fallback, accessible name, refresh              |

A final scoped audit must check equivalent Repovio User references beyond this inventory. Login/edit credentials,
service usernames, Provider Accounts, and work-item author/assignee Provider Actors remain separate concepts.

## Search and Pagination

**Decision**: Extend `composables/api/repovio-api.ts` User search with existing resource filters. A nonempty query matches
username as a whole OR all name tokens across firstName/lastName, case-insensitively. Empty search adds no name filter.
Retain username/ID ordering, paging, page reset, stale-response protection, and current ability restrictions.

**Rationale**: Current search only matches username. Name-first options should be discoverable by name. Notification
choices currently load at most 100 Users; reuse paginated discovery and preserve selected/configured labels across pages.

**Alternatives considered**: Filtering only loaded choices misses later pages. New endpoints and unbounded User loads
are unnecessary. Reordering the global User list is unrelated.

## API and Data Contracts

**Decision**: Reuse existing nullable User names. Add names to notification recipient projections and an optional nullable
`requestedBy` safe identity on delivery responses; retain `requestedByUsername`. Updated mappings emit explicit nulls
for absent names; parsing tolerates missing new properties in older responses.

**Rationale**: `apps/api/src/modules/auth/dto/user.dto.ts` already exposes safe names; group member queries reuse it.
`libs/schemas/src/api/notifications.ts` has strict ID/username-only recipients. Notification controller/service relation
selects, `notification-delivery.service.ts`, and channel/delivery DTOs must carry names through explicit safe mapping.
Existing requester relations suffice; no persistence migration or historical-name snapshot is required.

**Alternatives considered**: Per-User fetches create request overhead and permission risks. Raw User models expose
unrelated fields. Replacing response fields breaks compatibility. Persisting labels produces stale display data.

## Validation and Workflow

**Decision**: Extend helper/composable tests, notification schema/API tests, and Playwright suites
`user-management.spec.ts`, `user-groups.spec.ts`, and `notifications.spec.ts`; include repository access coverage.

**Rationale**: Helper tests cannot prove projection completeness, selected values, summaries, accessible descriptions,
or confirmation text. Verify complete/partial/null/blank/Unicode/duplicate/long names, profile refresh, English/German,
narrow screens, pagination, stale responses, unchanged IDs, and authorization/secret exclusion.

**Alternatives considered**: Static audits alone cannot prove browser behavior; browser tests alone miss contract drift.

Technical unknowns are resolved from repository sources; no new external framework behavior is assumed. The existing
Codex worktree is reused on `codex/76-user-name-presentation` for issue
[#76](https://github.com/repovio/repovio/issues/76). The PWA issue and Changesets release PR are unrelated.
Base `main` at `19dada5` had successful CI when inspected; this does not validate the unimplemented feature.
