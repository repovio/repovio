import { initializeBranding } from '../utils/branding';

export default defineNitroPlugin(
  /** Validate and load installation branding before accepting requests. */ () => {
    initializeBranding(useRuntimeConfig());
  },
);
