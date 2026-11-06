import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { brandingDefaults, brandingFileDefaults, isBrandingUrl, validatePublicBranding } from '../../shared/branding';
import { getBranding, initializeBranding, loadBranding } from './branding';
import { validateBrandingPng } from './branding-png';

const directories: string[] = [];

/** Create a disposable image file outside the repository. */
function fixture(name: string, body: string | Buffer): string {
  const directory = mkdtempSync(join(tmpdir(), 'repovio-branding-'));
  directories.push(directory);
  const file = join(directory, name);
  writeFileSync(file, body);
  return file;
}

/** Construct an isolated runtime config with all supported defaults. */
function config() {
  return { ...brandingFileDefaults, public: { ...brandingDefaults } };
}

afterEach(
  /** Remove only test-created disposable files. */ () => {
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  },
);

describe('runtime branding', /** Exercise public validation and private asset loading. */ () => {
  it('preserves defaults and strips unrelated runtime fields', /** Verify the response is a public allowlist. */ () => {
    const input = { ...config(), privateToken: 'must-not-appear' };
    const loaded = loadBranding(input);
    expect(loaded.public).toEqual(brandingDefaults);
    expect(loaded.assets.size).toBe(0);
    expect(JSON.stringify(loaded.public)).not.toContain('must-not-appear');
  });

  it('applies URL, palette, typography, and identity overrides', /** Verify valid runtime settings reach the public contract. */ () => {
    const input = config();
    Object.assign(input.public, {
      brandName: 'Example',
      brandLogoLight: 'https://example.test/logo.svg',
      themePrimary: 'rose',
      themeRadius: '8px',
      themeFontFamily: 'Arial, sans-serif',
      brandDocsUrl: '',
    });
    expect(loadBranding(input).public).toEqual(input.public);
  });

  it('gives mounted files priority and never exposes private filenames', /** Verify exact mounted bytes and a safe public URL. */ () => {
    const input = config();
    input.brandLogoLightFile = fixture('private-logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
    input.public.brandLogoLight = 'https://example.test/unused.svg';
    const loaded = loadBranding(input);
    expect(loaded.public.brandLogoLight).toBe('/api/branding/logo-light');
    expect(loaded.assets.get('logo-light')?.contentType).toBe('image/svg+xml');
    expect(loaded.assets.get('logo-light')?.body).toEqual(readFileSync(input.brandLogoLightFile));
    expect(JSON.stringify(loaded.public)).not.toContain(input.brandLogoLightFile);
    expect(loaded.assets.get('../private-logo.svg')).toBeUndefined();
  });

  it('reloads configuration only when explicitly initialized', /** Model the startup lifecycle without retaining stale settings. */ () => {
    const input = config();
    initializeBranding(input);
    input.public.brandName = 'Changed';
    expect(getBranding().public.brandName).toBe('Repovio');
    initializeBranding(input);
    expect(getBranding().public.brandName).toBe('Changed');
  });

  it('rejects unreadable, empty, unsupported, and oversized files', /** Invalid file settings must fail startup. */ () => {
    const files = [
      '/missing/branding.svg',
      fixture('empty.svg', ''),
      fixture('logo.txt', 'hello'),
      fixture('huge.svg', Buffer.alloc(5 * 1024 * 1024 + 1)),
    ];
    for (const file of files) {
      const input = config();
      input.brandLogoLightFile = file;
      expect(/** Execute invalid startup configuration. */ () => loadBranding(input)).toThrow('brandLogoLightFile');
    }
  });

  it('accepts bundled PNGs and rejects wrong dimensions and corrupt data', /** Validate install icons beyond filename extensions. */ () => {
    const png = readFileSync(new URL('../../public/pwa-192x192.png', import.meta.url));
    expect(/** Validate a real 192-pixel PNG. */ () => validateBrandingPng(png, 192)).not.toThrow();
    expect(/** Reject an incorrectly sized PNG. */ () => validateBrandingPng(png, 512)).toThrow();
    const corrupt = Buffer.from(png);
    corrupt[40] ^= 255;
    expect(/** Reject a bad PNG chunk checksum. */ () => validateBrandingPng(corrupt, 192)).toThrow();
    expect(/** Reject truncated PNG framing. */ () => validateBrandingPng(png.subarray(0, 25), 192)).toThrow();
    const input = config();
    input.brandPwaIcon_192File = fixture('pwa.png', png);
    expect(loadBranding(input).public.brandPwaIcon_192).toBe('/api/branding/pwa-icon-192');
    input.brandPwaIcon_512File = input.brandPwaIcon_192File;
    expect(/** Reject the wrong icon size at startup. */ () => loadBranding(input)).toThrow('brandPwaIcon_512File');
  });

  it('rejects invalid theme values, CSS injection, and invalid URLs', /** Keep startup validation consistent across every public setting. */ () => {
    const invalid = [
      { themePrimary: 'unknown' },
      { themeSecondary: 'zinc' },
      { themeNeutral: 'rose' },
      { themeRadius: '-1rem' },
      { themeRadius: 'calc(1rem)' },
      { themeFontFamily: 'Arial; color:red' },
      { themeDisplayFontFamily: '</style>' },
      { brandName: ' ' },
      { brandPwaThemeColor: 'red' },
      { brandPwaBackgroundColor: '#fff' },
      { brandLogoDark: '//example.test/logo.svg' },
      { brandDocsUrl: 'javascript:alert(1)' },
    ];
    for (const override of invalid) {
      expect(
        /** Validate each deliberately invalid override. */ () =>
          validatePublicBranding({ ...brandingDefaults, ...override }),
      ).toThrow();
    }
  });

  it('accepts only local absolute and HTTP(S) URLs', /** Reject unsafe schemes, protocol-relative URLs, and backslashes. */ () => {
    for (const url of ['/logo.svg', 'https://example.test/logo.svg', 'http://example.test/docs'])
      expect(isBrandingUrl(url)).toBe(true);
    for (const url of [
      '',
      '//example.test',
      'javascript:alert(1)',
      'data:image/svg+xml,test',
      'file:///tmp/logo',
      '/\\example.test',
      '/ logo.svg',
    ])
      expect(isBrandingUrl(url)).toBe(false);
  });
});
