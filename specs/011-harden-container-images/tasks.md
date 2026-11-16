# Tasks: Harden Container Images

**Issue**: [Arcane vulnerability triage](https://github.com/repovio/repovio/issues/105)

## User Story 1 - Run images with patched dependencies

- [ ] T001 [US1] Remove npm and npx from `apps/{api,web,website}/Dockerfile` runtime stages, upgrade Apprise in `apps/api/Dockerfile`, and update Hono in `pnpm-workspace.yaml` and `pnpm-lock.yaml`.
- [ ] T002 [US1] Build the API, web, and website containers. Confirm the final images omit npm and npx and the API includes Apprise 1.11.0 and Hono 4.13.16. Exercise application entrypoints and rescan built images.
