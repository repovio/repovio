import { getBranding } from '../utils/branding';
import { createBrandingManifest, type BrandingManifest } from '../utils/branding-manifest';

export default defineEventHandler(
  /** Serve fresh installation metadata without a build-time manifest. */ (event): BrandingManifest => {
    setHeader(event, 'Content-Type', 'application/manifest+json');
    setHeader(event, 'Cache-Control', 'no-store');
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    return createBrandingManifest(getBranding().public);
  },
);
