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
    load: () =>
      run(async () => {
        configuration.value = (await api.githubApp.configuration()).data;
      }),
    save: (input: SaveGitHubApp, saved: () => void) =>
      run(async () => {
        configuration.value = (await api.githubApp.save(input)).data;
        installations.value = [];
        saved();
      }),
    refresh: () =>
      run(async () => {
        installations.value = (await api.githubApp.installations()).data;
      }),
    remove: () =>
      run(async () => {
        await api.githubApp.delete();
        configuration.value = (await api.githubApp.configuration()).data;
        installations.value = [];
      }),
    connect: (installationId: string, displayName: string, connected: () => Promise<void>) =>
      run(async () => {
        await api.githubApp.connect({ installationId, displayName });
        installations.value = (await api.githubApp.installations()).data;
        await connected();
      }),
  };
}
