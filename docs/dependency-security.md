# Dependency security maintenance

The workspace fixes the following advisories through bounded dependency overrides:

- [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw): `@prisma/config@7.10.1` pins
  `effect@3.20.0`; resolve this edge to `3.22.1`. Remove the override once Prisma resolves a patched Effect itself.
- [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): `glob` 9 through 14.0.1 resolve to 14.0.2.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): `minimatch` 7 through 11.0.0 resolve to 11.0.1.

Older, unaffected major lines retain their own APIs. The newer versions change matching internals and remove some APIs;
run the affected builds and tests when changing these overrides.

## Removing deepmerge

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) has no published fixed `deepmerge` version.
The workspace removes its dependency edges from `jest-config` and `@rollup/plugin-node-resolve`.
Version-specific pnpm patches replace their imports with `@fastify/deepmerge@3.2.4`; package extensions declare the new
dependency. The old implementation is not bundled or renamed.

The patches cover CommonJS and ES modules, symbol properties, nested cloning, and Jest configuration merging.
The replacement rejects prototype-control keys from both merge inputs. Keep these semantics when upgrading a patched
consumer. Remove its patch and dependency extension after confirming the upstream replacement and running the tests.

`nestjs-zod` 5.6 uses its own merge implementation. The regression tests cover cloning, deduplicated intersection arrays,
and prototype isolation in its CommonJS and ES module exports.

Run `pnpm test:dependencies`, API tests and offline OpenAPI export, web tests and production builds, and both Docker
builds. Validate a clean `pnpm install --frozen-lockfile`; existing `node_modules` contents are not reproducibility proof.
GitHub closes alerts after the fixed dependency graph reaches the default branch and is analyzed. Do not dismiss alerts
to substitute for removing vulnerable dependencies.
