import { readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import {
  brandingAssets,
  brandingDefaults,
  brandingFileDefaults,
  validatePublicBranding,
  type PublicBranding,
} from '../../shared/branding';
import { validateBrandingPng } from './branding-png';

/** Server-only runtime configuration accepted by the asset loader. */
export type BrandingConfig = typeof brandingFileDefaults & { public: PublicBranding };

/** Loaded public configuration and the allowlisted in-memory mounted assets. */
export interface LoadedBranding {
  public: PublicBranding;
  assets: Map<string, { body: Buffer; contentType: string }>;
}

const mediaTypes: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

/** Load configured regular files once at startup; private paths never enter the returned public configuration. */
export function loadBranding(config: BrandingConfig): LoadedBranding {
  const publicConfig = { ...brandingDefaults };
  for (const key of Object.keys(brandingDefaults) as (keyof PublicBranding)[]) publicConfig[key] = config.public[key];
  const assets: LoadedBranding['assets'] = new Map();
  for (const [asset, key, fileKey, size] of brandingAssets) {
    if (!config[fileKey]) continue;
    try {
      const path = resolve(config[fileKey]);
      const contentType = mediaTypes[extname(path).toLowerCase()];
      const stat = statSync(path);
      if (!contentType || !stat.isFile() || !stat.size || stat.size > 5 * 1024 * 1024)
        throw new Error('Invalid image file');
      const body = readFileSync(path);
      if (size) {
        if (contentType !== 'image/png') throw new Error('Expected a PNG file');
        validateBrandingPng(body, size);
      }
      assets.set(asset, { body, contentType });
      publicConfig[key] = `/api/branding/${asset}`;
    } catch {
      throw new Error(
        `Invalid branding file setting: ${fileKey}; expected a readable image${size ? ` (${size}x${size} PNG)` : ''} of at most 5 MiB`,
      );
    }
  }
  return { public: validatePublicBranding(publicConfig), assets };
}

let branding: LoadedBranding | undefined;

/** Initialize validated runtime branding before serving requests. */
export function initializeBranding(config: BrandingConfig): void {
  branding = loadBranding(config);
}

/** Return initialized server-only state; request parameters never select filesystem paths. */
export function getBranding(): LoadedBranding {
  if (!branding) throw new Error('Branding has not been initialized');
  return branding;
}
