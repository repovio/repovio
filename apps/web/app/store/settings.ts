import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useRepovioApi } from '~/composables/api/repovio-api';
import type { ApplicationSettings, UpdateApplicationSettings } from '~/types/api/resources';

export const defaultApplicationSettings: ApplicationSettings = {
  dateTimeFormat: 'LOCALE_MEDIUM',
  issueRetentionDays: 90,
  pullRequestRetentionDays: 90,
  workflowRunRetentionDays: 90,
};

/** Loads and updates the application-wide settings used by every authenticated page. */
export const useSettingsStore = defineStore(
  'settings',
  /** Creates shared settings state with deduplicated loading and persistence actions. */ () => {
    const error = ref(false);
    const initialized = ref(false);
    const loading = ref(false);
    const settings = ref<ApplicationSettings>({ ...defaultApplicationSettings });
    let activeLoad: Promise<void> | undefined;

    /** Load persisted global settings once, or force a refresh for the administration form. */
    async function load(force = false): Promise<void> {
      if (activeLoad) return activeLoad;
      if (initialized.value && !force) return;

      loading.value = true;
      error.value = false;
      activeLoad = useRepovioApi()
        .settings.get()
        .then(
          /** Stores the loaded settings and marks initialization complete. */ (response) => {
            settings.value = response.data;
            initialized.value = true;
          },
        )
        .catch(
          /** Records the settings load failure for the error state. */ () => {
            error.value = true;
          },
        )
        .finally(
          /** Releases the pending settings request so a later load may retry. */ () => {
            loading.value = false;
            activeLoad = undefined;
          },
        );
      return activeLoad;
    }

    /** Persist a complete valid settings payload and immediately update all consumers. */
    async function update(input: UpdateApplicationSettings): Promise<void> {
      settings.value = (await useRepovioApi().settings.update(input)).data;
      initialized.value = true;
      error.value = false;
    }

    return { error, initialized, load, loading, settings, update };
  },
);
