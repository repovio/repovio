import { describe, expect, it } from 'vitest';
import { brandingDefaults } from '../../shared/branding';
import { createBrandingManifest } from './branding-manifest';

describe('runtime branding manifest', /** Verify metadata and icon purpose boundaries. */ () => {
  it('preserves bundled installation defaults', /** Keep existing PWA identity, dimensions, and scope. */ () => {
    const manifest = createBrandingManifest(brandingDefaults);
    expect(manifest).toMatchObject({
      name: 'Repovio',
      short_name: 'Repovio',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      theme_color: '#4f46ff',
      background_color: '#0b1238',
    });
    expect(manifest.icons).toHaveLength(4);
    expect(manifest.icons.at(-1)).toMatchObject({ purpose: 'maskable', sizes: '512x512' });
  });
  it('uses runtime values without treating regular icons as maskable', /** Separate explicitly configured maskable icons from regular install icons. */ () => {
    const manifest = createBrandingManifest({
      ...brandingDefaults,
      brandName: 'Example',
      brandDescription: 'Example dashboard',
      brandPwaThemeColor: '#112233',
      brandPwaBackgroundColor: '#334455',
      brandPwaIcon_192: '/api/branding/pwa-icon-192',
      brandPwaIcon_512: '/api/branding/pwa-icon-512',
      brandPwaMaskableIcon: '',
    });
    expect(manifest).toMatchObject({
      name: 'Example',
      description: 'Example dashboard',
      theme_color: '#112233',
      background_color: '#334455',
    });
    expect(manifest.icons).toHaveLength(2);
    for (const icon of manifest.icons) expect(icon.purpose).toBeUndefined();
  });
});
