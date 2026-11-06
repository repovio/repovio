import { ref } from 'vue';
import type { GitHubAppConfiguration, GitHubAppInstallation, SaveGitHubApp } from '~/types/api/resources';
import { useRepovioApi } from './repovio-api';

/** Keep App setup requests, safe metadata and pending state outside the presentation component. */
export function useGitHubApp() {
  const api = useRepovioApi();
  const configuration = ref<GitHubAppConfiguration>();
  const installations = ref<GitHubAppInstallation[]>([]);
  const pending = ref(false);
  const error = ref(false);

  /** Run one full UI action, retaining loading state across all dependent requests. */
  async function run(action: () => Promise<void>): Promise<void> {
    if (pending.value) return;
    pending.value = true;
    error.value = false;
    try {
      await action();
    } catch {
      error.value = true;
    } finally {
      pending.value = false;
    }
  }

  return {
    configuration,
    installations,
    pending,
    error,
    /** Loads the safe GitHub App configuration into shared state. */
    load: () =>
      run(
        /** Stores configuration after the metadata request completes. */ async () => {
          configuration.value = (await api.githubApp.configuration()).data;
        },
      ),
    /** Persists App credentials and clears stale installation choices before notifying the form. */
    save: (input: SaveGitHubApp, saved: () => void) =>
      run(
        /** Stores saved metadata, clears installation choices, and invokes the completion callback. */ async () => {
          configuration.value = (await api.githubApp.save(input)).data;
          installations.value = [];
          saved();
        },
      ),
    /** Refreshes the installation choices available to this App. */
    refresh: () =>
      run(
        /** Replaces installation choices with the current provider response. */ async () => {
          installations.value = (await api.githubApp.installations()).data;
        },
      ),
    /** Removes App configuration and refreshes the remaining safe metadata. */
    remove: () =>
      run(
        /** Deletes local configuration and clears installation state while retaining the pending action. */ async () => {
          await api.githubApp.delete();
          configuration.value = (await api.githubApp.configuration()).data;
          installations.value = [];
        },
      ),
    /** Connects the selected installation and refreshes both installation and account views. */
    connect: (installationId: string, displayName: string, connected: () => Promise<void>) =>
      run(
        /** Connects the installation and awaits all dependent view refreshes. */ async () => {
          await api.githubApp.connect({ installationId, displayName });
          installations.value = (await api.githubApp.installations()).data;
          await connected();
        },
      ),
  };
}
