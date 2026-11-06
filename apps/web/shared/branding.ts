/** Runtime defaults preserve the bundled Repovio identity. */
export const brandingDefaults = {
  themePrimary: 'indigo',
  themeSecondary: 'emerald',
  themeNeutral: 'zinc',
  themeRadius: '0.25rem',
  themeFontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  themeDisplayFontFamily: "'JetBrains Mono', ui-monospace, monospace",
  brandName: 'Repovio',
  brandDescription: 'Read-only workflow status dashboard for GitHub, GitLab, Forgejo, and Gitea.',
  brandTitleTemplate: '',
  brandLogoLight: '/logo-wordmark-light.svg',
  brandLogoDark: '/logo-wordmark-dark.svg',
  brandLogoCompact: '/logo.svg',
  brandFavicon: '/favicon.ico',
  brandAppleTouchIcon: '/apple-touch-icon-180x180.png',
  brandPwaIcon_192: '/pwa-192x192.png',
  brandPwaIcon_512: '/pwa-512x512.png',
  brandPwaMaskableIcon: '/maskable-icon-512x512.png',
  brandPwaThemeColor: '#4f46ff',
  brandPwaBackgroundColor: '#0b1238',
  brandProductUrl: '',
  brandDocsUrl: 'https://repovio.de/docs/',
  brandRepositoryUrl: 'https://github.com/repovio/repovio',
};

/** Public branding response; contains resolved asset URLs, never private filenames. */
export type PublicBranding = typeof brandingDefaults;

/** Allowlisted assets and their runtime configuration fields. */
export const brandingAssets = [
  ['logo-light', 'brandLogoLight', 'brandLogoLightFile', 0],
  ['logo-dark', 'brandLogoDark', 'brandLogoDarkFile', 0],
  ['logo-compact', 'brandLogoCompact', 'brandLogoCompactFile', 0],
  ['favicon', 'brandFavicon', 'brandFaviconFile', 0],
  ['apple-touch-icon', 'brandAppleTouchIcon', 'brandAppleTouchIconFile', 180],
  ['pwa-icon-192', 'brandPwaIcon_192', 'brandPwaIcon_192File', 192],
  ['pwa-icon-512', 'brandPwaIcon_512', 'brandPwaIcon_512File', 512],
  ['pwa-maskable-icon', 'brandPwaMaskableIcon', 'brandPwaMaskableIconFile', 512],
] as const;

/** Private runtime fields are deliberately separate from the public response. */
export const brandingFileDefaults = {
  brandLogoLightFile: '',
  brandLogoDarkFile: '',
  brandLogoCompactFile: '',
  brandFaviconFile: '',
  brandAppleTouchIconFile: '',
  brandPwaIcon_192File: '',
  brandPwaIcon_512File: '',
  brandPwaMaskableIconFile: '',
};

export const accentPalettes = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
export const neutralPalettes = ['slate', 'gray', 'zinc', 'neutral', 'stone'];

/** Accept same-origin absolute paths and HTTP(S), excluding protocol-relative URLs and backslashes. */
export function isBrandingUrl(value: string): boolean {
  if (!value || hasControlCharacters(value) || /[\\\s]/.test(value)) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Validate public runtime values before exposing them or applying CSS. Throws for invalid configuration. */
export function validatePublicBranding(input: PublicBranding): PublicBranding {
  const value = { ...input };
  for (const key of ['themePrimary', 'themeSecondary', 'themeNeutral'] as const) {
    const allowed = key === 'themeNeutral' ? neutralPalettes : accentPalettes;
    if (!allowed.includes(value[key])) throw new Error(`Invalid branding setting: ${key}`);
  }
  if (!/^\d*\.?\d+(rem|px)$/.test(value.themeRadius)) throw new Error('Invalid branding setting: themeRadius');
  for (const key of ['themeFontFamily', 'themeDisplayFontFamily'] as const) {
    if (!value[key].trim() || hasControlCharacters(value[key]) || /[;{}<>\\]/.test(value[key]))
      throw new Error(`Invalid branding setting: ${key}`);
  }
  for (const key of ['brandPwaThemeColor', 'brandPwaBackgroundColor'] as const) {
    if (!/^#[0-9a-f]{6}$/i.test(value[key])) throw new Error(`Invalid branding setting: ${key}`);
  }
  if (!value.brandName.trim()) throw new Error('Invalid branding setting: brandName');
  for (const [, key] of brandingAssets) {
    if (!value[key] && key === 'brandPwaMaskableIcon') continue;
    if (!isBrandingUrl(value[key])) throw new Error(`Invalid branding URL: ${key}`);
  }
  for (const key of ['brandProductUrl', 'brandDocsUrl', 'brandRepositoryUrl'] as const) {
    if (value[key] && !isBrandingUrl(value[key])) throw new Error(`Invalid branding URL: ${key}`);
  }
  return value;
}

/** Reject control bytes without interpreting configuration as CSS or markup. */
function hasControlCharacters(value: string): boolean {
  for (const character of value) if (character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) return true;
  return false;
}
