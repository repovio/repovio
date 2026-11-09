# Feature Specification: Correct Active Workflow Run Timing

**Feature Branch**: `codex/74-fix-active-run-timing` in the existing Codex worktree.

**Feature ID**: `005-fix-active-run-timing`

**Created**: 2026-11-09

**Status**: Planned; issue creation and planning commit approved; implementation pending.

**Input**: Active Workflow Runs display negative duration and a completion date of January 1, 1970.

**Tracking**: [Issue #74](https://github.com/repovio/repovio/issues/74).

## User Scenarios & Testing

### User Story 1 - Recognize unfinished runs (Priority: P1)

As a User monitoring Workflow Runs, I need unfinished runs to show unavailable completion information so that I do
not mistake an unfinished run for a completed run with impossible timing.

**Why this priority**: The current display misrepresents execution state and duration.

**Independent Test**: View running and queued runs with absent timing and with bogus epoch completion information.

**Acceptance Scenarios**:

1. **Given** a running run, **When** its row appears, **Then** completion and final duration show the existing
   unavailable indicator, never January 1, 1970 or a negative duration.
2. **Given** a queued or approval-waiting run, **When** its row appears, **Then** it shows no final timing.
3. **Given** an already stored active run with bogus completion information, **When** viewed before its next sync,
   **Then** it also shows unavailable final timing.

### User Story 2 - Preserve valid completed timing (Priority: P2)

As a User reviewing run history, I need valid completion dates and durations preserved after a run finishes.

**Why this priority**: Correcting active runs must preserve useful historical information.

**Independent Test**: Observe an active run transition to a terminal status using valid completion information.

**Acceptance Scenarios**:

1. **Given** an active run that finishes, **When** synchronization observes valid terminal information,
   **Then** the real completion date and nonnegative duration appear.
2. **Given** a completed run with invalid or reversed timing, **When** viewed,
   **Then** invalid values show unavailable; valid independent timing remains available.
3. **Given** a valid completed run lasting zero milliseconds, **When** viewed, **Then** zero remains a valid duration.

### Edge Cases

- Missing, empty, malformed, epoch-sentinel, or pre-start completion timestamps.
- Negative or nonfinite durations; valid zero duration; missing start with valid terminal duration.
- Active runs carrying plausible completion information or a positive provider duration: final timing remains unavailable.
- Unknown status: unavailable timing remains unavailable; never infer completion from status alone.
- English and German interfaces, dashboard rows, Workflow Runs tables, and repository-scoped run views.

## Requirements

### Functional Requirements

- **FR-001**: Queued and running runs MUST have no displayed completion date or final duration.
- **FR-002**: Invalid completion timestamps and negative or nonfinite durations MUST display as unavailable.
- **FR-003**: Valid terminal completion timestamps and nonnegative durations, including zero, MUST remain available.
- **FR-004**: Existing stored active runs MUST satisfy FR-001 before their next provider synchronization.
- **FR-005**: Normal synchronization MUST overwrite bad active timing with unavailable timing and later record valid
  terminal timing without creating duplicate runs.
- **FR-006**: Dashboard and Workflow Runs views MUST apply consistent validity rules and existing localized
  unavailable labels in English and German.
- **FR-007**: Repository permissions, status normalization, approval state, and provider read-only behavior MUST remain
  unchanged.

### Key Entities

- **Workflow Run**: Existing execution record with status, start, completion, duration, and Repository association.
- **Run Timing**: Optional start and completion instants and optional final duration; unavailable differs from zero.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every queued/running acceptance fixture displays neither a completion date nor a final duration.
- **SC-002**: No invalid-timing acceptance fixture displays a bogus epoch completion or a negative duration.
- **SC-003**: Every valid terminal acceptance fixture retains its expected timing, including zero duration.
- **SC-004**: Both affected run-row surfaces pass the acceptance matrix in English and German, including stored bad rows.

## Assumptions

- An unavailable final duration is preferable to adding a live elapsed-duration feature, which is outside scope.
- Existing polling/webhook synchronization supplies eventual terminal information; no provider writes are needed.
- No bulk production repair, schema migration, toolchain change, or unrelated timing refactor is included.
- The reported live payload has not been captured. The Forgejo normalizer contains a matching source-level defect.
