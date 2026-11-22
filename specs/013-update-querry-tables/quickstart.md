# Acceptance checks

1. Install from the lockfile in a fresh directory. Run `pnpm audit`, `pnpm test:dependencies`, and check resolved peers.
2. Exercise each grouped query across two repositories using synthetic data and a user allowed only one repository.
   Compare counts with filtered flat-list totals; verify manager-only Security Alerts and unsupported field rejection.
3. Seed more than one page per group. In each table, switch modes, expand, append, retry a failed load, change filters
   during a pending load, and return to pagination. Verify row identity, ordering, embedded scope, and empty results.
4. Verify English and German, narrow and desktop widths, and keyboard navigation in the browser. Run affected format,
   lint, tests, typecheck, and build targets.
