# Repovio coding guidelines

## Sources of truth

These standards apply to handwritten application code, shared schemas, tests, scripts, and configuration in this
repository. Architecture and provider read-only constraints remain defined in `PLAN.md` and `AGENTS.md`.
Use Node.js 26.13.0 and Corepack pnpm 11.28.9. Preserve the TypeScript compiler aliases and version ranges.

ESLint, Prettier, `.editorconfig`, and the scripts below implement the executable standards. Exclude dependencies,
vendor/generated sources, framework output, build output, coverage and browser reports. Let pnpm own the lockfile.
Never weaken a rule or add blanket source exclusions to make checks pass.

## TypeScript and JavaScript

- Use American English, two spaces, LF, single quotes, semicolons, trailing commas, and a 120-character print width.
- Keep adjacent imports together and separate them from statements. The existing Prettier import organizer is canonical;
  review reordering and removals for side effects. Do not introduce default exports except framework conventions.
- Preserve strict types and explicit DTOs/validation at public boundaries. Prefer domain types or narrowed `unknown`
  over `any`. Keep existing feature-module, authorization, localization, and API-composable architecture.

### Documentation

Document every handwritten function and method: private/local helpers, constructors, getters/setters, arrow functions,
callbacks, and composables. Also document every exported type alias, interface, enum, and class. Tests, build scripts,
and configuration callbacks are included. Brief helpers still need an accurate purpose summary.

Use JSDoc/TSDoc immediately before the declaration or callback expression. A variable/property comment may document its
function initializer; a surrounding call's comment does not document its callback. Do not repeat TypeScript types in
braces. Describe relevant parameter meaning, units/ranges, ownership, side effects, permissions, asynchronous completion
and rejection/cancellation. Use `@param`, `@returns`, `@throws`, and `@typeParam` when they clarify a contract; no empty
or placeholder tags. Constructors/setters do not need return tags. Keep component props/events/models documented when
their meaning is non-obvious. Preserve existing comments and update them when contracts change.

The repository checker verifies declaration coverage and nonempty summaries/tags, including Vue scripts. The existing
API checker additionally verifies parameter, return, generic, and explicit escaping-throw tags on named API callables.
Neither checker proves semantic correctness, transitive rejection behavior, or that prose is useful: review those
against implementation and tests. Documentation fixtures embedded in strings are data, not declarations to document.

## Vue components and layout

- Blocks: `<template>`, `<script setup lang="ts">`, then optional `<style>`, separated by one blank line. Preserve valid
  additional script/custom blocks. Keep script/style bodies unindented; templates use two spaces per nesting level.
- Keep route pages focused on metadata, loading, and composition. Use the existing layout/common/module components,
  typed props/events/models, composables, stores, API contracts, and utility locations documented in `AGENTS.md`.
- Attribute groups: definition, list rendering, conditionals, render modifiers, identity, two-way binding, remaining
  directives, global attributes, static attributes, dynamic attributes, events, content. Preserve within-group order.
- Short tags may remain on one line when they fit within 120 characters. Multiline tags close with `>` or `/>` on a
  separate aligned line; following content starts on a new line. Attribute count alone does not force wrapping.
- Non-inline element content uses separate lines; `span` retains inline content. Preserve significant whitespace,
  preformatted content, mixed inline text, binding/spread precedence, slots, comments, and accessible/localized content.
  Use a narrowly justified exception only where a layout change would alter rendering.

The canonical format pipeline runs Prettier/import organization, then the shared Vue layout rules. Vue deliberately
uses this combined output instead of the standalone `prettier/prettier` rule. Other files retain that rule. Do not run
vanilla Prettier as a substitute for the canonical check. Two complete passes must produce identical bytes. The formatter also compares compiled Vue render functions and refuses
changes to significant text or bindings. Preformatted element bodies are retained byte for byte.

## Verification

Run from the repository root, using `corepack pnpm` if the active pnpm is not the pinned version:

| Command                    | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `pnpm format:check`        | Check canonical formatting without writes              |
| `pnpm format`              | Explicitly write canonical formatting                  |
| `pnpm documentation:check` | Check all handwritten declarations                     |
| `pnpm test:guidelines`     | Documentation and formatting regression fixtures       |
| `pnpm lint`                | Documentation, shared scripts, and package lint checks |
| `pnpm typecheck`           | API, web, and schema type checks                       |
| `pnpm test`                | API, web, and schema unit tests                        |
| `pnpm --dir apps/web e2e`  | Browser regression scenarios against a running web app |

`apps/api` retains `pnpm lint` and the API documentation entrypoint. CI runs the canonical formatting, documentation,
checker regression tests, ESLint, and type checks in the existing lint workflow. Fix commands are explicit and uncached.
Root rule/configuration and checker changes participate in Nx lint cache inputs. No new hooks are required.

Style changes must preserve behavior, permission filtering, API contracts, pending/error states, localization,
accessibility, and significant whitespace. Inspect relevant Vue rendering in a browser; lint and types are insufficient.
