import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createRecentNotificationsState } from './recent-notifications-state';

describe('personal notification history', /** Tests account-private asynchronous state. */ () => {
  it('clears old entries immediately when account changes and ignores late responses', /** Checks cross-account cache isolation. */ async () => {
    const account = ref<string | null>('a');
    let resolve!: (response: unknown) => void;
    const api = vi.fn().mockImplementation(
      /** Defer the response until after account change. */ () =>
        new Promise(
          /** Capture the old-account resolver. */ (done) => {
            resolve = done;
          },
        ),
    );
    const history = createRecentNotificationsState(api, account);
    const pending = history.load();
    account.value = 'b';
    resolve({ data: { items: [{ id: 'foreign' }] } });
    await pending;
    expect(history.items.value).toEqual([]);
    expect(history.loading.value).toBe(false);
  });
  it('clears stale data after failed refresh and permits retry', /** Checks failure and retry state. */ async () => {
    const api = vi
      .fn()
      .mockResolvedValueOnce({ data: { items: [{ id: 'own' }] } })
      .mockRejectedValueOnce(new Error('401'))
      .mockResolvedValueOnce({ data: { items: [] } });
    const state = createRecentNotificationsState(api, ref('a'));
    await state.load();
    expect(state.items.value).toHaveLength(1);
    await state.load();
    expect(state.items.value).toEqual([]);
    expect(state.error.value).toBe(true);
    await state.load();
    expect(state.error.value).toBe(false);
  });
});
