# Dependency security maintenance

The workspace fixes the following advisories through bounded dependency overrides:

- [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): `glob` 9 through 14.0.1 resolve to 14.0.2.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): `minimatch` 7 through 11.0.0 resolve to 11.0.1.

Older, unaffected major lines retain their own APIs. The newer versions change matching internals and remove some APIs;
run the affected builds and tests when changing these overrides.

## Removing deepmerge

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no published fixed `deepmerge` version.
The workspace removes its dependency edges from `nestjs-zod`, `jest-config`, and `@rollup/plugin-node-resolve`.
Version-specific pnpm patches replace their imports with `@fastify/deepmerge@3.2.4`; package extensions declare the new
dependency. The old implementation is not bundled or renamed.

The patches cover CommonJS and ES modules, symbol properties, nested cloning, Jest configuration merging, and the
custom array union used for Zod intersection schemas. The replacement rejects prototype-control keys from both merge
inputs. Keep these semantics when upgrading a patched consumer; remove its patch and dependency extension only when
the upstream package no longer depends on the vulnerable implementation.

Run `pnpm test:dependencies`, API tests and offline OpenAPI export, web tests and production builds, and both Docker
builds. Validate a clean `pnpm install --frozen-lockfile`; existing `node_modules` contents are not reproducibility proof.
GitHub closes alerts after the fixed dependency graph reaches the default branch and is analyzed. Do not dismiss alerts
to substitute for removing vulnerable dependencies.
