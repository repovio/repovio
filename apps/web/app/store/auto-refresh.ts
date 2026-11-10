import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  normalizeRefreshInterval,
  readRefreshInterval,
  writeRefreshInterval,
  type RefreshInterval,
} from '../composables/app/auto-refresh-state';

/** Share a validated browser display preference without changing server or provider settings. */
export const useAutoRefreshStore = defineStore(
  'auto-refresh',
  /** Initialize origin-local preference with a safe memory fallback. */ () => {
    const interval = ref<RefreshInterval>(15000);
    try {
      if (typeof window !== 'undefined') interval.value = readRefreshInterval(window.localStorage);
    } catch {
      // Accessing localStorage itself can throw in privacy-restricted browser contexts.
    }
    /** Apply only supported values, persisting best effort while keeping the UI usable. */
    function setInterval(value: unknown): void {
      interval.value = normalizeRefreshInterval(value);
      try {
        if (typeof window !== 'undefined') writeRefreshInterval(window.localStorage, interval.value);
      } catch {
        // Keep the current in-memory preference when the browser denies storage access.
      }
    }
    return { interval, setInterval };
  },
);
