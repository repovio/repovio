# Layout contract

- Visible summary or intervening navigation: breadcrumb, intervening content, table toolbar, table.
- No intervening content and room for both: breadcrumb and table toolbar in one row, then table.
- No intervening content and insufficient room: separate rows. An available summary toggle stays on the right of
  the breadcrumb row, including when controls merge.
- Embedded tables have one local toolbar. Only the active table claims Ctrl+F; modal controls retain their focus scope.
- Toggling changes `aria-expanded`; `aria-controls` identifies the region. Hidden content cannot receive focus.
