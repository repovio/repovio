# Feature Specification: Organization Webhooks

**Feature Branch**: `codex/58-organization-webhooks`

**Created**: 2026-11-09

**Status**: Approved; implementation and issue/branch/task-commit delivery authorized in this chat.

**Issue**: [#58](https://github.com/repovio/repovio/issues/58)

**Input**: Configure one organization webhook instead of individual repository hooks and display a blue Organization badge.

## User Scenarios & Testing

### User Story 1 - Configure once per organization (Priority: P1)

A System Administrator configures one organization webhook for a Provider Account and registers it manually at the provider.
Multiple organizations may be configured under a connection. GitLab uses a full group path.

**Why this priority**: Removes repeated setup for every tracked repository.

**Independent Test**: Create, list, rotate, and remove a configuration as an administrator; verify no stored secret is disclosed.

**Acceptance Scenarios**:

1. Given an existing Provider Account, when an administrator supplies an organization and secret, the system returns its
   callback address and safe metadata without registering anything at the provider.
2. Given a configured organization, when its secret is rotated, the organization and callback stay unchanged.
3. Given an unauthorized user, when configuration is requested or changed, access is denied before configuration is read.
4. Given an existing organization configuration, when the same normalized organization is added again to that connection,
   the system rejects the duplicate.

### User Story 2 - Synchronize matching tracked repositories (Priority: P1)

Verified organization deliveries refresh already tracked repositories belonging to that organization and Provider Account.
GitLab group hooks also cover descendant groups. Repositories remain manually selected for tracking.

**Why this priority**: Shared setup must refresh the correct repositories without importing or exposing others.

**Independent Test**: Send valid, invalid, repeated, concurrent, and cross-organization deliveries for all four providers.

**Acceptance Scenarios**:

1. Given an enabled tracked repository, when an authentic organization event references it, one durable refresh is scheduled.
2. Given unknown or disabled repositories, when an authentic event arrives, no repository is imported or refreshed.
3. Given repositories in other connections or organizations, when an event references them, their state is unaffected.
4. Given a delivery repeated concurrently through organization and repository hooks with the same delivery identity,
   one repository refresh is recorded. A processing failure leaves the delivery retryable.
5. Given a GitLab group `acme`, when an event references a repository in `acme/team`, it is covered; `acme-other` is not.

### User Story 3 - Recognize inherited configuration (Priority: P2)

Matching repositories show a blue Organization badge (German: Organisation). Details identify the inherited organization
and link to provider administration. Existing repository configuration remains available as a fallback.

**Why this priority**: Makes the shared setup visible and avoids unnecessary repository-specific configuration.

**Independent Test**: Exercise the management and repository views in English and German at desktop and mobile widths.

**Acceptance Scenarios**:

1. Given matching organization configuration, when a repository is listed, its webhook column shows the localized blue badge.
2. Given overlapping GitLab groups, when details are shown, the deepest matching configured group is displayed.
3. Given an existing repository secret, when organization configuration is removed, repository-specific configuration returns.
4. Given an ongoing or failed request, the initiating control remains pending through completion and errors allow recovery.

### Edge Cases

- Organization names normalize consistently; group matching respects slash boundaries.
- Invalid signatures and disabled connections are rejected. Ping and events without repository context are acknowledged.
- Two connections to the same forge never share configuration or repository matching implicitly.
- Configuration indicates local setup, not confirmed provider registration. GitHub App deliveries remain independent.

## Requirements

### Functional Requirements

- **FR-001**: Support organizations on GitHub, Forgejo, and Gitea and groups including descendants on GitLab.
- **FR-002**: Restrict configuration to System Administrators and scope every configuration to a Provider Account.
- **FR-003**: Keep organizations immutable after creation and support write-only secret creation and rotation.
- **FR-004**: Protect secrets at rest and never return or log them.
- **FR-005**: Automatically apply matching configuration to already tracked repositories without per-repository opt-in.
- **FR-006**: Verify delivery authenticity before resolving event repositories and enforce account and namespace boundaries.
- **FR-007**: Durably deduplicate deliveries and persist accepted refresh work atomically.
- **FR-008**: Preserve existing repository secrets, repository hooks, GitHub App hooks, and polling.
- **FR-009**: Prefer organization display over repository display and select the deepest configured GitLab group.
- **FR-010**: Provide explicit blue Organization/Organisation badges, inherited details, and accessible localized management.
- **FR-011**: Explain manual provider registration and GitLab group-hook licensing requirements.
- **FR-012**: Preserve existing data during installation and upgrades. Never mutate provider resources or import repositories.

### Key Entities

- **Organization Webhook**: One local organization/group configuration belonging to a Provider Account with protected
  verification credentials, an immutable namespace, a callback address, and receipt metadata.
- **Organization Webhook Delivery**: A durable receipt identifying an accepted delivery for that configuration.
- **Repository**: An explicitly tracked provider repository whose webhook presentation can inherit organization configuration.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One configuration covers at least two tracked repositories in the same organization without individual setup.
- **SC-002**: Every supported provider accepts authentic deliveries and rejects invalid verification credentials.
- **SC-003**: Repeated delivery identities schedule no duplicate repository work, including simultaneous delivery paths.
- **SC-004**: Cross-account, cross-organization, disabled, and unknown repository cases produce no unintended refresh/import.
- **SC-005**: English/desktop and German/mobile journeys show the blue badge and preserve fallback after removal.
- **SC-006**: Clean installation and upgrade validation preserve pre-existing repositories and their webhook secrets.

## Assumptions

- Provider registration remains manual, performed by someone with appropriate organization/group permissions.
- GitLab group hooks require a suitable GitLab tier; unsupported provider events remain subject to existing adapter support.
- Blue represents locally inherited configuration and does not prove provider-side registration or delivery health.
- Existing worktree, project conventions, and approved architecture are retained; issue #58 owns this feature only.
