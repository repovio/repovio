import { docPath, docVersions } from '#shared/docs';
import { localizedPath, supportedLocales } from '../../shared/locales';
import { productPaths } from '../../shared/product';

export default defineEventHandler(
  /** List published product and documentation URLs across supported locales. */ (event) => {
    const origin = String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, '');
    /** Compute `escape` as `value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')`. */
    const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
    const pages = [
      '/',
      ...productPaths,
      '/imprint',
      '/privacy-policy',
      ...docVersions
        .filter(/** Keep entries matching `version.status !== 'preview'`. */ (version) => version.status !== 'preview')
        .flatMap(
          /** Evaluate `version.slugs.map((slug) => docPath(version.id, slug))`. */ (version) =>
            version.slugs.map(
              /** Map each entry to `docPath(version.id, slug)`. */ (slug) => docPath(version.id, slug),
            ),
        ),
    ];
    const urls = pages.flatMap(
      /** Evaluate `supportedLocales.map((locale) => localizedPath(locale.code, path))`. */ (path) =>
        supportedLocales.map(
          /** Map each entry to `localizedPath(locale.code, path)`. */ (locale) => localizedPath(locale.code, path),
        ),
    );
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(/** Map each entry to ``<url><loc>${escape(origin + path)}</loc></url>``. */ (path) => `<url><loc>${escape(origin + path)}</loc></url>`).join('')}</urlset>`;
  },
);
