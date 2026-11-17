# Implementation Plan: Update Dependencies

## Summary

Prioritize Nuxt and node-forge security fixes, upgrade compatible packages across the workspace, and resolve outstanding
Dependabot PRs. Follow with the stable major migrations below.

## Technical Context

- **Toolchain:** Node.js 26.13.0, pnpm 11.28.9, current TypeScript aliases, and the existing release-age policy.
- **Affected projects:** API, web, website, schemas, root development tooling, and applicable CI/container dependencies.
- **Dependency ownership:** Workspace manifests declare direct ranges. Workspace settings own overrides and patches.
  pnpm generates the shared lockfile.
- **Tracking:** [Workspace maintenance issue #108](https://github.com/repovio/repovio/issues/108) and Dependabot
  PRs #100 through #104.

## Constitution Check

Provider interactions, authorization, migrations, the release workflow, and the product data model retain existing
contracts. Scope package upgrades to supported runtime and peer ranges. Verify applicable project targets and record
exceptions. Keep the required Changeset, Graphify, and GitHub CI checks.

## Project Structure

### Documentation

- [Specification](spec.md)
- [Research](research.md)
- [Validation](quickstart.md)

### Source Code

- Root and workspace `package.json` files, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`.
- Existing version-specific patches and dependency tests where upstream changes require follow-up.
- Docker and GitHub workflow files where a compatible dependency update is available.

## Delivery

1. Update the two Nuxt consumers and the shared security resolutions. Validate all installed Nuxt-family and node-forge versions.
2. Refresh compatible direct and transitive resolutions and check each affected toolchain and consumer group.
3. Test reproducibility, dependency security, formatting, types, API/web/website behavior, and builds.
4. Merge current, green Dependabot Docker PRs. Close duplicate or superseded Nuxt PRs and track the coordinated replacement.
5. Run the major migrations in isolated increments. Check each group against its current peer graph before editing.
6. Recheck the complete workspace after the final increment. Record stable targets that remain blocked and why.

## Major Migrations

- **Querry Kit Nest 2.0.0, Nuxt 1.0.0, and Nuxt UI 4.0.0.** Review peers and exports together. Verify CASL restrictions,
  DTO field selection, pagination, filtering, sorting, and web table state.
- **Fastify Multipart 10.1.8.** Check the Fastify peer line and registration. Exercise accepted uploads, size limits,
  malformed requests, and errors.
- **Vite PWA Nuxt 2.0.1 and assets generator 2.0.0.** Verify ESM asset generation, worker registration and consent,
  update retries, and protected-cache isolation in a production browser.
- **web-push 4.0.0 and Apprise 2.2.0.** Use two increments. Verify ESM exports, VAPID, terminal status handling, retries,
  and Apprise CLI behavior in the API container with synthetic payloads.
- **pnpm 12.21.0, subject to toolchain approval.** Align local, CI, and Docker pins. Verify reproducibility, patches,
  override resolution, build trust settings, and the API deployment layout.

Prisma 8 and Node.js 27 currently have prerelease targets. Retest stable availability at implementation time. Keep the
TypeScript aliases and declared ranges for the workspace compiler roles. Assess any future compiler migration separately.

## Complexity Tracking

No new runtime module, application entity, transport contract, or migration.
