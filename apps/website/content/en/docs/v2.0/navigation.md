---
title: 'Navigation'
description: 'Find application destinations, status, personal settings, and version information.'
---

<a id="sidebar"></a>

## Sidebar

**Overview** contains Dashboard, Workflow runs, Issues, Pull requests, and supported Security alerts. **Operations**
contains Repositories, Jobs, and Notifications. **Administration** contains Provider accounts, Users, and Settings for
system administrators. Workflow runs expands to All runs, Awaiting approval, and Needs attention; notification
navigation exposes Channels and, for administrators, Delivery history.

The sidebar only offers destinations your role can access. Security alerts require management permission. Collapsing the
sidebar preserves labeled destinations. On narrow screens, use the navigation control to open the sidebar. The handbook
documents every role area even when your account cannot see it.

<a id="status-and-search"></a>

## Status and search

Use [Search](/docs/v2.0/search) in the app bar to find destinations and synchronized resources. The status bar reports
API connectivity, synchronization activity, and running workflow counts. Its running-workflow counter opens
[Jobs](/docs/v2.0/guide-jobs); synchronization activity can include item progress. Connection recovery refreshes status.
A disconnected indicator means live updates may be stale; inspect the API and retry before relying on displayed counts.

<a id="user-menu-and-footer"></a>

## User menu and footer

The user menu opens personal [Settings](/docs/v2.0/settings), language and appearance controls, and sign out. The footer
links to the project and handbook. Selecting the displayed version opens the changelog dialog. Its release notes and
update indicator help identify an available release; applying an upgrade remains a deployment operation. Provider links
open external resources. Actions there require the provider's own permissions and are outside Repovio.

<a id="table-controls"></a>

## Shared table controls

Where offered, table options configure column visibility, ordering, and pinning; the actions column stays pinned right.
Options persist per table in the browser. Pagination uses the page query. Workflow, issue, pull-request, and alert lists
start at 25 rows; Jobs, Repositories, Providers, Users, Channels, and Delivery history start at 10. Filter controls can
be disabled while their options load. Clear dashboard presets or change filters to return to your own query. These
controls change the local view, never provider records.
