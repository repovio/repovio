# Research: Simplify Notifications Navigation

## Shared destination ownership

**Decision**: Replace the notification destination array with one channel destination in
`apps/web/app/composables/app/navigation-items.ts`.

**Rationale**: The current composable produces both sidebar items and flat navigation search items. One definition avoids
leaving a second history entry in search or changing only one navigation surface. `toMenuItem` retains accessible labels.

**Alternatives considered**: Hiding sidebar children with CSS leaves keyboard/search destinations and an unnecessary
trigger. A separate shell-specific link duplicates route and active-state logic.

## Administrative history entry points

**Decision**: Keep the channel toolbar link; remove the navbar popover's administrative history link and the shared
navigation history destination. Preserve `/notifications/history` and its current authorization.

**Rationale**: The user explicitly wants history reached only through the toolbar. The popover currently has another
history link at `apps/web/app/components/modules/notifications/navbar-popover.vue`; sidebar-only removal is insufficient.
Personal recent notifications in that popover are a separate feature.

**Alternatives considered**: Keeping the popover link violates toolbar-only discovery. Removing or redirecting the history
route breaks bookmarks and exceeds the navigation request.

## Active state and permissions

**Decision**: Use the existing prefix-aware `isActive('/notifications')`; keep current channel visibility and
administrator-only history toolbar/route checks.

**Rationale**: Channels and history belong to one section, including direct refresh. Visibility changes are not requested.

**Alternatives considered**: Exact-only matching leaves the sidebar inactive on history; hiding Notifications from
non-administrators removes existing channel access.

## Regression evidence

**Decision**: Extend the existing Playwright notification/navigation tests for direct links, toolbar navigation, popover
absence, locale coverage, role coverage, and desktop/mobile/collapsed rendering.

**Rationale**: Existing `notifications.spec.ts` expects an expanded Notifications group and Channels child, then navigates
to history through that child. Those assertions must change while channel forms and delivery details remain covered.

**Alternatives considered**: Lint/types alone cannot prove the visible menu, active styling, keyboard behavior, or toolbar.

## Resolution

All design questions resolved from repository code and the user's comment. No new library usage or external API facts
required. Active GitHub Issue association is deferred to the issue workflow; it is not permission to create an issue.
