import { getBranding } from '../../utils/branding';

export default defineEventHandler(
  /** Serve only startup-loaded assets; arbitrary paths and unconfigured identifiers return 404. */ (event) => {
    const asset = getBranding().assets.get(getRouterParam(event, 'asset') ?? '');
    if (!asset) throw createError({ statusCode: 404, statusMessage: 'Branding asset not found' });
    setHeader(event, 'Content-Type', asset.contentType);
    setHeader(event, 'Cache-Control', 'no-store');
    setHeader(event, 'X-Content-Type-Options', 'nosniff');
    return asset.body;
  },
);
