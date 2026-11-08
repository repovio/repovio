---
title: 'Browser push'
description: 'Enable notifications per device and understand server and browser requirements.'
---

<a id="server-requirements"></a>

## Server requirements

Browser push is a native transport and does not use Apprise. The deployment operator configures all three settings:

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Generate a VAPID key pair with `npx web-push generate-vapid-keys`. The subject is a `mailto:` or `https:` URI. Keep the
private key secret. Without the complete configuration, browser push is shown as unavailable. Use a secure browser
context and a browser supporting service workers and Push API.

<a id="enable-or-disable-this-device"></a>

## Enable or disable this device

Use **Enable on this device** and grant the browser's notification permission when requested. The subscription belongs
to the current user and browser. An administrator selects recipient users in a browser-push channel; each recipient
needs an enabled device. Refusing browser permission prevents subscription; adjust the site's browser permission and
retry if desired. Check the availability/device count and reported errors before sending a test.

Disabling push removes this device's subscription, not other devices. Endpoints and keys are encrypted and deduplicated
with a non-secret fingerprint. HTTP 404/410 responses remove expired subscriptions. An unavailable browser, missing
server configuration, denied permission, or subscription request failure requires the corresponding cause to be fixed;
refreshing alone cannot grant browser permission. See [Delivery history](/docs/next/notification-history) for attempts.
