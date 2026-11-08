/** Keep localized product metadata reactive across client-side language and route changes. */
export function useProductSeo(title: () => string, description: () => string): void {
  const config = useRuntimeConfig().public;
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    /** Return ``${safeUrl(config.siteUrl).replace(/\/$/, '')}/images/product/dashboard-en-light.png`` when invoked. */
    ogImage: () => `${safeUrl(config.siteUrl).replace(/\/$/, '')}/images/product/dashboard-en-light.png`,
    twitterTitle: title,
    twitterDescription: description,
  });
}
