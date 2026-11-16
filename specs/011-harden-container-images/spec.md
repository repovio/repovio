# Feature Specification: Harden Container Images

**Branch**: `105-triage-container-image-vulnerabilities-from-arcane`
**Issue**: [Arcane vulnerability triage](https://github.com/repovio/repovio/issues/105)

## User Scenarios & Testing

### User Story 1 - Run images with patched dependencies (Priority: P1)

An operator can rebuild and run the API, web, and website images with the Arcane-reported packages removed or fixed.

**Independent test**: Build the API, web, and website containers. Confirm the final images omit npm and npx and the API includes Apprise 1.11.0 and Hono 4.13.16. Exercise application entrypoints and rescan built images.

### Edge Cases

Package findings may originate in the Node base image or application dependencies. Check both sources in the final image.

## Requirements

### Functional Requirements

- **FR-001**: Restrict production images to application runtime packages and update the API’s Apprise and Hono releases.
- **FR-002**: Keep the existing API/web version coupling, migration command, notification command, health checks, and website runtime user. Preserve the pinned toolchain and provider read-only behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Rebuilt runtime images pass their startup checks and a vulnerability scan confirms the status of the reported findings.
