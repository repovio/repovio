# PWA State Model

No Prisma models, migrations, API DTOs, or durable server records change.

## Installation Identity

The existing `BrandingManifest` remains authoritative: `id`, `scope`, and `start_url` are `/`; `display` is `standalone`;
`name`, `short_name`, `description`, colors, and icons derive from validated runtime branding. The manifest remains
public and `no-store`. Installed browser metadata may refresh later than the server response.

## Client State

| State              | Owner                    | Transition and constraint                                                  |
| ------------------ | ------------------------ | -------------------------------------------------------------------------- |
| Worker unavailable | Browser/plugin           | Continue online without PWA controls; no unhandled registration rejection  |
| Active worker      | Browser/plugin           | Serve only existing public static caches; request protected content online |
| Update waiting     | Plugin `needRefresh`     | Show existing update prompt                                                |
| Prompt dismissed   | Component `dismissed`    | Hide for the current component lifetime; do not activate worker            |
| Activation pending | Component `updating`     | Keep Update loading and prevent duplicate activation                       |
| Activation failed  | Component `updateFailed` | Show localized error; allow explicit retry                                 |
| New worker active  | Browser/plugin           | Reload after explicit accepted update; avoid reload loops                  |

Treat these as observable states, not a proposal to create a new state-machine framework. Verify actual plugin promise
and controller-change behavior before changing the existing loading logic.

## Cache Boundary

Only public static build assets belong in Workbox-managed Cache Storage. Protected API responses, authentication
responses, realtime traffic, runtime branding, and the manifest must remain absent. No per-user persistent cache or
offline request queue is introduced. Logout/account switching tests inspect both cache entries and subsequent responses.

## Installation Capability

Browser-controlled installation and standalone display are independent observations. Absence of `beforeinstallprompt`
does not establish whether installation is supported or whether the app is installed. Do not persist an inferred
installation flag or introduce an installation-status API.
