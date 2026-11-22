# Update selection

Baseline: `pnpm -r outdated --format json` reported 28 direct packages. The requested Querry-Kit group is
`@querry-kit/nest` 2.0.0 → 2.1.1, `@querry-kit/nuxt` 1.0.0 → 1.1.1, and `@querry-kit/nuxt-ui` 4.0.0 → 4.2.0.
All three targets support the pinned runtime. The Nuxt packages support switchable loading; the Nest package supports
ability-aware aggregation. Grouping only the loaded page would produce incorrect counts.

`pnpm audit` and GitHub agree on [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw):
`@prisma/config` pulls in `effect@3.20.0`; the first patched version is 3.22.1. Prefer a supported parent resolution,
otherwise verify a narrowly scoped override. The Prisma 8 release candidate is not a stable upgrade.

GitHub also lists [GHSA-f3x9-2chm-73c8](https://github.com/advisories/GHSA-f3x9-2chm-73c8). Both application
resolutions already use the patched Nuxt 4.6.4 on the default branch.
