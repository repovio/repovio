# Browser acceptance

Use local authenticated Playwright fixtures in `apps/web/tests/e2e`. Run the affected specs with
`pnpm --dir apps/web exec playwright test tests/e2e/page-layout.spec.ts` and the relevant monitoring/admin specs.

1. At 1118 × 1273 on Issues, observe metrics above controls. Type a query matching a known issue; toggle the metrics
   twice using the keyboard. Verify row results, input value, focus, chevron direction, and layout bounds.
2. Check a desktop list without metrics. Narrow to 390 px, then expand again. Confirm there is one search and all
   controls remain reachable. Repeat in German and English.
3. Verify Ctrl+F after route changes and on an embedded repository table. Assert focus on the visible input and verify
   actual results. On a page without a table, verify the shortcut event is not canceled.
4. Run the KPI toggle on a page without a table; check reduced motion and that hidden content is outside the tab order.
5. Check existing search, filters, grouping, pagination, empty/error states, and repository constraints across the
   route inventory. Inspect representative rendered screens, then run affected web lint, type, and unit checks.

## Verification on the feature branch

- Chromium with authenticated API fixtures: verified expanded and merged Issues at 1118 × 1273, separate search
  at 390 × 844, keyboard disclosure, reduced motion, native find fallback, and filtered server results from page one.
  Inspected screenshots of all three layout states.
- Broad run: 104 of 108 scenarios passed on the first loopback run. Both notification breadcrumb scenarios passed
  after updating their selectors; the 1440 px theme scenario passed on rerun. The remaining repository selection
  dialog failure (`Selected: 1` instead of `Selected: 2`) reproduced on unmodified `main` at `51b7142`.
- Web lint, typecheck, 157 unit tests, documentation coverage, and canonical formatting passed. No live provider
  operations were used for verification.
