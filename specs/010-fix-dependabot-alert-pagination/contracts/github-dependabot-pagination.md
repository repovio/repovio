# Provider Contract: GitHub Dependabot Repository Alerts

- Initial request uses `GET /repos/{owner}/{repo}/dependabot/alerts?per_page=100` and the configured GitHub API base.
- Each successful response supplies a JSON array. A `Link` relation of `next` supplies the next URL. An absent next
  relation ends the collection, regardless of the number of alerts on that page.
- Continuations preserve the provider-supplied path and query. Only valid HTTP(S) targets on the configured origin
  without embedded credentials are eligible. A malformed, repeated, or cross-origin next target fails with a
  credential-free error. HTTP redirects on continuation requests are treated as unsuccessful responses.
- Each page uses existing GitHub authentication and content negotiation. The existing sanitized provider error
  classification applies, including non-rate-limited HTTP 403 or 404 as unavailable and rate limiting as retriable.

Repovio's provider adapter interface and public API schemas stay compatible.
