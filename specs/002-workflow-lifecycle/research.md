# Research: Workflow Lifecycle Awareness

## Authoritative workflow metadata

- GitHub workflow 408114051 returns state deleted even though historical run 42027893756 still returns failure.
- Decision: use native workflow identity and explicit state, not a run title, missing runs, or missing default-branch files.
- Source: https://docs.github.com/en/rest/actions/workflows#get-a-workflow
- Gitea exposes workflow state and deleted_at. A zero Go timestamp is not removal evidence.
- Source: https://docs.gitea.com/api/1.24/operations/actions-get-workflow/

## Provider limitations

- The inspected Forgejo instance exposes repository has_actions but no read-only individual workflow lifecycle endpoint.
- GitLab groups this application's workflows by pipeline name; missing names do not prove workflow removal.
- Decision: support explicit repository CI disabling for these providers; otherwise keep individual state UNKNOWN.
- Sources: https://forgejo.org/docs/latest/user/api/usage/ and https://docs.gitlab.com/api/projects/#retrieve-a-project

## Failure and synchronization semantics

- Omitted observations and isolated 404s preserve known state. Authentication, network, rate-limit, and server failures
  preserve provider retry semantics and must not commit partial lifecycle observations.
- Reuse repository metadata within the sync; avoid conflicting availability reads and unavailable run APIs after disabling.
- A historical run payload never reactivates a workflow; fresh metadata for the same native identity is required.

## Persistence and compatibility

- Additive enum/columns preserve historical run outcomes and allow application rollback without dropping data.
- Optional projectable response fields preserve existing Query Kit projections; current list membership changes deliberately.
- No individual workflow-removal heuristic is introduced for unsupported providers.
