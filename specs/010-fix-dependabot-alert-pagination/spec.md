# Feature Specification: Fix GitHub Dependabot Alert Pagination

**Feature Branch**: `97-fix-github-dependabot-alert-pagination`

**Created**: 2026-11-16

**Status**: Draft

**Issue**: [repovio/repovio#97](https://github.com/repovio/repovio/issues/97)

## User Scenarios & Testing

### User Story 1 - Complete Repository Synchronization (Priority: P1)

As a Repovio administrator, I can synchronize a repository with Dependabot alerts so the job can finish processing its
selected scopes and the dependency alerts are available in Repovio.

**Why this priority**: The current request fails with HTTP 400 before any alert kind completes, blocking later workflow
synchronization.

**Independent Test**: Synchronize a repository against a GitHub fixture that rejects numbered Dependabot pages and
provides two cursor-linked pages. The synchronization reads both pages and continues processing the requested scopes.

**Acceptance Scenarios**:

1. **Given** GitHub provides one page of Dependabot alerts, **When** a repository is synchronized, **Then** Repovio
   reads
   and normalizes those alerts and continues the job.
2. **Given** GitHub provides cursor-linked pages, **When** Repovio synchronizes the repository, **Then** all pages are
   consumed and their alerts are available to the existing persistence flow.
3. **Given** GitHub denies access to an alert kind or rate-limits an account, **When** the alert phase runs, **Then**
   Repovio applies its existing warning or retry behavior, respectively.

### Edge Cases

- Empty results and responses without a next page end the Dependabot read normally.
- An unsafe, malformed, or repeated next link fails the Dependabot read before another authenticated request is sent.
- A provider failure mid-collection leaves the batch incomplete and uses the existing provider failure handling.

## Requirements

### Functional Requirements

- **FR-001**: Repovio MUST retrieve Dependabot repository alerts using GitHub-provided pagination.
- **FR-002**: Repovio MUST send authenticated continuation requests to the configured GitHub API origin and reject
  invalid
  or cyclic continuations.
- **FR-003**: Repovio MUST preserve alert normalization, Code Scanning and Secret Scanning requests, and per-kind
  availability and retry behavior.
- **FR-004**: The repair MUST work with the existing synchronization queue, including manual retries, and use read-only
  provider operations.

### Key Entities

- **Repository Sync Request** records the selected scopes and job outcome.
- **Dependency Alert** is a normalized Dependabot finding associated with a repository.

## Success Criteria

- **SC-001**: The previous HTTP 400 reproduction completes the Dependabot read and makes all fixture alerts available to
  the synchronization service.
- **SC-002**: Tests prove correct termination for empty, single-page, and multi-page results.
- **SC-003**: Tests prove that unsafe continuations issue no authenticated request and existing unavailability and
  rate-limit cases retain their outcomes.

## Assumptions

- The scope is the Dependabot pagination regression. The Jobs page's generic error text is incident context.
- A repository with unavailable alert kinds may complete with a warning.
