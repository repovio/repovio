# Tasks: Harden Container Images

**Issue**: [Arcane vulnerability triage](https://github.com/repovio/repovio/issues/105)

## User Story 1 - Run images with patched dependencies

- [x] T001 [US1] Remove npm and npx from `apps/{api,web,website}/Dockerfile` runtime stages, upgrade Apprise in `apps/api/Dockerfile`, and update Hono in `pnpm-workspace.yaml` and `pnpm-lock.yaml`.
- [x] T002 [US1] Build the API, web, and website containers. Confirm the final images omit npm and npx and the API includes Apprise 1.11.0 and Hono 4.13.16. Exercise application entrypoints and rescan built images.

## Validation evidence

- Built the API, web, and website runtime images from the patched branch for Linux arm64.
- Confirmed the API migration and health endpoint against disposable PostgreSQL; the web and website returned HTTP 200.
- Confirmed Hono 4.13.16, Apprise 1.11.0 and a successful loopback notification, and removal of npm and npx.
- Verified the frozen pnpm lockfile, eight dependency regression tests, and 31 MCP and notification tests.
- Trivy 0.76.2 reported none of the 63 issue findings. Its database still reports 464 Debian findings in the API image
  and 234 each in the web and website images, with no fixed versions reported for those OS findings.
