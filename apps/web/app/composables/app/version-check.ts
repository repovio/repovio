import { computed } from 'vue';

import { useRepovioApi } from '~/composables/api/repovio-api';

/** Load and compare the installed Repovio version with the latest GitHub release. */
export function useVersionCheck() {
  const api = useRepovioApi();
  const current = useRuntimeConfig().public.appVersion;
  const latest = useState<string | null>(
    'latest-app-version',
    /** Evaluates `null` when useState invokes this callback. */ () => null,
  );
  const loaded = useState(
    'latest-app-version-loaded',
    /** Evaluates `false` when useState invokes this callback. */ () => false,
  );

  /** Load the latest version once for the current application session. */
  async function load(): Promise<void> {
    if (loaded.value) return;

    try {
      latest.value = (await api.version()).data.latest;
    } catch {
      latest.value = null;
    } finally {
      loaded.value = true;
    }
  }

  const updateAvailable = computed(
    /** Derives update available from the current reactive dependencies. */ () =>
      Boolean(latest.value) && compareSemver(latest.value!, current) > 0,
  );

  return { current, latest, load, updateAvailable };
}

/** Compares numeric semantic-version components for update detection. */
function compareSemver(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
