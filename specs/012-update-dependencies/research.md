# Dependency Update Research

- Nuxt 4.6.4 patches the current Nuxt advisories and brings Nitro security fixes. Web and website share one lockfile.
  Dependabot #103 has the package changes but fails the required Changeset check. #104 updates only a manifest and
  duplicates the website update in #103.
- Current GitHub alerts require node-forge 1.4.3. Inspect all install paths, including those affected by the current 1.4.1 override.
- A scratch checkout resolved Nuxt 4.6.4 and node-forge 1.4.3. Updating the direct Nuxt entries alone left
  `@nuxt/schema` 4.6.3. A depth-limited pnpm update of `@nuxt/kit` and `@nuxt/schema` eliminated the old entries.
  A frozen install, eight dependency security tests, 157 web unit tests, 60 website unit tests, both builds, and 18
  PWA browser scenarios passed. The production npm audit reported zero findings in this candidate.
- The current pnpm inventory shows compatible updates across Nest, Nuxt, Vue, tooling, and icons. Check related peer
  versions together. An unrestricted transitive refresh failed because it stopped using the existing
  `eslint-plugin-import-x` and `nestjs-zod` patches. Keep each patched version until its upstream replacement or
  forward-ported patch passes the relevant security and behavior checks.
- Querry Kit Nest 2 requires Node 26.13.0 or later. Check its Nest, CASL, Swagger, and validation peers against the API.
  Nuxt 1 and Nuxt UI 4 require Vue 3.5 and share table/query contracts.
- Vite PWA Nuxt 2 builds on Nuxt Kit 4.6.4. Verify module-generated worker output and asset generation together.
- web-push 4 uses ESM package metadata. Apprise 2 is a separate Python and container change. Test the adapter boundaries
  independently. Fastify Multipart 10 also requires upload behavior verification.
- Compare pnpm 12 against the current pin in a clean checkout and containers after explicit toolchain approval.
- Prisma 8 is a release candidate. Node.js 27 is alpha. Current workflow action pins already match their stable tags.
- The three Node PRs update only the Docker image patch level. The default branch requires passing checks on an
  up-to-date head before merging.

Sources: [Nuxt v4.6.4](https://github.com/nuxt/nuxt/releases/tag/v4.6.4),
[Node.js v26.13.1](https://nodejs.org/en/blog/release/v26.13.1),
[Dependabot alerts](https://github.com/repovio/repovio/security/dependabot),
[Querry Kit Nest v2](https://github.com/querry-kit/nest/releases/tag/v2.0.0),
[Querry Kit Nuxt v1](https://github.com/querry-kit/nuxt/releases/tag/v1.0.0),
[Querry Kit Nuxt UI v4](https://github.com/querry-kit/nuxt-ui/releases/tag/v4.0.0),
[Fastify Multipart v10.1.8](https://github.com/fastify/fastify-multipart/releases/tag/v10.1.8),
[Vite PWA Nuxt v2.0.1](https://github.com/vite-pwa/nuxt/releases/tag/v2.0.1),
[Vite PWA assets generator v2](https://github.com/vite-pwa/assets-generator/releases/tag/v2.0.0),
[web-push v4](https://github.com/web-push-libs/web-push/releases/tag/v4.0.0),
[Apprise v2.2.0](https://github.com/caronc/apprise/releases/tag/v2.2.0),
[pnpm migration guide](https://pnpm.io/migration-v11).
