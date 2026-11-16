# Implementation Plan: Fix GitHub Dependabot Alert Pagination

**Branch**: `97-fix-github-dependabot-alert-pagination` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Issue**: [repovio/repovio#97](https://github.com/repovio/repovio/issues/97)

## Summary

Use cursor pagination for GitHub Dependabot repository alerts. This removes the HTTP 400 that stops full repository
synchronization in the Alerts phase. The design is scoped to the GitHub adapter and its tests.

## Technical Context

| Area         | Detail                                                                                  |
| ------------ | --------------------------------------------------------------------------------------- |
| Runtime      | TypeScript, Node.js 26.13.0, pnpm 11.28.9                                               |
| Dependencies | Existing NestJS GitHub adapter, injected Fetch API, Jest                                |
| Storage      | Existing PostgreSQL records via Prisma                                                  |
| Project type | Backend provider integration in the pnpm/Nx monorepo                                    |
| Performance  | One request per linked Dependabot page, with up to 100 results per request              |
| Constraints  | Read-only provider API, same-origin authenticated continuations, credential-free errors |
| Scope        | GitHub Dependabot repository alerts                                                     |

## Constitution Check

**Pre-research and post-design**: Pass.

- Issue #97 bounds the adapter and focused tests. Product authorization and normalized data use existing boundaries.
- All provider requests use GET. The next URL is validated before authentication headers are sent.
- The existing retry classifier, per-kind availability guard, and durable queue are reused.
- Add focused Jest coverage and a patch Changeset at implementation. Apply repository documentation checks and typed
  documentation for changed handwritten declarations.

## Design

- Route the dependency alert call to a dedicated private cursor reader. Keep the numbered helper for Code Scanning and
  Secret Scanning. Reuse GitHub URL construction, injected fetch, authentication headers, and `providerRequestError`.
- Parse the GitHub `Link` header for `rel="next"`. Resolve the target against the current request URL, preserve the
  provider's path and query, and allow the canonical repository-ID path. Follow next links even on short pages.
- Validate HTTP(S), same origin, and absence of embedded credentials before a continuation GET. Ignore fragments when
  tracking visited URLs. Reject invalid or repeated next targets with a fixed sanitized error. Set `redirect: 'manual'`
  on continuation fetches so the validated request cannot automatically redirect to another target.
- Accumulate Dependabot pages before returning them to existing normalization and persistence. Propagate failed reads
  through the existing per-kind availability and retry handling. The Jobs UI is outside this issue's repair scope.

## Project Structure

- [Research](research.md), [Data model](data-model.md), [Provider contract](contracts/github-dependabot-pagination.md),
  and [Validation guide](quickstart.md) accompany this plan.
- Implementation and focused Jest coverage belong in
  `apps/api/src/modules/providers/github/github-actions.adapter.ts` and its adjacent spec.

## Verification

Run the focused adapter suite, then the API test, typecheck, and lint targets described in
[quickstart.md](quickstart.md).
After release, retry one affected job and verify the Alerts phase advances. Enabled alert types should complete.
Unavailable alert types may still produce the existing warning.
