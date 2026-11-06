import { brandingDefaults, type PublicBranding } from '../../shared/branding';

/** Runtime installation metadata returned independently of the application build. */
export interface BrandingManifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  display: 'standalone';
  lang: string;
  start_url: string;
  scope: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
}

/** Build the manifest from the same validated public settings used by the client. */
export function createBrandingManifest(branding: PublicBranding): BrandingManifest {
  const icons: BrandingManifest['icons'] = [
    { src: branding.brandPwaIcon_192, sizes: '192x192', type: 'image/png' },
    { src: branding.brandPwaIcon_512, sizes: '512x512', type: 'image/png' },
  ];
  if (
    branding.brandPwaIcon_192 === brandingDefaults.brandPwaIcon_192 &&
    branding.brandPwaIcon_512 === brandingDefaults.brandPwaIcon_512
  ) {
    icons.unshift({ src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' });
  }
  if (branding.brandPwaMaskableIcon)
    icons.push({ src: branding.brandPwaMaskableIcon, sizes: '512x512', type: 'image/png', purpose: 'maskable' });
  return {
    id: '/',
    name: branding.brandName,
    short_name: branding.brandName,
    description: branding.brandDescription,
    display: 'standalone',
    lang: 'en',
    start_url: '/',
    scope: '/',
    theme_color: branding.brandPwaThemeColor,
    background_color: branding.brandPwaBackgroundColor,
    icons,
  };
}
