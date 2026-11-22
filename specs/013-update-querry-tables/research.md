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

## Other direct updates found

Registry snapshot on November 22, 2026. These packages were checked but are outside the requested update group.

| Package                        | Locked  | Registry target |
| ------------------------------ | ------- | --------------- |
| `@fastify/multipart`           | 10.1.8  | 10.1.9          |
| `@iconify-json/lucide`         | 1.2.155 | 1.2.157         |
| `@iconify-json/simple-icons`   | 1.2.102 | 1.2.103         |
| `@nestjs/cli`                  | 12.0.13 | 12.0.15         |
| `@nestjs/common`               | 12.5.0  | 12.6.0          |
| `@nestjs/core`                 | 12.5.0  | 12.6.0          |
| `@nestjs/platform-fastify`     | 12.5.0  | 12.6.0          |
| `@nestjs/platform-socket.io`   | 12.5.0  | 12.6.0          |
| `@nestjs/schematics`           | 12.0.13 | 12.0.16         |
| `@nestjs/testing`              | 12.5.0  | 12.6.0          |
| `@nestjs/throttler`            | 6.7.1   | 6.8.0           |
| `@nestjs/websockets`           | 12.5.0  | 12.6.0          |
| `@nuxt/content`                | 3.16.2  | 3.17.0          |
| `@nuxt/icon`                   | 2.6.2   | 2.6.3           |
| `@nuxt/ui`                     | 4.12.0  | 4.13.0          |
| `@scalar/nestjs-api-reference` | 1.2.37  | 1.2.40          |
| `@vite-pwa/nuxt`               | 2.0.1   | 2.0.3           |
| `marked`                       | 18.2.0  | 18.2.1          |
| `openid-client`                | 6.9.0   | 6.9.1           |
| `prettier`                     | 3.9.10  | 3.10.1          |
| `prisma`                       | 7.10.1  | 8.0.0-rc.34     |
| `typescript-eslint`            | 8.72.2  | 8.73.0          |
| `vitest`                       | 5.1.0   | 5.1.1           |
| `vue`                          | 3.5.45  | 3.5.46          |
| `vue-i18n`                     | 11.4.20 | 11.4.23         |
