# Quickstart: Verify GitHub Dependabot Alert Pagination

## Local Regression Checks

Use Node.js 26.13.0 and Corepack with pnpm 11.28.9. Install workspace dependencies and prepare the API generated client
as described in the repository setup guide.

```sh
corepack pnpm --filter @repovio/api test github-actions.adapter.spec.ts
corepack pnpm --filter @repovio/api test
corepack pnpm --filter @repovio/api typecheck
corepack pnpm --filter @repovio/api lint
corepack pnpm format:check
git diff --check
```

- A fixture rejects numbered Dependabot requests. Verify the corrected initial request succeeds for empty and
  single-page collections.
- Return a short first page with multiple link relations and an encoded next cursor using GitHub's canonical
  repository-ID path. Verify the adapter follows only the next relation and returns every expected alert.
- Test a configured API base, an off-origin URL, a malformed next target, and a repeated URL. Verify unsafe targets
  receive no request. Check that a continuation redirect is surfaced as an error.
- Keep existing coverage for Code Scanning, Secret Scanning, and availability. Verify a later-page rate limit preserves
  its status and retry metadata.

## Post-Release Check

With the fixed build deployed, an authorized administrator retries one previously failed GitHub Repository Sync
Request. In Jobs, check that the sync passes Alerts and advances through the remaining scopes. Verify that a repository
with accessible Dependabot alerts lists its findings. An unavailable alert type may still produce a warning.
