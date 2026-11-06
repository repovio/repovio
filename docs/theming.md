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
