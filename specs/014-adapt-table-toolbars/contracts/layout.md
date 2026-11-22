# Layout contract

- Visible summary or intervening navigation: breadcrumb, intervening content, table toolbar, table.
- No intervening content and room for both: breadcrumb and table toolbar in one row, then table.
- No intervening content and insufficient room: separate rows. An available summary toggle stays on the right of
  the breadcrumb row, including when controls merge.
- Embedded tables have one local toolbar. Only the active table claims Ctrl+F; modal controls retain their focus scope.
- Toggling changes `aria-expanded`; `aria-controls` identifies the region. Hidden content cannot receive focus.

## Route inventory

- Issues, Pull requests, and all three security alert categories share module tables, summary cards, and existing
  server search. Keep availability notices, errors, and removable dashboard presets visible when metrics collapse.
- Workflow runs, Needs attention, and repository-scoped runs share a frame and a server filter; the base list currently
  suppresses its search. Awaiting approval uses an unpaginated local search and has a permanent provider notice.
- Repository child tables keep local controls below the repository navigation. Selection and editing forms inside
  cards/dialogs are not page toolbars.
- User groups already search by name. Users, provider accounts, repositories, channels, and delivery history use
  `useTable` and need search tied to their resource query. Keep create/navigation actions available.
- Jobs has a summary and an existing server-side `search` query for repository/provider names. The dashboard's
  summary cards have no table toolbar; its charts, range selector, and latest runs remain independent.
