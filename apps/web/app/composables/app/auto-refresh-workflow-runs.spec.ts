import { useTable } from '@querry-kit/nuxt/table';
import axios, { type AxiosAdapter } from 'axios';
import { expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick } from 'vue';
import { serializeApiReads } from '../api/serialized-reads';

it('serializes actual Query Kit watcher and manual requests while retaining the latest query', /** Exercise the installed closure-driven refresh implementation. */ async () => {
  let finish!: () => void;
  let count = 0;
  let active = 0;
  let maximum = 0;
  /** Count real transport overlap and expose a deliberately slow request. */
  const adapter: AxiosAdapter = async (config) => {
    active++;
    maximum = Math.max(maximum, active);
    count++;
    if (count === 2)
      await new Promise<void>(
        /** Hold the manual request while query watchers run. */ (resolve) => {
          finish = resolve;
        },
      );
    active--;
    return {
      data: { items: [{ id: String(count) }], meta: { itemCount: 100, pageCount: 4 } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  const client = axios.create({ adapter });
  const controller = new AbortController();
  serializeApiReads(client, controller.signal);
  const scope = effectScope();
  const table = scope.run(
    /** Use real Query Kit request versioning and internal watchers. */ () =>
      useTable({
        api: client,
        endpoint: '/runs',
        persistenceKey: 'refresh-test',
        storage: {
          getItem: /** Ignore persisted preferences. */ () => null,
          setItem: /** Keep test storage isolated. */ () => undefined,
        },
        columns: computed(/** Provide one selected field. */ () => [{ id: 'id' }]),
      }),
  )!;
  await table.initialize();
  const pending = table.refresh();
  await vi.waitFor(/** Await the real second transport dispatch. */ () => expect(count).toBe(2));
  table.page.value = 2;
  await nextTick();
  table.page.value = 3;
  await nextTick();
  expect(count).toBe(2);
  finish();
  await pending;
  await vi.waitFor(/** Await the final queued query result. */ () => expect(table.loading.value).toBe(false));
  expect(maximum).toBe(1);
  expect(count).toBe(4);
  expect(table.page.value).toBe(3);
  expect(table.items.value).toEqual([{ id: '4' }]);
  controller.abort();
  scope.stop();
});

it('does not dispatch queued reads after disposal, and recovers from failed predecessors', /** Transport cancellation must stop route-owned queued requests. */ async () => {
  let finish!: () => void;
  const adapter = vi.fn<AxiosAdapter>().mockImplementationOnce(
    /** Hold the first transport until route disposal. */ async (config) => {
      await new Promise<void>(
        /** Capture request completion. */ (resolve) => {
          finish = resolve;
        },
      );
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    },
  );
  const client = axios.create({ adapter });
  const controller = new AbortController();
  serializeApiReads(client, controller.signal);
  const first = client.get('/runs').catch(/** Consume the expected disposed-request cancellation. */ () => undefined);
  await vi.waitFor(/** Wait for transport entry. */ () => expect(adapter).toHaveBeenCalledTimes(1));
  const queued = client.get('/runs?page=2');
  const rejected = expect(queued).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  controller.abort();
  finish();
  await first;
  await rejected;
  expect(adapter).toHaveBeenCalledTimes(1);
});
