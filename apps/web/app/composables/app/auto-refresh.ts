import { useDocumentVisibility, useOnline } from '@vueuse/core';
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import { useAuthStore } from '../../store/auth';
import { useAutoRefreshStore } from '../../store/auto-refresh';
import { createRefreshTarget } from './auto-refresh-state';

/** Register one complete view refresh; query loaders remain owners of rows, scope, and error feedback. */
export function useAutoRefresh(run: () => Promise<unknown>, busy: MaybeRefOrGetter<boolean>) {
  const preference = useAutoRefreshStore();
  const auth = useAuthStore();
  const visibility = useDocumentVisibility();
  const online = useOnline();
  const pending = ref(false);
  const eligible = computed(
    /** Pause background, offline, and unauthenticated automatic reads. */ () =>
      visibility.value === 'visible' && online.value && !!auth.accessToken,
  );
  const target = createRefreshTarget({
    interval: /** Read the current shared cadence. */ () => preference.interval,
    busy: /** Include every initial/query/supporting request owned by the view. */ () => toValue(busy),
    eligible: /** Read browser eligibility without opening a second status socket. */ () => eligible.value,
    run,
    pending: /** Expose the complete grouped-operation lifetime to the manual control. */ (value) => {
      pending.value = value;
    },
  });
  const stop = watch(
    [
      /** Observe cadence changes. */ () => preference.interval,
      /** Observe independent query work. */ () => toValue(busy),
      eligible,
    ],
    target.sync,
  );
  onMounted(target.activate);
  onActivated(target.activate);
  onDeactivated(target.deactivate);
  watch(
    /** Observe authentication changes immediately, even before navigation. */ () => auth.accessToken,
    /** Stop explicit and automatic work after local session clearing. */ (token) => {
      if (!token) target.deactivate();
      else target.activate();
    },
    { flush: 'sync' },
  );
  onScopeDispose(
    /** Release watchers, browser listeners, and this instance's deadline. */ () => {
      stop();
      target.dispose();
    },
  );
  const loading = computed(
    /** Keep manual refresh busy through all owned reads. */ () => pending.value || toValue(busy),
  );
  return { refresh: target.refresh, loading };
}
