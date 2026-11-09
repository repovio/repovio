import { computed } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useAuthStore } from '~/store/auth';
import { createRecentNotificationsState } from './recent-notifications-state';

/** Provide private history that refreshes only when the notification popover asks for it. */
export function useRecentNotifications() {
  const auth = useAuthStore();
  return createRecentNotificationsState(
    useRepovioApi().notifications.recent,
    computed(/** Identify the active recipient. */ () => auth.user?.id ?? null),
  );
}
