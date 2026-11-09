---
title: 'Notification channels'
description: 'Create global notification destinations, subscribe to events, and test delivery.'
---

<a id="access-and-channel-list"></a>

## Access and channel list

Open **Operations → Notifications → Channels**. Channels are global Repovio configuration, not repository-owned manager
configuration. System administrators create, edit, test, enable/disable, and delete channels. Repository-manager status
does not grant channel administration. The table shows name, type, safe destination metadata, subscribed events, enabled
state, and updated time; use type/enabled filters, sorting, column controls, and pagination.

<a id="create-a-destination"></a>

## Create a destination

The create/edit dialog has four steps: **Name and type**, **Destination**, **Events**, and **Preview and review**. Set the
name, type, and enabled state; configure the destination; choose event subscriptions and filters; then review the summary
and optional workflow preview before saving. Back/Next preserves the draft. Destination credentials are hidden in the review.

Choose **Add channel**, enter a name, select a type, and configure the destination:

- **Email:** SMTP host/port, transport security, sender, optional authentication, and recipients.
- **Gotify:** server URL, application token, and priority.
- **ntfy:** server, topic, optional authentication/token, and priority.
- **Discord:** webhook destination.
- **Custom Apprise URL:** a supported Apprise service URL.
- **Browser push:** recipient users; each recipient must enable [their device](/docs/next/browser-push).

Configure [event subscriptions and preview](/docs/next/notification-rules) in the same dialog. Save and wait for the
request before closing. Validation or save failures leave the form available for correction.

<a id="edit-test-and-remove"></a>

## Edit, test, and remove

The destination is encrypted at rest. You can save it, but you cannot read it back. Editing preserves its stored
credentials unless **Replace destination configuration** is selected. Channel type cannot be changed; create a new
channel instead. A migrated channel marked **Requires reconfiguration** cannot be reenabled until its destination is
replaced. Browser-push channels use user subscriptions and reject a transport destination secret.

Use the row test action to send a real notification to the configured destination; it does not modify provider data.
Review the result in [Delivery history](/docs/next/notification-history). Disable a channel to pause delivery, or delete
it when no longer needed. Deletion executes immediately. Never paste credentials into screenshots or support reports.

Email, Gotify, ntfy, Discord, and custom destinations use the API's bundled Apprise CLI; a separate Apprise server is
not required. If a request fails, retry after API recovery. An empty list means no visible configured channels match
filters; clear the filters or create a channel. Delivery failure details contain sanitized errors only.
