---
title: 'Global search'
description: 'Search destinations, repositories, provider accounts, and workflow runs.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="search-the-installation"></a>

## Search the installation

Open search from the app bar or use the displayed keyboard shortcut. Enter at least two characters. Results are grouped
into navigation destinations, repositories, provider accounts, and workflow runs. Navigation matches use the translated
labels of destinations your account can access; resource results use synchronized provider names.

Move through results with the keyboard or select one with the pointer. Repository and provider-account matches open the
corresponding Repovio view; workflow matches open the provider run URL. Press **Escape** to close search and return to
the previous page. Search does not perform provider-side discovery or start synchronization.

<a id="access-and-failure-states"></a>

## Access and failure states

Resource search uses the current user's repository permissions. Provider-account results are limited to administrators.
No results can mean a short query, no matching retained records, or insufficient membership. Try a more specific name
and inspect the repository/job if synchronized data is missing. Loading is shown while a query runs. On a request error,
retry the query after API connectivity recovers. Search never reveals provider tokens or notification credentials.
