# Handbook feature coverage

Both version columns refer to the exact application commits in `versions.json`. All listed destinations exist in both
recorded revisions; release-specific branding and browser-storage differences remain versioned.

| Feature / controls                                                                                                              | Handbook page          | v1.0        | next    |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- | ------- |
| Repovio overview: Read-only workflow runs, repository work and security alerts across your providers.                           | `overview`             | Covered     | Covered |
| Repovio user guide: Start using Repovio to view repositories, workflow status, and required approval actions.                   | `installation`         | Covered     | Covered |
| First-run setup: Create the first local administrator and understand one-time setup.                                            | `setup`                | Covered     | Covered |
| Sign in: Use local credentials or OpenID Connect and safely end a session.                                                      | `sign-in`              | Covered     | Covered |
| Navigation: Find application destinations, status, personal settings, and version information.                                  | `navigation`           | Covered     | Covered |
| Global search: Search destinations, repositories, provider accounts, and workflow runs.                                         | `search`               | Covered     | Covered |
| Deploying Repovio: Production deployment, TLS proxy, backup, restore, upgrade, and rollback guidance for Repovio.               | `deployment`           | Covered     | Covered |
| Dashboard: Read current workflow health, work summaries, and historical charts.                                                 | `guide-dashboard`      | Covered     | Covered |
| All runs: Search, filter, and inspect retained workflow history without changing provider resources.                            | `workflow-runs`        | Covered     | Covered |
| Awaiting approval: Find provider approval gates and open their external approval screens.                                       | `awaiting-approval`    | Covered     | Covered |
| Needs attention: Investigate workflow contexts whose newest completed run failed.                                               | `needs-attention`      | Covered     | Covered |
| Issues: Browse synchronized issues, filters, and read-only details.                                                             | `guide-issues`         | Covered     | Covered |
| Pull requests: Browse synchronized pull requests, filters, and read-only details.                                               | `guide-pull-requests`  | Covered     | Covered |
| Dependency alerts: Review dependency alerts with repository-scoped management access.                                           | `alerts-dependencies`  | Covered     | Covered |
| Code scanning alerts: Review code scanning alerts with repository-scoped management access.                                     | `alerts-code`          | Covered     | Covered |
| Secret scanning alerts: Review secret scanning alerts with repository-scoped management access.                                 | `alerts-secrets`       | Covered     | Covered |
| Repositories: Track repositories, inspect activity, and configure local synchronization and access.                             | `repositories`         | Covered     | Covered |
| Repository webhook setup: Configure signed read-only webhooks for GitHub, GitLab, Forgejo, and Gitea repositories.              | `provider-webhooks`    | Covered     | Covered |
| Repository synchronization jobs: Monitor and manually start Repovio repository synchronization jobs.                            | `guide-jobs`           | Covered     | Covered |
| Notification channels: Create global notification destinations, subscribe to events, and test delivery.                         | `notifications`        | Covered     | Covered |
| Event subscriptions: Choose events, repository filters, and workflow patterns inside a channel.                                 | `notification-rules`   | Covered     | Covered |
| Delivery history: Inspect notification outcomes and safe per-attempt delivery details.                                          | `notification-history` | Covered     | Covered |
| Browser push: Enable notifications per device and understand server and browser requirements.                                   | `browser-push`         | Covered     | Covered |
| Provider accounts: Connect and administer encrypted, read-only provider credentials.                                            | `provider-accounts`    | Covered     | Covered |
| Provider OAuth setup: Register OAuth applications and configure read-only provider authentication for Repovio.                  | `provider-oauth`       | Covered     | Covered |
| GitHub App registration, encrypted configuration, installation connections, central webhooks, rotation and troubleshooting.     | `github-app`           | Unavailable | Covered |
| Users: Review local and identity-managed users, roles, deletion, and MCP token administration.                                  | `users`                | Covered     | Covered |
| Settings: Find personal settings and administrator-only authentication and system controls.                                     | `settings`             | Covered     | Covered |
| Profile: Change local account names and username with current-password verification.                                            | `profile`              | Covered     | Covered |
| Avatar: Upload, import, crop, or remove your profile picture.                                                                   | `avatar`               | Covered     | Covered |
| Password: Change a local password and understand session invalidation and recovery.                                             | `password`             | Covered     | Covered |
| Language: Choose an application language and distinguish it from documentation languages.                                       | `language`             | Covered     | Covered |
| Appearance: Choose system, light, or dark presentation without changing repository data.                                        | `appearance`           | Covered     | Covered |
| MCP access: Connect header-configurable MCP clients to Repovio's permission-aware read-only workflow tools.                     | `mcp`                  | Covered     | Covered |
| Authentication: Configure local authentication, optional OpenID Connect sign-in, and account recovery.                          | `authentication`       | Covered     | Covered |
| System settings: Configure independent retention policies and the default date/time format.                                     | `settings-system`      | Covered     | Covered |
| Interface localization: Supported interface languages, fallback behavior, and the process for maintaining Repovio translations. | `localization`         | Covered     | Covered |

## Inventory sources

- Application route pages and reusable feature dialogs/cards, including detail, list, search, and global layout
  controls.
- Protected API authorization for notifications, security alerts, repositories, users, authentication, and MCP.
- Repository settings: three retention overrides, metadata refresh, durable synchronization, allow/deny patterns,
  memberships, webhook secrets.
- Notification channel dialog: six transports, destination replacement, event/repository/workflow filters, preview
  states, test, toggle, deletion.
- Settings: local/OIDC restrictions, avatar import/crop/remove, session invalidation, token create/revoke, OIDC secret
  management and connection check.
- Lists: filters, sorting, pagination, column visibility/order/pinning where implemented; loading, empty, partial, error
  and retry states.

English is the editorial reference. Translate complete content and preserve commands, identifiers, links, and explicit
heading anchors. Validate this inventory whenever the reviewed application revision changes; a matching route alone does
not prove functional coverage.

## Function-level review

Every row applies to both recorded versions. Component paths are relative to the application web source unless an API
service/controller is named. Each linked heading is also present in the matching v1.0 handbook.

| Function and controls                                                                    | Source ownership                                                          | Handbook heading                                                                    | Versions   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| Setup names, username, password confirmation, initialized conflict, sign-in result       | `pages/auth/setup.vue`                                                    | [setup](en/docs/next/setup.md#create-the-administrator)                             | v1.0, next |
| Local credentials, OIDC availability/callback failures, sign out                         | `pages/auth/signin.vue; components/layout/user-menu.vue`                  | [sign-in](en/docs/next/sign-in.md#openid-connect)                                   | v1.0, next |
| Sidebar, collapsed/mobile destinations, status, version/changelog/update indicator       | `components/layout/sidebar.vue; api-status-bar.vue; sidebar-footer.vue`   | [navigation](en/docs/next/navigation.md#sidebar)                                    | v1.0, next |
| Debounced search, minimum query, grouped/partial results, resource opening               | `composables/app/global-search.ts`                                        | [search](en/docs/next/search.md#search-the-installation)                            | v1.0, next |
| Command palette, administrator add shortcuts, shortcut help, reset query                 | `components/layout/command-palette.vue; user-menu.vue`                    | [appearance](en/docs/next/appearance.md#layout-and-keyboard-controls)               | v1.0, next |
| Persisted columns, ordering/pinning, pagination, dashboard presets                       | `composables/api/table.ts`                                                | [navigation](en/docs/next/navigation.md#table-controls)                             | v1.0, next |
| Current/historical dashboard requests, 7/30/90 days, six metrics, work/alert cards       | `pages/index.vue; modules/dashboard/summary-cards.vue`                    | [guide-dashboard](en/docs/next/guide-dashboard.md#summary-and-navigation)           | v1.0, next |
| Run filters/status/duration, columns, no text search or internal log viewer              | `modules/workflow-runs/table-page.vue; pages/workflow-runs.vue`           | [workflow-runs](en/docs/next/workflow-runs.md#browse-retained-runs)                 | v1.0, next |
| Failure context selection, branch/change association, search/timestamps                  | `pages/workflow-runs-needs-attention.vue; workflow-runs-query.service.ts` | [needs-attention](en/docs/next/needs-attention.md#current-failures)                 | v1.0, next |
| Approval search, context links, external provider action, observed-state delay           | `pages/workflows/awaiting-approval.vue`                                   | [awaiting-approval](en/docs/next/awaiting-approval.md#complete-the-provider-action) | v1.0, next |
| Issue summaries, people/milestone/labels/date filters, safe details                      | `modules/work-items/table-page.vue; detail-page.vue`                      | [guide-issues](en/docs/next/guide-issues.md#browse-and-filter)                      | v1.0, next |
| PR draft/workflow/approval filters, branches, aggregate precedence, safe details         | `modules/work-items/table-page.vue; detail-page.vue`                      | [guide-pull-requests](en/docs/next/guide-pull-requests.md#inspect-details)          | v1.0, next |
| Dependency ecosystem/package/manifest filters, severity/state, detail                    | `modules/security-alerts/table-page.vue; detail-page.vue`                 | [alerts-dependencies](en/docs/next/alerts-dependencies.md#review-findings)          | v1.0, next |
| Code scanner/rule/path filters, severity/state, safe detail                              | `modules/security-alerts/table-page.vue; detail-page.vue`                 | [alerts-code](en/docs/next/alerts-code.md#review-findings)                          | v1.0, next |
| Secret type/provider filters, no raw secrets, availability/permissions                   | `security-alerts-query.service.ts; security-alert-sync.service.ts`        | [alerts-secrets](en/docs/next/alerts-secrets.md#access-and-provider-support)        | v1.0, next |
| Repository discovery/multi-add, partial failure, enabled state, stable ID/rename         | `modules/repositories/add-dialog.vue; pages/repositories/index.vue`       | [repositories](en/docs/next/repositories.md#add-and-maintain-tracking)              | v1.0, next |
| Repository activity, age/interval, progress, metadata refresh/manual read                | `pages/repositories/[id].vue; details/sync-status-card.vue`               | [repositories](en/docs/next/repositories.md#browse-and-open-details)                | v1.0, next |
| Three retention overrides and fallback, workflow ALLOW/DENY globs                        | `details/general-card.vue; workflow-filters-card.vue`                     | [repositories](en/docs/next/repositories.md#retention-filters-and-memberships)      | v1.0, next |
| Add/change/remove Viewer/Manager memberships, administrator exclusion                    | `details/members-card.vue`                                                | [repositories](en/docs/next/repositories.md#retention-filters-and-memberships)      | v1.0, next |
| Webhook generate/reveal/copy/save, rotate/remove confirmations, missing public URL       | `details/webhook-card.vue`                                                | [repositories](en/docs/next/repositories.md#webhooks-and-failures)                  | v1.0, next |
| Jobs scopes/states/timing/progress/errors, five-second refresh, Run/Retry/Run all        | `pages/jobs.vue`                                                          | [guide-jobs](en/docs/next/guide-jobs.md#start-or-retry-synchronization)             | v1.0, next |
| Channel global administrator access, list/filter, six transport forms                    | `pages/notifications/index.vue; modules/notifications/channel-dialog.vue` | [notifications](en/docs/next/notifications.md#create-a-destination)                 | v1.0, next |
| Destination preservation/replacement, immutable type, test/toggle/immediate deletion     | `modules/notifications/channel-dialog.vue; notifications.service.ts`      | [notifications](en/docs/next/notifications.md#edit-test-and-remove)                 | v1.0, next |
| Sixteen event types, repository restrictions, workflow-name patterns                     | `modules/notifications/channel-dialog.vue`                                | [notification-rules](en/docs/next/notification-rules.md#configure-subscriptions)    | v1.0, next |
| Workflow-only preview prerequisite, max 20, no data/sync failure/partial data            | `notifications.service.ts; modules/notifications/channel-dialog.vue`      | [notification-rules](en/docs/next/notification-rules.md#preview-matches)            | v1.0, next |
| Push availability, VAPID setup, permissions, subscribe/unsubscribe current device        | `composables/app/browser-push.ts`                                         | [browser-push](en/docs/next/browser-push.md#enable-or-disable-this-device)          | v1.0, next |
| History kind/status/filter, per-device attempts, no manual retry/cancel                  | `pages/notifications/history.vue; delivery-details-dialog.vue`            | [notification-history](en/docs/next/notification-history.md#review-deliveries)      | v1.0, next |
| Provider options loading, PAT verify, OAuth redirect/results, base URLs                  | `modules/providers/add-dialog.vue`                                        | [provider-accounts](en/docs/next/provider-accounts.md#connect-a-provider)           | v1.0, next |
| Provider enable/disable/immediate deletion and pending conflicting actions               | `pages/admin/providers.vue`                                               | [provider-accounts](en/docs/next/provider-accounts.md#maintain-connections)         | v1.0, next |
| Users role/origin filters, API-only provisioning, no self-delete, immediate deletion     | `pages/admin/users.vue; auth/users.controller.ts`                         | [users](en/docs/next/users.md#provisioning-and-deletion)                            | v1.0, next |
| Administrator list/revoke user MCP tokens, no plaintext or create-other-user action      | `modules/mcp/user-token-dialog.vue`                                       | [users](en/docs/next/users.md#user-mcp-tokens)                                      | v1.0, next |
| Settings tab permissions and OIDC-managed local-profile restrictions                     | `pages/admin/settings.vue; settings/index.vue`                            | [settings](en/docs/next/settings.md#settings-tabs)                                  | v1.0, next |
| Names/username/current password, uniqueness and verification failures                    | `modules/settings/profile-card.vue`                                       | [profile](en/docs/next/profile.md#edit-a-local-profile)                             | v1.0, next |
| Password length/confirmation, current token replacement and other-session invalidation   | `modules/settings/password-card.vue; auth.service.ts`                     | [password](en/docs/next/password.md#change-a-password)                              | v1.0, next |
| Avatar upload/import, decode/crop/save/remove, normalization and failure states          | `modules/settings/avatar-card.vue; avatar-crop-dialog.vue`                | [avatar](en/docs/next/avatar.md#choose-an-image)                                    | v1.0, next |
| Locale selection, cookie persistence, unsupported fallback, provider data unchanged      | `composables/app/locales.ts; nuxt.config.ts`                              | [language](en/docs/next/language.md#application-preference)                         | v1.0, next |
| System/light/dark selection and browser-local preference                                 | `components/layout/user-menu.vue`                                         | [appearance](en/docs/next/appearance.md#color-mode)                                 | v1.0, next |
| MCP own-token name/expiry/copy-once/create/revoke/empty/load states                      | `modules/mcp/token-management-card.vue`                                   | [mcp](en/docs/next/mcp.md#manage-token-states)                                      | v1.0, next |
| OIDC enable/issuer/client/scopes/groups, role precedence, unmatched policy, HTTP warning | `modules/settings/oidc-card.vue; oidc.service.ts`                         | [authentication](en/docs/next/authentication.md#openid-connect-single-sign-on)      | v1.0, next |
| OIDC callback copy, secret preserve/replace/clear, observed groups, save-before-check    | `modules/settings/oidc-card.vue`                                          | [authentication](en/docs/next/authentication.md#openid-connect-single-sign-on)      | v1.0, next |
| Independent 1–3650-day defaults, date/time preview, load/retry/save states               | `pages/admin/settings/system.vue`                                         | [settings-system](en/docs/next/settings-system.md#retention-defaults)               | v1.0, next |

## API reference drafts

The API access and static reference pages exist only in `next`. Their application source is reviewed for v2.0 as
recorded below. Released versions without an API snapshot remain supported. Contract identifiers and generated
descriptions retain the language of the authoritative OpenAPI contract.

## GitHub App support in v2.0

- `next`: [GitHub App setup](en/docs/next/github-app.md), covering App registration, read permissions, central webhooks,
  installation connections, rotation and troubleshooting in all 13 locales.
- Application implementation: [repovio/repovio#22](https://github.com/repovio/repovio/issues/22); documentation task:
  [#6](https://github.com/repovio/docs/issues/6).
- Reviewed feature source: application merge revision `ac6b7ca637807f55fd5daa20780886b474a0ad3b` from
  [repovio/repovio#24](https://github.com/repovio/repovio/pull/24). The feature ships in application v2.0; historical
  `v1.0` does not include it.

The next handbook also covers local account creation, administrative password resets, local access groups, and additive
repository group grants on the Users, Repositories, Authentication, Password, and Setup pages. Installation includes
complete local-account and Authentik Compose examples. These additions do not alter the immutable v1.0 archive.

## Unpublished operations handbook updates

The `next` handbook additionally contains `postgresql-18-upgrade`: the PostgreSQL 17-to-18 dump/restore procedure,
separate-volume requirements, verification, and recovery limits. Its branding guide explicitly separates the rename on
PostgreSQL 17 from the later major upgrade. Its localization guide also covers sign-in/setup controls and local flag
assets. These updates are editorial drafts for all 13 documentation languages; the immutable `v1.0` archive remains
unchanged and does not gain these instructions retroactively.

## v2.0 release review

The `next` handbook is reviewed against application release `repovio@2.0.0` at
`dd939a1aee7428e517e74e5bc12c65302a521816`. Its API access routes, local account and group permissions, GitHub App
setup, PostgreSQL 18 Compose examples, and upgrade procedures match that release. The API snapshot is exported from this
exact application revision during promotion. The working-tree publication guard is removed following this review; `next`
remains unpublished until the normal archive, screenshot, and website validation steps complete.

## Additional OIDC provider guides

The `next` Authentication and Installation pages cover Authentik, Keycloak, Microsoft Entra ID, and Auth0 in all 13
languages. The Keycloak example includes a pinned production container, a separate PostgreSQL database, an internal
readiness check, TLS proxy configuration, bootstrap administration, and backup/recovery instructions. Provider guides
distinguish Keycloak group names, Entra group object IDs and denied overage markers, and Auth0 administratively managed
namespaced ID-token claims. Existing-provider deployments reuse the local-account stack with the public callback URL.
These editorial updates leave every published archive and the single-provider OIDC runtime unchanged.
