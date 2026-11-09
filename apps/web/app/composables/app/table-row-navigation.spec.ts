import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTableRowNavigation } from './table-row-navigation';

beforeEach(
  /** Isolate navigation observations per scenario. */ () => {
    vi.stubGlobal('navigateTo', vi.fn());
  },
);
describe('table row navigation', /** Verify the typed event boundary used after native Nuxt UI handling. */ () => {
  it('accepts a native default-prevented activation without double navigation', /** Preserve Nuxt UI event semantics. */ async () => {
    const event = new Event('click', { cancelable: true });
    event.preventDefault();
    const select = useTableRowNavigation<{ id: string }>(
      /** Resolve the existing internal target. */ (item) => `/issues/${item.id}`,
    );
    await select(event, { original: { id: 'one' } });
    expect(navigateTo).toHaveBeenCalledExactlyOnceWith('/issues/one');
  });
});
