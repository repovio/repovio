import { useBranding } from '~/composables/app/branding';
import { brandingDefaults, type PublicBranding } from '../../shared/branding';

export default defineNuxtPlugin(
  /** Load public runtime metadata before rendering any brand surface. */ async () => {
    const branding = useBranding();
    branding.value = await $fetch<PublicBranding>('/api/branding');
    const config = branding.value;
    updateAppConfig({
      ui: { colors: { primary: config.themePrimary, secondary: config.themeSecondary, neutral: config.themeNeutral } },
    });
    useHead({
      title: config.brandName,
      /** Format page titles without interpreting the configured name or template as markup. */
      titleTemplate: (title) =>
        (config.brandTitleTemplate || `%s · ${config.brandName}`).replaceAll('%s', title || config.brandName),
      meta: [
        { name: 'description', content: config.brandDescription },
        { name: 'theme-color', content: config.brandPwaThemeColor },
        { name: 'apple-mobile-web-app-title', content: config.brandName },
      ],
      link: [
        { rel: 'icon', href: config.brandFavicon },
        ...(config.brandFavicon === brandingDefaults.brandFavicon
          ? [{ rel: 'icon' as const, type: 'image/svg+xml', sizes: 'any', href: '/favicon.svg' }]
          : []),
        { rel: 'apple-touch-icon', sizes: '180x180', href: config.brandAppleTouchIcon },
      ],
      style: [
        {
          textContent: `:root{--ui-radius:${config.themeRadius};--font-sans:${config.themeFontFamily};--font-display:${config.themeDisplayFontFamily}}`,
        },
      ],
    });
  },
);
