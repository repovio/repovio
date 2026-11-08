# Repovio Agent Guidelines

## Working Style

- Work autonomously until the requested task is fully completed.
- Do not stop after implementing only part of the task.
- Continue through implementation, debugging, testing, and verification.
- If tests, linting, type checking, or builds fail, investigate and fix the issues.
- After each significant change, reassess the original task and continue if anything remains.
- Do not ask for confirmation for routine implementation decisions.
- Only ask the user when genuinely blocked by missing information that cannot be determined from the repository.
- Do not report completion until the implementation has been verified.
- For complex tasks, maintain an internal checklist of all required work. Continue working through the checklist until every item is completed and verified. Do not return control to the user merely to provide a progress update.

## Scope and priorities

- Treat `PLAN.md` as the approved product architecture and the GitHub Issues
  and sub-issues as the implementation order.
- Complete only the active GitHub Issue and its direct dependencies. Do not
  start later work opportunistically.
- Preserve unrelated work. Inspect `git status` and the relevant diff before
  every edit, test, and commit.
- The Repovio application is read-only with respect to GitHub, GitLab, and
  Forgejo. Never add provider calls that create, modify, dispatch, rerun,
  cancel, or delete provider resources.
- Agents may create GitHub Issues, sub-issues, and milestones only when the
  user explicitly requests it. This exception applies to agent tooling, not to
  Repovio's provider integrations.

## Repository conventions

- Before changing domain terminology, product text, or domain models, read the canonical
  [glossary](GLOSSARY.md). Use its terms consistently and update definitions when their meaning changes.
- Use American English in source code, tests, comments, documentation, and
  Changesets.
- Preserve the TypeScript compiler aliases and version ranges in the workspace manifests.
  Toolchain changes require an explicit request and compatibility validation.
- Use Node.js 26.13.0 and the pinned pnpm 11.28.9. Run package commands through Corepack when pnpm is
  not already the pinned workspace version.
- Format TypeScript, JSON, YAML, and Markdown with 120-character lines, single
  quotes, semicolons, and trailing commas where applicable.
- Keep imports organized and avoid default exports except where a framework
  convention requires them.
- Before source, test, script, or configuration changes, read
  [coding guidelines](docs/coding-guidelines.md) for documentation coverage,
  Vue layout, exclusions, and verification commands.
- Prefer explicit DTOs, validation, and return types at public boundaries.

## API conventions

- Follow the feature-module layout from Machine Admin API: module, service,
  controller, DTOs/types, and focused tests.
- Use `@querry-kit/nest` for resource queries, pagination, filtering, sorting,
  field selection, and explicit ability-aware DTO mapping.
- Enforce authorization in Prisma queries with CASL-aware restrictions. DTO
  field filtering is a second layer, never the only authorization mechanism.
- Encrypt provider tokens and notification-channel credentials at rest. Never
  log, serialize, expose, snapshot, or commit secrets.
- Make polling, webhooks, and notification delivery idempotent. Use durable
  database records for operations that may be retried.

## Frontend conventions

- Follow the Machine Admin Web application layout and typed API-composable
  pattern.
- Structure the Nuxt application by responsibility: route files in `app/pages`
  coordinate a screen, reusable application shells and navigation live in
  `app/components/layout`, generic UI belongs in `app/components/common`, and
  feature-specific UI belongs in `app/components/modules/<feature>`.
- Keep page components focused on route metadata, data loading, and composition.
  Extract independently understandable cards, forms, tables, dialogs, and
  feature sections into named components instead of allowing page files to grow
  into monoliths. Nest closely related feature components by workflow when that
  makes their ownership clear, for example `<feature>/{create,edit,details,table}`.
- In Vue single-file components, place blocks in the order `<template>`,
  `<script setup lang="ts">`, then `<style>`. Keep the script typed; use a
  scoped style block only for component-specific CSS that cannot be expressed
  through the established utility classes.
- Keep API clients and query state in `app/composables/api`, app-wide
  presentation concerns in `app/composables/app`, enum presentation mappings in
  `app/composables/enums`, persistent client state in `app/store`, API contracts
  in `app/types/api`, and small framework-independent helpers in `app/util`.
  Do not hide these responsibilities in page or presentation components.
- Keep template attributes in a consistent reading order: structural directives
  (`v-for`, `v-if`), identity and two-way bindings (`ref`, `:key`, `v-model`),
  static attributes, dynamic bindings, then event listeners.
- Use `@querry-kit/nuxt` for API/table state. Use
  `@querry-kit/nuxt-ui/types` only for UI filtering and sorting contracts;
  preserve full column metadata when adapting local table controls.
- Keep API DTO types synchronized with the Nest API. Do not infer a complete
  client model from untyped responses.
- Implement all user-visible text in English and German locale files.
- Keep the initiating or gating button in its loading state for the full lifetime of every API request it awaits.
- Verify visual changes in a browser or screenshot-based test; linting and
  typechecking alone do not prove visual correctness.

## Validation and commits

- Add or update focused tests with each behavior change. Run the smallest
  relevant checks first, then the affected project targets.
- Before committing, run `git diff --check`, inspect the staged diff, and
  stage only the files in scope.
- Every substantive implementation commit requires exactly one focused
  Changeset for the `repovio` package. Do not add Changesets for generated
  version-release output.
- Push the current branch to its configured remote after every commit unless
  the user explicitly requests a local-only commit or a different remote
  workflow.
- Commit only when explicitly requested. Once a requested commit succeeds,
  apply the preceding push rule only to the reviewed scope.
- Report unverified provider, browser, Docker, or remote GitHub Actions
  behavior honestly.

## graphify

Version only `graphify-out/graph.json`. Reports, HTML, caches, manifests, costs, and runtime metadata stay local.
Each worktree has its own writable graph and cache; use the graph checked out from Git as the initial shared snapshot.
Keep shared scan rules and these instructions in Git. Never commit absolute interpreter or worktree paths.

### Local setup

Run once per clone after installing Graphify. Inspect and preserve existing hooks before changing `core.hooksPath`.
Git configuration is shared by linked worktrees; interpreter paths belong in local Git config, not tracked files.

```sh
graphify_python="$(sed -n '1s/^#!//p' "$(command -v graphify)")"
git config --local graphify.python "$graphify_python"
git config --local merge.graphify.name 'Graphify graph.json union merge'
git config --local merge.graphify.driver "\"$graphify_python\" -m graphify merge-driver %O %A %B"
git config --local core.hooksPath .githooks
```

The tracked `.githooks/pre-commit` rebuilds the AST graph from an isolated copy of the Git index with
`PYTHONHASHSEED=0` and stages only `graphify-out/graph.json`. Unstaged and untracked sources stay out of that rebuild.
It reuses the local graph and cache, invokes no LLM, and aborts the commit if rebuilding fails. It does not refresh
semantic document/image nodes. Run `sh .githooks/test-pre-commit.sh` to check its isolation and failure behavior.
Do not install Graphify's post-commit rebuild hooks alongside this hook. `GRAPHIFY_SKIP_HOOK=1` is an explicit opt-out
for environments without Graphify, such as CI-generated commits.

### Navigation and updates

- When the user invokes Graphify, use the installed project-local skill before doing anything else.
- If the graph is missing, first recover the tracked snapshot from Git. Generate a fresh graph only when no usable
  snapshot exists. A new clone or worktree alone MUST NOT trigger a full semantic rebuild.
- Reuse unchanged semantic results. A cache copied from a stable snapshot of this repository may be reused, but keep
  `.graphify_root`, `.graphify_python`, and other absolute-path runtime metadata local. Resolve cached source paths
  against the current worktree; never share a writable cache or graph through a symlink.
- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before the first grep, search, or source-file
  read for a codebase question. Include this rule in every subagent prompt that explores code. Read raw files only for
  context located by the graph or an earlier read. Use `graphify path` for relationships and `graphify explain` for
  focused concepts.
- Locally updated graphs are not a reason to skip Graphify. Stale/incorrect graph tasks or explicit user instructions
  may bypass it. Use `graphify-out/wiki/index.md` for broad navigation when available; read `GRAPH_REPORT.md` only for
  broad architecture review or when query/path/explain do not provide enough context.
- After code changes or a branch switch, run `graphify update .` (AST-only, no LLM tokens). The pre-commit hook repeats
  the update against staged sources. For changed documents, papers, or images, use the skill's incremental update and
  semantic cache; do not rerun semantic extraction for unchanged files.
- Keep the graph in the same commit as its source changes. `.gitattributes` marks it generated and selects the union
  merge driver. Review node/edge summaries and queries instead of relying on the suppressed textual diff. A merge
  conflict from invalid graph data MUST be investigated; do not bypass the driver's validation.
