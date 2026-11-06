import { useAuthStore } from '~/store/auth';

/** Keep security-alert data inaccessible to viewers without manager privileges. */
export default defineNuxtRouteMiddleware(
  /** Redirects users without manager or system-administrator privileges. */ () => {
    if (!import.meta.client) return;
    if (!['MANAGER', 'SYSTEM_ADMIN'].includes(useAuthStore().user?.role ?? '')) return navigateTo('/');
  },
);
