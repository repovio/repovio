import { docPath, getDocVersion, stableDocVersion } from '#shared/docs';
import { getDocEntries } from '#shared/docs-navigation';
import { getLocale } from '#shared/locales';
import type { Collections } from '@nuxt/content';

/** Resolve public documentation destinations, groups, and content for the active language and release. */
export function useDocs() {
  const { locale, t } = useI18n();
  const route = useRoute();
  const localePath = useLocalePath();
  const version = computed(
    /** Return `getDocVersion(String(route.params.version || stableDocVersion))` when invoked. */ () =>
      getDocVersion(String(route.params.version || stableDocVersion)),
  );
  const entries = computed(
    /** Return `getDocEntries(version.value?.id || stableDocVersion).map((entry) => ({ ...entry, title: t(entry.slug), to: localePath(docPath(version.value?` when invoked. */ () =>
      getDocEntries(version.value?.id || stableDocVersion).map(
        /** Map each entry to `({ ...entry, title: t(entry.slug), to: localePath(docPath(version.value?.id || stableDocVersion, entry.slug)), })`. */ (
          entry,
        ) => ({
          ...entry,
          title: t(entry.slug),
          to: localePath(docPath(version.value?.id || stableDocVersion, entry.slug)),
        }),
      ),
  );
  const collection = computed(
    /** Return `getLocale(locale.value).collection as keyof Collections` when invoked. */ () =>
      getLocale(locale.value).collection as keyof Collections,
  );
  return { entries, collection, version };
}
