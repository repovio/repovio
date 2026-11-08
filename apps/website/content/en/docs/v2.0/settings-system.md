---
title: 'System settings'
description: 'Configure independent retention policies and the default date/time format.'
---

<a id="administrator-access"></a>

## Administrator access

Only system administrators can open **Settings → System**. Loading shows a skeleton; a failed load provides an error and
retry instead of editable defaults inferred from missing data. Wait for the settings request before saving changes.

<a id="retention-defaults"></a>

## Retention defaults

Set separate default retention periods for workflow runs, issues, and pull requests. Each value must be from 1 to 3650
days. A repository can override each corresponding value independently; an empty repository override restores that
system default. Retention affects locally stored history, not provider-side records. Shortening retention can remove
older stored data, so check reporting and investigation requirements first.

Repository retention and tracking controls are documented in [Repositories](/docs/v2.0/repositories). A missing
historical row can reflect retention rather than a failed provider synchronization.

<a id="datetime-formatting"></a>

## Date/time formatting

Set the default date/time format and inspect its live preview before saving. Locale selection still controls translated
interface text and locale-sensitive formatting. Save once; success and validation/API failures are reported separately.
Retry after correction or API recovery. A formatting preference never changes original provider timestamps.
