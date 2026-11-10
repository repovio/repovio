import { defineCollection, defineContentConfig } from '@nuxt/content';
import { dirname } from 'node:path';
import { readReleaseNotes, releaseNotesPath } from './scripts/check-release-notes.mjs';
import { supportedLocales } from './shared/locales';

readReleaseNotes();

export default defineContentConfig({
  collections: {
    release_notes: defineCollection({
      type: 'page',
      source: { cwd: dirname(releaseNotesPath), include: 'CHANGELOG.md', prefix: '/application-releases' },
    }),
    ...Object.fromEntries(
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
  },
});
