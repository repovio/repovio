# GitHub security setup

Settings inspected on November 5, 2026. No paid GitHub security feature was activated.

| Repository      | Visibility                           | Dependency graph | Dependabot alerts | Security updates | Secret Protection               | Push protection                 | Private vulnerability reports     |
| --------------- | ------------------------------------ | ---------------- | ----------------- | ---------------- | ------------------------------- | ------------------------------- | --------------------------------- |
| repovio/repovio | Private                              | Enabled          | Enabled           | Enabled          | Not offered by current plan     | Not offered by current plan     | Use public docs reporting channel |
| repovio/website | Private                              | Enabled          | Enabled           | Enabled          | Not offered by current plan     | Not offered by current plan     | Use public docs reporting channel |
| repovio/docs    | Public                               | Enabled          | Enabled           | Enabled          | Enabled                         | Enabled                         | Enabled                           |
| repovio/.github | Private pending approved publication | Enabled          | Enabled           | Enabled          | Recheck after public visibility | Recheck after public visibility | Recheck after public visibility   |

These values were read back from GitHub after configuration. Dependabot version-update manifests and checksum-pinned
CodeQL workflows are prepared locally. Their presence locally does not mean GitHub has executed them. The three new
repositories still require their reviewed content commits and the website requires an exact docs submodule gitlink.

Public CodeQL workflows cover Actions in the community repository and Actions/JavaScript in docs. Private application
and website CodeQL jobs run only with `CODEQL_ENABLED=true` where the required GitHub capability is already available.
Do not enable a paid subscription or change visibility to bypass the private-repository limitation.

After approved initial publication, verify public repository visibility and Security settings again, verify the funding
button, and inspect actual current-head workflow runs. Enable Secret Protection, push protection and private reporting
for the public community repository where available. Keep app and website private.

Release promotion additionally requires a dedicated, restricted GitHub App and the variables/secrets documented in the
website README. It stays disabled until configured. No real provider integration, remote Actions execution, release,
container publication, DNS change or production deployment has been verified by local checks alone.
