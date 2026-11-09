# Theming and branding

Repovio supports installation-wide runtime configuration. Set environment variables on the web service and restart it;
the same production image can be reused. Defaults preserve Repovio's bundled appearance.

Public values use `NUXT_PUBLIC_THEME_*` and `NUXT_PUBLIC_BRAND_*`. Public configuration is visible without authentication;
never include credentials. Private `NUXT_BRAND_*_FILE` settings point to local files inside the web container. Files
are loaded once at startup and take precedence over public URLs. Unsupported, empty, unreadable, oversized (over 5 MiB),
or incorrectly sized installation PNG files prevent startup. Private paths are never included in public responses.

`GET /api/branding` returns validated public configuration with resolved asset URLs. `GET /api/branding/:asset` serves
only explicitly configured files. Both responses use `Cache-Control: no-store`; unknown asset identifiers return 404.
External asset URLs are loaded by the browser, never downloaded by the server.

The same configuration drives sign-in and sidebar logos, accessible brand names, titles, description, browser icons,
and Nuxt UI colors. Light/dark/system preferences remain user-controlled. `NUXT_PUBLIC_BRAND_PRODUCT_URL` adds a link
on sign-in; empty product/docs/repository URLs hide their links. Help text, copyright, search text, and the upstream
release source continue to identify Repovio. No new translation keys are needed for configurable brand values.

Use supported Tailwind accent names for primary/secondary and slate/gray/zinc/neutral/stone for neutral. Radius accepts
nonnegative px/rem values. Font settings select installed/system fonts; they do not download custom fonts. Defaults
retain IBM Plex Sans and JetBrains Mono. All built-in palettes remain available in the production stylesheet.

## Environment variables

All settings apply to the `web` service. The shipped `compose.yml` already reads `.env` through `env_file`.
The complete defaults are listed in `.env.example`.

| Prefix               | Suffixes                                                                | Behavior                                                                                      |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_THEME_` | `PRIMARY`, `SECONDARY`, `NEUTRAL`                                       | Named palettes; defaults indigo, emerald, zinc.                                               |
| `NUXT_PUBLIC_THEME_` | `RADIUS`                                                                | Nonnegative value in px or rem; default `0.25rem`.                                            |
| `NUXT_PUBLIC_THEME_` | `FONT_FAMILY`, `DISPLAY_FONT_FAMILY`                                    | CSS font stacks for text and headings.                                                        |
| `NUXT_PUBLIC_BRAND_` | `NAME`, `DESCRIPTION`, `TITLE_TEMPLATE`                                 | Installation metadata; `%s` substitutes the page title. An empty template uses `%s · <NAME>`. |
| `NUXT_PUBLIC_BRAND_` | `LOGO_LIGHT`, `LOGO_DARK`, `LOGO_COMPACT`, `FAVICON`                    | Asset URLs; compact logo appears in the collapsed sidebar.                                    |
| `NUXT_PUBLIC_BRAND_` | `APPLE_TOUCH_ICON`, `PWA_ICON_192`, `PWA_ICON_512`, `PWA_MASKABLE_ICON` | PNG icon URLs; dimensions 180, 192, 512, and 512 pixels respectively.                         |
| `NUXT_PUBLIC_BRAND_` | `PWA_THEME_COLOR`, `PWA_BACKGROUND_COLOR`                               | Six-digit hexadecimal colors; defaults `#4f46ff` and `#0b1238`.                               |
| `NUXT_PUBLIC_BRAND_` | `PRODUCT_URL`, `DOCS_URL`, `REPOSITORY_URL`                             | Optional external or local links. Empty values hide them.                                     |

Supported accent palettes: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet,
purple, fuchsia, pink, rose. Indigo and emerald retain Repovio's bundled palette values. Neutral palettes: slate,
gray, zinc, neutral, stone. CSS declaration delimiters and control characters are not accepted in font stacks.

For each image suffix above, `NUXT_BRAND_<SUFFIX>_FILE` specifies a private file override. For example,
`NUXT_BRAND_PWA_ICON_192_FILE=/app/branding/pwa-192.png`. Paths are resolved inside the running container; relative
paths resolve against its working directory (`/app` in the shipped image). Logo/favicon files accept SVG, PNG, JPEG,
WebP, GIF, or ICO extensions. Installation and Apple touch icons require valid PNG data at the stated dimensions.
Files are limited to 5 MiB each. SVG files must come from a trusted installation administrator.

URLs must be same-origin absolute paths beginning with a single `/`, or absolute HTTP(S) URLs. Protocol-relative,
file, data, and JavaScript URLs are rejected. URL assets must be reachable by the browser; the server does not inspect
remote image contents. Keep remote install icons as correctly sized PNGs with an appropriate content type.

## Docker Compose example

Create `branding/` beside `compose.yml` with your light/dark logos, compact mark, favicon, and PNG icons. Create a
`compose.branding.yml` override:

```yaml
services:
  web:
    volumes:
      - ./branding:/app/branding:ro
    environment:
      NUXT_PUBLIC_THEME_PRIMARY: rose
      NUXT_PUBLIC_THEME_SECONDARY: amber
      NUXT_PUBLIC_THEME_NEUTRAL: slate
      NUXT_PUBLIC_BRAND_NAME: Example Forge
      NUXT_PUBLIC_BRAND_DESCRIPTION: Our workflow dashboard
      NUXT_PUBLIC_BRAND_PRODUCT_URL: https://example.com
      NUXT_PUBLIC_BRAND_DOCS_URL: ''
      NUXT_PUBLIC_BRAND_PWA_THEME_COLOR: '#e11d48'
      NUXT_PUBLIC_BRAND_PWA_BACKGROUND_COLOR: '#0f172a'
      NUXT_BRAND_LOGO_LIGHT_FILE: /app/branding/logo-light.svg
      NUXT_BRAND_LOGO_DARK_FILE: /app/branding/logo-dark.svg
      NUXT_BRAND_LOGO_COMPACT_FILE: /app/branding/mark.svg
      NUXT_BRAND_FAVICON_FILE: /app/branding/favicon.ico
      NUXT_BRAND_APPLE_TOUCH_ICON_FILE: /app/branding/apple-touch-icon.png
      NUXT_BRAND_PWA_ICON_192_FILE: /app/branding/pwa-192.png
      NUXT_BRAND_PWA_ICON_512_FILE: /app/branding/pwa-512.png
      NUXT_BRAND_PWA_MASKABLE_ICON_FILE: /app/branding/maskable-512.png
```

Make files readable by the container and recreate only the web service:

```sh
docker compose -f compose.yml -f compose.branding.yml up -d --no-deps --force-recreate web
```

Environment/file changes take effect when the web process starts. No registry push, application image rebuild, or
API/database changes are needed. To omit the maskable icon, unset its private file override and set
`NUXT_PUBLIC_BRAND_PWA_MASKABLE_ICON` to an empty string. Regular install icons are never automatically marked maskable.
The Apple touch icon remains independent of the favicon and regular install icons.

## PWA and caching

`/manifest.webmanifest` resolves runtime settings and mounted asset URLs, with `Cache-Control: no-store`.
The service worker does not precache the manifest or branding API responses and does not cache protected API data.
Its existing update prompt remains unchanged. Browsers decide when an already installed application's metadata is
refreshed; reinstalling may be necessary to see a changed name/icon immediately.

Run `pnpm --dir apps/web e2e:pwa` for installability, service-worker lifecycle, runtime overrides, mounted icons, and
invalid-startup regression tests against the same production build with two configurations.

If using a reverse proxy, route `/api/branding` and `/api/branding/*` to the web service, alongside
`/manifest.webmanifest`. The existing Nest application endpoints under `/api/v1` still belong to the API service.

### Install and launch

Use HTTPS for a shared installation. Desktop localhost is suitable for development checks; an untrusted HTTP LAN
address does not provide the secure context needed for production service workers. Install through native browser
controls rather than expecting an application-specific Install button:

- Desktop Chromium: open Repovio, then use the address-bar installation control or the browser menu's installation
  command when offered. Launch the installed application and verify that it opens the same origin in a standalone window.
- Android Chromium: open Repovio in Chrome and choose the browser menu's **Install app** or **Add to Home screen** option.
  Browser versions may offer different labels or an ordinary shortcut; verify the resulting launch mode on the device.
- iOS/iPadOS Safari: open Repovio, open the Share menu, and choose **Add to Home Screen**. Enable **Open as Web App** if
  that control is available. Launch the saved icon to verify standalone behavior and sign in on the installed surface.

The browser controls installation availability and wording. Missing installation controls do not prevent normal online
use, and absence of `beforeinstallprompt` does not prove that an application is unsupported or already installed.
Brand name/icon updates on an existing installation may require browser metadata refresh or reinstallation. The stable
manifest identity, scope, and start URL remain `/`; runtime branding does not create a new application identity.

For local or OpenID Connect sign-in, verify the complete flow in the installed application, including the return to an
authorized deep link. A successful desktop browser login does not prove installed iOS/Android callback behavior. Record
OS/browser versions and actual installed launches separately from responsive screenshots or Playwright emulation.

### Connectivity and protected data

Installation does not provide offline access to repositories. The service worker precaches public static build assets
only. It has no navigation fallback and no runtime response cache: protected API/authentication responses, realtime
traffic, runtime branding, and the manifest remain network-only from the worker's perspective. A cold offline launch
can fail; an already-open page may keep previously rendered information visible, which does not mean it has fetched a
fresh repository status. Reconnect before relying on refreshed data.

Local-account regression checks exercise logout and a second account in the same worker-controlled browser context;
the second account receives only its own authorized online responses. This cache policy does not replace API
authorization. It also does not imply that all browser HTTP storage is disabled: existing authenticated HTTP headers
and local session-token persistence retain their existing contracts.

A waiting update offers **Later** or **Update**. Later keeps the current version; accepted activation may affect other
open tabs because a service-worker registration is shared. Activation failures retain the current page, announce a
localized status, and allow retry. Registration failure leaves normal online use available. Repeated updates and two-tab
behavior are covered by production tests; deployment proxy/CDN behavior must be verified in its own environment.

For reproducible mocked and disposable real-API checks, see
[the PWA validation guide](../specs/003-pwa-support/quickstart.md). Real installed-device and OIDC callback observations
must be recorded separately; a passing Chromium suite does not verify those platforms.
