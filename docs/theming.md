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
