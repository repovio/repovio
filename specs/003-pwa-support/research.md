# PWA Research Decisions

**Date**: 2026-11-09. Scope confirmed: audit existing support and close demonstrated gaps.

## 1. Reuse the Existing Architecture

**Decision**: Keep `@vite-pwa/nuxt`, runtime manifest generation, and `registerType: 'prompt'`.

**Rationale**: `apps/web/nuxt.config.ts` already registers the plugin, precaches static assets, imports the notification
worker, sets `navigateFallback: null`, and supplies no runtime caching rules. The update component already uses
`needRefresh` and `updateServiceWorker(true)`. Replacing these would add risk without a demonstrated requirement.

**Alternatives considered**: A custom worker, automatic updates, or another PWA package. Rejected: unnecessary migration
and potential disruption of existing update/notification behavior.

**Source**: [Official Nuxt integration](https://vite-pwa-org.netlify.app/frameworks/nuxt.html).

## 2. Preserve Native Installation

**Decision**: Use browser-native installation; document platform-specific paths rather than add a custom install banner.

**Rationale**: `beforeinstallprompt` has limited availability and no guaranteed firing time. Its absence does not prove
that installation is impossible or already complete. Custom prompt interception is additional product behavior. Existing
manifest and icon tests are a useful baseline, but real installed launches require device evidence.

**Alternatives considered**: A universal Install button or inferred persisted install status. Rejected: unsupported or
misleading on some browsers and outside the confirmed audit scope.

**Sources**: [MDN installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable),
[MDN install event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event), and the official
Nuxt integration above.

## 3. Preserve the Online Data Boundary

**Decision**: Keep no navigation fallback and no protected API caching. Cold offline launch remains unsupported.

**Rationale**: Installability does not itself require offline operation. The application monitors permission-filtered
repository data; storing such responses introduces authorization and freshness concerns beyond this audit. Inspect
actual generated precaches after authenticated traffic rather than infer safety only from configuration.

**Alternatives considered**: Offline shell, generic offline landing page, cached dashboard, or IndexedDB snapshots.
Deferred: separate product scope and privacy design, not prerequisites for existing installation support.

**Sources**: [MDN installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
and [MDN offline operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).

## 4. Prove Failure Recovery and Controlled Updates

**Decision**: Extend existing production tests around explicit update acceptance, dismissal, activation rejection/retry,
registration failure, loading lifetime, repeated versions, and multiple tabs.

**Rationale**: Existing `apps/web/tests/pwa/pwa.spec.ts` checks a successful update and Later, but does not prove failure
paths or account isolation. The plugin exposes update and registration state. Verify its actual lifecycle before
changing component behavior; a missing test is not evidence of a defect.

**Alternatives considered**: Auto-activation or broad state-management refactoring. Rejected: changes user expectations
and increases scope. Keep existing cache cleanup and notification worker integration.

**Sources**: [Official update guide](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) and official Nuxt
integration above.

## 5. Separate Evidence from Support Claims

**Decision**: Combine deterministic production Playwright tests with manual desktop/Android/iOS installation and
standalone authentication checks. Explicitly record unavailable environments.

**Rationale**: Chromium DevTools installability assertions and mocked APIs cannot prove iOS installation or real OIDC
return behavior. The current suite's test coverage is a repository observation, not a claim that it passes at this head.

**Alternatives considered**: Treating viewport emulation as installed-device evidence or running development mode only.
Rejected: neither exercises browser installation or the production worker lifecycle accurately.

## Resolved Scope and Implementation Readiness

No technical clarification remains. The user selected audit/gap closure rather than offline usage or new installation
UX, then explicitly requested issue creation and task generation.
[#64](https://github.com/repovio/repovio/issues/64) now owns the scope, resolving the issue-binding gate;
[#26](https://github.com/repovio/repovio/issues/26) records prior PWA work. [Tasks](tasks.md) are generated separately.
No application changes are included.
