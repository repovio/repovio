# Feature Specification: App Language Parity

**Feature Branch**: `codex/84-app-language-parity`
**Feature Directory**: `specs/008-app-language-parity`
**Created**: 2026-11-10
**Status**: Implementation and local acceptance complete; PR review and separate merge approval remain
**Issue**: [#84](https://github.com/repovio/repovio/issues/84)
**Input**: User description: "die app sollte in den gleichen sprachen übersetzt sein wie die website"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Use the App in a Website Language (Priority: P1)

As a user who reads the website in my language, I can select that same language in the app and understand its interface.

**Why this priority**: Website language support should extend to the actual product, including authentication.
**Independent Test**: Select each website language on sign-in and in the signed-in app, then navigate core screens.

**Acceptance Scenarios**:

1. **Given** a new or existing user, **When** they open a language selector, **Then** all 13 website languages are available
   under their native names, including distinct Portuguese and Brazilian Portuguese options.
2. **Given** a selected language, **When** the user visits authentication, dashboard, repositories, workflow runs, work items,
   security alerts, notifications, settings, and permitted administration, **Then** app-owned labels, validation messages,
   empty/error/loading states, and accessible labels use that language.
3. **Given** an Italian, Dutch, Polish, or Portuguese app user, **When** language support expands, **Then** their existing
   language and saved preference remain supported.

### User Story 2 - Read Right-to-Left Languages (Priority: P1)

As an Arabic or Urdu reader, I can use an appropriately directed interface without losing the readability of technical data.

**Why this priority**: Translation alone does not make right-to-left languages usable.
**Independent Test**: Switch between Arabic, Urdu, and English on a narrow mobile and desktop viewport.

**Acceptance Scenarios**:

1. **Given** Arabic or Urdu, **When** any app screen or dialog opens, **Then** the interface uses right-to-left direction,
   native text remains readable, and navigation, forms, tables, menus, and tooltips remain usable with keyboard and pointer.
2. **Given** right-to-left text surrounding repository identifiers, URLs, or code, **When** technical data is displayed,
   **Then** its source value and readable order remain intact.
3. **Given** an active right-to-left language, **When** English is selected, **Then** the interface returns to left-to-right
   without stale direction on overlays or the document.

### User Story 3 - Keep Language Preferences Reliable (Priority: P2)

As a returning user, I retain my language through reloads and navigation with predictable fallback and formatting.

**Why this priority**: Language selection must remain stable across normal application use.
**Independent Test**: Select a newly supported language, reload, navigate, and repeat with an unsupported preference.

**Acceptance Scenarios**:

1. **Given** a saved supported language, **When** the app reloads, **Then** the same language remains active without changing
   the current screen or its query parameters.
2. **Given** no saved preference, **When** a supported browser language is detected, **Then** it is used; when no supported
   preference is available, English is used.
3. **Given** translated messages with counts, names, dates, or numbers, **When** rendered, **Then** substitutions and
   locale-aware formatting remain correct without raw message keys or malformed text.
4. **Given** a language still loading or failing to load, **When** a user changes languages, **Then** selection remains busy
   for the entire operation, reports failure accessibly, and leaves a usable interface.

### Edge Cases

- `pt` and `pt-BR` are separate languages for selection and persistence; existing `pt` preferences must not be remapped.
- Unsupported or malformed saved/browser preferences fall back to English using existing detection rules.
- Arabic and Urdu require direction reset when switching back to another language, including open overlays.
- Long translations and CJK, Bengali, Hindi, and Urdu glyphs must remain usable at 390px and 1440px widths in both themes.
- Interpolated provider values, technical tokens, and linked messages must retain their meaning and valid formatting.
- A missing message falls back to English at runtime, but incomplete shipped translations fail acceptance.
- A slow or failed language change must not strand a control in a busy state or report an uncompleted selection as active.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST support all current website languages: `en`, `de`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`,
  `pt-BR`, `id`, `ur`, `ru`, and `ja`.
- **FR-002**: The app MUST retain its existing `it`, `nl`, `pl`, and `pt` languages, producing 17 selectable languages.
- **FR-003**: Every shipped language MUST provide the complete app-owned message set, including accessible labels and
  existing feature states. English fallback MUST NOT substitute for completing a translation.
- **FR-004**: Existing public authentication and signed-in language selectors MUST expose the same complete language set,
  native names, and locally served decorative flags; selection MUST remain keyboard accessible.
- **FR-005**: Arabic and Urdu MUST apply right-to-left document and component direction; other languages MUST use
  left-to-right direction. Technical data MUST remain readable without rewriting source values.
- **FR-006**: The app MUST preserve saved preferences, supported browser-language detection, English default/fallback,
  current navigation, query parameters, and full-duration loading behavior during language changes.
- **FR-007**: Message parameters, plural meaning, linked messages, and date/time/number formatting MUST remain valid in
  every supported language, including built-in interface controls.
- **FR-008**: Maintenance checks MUST detect website-language omissions, incomplete or malformed app translations,
  incompatible message parameters, invalid direction metadata, and missing flag assets before acceptance.
- **FR-009**: Current localization guidance MUST describe the complete language set and maintenance checks without
  rewriting previously published handbook archives.
- **FR-010**: Provider names, repository names, workflow names, provider-authored content, secrets, permission rules, and
  read-only provider behavior MUST remain unchanged.

### Key Entities

- **Supported Language**: Identifier, native name, regional language tag, reading direction, and decorative flag.
- **Message Catalog**: App-owned messages for one supported language, with consistent message identifiers and parameters.
- **Language Preference**: Existing browser-local selection; no new user account setting or synchronization is required.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 13 website languages and all 8 preexisting app languages are selectable, with 17 unique options.
- **SC-002**: Every shipped language covers 100% of the English message set and renders representative parameterized
  messages without missing parameters, malformed messages, or raw identifiers.
- **SC-003**: Sign-in, setup, navigation, representative data tables/forms/dialogs, and locale changes pass browser checks
  for every language; selected languages persist after reload and navigation.
- **SC-004**: Arabic and Urdu pass direction, keyboard, technical-data readability, and overlay checks; visual samples
  across both themes and 390px/1440px widths show no page overflow, unreadable glyphs, or inaccessible controls.
- **SC-005**: No translation or flag requires a third-party runtime service, and no provider data is changed by selection.
- **SC-006**: Maintenance checks reject fixtures with a missing website language, translation key, parameter, or flag.

## Assumptions

- "Same languages" means adding website-language coverage while preserving existing app languages; no removal was requested.
- Website language identifiers and native names are authoritative for the 13 overlapping locales. Portuguese remains a
  distinct legacy option alongside Brazilian Portuguese.
- The request covers the browser application, including built-in controls. Outgoing email/push templates, raw backend or
  provider diagnostics, provider-authored content, and website translation revisions are outside this feature.
- Existing app-owned user-facing error wrappers are translated; raw diagnostic payloads remain unchanged.
- English is the canonical source for translation completeness; legitimate unchanged product names and technical terms
  are allowed and must not be mistaken for untranslated prose.
- No new provider request, database migration, translation service, dependency upgrade, release, or deployment is needed.
- Planning, task generation, issue creation, and the planning-only commit/push are authorized. Implementation and per-task commits are also approved; merge remains separately gated.
