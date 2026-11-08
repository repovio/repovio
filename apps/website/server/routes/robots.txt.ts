export default defineEventHandler(
  /** Serve crawler rules and the configured public sitemap URL. */ (event) => {
    const origin = String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, '');
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
    return `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  },
);
