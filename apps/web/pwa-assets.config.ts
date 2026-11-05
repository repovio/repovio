import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/** Generate the complete installable-app icon set from Repovio's vector logo. */
export default defineConfig({
  images: ['public/logo.svg'],
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0b1238' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0b1238' } },
  },
});
