# Feature Specification: Workflow Lifecycle Awareness

**Feature Branch**: `codex/61-workflow-lifecycle`

**Created**: 2026-11-09

**Status**: Approved; implementation awaiting task commits

**Issue**: [#61](https://github.com/repovio/repovio/issues/61)

## User Scenarios & Testing

### User Story 1 - Show only actionable workflow contexts (Priority: P1)

As a viewer, I see current failures, approvals, and active-run counters only for workflows that have not been confirmed
removed or disabled. Unknown lifecycle information must not hide a workflow.

**Why this priority**: Deleted Documentation workflow 408114051 leaves failed run 42027893756 permanently actionable.

**Independent test**: Synchronize a confirmed removed workflow, then query attention, approval, active lists, and counts.

**Acceptance scenarios**:

1. Given a workflow whose latest terminal run failed, when its provider confirms removal, then its run leaves current
   attention lists and counters without changing its stored FAILED outcome.
2. Given a workflow with queued, running, or approval-gated runs, when the provider confirms disabling, then those runs
   leave current views and do not generate new run notifications.
3. Given an inactive workflow, when fresh metadata confirms reactivation of the same identity, then current views include
   it again under their existing run-selection rules.
4. Given an unknown response, unsupported endpoint, missing run, isolated 404, or failed provider request, then previously
   confirmed lifecycle state and check time remain unchanged.

### User Story 2 - Understand preserved workflow history (Priority: P2)

As a viewer, I can inspect retained runs of removed and disabled workflows with their actual outcomes, a lifecycle badge,
and the latest confirmed lifecycle check time.

**Why this priority**: Removing stale attention entries must not erase diagnostic history or misrepresent old failures.

**Independent test**: Open retained historical runs and verify their outcomes, localized badges, tooltips, and API data.

**Acceptance scenarios**:

1. Given removed Documentation workflow 408114051, then run 42027893756 remains FAILED in history with Removed.
2. Given an English or German interface, then the lifecycle badge and check-time tooltip use the selected locale.
3. Given a historical metrics query, then completed counts, status distribution, trends, and retention are unchanged.
4. Given an inaccessible repository, then its runs and metadata remain unavailable through API, MCP, lists, and counts.

### Edge Cases

- Historical successful runs cannot reactivate a removed workflow.
- Different provider-native identities with the same name are not merged solely by name.
- Missing or zero-valued deletion timestamps do not prove removal.
- Repository CI disabling can make run APIs unavailable; lifecycle reconciliation must still succeed.
- Repeated synchronization checks inactive workflows and remains idempotent.
- Provider authentication, network, rate-limit, and server failures retain existing retry/error semantics.
- Individual Forgejo definition removal and missing GitLab pipeline names remain inconclusive.

## Requirements

### Functional Requirements

- **FR-001**: Persist UNKNOWN, ACTIVE, DISABLED, or REMOVED with the latest authoritative check time and raw provider state.
- **FR-002**: Use only authoritative read-only metadata; absence, age, filters, and single 404s are not deletion evidence.
- **FR-003**: Inspect GitHub/Gitea workflow identities and support Forgejo/GitLab repository-level CI disabling.
- **FR-004**: Check known inactive and newly discovered tracked identities at most once each per synchronization.
- **FR-005**: Reuse repository metadata and persist lifecycle observations only after provider reads succeed.
- **FR-006**: Exclude inactive workflows before current-view pagination, projection, aggregation, and CASL-safe counts.
- **FR-007**: Preserve run outcomes, historical metrics, existing notification deliveries, and retention policies.
- **FR-008**: Suppress new run events for inactive workflows; workflow removal is never a recovery event.
- **FR-009**: Expose projectable lifecycle state/check time consistently through existing API and MCP contracts.
- **FR-010**: Show localized lifecycle history badges with an accessible last-check tooltip.

### Key Entities

- **Workflow**: Owns provider-native identity and last confirmed lifecycle state; lifecycle differs from execution outcome.
- **Workflow Run**: Retained execution and actual outcome; historical payloads do not prove workflow availability.
- **Lifecycle observation**: Provider-confirmed state for one workflow identity, including its raw state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Run 42027893756 leaves Needs attention after confirmed deletion and remains FAILED in history.
- **SC-002**: Removed/disabled workflows contribute zero entries to current lists and current counters after successful sync.
- **SC-003**: Historical completed counts, trends, outcomes, and retained durations remain unchanged.
- **SC-004**: Reactivation restores visibility without duplicate workflow identities or false recovery notifications.
- **SC-005**: English/German history badges and tooltip timestamps pass browser checks; all shipped locale keys remain complete.
- **SC-006**: Adapter, sync, query, contract, migration, authorization, and affected project checks pass.

## Assumptions

- Unsupported individual lifecycle detection preserves prior knowledge; it does not use default-branch file heuristics.
- Migration is additive, existing workflows default to UNKNOWN, and deployment/migration execution is outside this task.
- The user authorized issue creation, an issue-linked branch, and task commits with pushes after the initial local work.
