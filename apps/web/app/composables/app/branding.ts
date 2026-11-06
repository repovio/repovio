import type { Ref } from 'vue';
import { brandingDefaults, type PublicBranding } from '../../../shared/branding';

/** Share validated installation branding, loaded before the application renders. */
export function useBranding(): Ref<PublicBranding> {
  return useState<PublicBranding>(
    'installation-branding',
    /** Supply bundled defaults until plugin initialization. */ () => ({ ...brandingDefaults }),
  );
}
