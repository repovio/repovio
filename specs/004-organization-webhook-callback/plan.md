# Implementation Plan: Organization Webhook Callback Field

**Branch**: `codex/71-organization-webhook-callback`

**Issue**: [#71](https://github.com/repovio/repovio/issues/71)

**Feature Context**: `004-organization-webhook-callback` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Missing read-only callback URL field in the organization webhook creation form.

## Summary

Add the existing callback URL presentation to the setup form. Before creation, show an empty read-only field with
localized help explaining that saving makes the address available. After creation or selection, display the selected
configuration's server-returned URL with the existing copy action. Keep current configuration cards intact.

## Technical Context

**Language/Version**: TypeScript and Vue SFCs; existing Node.js 26.13.0 and pnpm 11.28.9 pins.

**Primary Dependencies**: Existing Nuxt 4, Vue 3, Nuxt UI, vue-i18n, and typed organization webhook composable.

**Storage**: Existing in-memory configuration list and selected ID; no persistent model or migration changes.

**Testing**: Existing Playwright organization webhook scenarios, canonical formatter, web lint, and web type checking.

**Target Platform**: Existing web application, desktop and mobile browsers.

**Project Type**: Existing pnpm/Nx monorepo; this correction changes only frontend behavior and localization.

**Performance Goals**: No additional requests; callback selection computed from the already loaded configuration list.

**Constraints**: Provider integrations remain read-only; preserve request DTOs, server public URL, secrets, and loading states.

**Scale/Scope**: One management dialog, English and German locale entries, focused browser regression coverage.

## Constitution Check

### Before research

- Pass: bounded user-requested correction to the existing Organization Webhook feature; no later feature work.
- Pass: preserve `PLAN.md`, glossary terminology, existing authorization, strict schemas, and provider read-only behavior.
- Pass: reuse existing components/composable, public callback metadata, and clipboard error handling.
- Pass: no schema, toolchain, endpoint, encryption, or synchronization changes.
- Gate: issue association and task approvals must be established before implementation under the coding workflow.

### After design

- Pass: callback is derived from safe metadata, never from plaintext secrets or browser origin.
- Pass: new helper text is localized; the input and copy action remain accessible.
- Pass: focused browser cases include state transitions, failures, and desktop/mobile layout.
- Pass: no architectural exceptions. The approved planning delivery records issue #71, tasks, and a separate planning commit; no product implementation or provider resource changes.
- Required implementation delivery: focused Changeset, graph update, and requested commit/push under repository rules.

## Project Structure

### Documentation

```text
specs/004-organization-webhook-callback/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
└── checklists/requirements.md
```

### Source Code

```text
apps/web/app/components/modules/providers/organization-webhooks-dialog.vue
apps/web/i18n/locales/en.json
apps/web/i18n/locales/de.json
apps/web/tests/e2e/organization-webhooks.spec.ts
```

**Structure Decision**: Keep the correction in the existing feature component. No new abstraction or backend module.

## Design

1. Derive a read-only presentation value from the configuration matching `editingId`, defaulting to an empty string.
   The composable already replaces the list entry after creation and rotation; avoid duplicate URL state.
2. Place a labeled read-only input inside the form near organization scope, using existing callback/copy locale labels.
   Reuse the existing copy helper. Disable copying while the value is empty; add localized pre-save explanatory help.
3. Keep the callback value outside `form`: the strict creation schema accepts only scope and signing secret.
4. Reuse existing selection/reset lifecycle. Creation failure leaves no selected ID; rotation failure keeps its current
   callback. Reset, successful removal, Add another, and dismissal clear the selection and therefore the form URL.
5. Preserve list-card callback fields. Scope browser selectors to the form and accessible names; remove assumptions
   that the first read-only input always identifies a particular callback.

## Validation

Follow [quickstart.md](quickstart.md). Extend the existing synthetic-API Playwright suite to assert form callback behavior
before and after save, switching configurations, rotation, failures, copying, reset, removal, and reopening. Retain pending,
secret, permission, and repository inheritance checks. Inspect desktop/mobile screenshots and long-address overflow.

## Complexity Tracking

No constitution violations or additional infrastructure required.
