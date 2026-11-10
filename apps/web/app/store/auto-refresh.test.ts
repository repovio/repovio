import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { useAutoRefreshStore } from './auto-refresh';

afterEach(/** Release browser stubs between preference tests. */ () => vi.unstubAllGlobals());

it('restores a choice and persists changes without changing another Pinia instance', /** Check real store persistence. */ () => {
  const setItem = vi.fn();
  vi.stubGlobal('window', { localStorage: { getItem: /** Restore a minute cadence. */ () => '60000', setItem } });
  setActivePinia(createPinia());
  const store = useAutoRefreshStore();
  expect(store.interval).toBe(60000);
  store.setInterval(0);
  expect(store.interval).toBe(0);
  expect(setItem).toHaveBeenCalledWith('repovio:auto-refresh:interval-ms', '0');
  store.setInterval('60000');
  expect(store.interval).toBe(15000);
});

it('keeps its memory preference when localStorage access is denied', /** Privacy modes must not break the store. */ () => {
  vi.stubGlobal('window', {
    /** Model browsers that reject storage property access itself. */
    get localStorage() {
      throw Error('denied');
    },
  });
  setActivePinia(createPinia());
  const store = useAutoRefreshStore();
  expect(store.interval).toBe(15000);
  store.setInterval(300000);
  expect(store.interval).toBe(300000);
});
