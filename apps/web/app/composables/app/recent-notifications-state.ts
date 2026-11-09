import type { RecentNotification, RecentNotifications } from '@repovio/schemas';
import { ref, watch, type Ref } from 'vue';

/**
 * Keep lazy personal history isolated across account transitions and concurrent requests.
 * @param request Authenticated recent-history request.
 * @param account Current account identity; changes synchronously erase cached content.
 * @returns Personal history state and an explicit refresh operation.
 */
export function createRecentNotificationsState(
  request: () => Promise<{ data: RecentNotifications }>,
  account: Ref<string | null>,
) {
  const items = ref<RecentNotification[]>([]);
  const loading = ref(false);
  const error = ref(false);
  let revision = 0;
  watch(
    account,
    /** Invalidate content and outstanding work when the identity changes. */ () => {
      revision++;
      items.value = [];
      loading.value = false;
      error.value = false;
    },
    { flush: 'sync' },
  );

  /** Fetch current authorization-scoped history; failed refreshes never retain a stale list. */
  async function load(): Promise<void> {
    const epoch = ++revision;
    items.value = [];
    error.value = false;
    if (!account.value) return;
    loading.value = true;
    try {
      const { data } = await request();
      if (epoch === revision) items.value = data.items;
    } catch {
      if (epoch === revision) error.value = true;
    } finally {
      if (epoch === revision) loading.value = false;
    }
  }
  return { items, loading, error, load };
}
