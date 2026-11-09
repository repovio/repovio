# Feature Specification: PWA Support Audit and Gap Closure

**Branch**: `codex/pwa-support-plan` | **Created**: 2026-11-09 | **Status**: Implemented and locally verified; native-device/OIDC evidence unavailable

**Request**: Audit existing PWA support and close gaps, confirmed by the user in this chat.

**Issue**: [#64: Audit existing PWA support and close verified gaps](https://github.com/repovio/repovio/issues/64).
Prior runtime-branding work: [#26](https://github.com/repovio/repovio/issues/26). The user authorized issue creation, task generation, and subsequent implementation, with specifications committed first.
Native-device and OIDC evidence remain unavailable as confirmed by the user.

## Existing Behavior

The application already exposes a runtime manifest, validated installation icons, standalone identity, a registered
service worker, static asset precaching, and a localized update prompt. The production browser suite checks Chromium
installability and successful update activation. This feature extends that baseline rather than replacing it.

## User Scenarios and Testing

### Story 1: Install and launch the existing application (P1)

A user installs Repovio through supported browser controls and launches the same origin in standalone mode.

1. Default and customized branding produce valid manifest metadata and reachable installation icons.
2. An authenticated standalone launch and a deep link preserve existing authorization and routing.
3. Unsupported installation controls do not prevent normal browser use.
4. Installation guidance accurately describes desktop Chromium, Android Chromium, and iOS Safari behavior.

### Story 2: Receive updates without unexpected interruption (P1)

A user decides when a waiting service worker activates.

1. A waiting update produces the existing localized prompt; Later leaves the current session usable.
2. Update remains loading until activation settles; failed activation reports an error and allows retry.
3. Registration failure leaves the online application usable and does not produce an unhandled rejection.
4. A new release and an older open tab do not create a reload loop or silently force activation.

### Story 3: Keep protected information outside service-worker caches (P1)

A user can sign out or switch accounts without retrieving protected responses from service-worker caches.

1. Protected API, authentication, branding, manifest, and realtime responses stay outside Cache Storage.
2. Network interruption does not fabricate current repository status or turn cached data into an authorized response.
3. Logout and account switching preserve existing authentication and repository access checks.
4. A cold offline navigation remains unsupported; any user guidance describes this boundary explicitly.

## Requirements

- **FR-001**: Inventory existing behavior and classify findings as verified, missing coverage, confirmed defect, or
  platform limitation. Change application behavior only for a reproduced defect within these scenarios.
- **FR-002**: Preserve runtime branding, manifest identity `/`, scope `/`, start URL `/`, and existing icon validation.
- **FR-003**: Preserve prompt-based activation, dismissal, retry, and request-lifetime loading behavior.
- **FR-004**: Prove cache exclusion using authenticated requests and cache inspection, including logout/account switch.
- **FR-005**: Extend focused automated coverage for update failure, registration failure, and repeated update cycles.
- **FR-006**: Document supported installation paths and record manual device evidence separately from browser emulation.
- **FR-007**: Verify affected UI in English and German, keyboard use, and narrow and desktop viewports.
- **FR-008**: Preserve existing notification worker imports and online OIDC/local sign-in behavior.

## Boundaries and Success Criteria

No offline repository data, offline app shell, push subscription feature, custom install banner, database changes,
provider writes, toolchain updates, website work, deployment, or release execution.

Success means all scenarios have reproducible evidence or an explicitly recorded platform limitation, no protected
responses enter Cache Storage in the test matrix, update failures are recoverable, and no forced reload occurs before
user acceptance. Unsupported cold offline startup is documented rather than treated as a missing feature.
