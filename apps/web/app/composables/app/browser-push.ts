import { watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useAuthStore } from '~/store/auth';
import { createBrowserPushState, removeBrowserEnrollment, type PushPlatform } from './browser-push-state';

/** Provide secure browser capability access without registering a worker during passive reads. */
export function browserPushPlatform(): PushPlatform | null {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  )
    return null;
  return {
    supported: true,
    /** Reads current permission without prompting. */
    permission: () => Notification.permission,
    /** Requests permission only through an explicit user action. */
    requestPermission: () => Notification.requestPermission(),
    /** Finds the existing root registration without creating one. */
    getRegistration: () => navigator.serviceWorker.getRegistration('/'),
    /** Creates the root production worker only for enrollment. */
    register: () => navigator.serviceWorker.register('/sw.js', { scope: '/' }),
    /** Waits until the current registration has an active worker. */
    get ready() {
      return navigator.serviceWorker.ready;
    },
  };
}

/** Manage the authenticated user's PushSubscription for the current browser. */
export function useBrowserPush() {
  const state = createBrowserPushState(useRepovioApi().browserPush, browserPushPlatform());
  const auth = useAuthStore();
  watch(
    /** Identify account transitions without caching identity in push data. */ () => auth.user?.id,
    /** Invalidate all prior-account state. */ () => state.reset(),
    { flush: 'sync' },
  );
  return state;
}

/** Clean up this device before the authentication token is discarded. */
export async function cleanupBrowserPush(): Promise<void> {
  await removeBrowserEnrollment(useRepovioApi().browserPush, browserPushPlatform());
}
