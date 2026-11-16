# Research: GitHub Dependabot Alert Pagination

## GitHub Pagination

**Decision**: Use a Dependabot-specific cursor reader. Start with `per_page=100` and follow the provider's
`Link` header relation `next` until it is absent.

**Rationale**: GitHub returned HTTP 400 for `page=1` and HTTP 200 when that parameter was removed from otherwise
equivalent read requests. With a smaller page size, GitHub returned a next link with an opaque `after` cursor and a
canonical repository-ID path. The production queue recorded HTTP 400 at the start of the alert phase.

**Alternatives considered**: Removing `page` without traversing next links drops later findings. Changing the shared
numbered-page helper would broaden the fix to Code Scanning and Secret Scanning, which have their own pagination
contracts.

## Continuations and Existing Failure Handling

**Decision**: Validate the next URL against the configured API origin before fetching and detect repeated URLs. Use
the existing GitHub request headers, error construction, and per-kind availability guard.

**Rationale**: Link targets originate outside Repovio. Origin validation protects credentials while allowing GitHub
to change the canonical path. Keeping existing provider error handling preserves authorization warnings and
rate-limit retry metadata.

**Alternatives considered**: Following arbitrary links could send credentials to another origin. Rebuilding the next
path or cursor from local parameters can alter GitHub's pagination. Treating HTTP 400 as unavailable could silently
hide dependency findings.

## Sources

- [GitHub Dependabot alerts for a repository](https://docs.github.com/en/rest/dependabot/alerts#list-dependabot-alerts-for-a-repository)
- [GitHub REST pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)
