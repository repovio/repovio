# Repovio glossary

Canonical domain language for Repovio's read-only monitoring of GitHub, GitLab, Forgejo, and Gitea.
Provider-specific names below describe equivalent concepts, not resources that Repovio creates or modifies.

## Providers and repositories

**Provider**:
A supported source forge: GitHub, GitLab, Forgejo, or Gitea.

**Provider Account**:
A configured connection through which Repovio reads a provider's repositories and activity.
It is distinct from a User who signs in to Repovio and may use token-based or GitHub App installation authentication.
_Avoid_: User, login account when referring to a provider connection.

**Repository**:
A provider repository tracked through a Provider Account, including its workflows, work items, and security alerts.
A GitLab project is represented as a Repository in Repovio.
_Avoid_: Project as a separate Repovio resource.

**Provider Actor**:
A provider-side identity associated with work items as an author or assignee.
It is distinct from a Repovio User and does not imply access to Repovio.

## Workflows

**Workflow**:
A named automation within a Repository whose executions are tracked together.
For GitLab, Repovio groups pipeline executions under a workflow identity derived from the pipeline name or its fallback.

**Workflow Run**:
One execution of a Workflow, with its own status, timing, and branch or change-request context.
A GitLab pipeline execution is represented as a Workflow Run.
_Avoid_: Workflow when referring to an individual execution.

**Workflow Filter**:
A Repository's allow or deny rule for selecting workflow names to track.
Deny matches take precedence; when allow rules exist, a workflow must match at least one.

**Approval Required**:
A Workflow Run's indication that provider-side approval or manual action is needed before execution can proceed.
It does not grant permission to approve the run through Repovio.

## Work items and security

**Work Item**:
The collective term for an Issue or Pull Request tracked by Repovio.
Security Alerts and Workflow Runs are separate concepts.

**Issue**:
A provider-side issue tracked for a Repository, including its state, author, assignees, and labels.

**Pull Request**:
A proposed change from a source branch into a target branch, tracked with its review-related state and workflow status.
GitLab merge requests are represented as Pull Requests in Repovio.

**Change Request**:
The provider-neutral change context associated with a Workflow Run, such as its pull request or merge request.
It is not a separate work-item category alongside Issue and Pull Request.

**Security Alert**:
A provider-reported finding concerning a dependency, code, or secret in a Repository.
Its availability depends on provider support and access, so an unavailable alert category does not mean no findings exist.

## Users and access

**User**:
A person’s Repovio sign-in identity, authenticated locally or through OpenID Connect.
It is distinct from a Provider Account used to read provider data.

**Global Role**:
A User's application-wide role: System Administrator, Manager, or Viewer.
For non-administrators, a global role alone does not grant access to every Repository.

**System Administrator**:
A User with application-wide administrative access, including all Repositories and system configuration.

**Repository Role**:
A Viewer or Manager access level assigned for one Repository, directly or through a User Group.
Repository management by a non-administrator requires both the global Manager role and a Manager role for that Repository.

**Repository Membership**:
A direct assignment of a User to a Repository with a Repository Role.

**User Group**:
A locally managed collection of Repovio Users that can receive shared repository access.
It is distinct from a provider organization or team.

**Repository Group Grant**:
An assignment of a Repository Role to a User Group for one Repository.
It gives group members repository access without requiring individual Repository Memberships.

**MCP Access Token**:
A User-owned credential for accessing Repovio's read-only Model Context Protocol interface with that User's permissions.
It is distinct from provider credentials and a browser sign-in token.

## Notifications

**Notification Channel**:
A globally configured notification destination with event subscriptions and, where applicable, recipients.
It is not owned by a single Repository.

**Notification Event Subscription**:
A Notification Channel's selection of an event type, optionally narrowed to repositories and workflow-name patterns.
These rules select notifications independently of Workflow Filters that select which workflows to track.

**Notification Recipient**:
A Repovio User assigned to a Notification Channel as a recipient.
It is distinct from a provider-side work-item assignee.

**Notification Delivery**:
One logical notification for a channel, representing an event or a requested test notification.
It can have multiple Delivery Attempts without becoming multiple logical notifications.

**Delivery Attempt**:
One recorded attempt to send a Notification Delivery, including its success or failure.

**Workflow Run Recovered**:
A successful Workflow Run whose most recent preceding terminal run for the same workflow and execution scope failed.
An intervening terminal run with another status prevents that earlier failure from making this run a recovery.

## Synchronization and history

**Synchronization**:
The process of refreshing Repovio's local view from provider data through read-only requests.
It does not write Repovio changes back to the provider.

**Polling**:
Scheduled synchronization that checks providers for updated data.

**Repository Sync Request**:
A queued request to synchronize a Repository's selected workflows, issues, pull requests, or security alerts.
It describes Repovio's refresh work, not a request to execute a provider workflow.

**Webhook Delivery**:
An incoming provider event notification received by Repovio for synchronization processing.
It is distinct from an outgoing Notification Delivery.

**Organization Webhook**:
A locally configured incoming webhook for one provider organization and Provider Account.
GitLab group webhooks use the same concept and include descendant groups. Matching tracked Repositories inherit its
configuration automatically. Repovio does not register or modify the provider-side webhook.

**Retention**:
The policy controlling how long Repovio keeps local workflow-run or work-item history.
Removing retained local history does not delete resources at the provider.
