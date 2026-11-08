---
title: 'Delivery history'
description: 'Inspect notification outcomes and safe per-attempt delivery details.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="review-deliveries"></a>

## Review deliveries

Only system administrators can open **Notifications → Delivery history**. The table distinguishes event deliveries from
tests and shows event type, repository, subject/provider link, channel, state, attempt count, next attempt, and
sanitized final error. Filter by kind/status and use sorting, column controls, and pagination.

Open a delivery for its subject, requester when present, channel, status, and per-attempt timestamp, device label, and
error. Secrets, raw transport destinations, and provider credentials are never returned. Browser-push deliveries can
contain attempts for separate subscribed devices.

<a id="interpret-outcomes"></a>

## Interpret outcomes

Pending/retry timing describes durable delivery work, not a provider workflow queue. A successful attempt confirms the
transport accepted the delivery; a failure needs investigation of the channel configuration and destination service.
There are no rerun, cancel, or manual retry actions in this history view. Correct the
[channel](/docs/v1.0/notifications) and use its test action to verify configuration.

An empty table can reflect filters or no retained deliveries. A failed list/detail request is displayed separately;
retry after recovery. Initial synchronization may intentionally produce no lifecycle deliveries. The subject's external
link opens provider context without giving Repovio write access.
