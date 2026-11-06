import type { PublicBranding } from '../../../shared/branding';
import { getBranding } from '../../utils/branding';

export default defineEventHandler(
  /** Expose resolved public configuration to the SPA without private file settings. */ (event): PublicBranding => {
    setHeader(event, 'Cache-Control', 'no-store');
    return getBranding().public;
  },
);
