import { defineCollection, defineContentConfig } from '@nuxt/content';
import { supportedLocales } from './shared/locales';

export default defineContentConfig({
  collections: Object.fromEntries(
    supportedLocales.map(
      /** Map each entry to `[ collection, defineCollection({ type: 'page', source: { include: `${code}/** /*.md`, prefix: '', exclude: ['** /docs/next/**'] }, }), ]`. */ ({
        code,
        collection,
      }) => [
        collection,
        defineCollection({
          type: 'page',
          source: { include: `${code}/**/*.md`, prefix: '', exclude: ['**/docs/next/**'] },
        }),
      ],
    ),
  ),
});
