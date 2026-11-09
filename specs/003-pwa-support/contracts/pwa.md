# PWA Acceptance Contracts

## Existing Public HTTP Surface

| Resource                                  | Contract                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET /manifest.webmanifest`               | `application/manifest+json`; `Cache-Control: no-store`; validated runtime branding |
| Manifest icons                            | Reachable PNGs with declared dimensions; regular icons never implicitly maskable   |
| `GET /api/branding` and configured assets | Preserve current public contracts; no private paths or protected data              |
| `/sw.js`                                  | Generated production worker; prompt-based update; no protected runtime cache       |
| `/notification-sw.js`                     | Preserve existing worker import and notification behavior                          |

No new REST endpoints or shared schemas are needed. Reverse proxies must continue directing public branding routes and
manifest to the web service while `/api/v1` targets the API service.

## Update Interaction

- Waiting worker: one accessible localized prompt; Later dismisses without activating it.
- Update: one activation request at a time; loading persists throughout the awaited operation.
- Failure: localized error, no uncontrolled reload, retry remains available.
- Success: accepted worker becomes active; existing route remains valid; no repeated reload loop.
- Multiple tabs: characterize plugin behavior; no tab may initiate activation before a user accepts an update.
- A tab may react to a worker accepted in another tab; do not promise independent per-tab worker versions.

## Privacy and Connectivity

Issue representative authenticated requests, logout, and authenticate as a differently authorized user. Cache Storage
must not contain API/authentication responses, realtime traffic, runtime branding, or manifest responses. The second
user must receive only their authorized online responses. Never record tokens or real protected payloads in artifacts.

With networking disabled, a previously open screen must not imply that displayed status is newly fetched. Cold offline
navigation may fail because no navigation fallback is configured. Do not add cached HTML or API fallback to satisfy an
installation test. Verify reconnection with fresh authorized requests under existing application behavior.

## Platform and Presentation Evidence

Automate Chromium production behavior with Playwright. Manually record desktop Chromium installation, Android Chromium
installation/standalone launch, and iOS Safari Add to Home Screen/standalone launch. Include local sign-in and configured
OIDC callback/deep-link behavior. Emulation alone is not installation or real-device evidence.

Verify affected UI at 390 and 1440 CSS pixels in English and German, keyboard navigation, visible focus, no overflow,
and readable failure text. Browser-controlled install UI is allowed to differ by platform.
