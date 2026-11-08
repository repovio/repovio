import { vueFormatRules, vueLayoutPlugin } from '../../scripts/vue-format-rules.mjs';
import withNuxt from './.nuxt/eslint.config.mjs';
export default withNuxt(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.vue'],
    plugins: { repovio: vueLayoutPlugin },
    rules: {
      ...vueFormatRules,
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'UNIQUE',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'GLOBAL',
            'ATTR_STATIC',
            'ATTR_DYNAMIC',
            'EVENTS',
            'CONTENT',
          ],
          alphabetical: false,
        },
      ],
    },
  },
  { ignores: ['vendor/**', '.output/**', 'test-results/**', 'playwright-report/**'] },
);
