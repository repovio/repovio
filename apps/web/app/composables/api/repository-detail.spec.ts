import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import type { RepositoryDetail } from '~/types/api/resources';
import { createRepositoryDetailContext } from './repository-detail';

vi.mock(
  './repovio-api',
  /** Keep tests independent of Nuxt runtime configuration. */ () => ({ useRepovioApi: vi.fn() }),
);

/** Create a controllable response without wall-clock delays. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>(
    /** Capture response controls. */ (yes, no) => {
      resolve = yes;
      reject = no;
    },
  );
  return { promise, resolve, reject };
}

/** Supply just the existing Repository data used by this state boundary. */
function repository(id: string): RepositoryDetail {
  return { id, owner: 'team', name: id, syncState: { status: 'IDLE' } } as RepositoryDetail;
}

describe('Repository detail lifetime', /** Verify route-local asynchronous ownership. */ () => {
  it('rejects old A responses after A to B to A and after disposal', /** Exercises generation ownership. */ async () => {
    const id = ref('a');
    const a = deferred<{ data: RepositoryDetail }>();
    const b = deferred<{ data: RepositoryDetail }>();
    const latest = deferred<{ data: RepositoryDetail }>();
    const get = vi
      .fn()
      .mockReturnValueOnce(a.promise)
      .mockReturnValueOnce(b.promise)
      .mockReturnValueOnce(latest.promise);
    const scope = effectScope();
    const context = scope.run(
      /** Build the state inside its lifetime. */ () =>
        createRepositoryDetailContext(id, { get, refresh: vi.fn(), sync: vi.fn() }, vi.fn()),
    )!;
    id.value = 'b';
    await nextTick();
    id.value = 'a';
    await nextTick();
    a.resolve({ data: repository('old-a') });
    await nextTick();
    expect(context.repository.value).toBeUndefined();
    latest.resolve({ data: repository('latest-a') });
    await nextTick();
    expect(context.repository.value?.id).toBe('latest-a');
    scope.stop();
    b.resolve({ data: repository('b') });
    await nextTick();
    expect(context.repository.value?.id).toBe('latest-a');
  });

  it('keeps actions pending and ignores an action from a previous identity', /** Exercises action pending and response boundaries. */ async () => {
    const id = ref('a');
    const refresh = deferred<{ data: RepositoryDetail }>();
    const scope = effectScope();
    const notify = vi.fn();
    const context = scope.run(
      /** Build state with typed fake transport operations. */ () =>
        createRepositoryDetailContext(
          id,
          {
            get: vi.fn(/** Return the requested identity. */ async (value: string) => ({ data: repository(value) })),
            refresh: vi.fn(/** Delay refresh completion. */ () => refresh.promise),
            sync: vi.fn(),
          },
          notify,
        ),
    )!;
    await nextTick();
    const pending = context.refreshRepository();
    expect(context.refreshing.value).toBe(true);
    id.value = 'b';
    await nextTick();
    await nextTick();
    refresh.resolve({ data: repository('old-a') });
    await pending;
    expect(context.repository.value?.id).toBe('b');
    expect(notify).not.toHaveBeenCalled();
    scope.stop();
  });

  it('clears denied data and retains synchronization metadata after updates', /** Checks load failure and update behavior. */ async () => {
    const id = ref('a');
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: repository('a') })
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    const scope = effectScope();
    const context = scope.run(
      /** Provide the mocked Repository transport. */ () =>
        createRepositoryDetailContext(id, { get, refresh: vi.fn(), sync: vi.fn() }, vi.fn()),
    )!;
    await nextTick();
    context.handleRepositoryUpdated({ ...repository('a'), name: 'updated' });
    expect(context.repository.value?.syncState.status).toBe('IDLE');
    id.value = 'missing';
    await nextTick();
    await nextTick();
    expect(context.repository.value).toBeUndefined();
    expect(context.forbidden.value).toBe(true);
    expect(context.loadError.value).toBe(true);
    scope.stop();
  });
});

it('keeps synchronization pending until completion and reports the queued state', /** Verify the full initiating-control lifetime. */ async () => {
  const sync = deferred<void>();
  const scope = effectScope();
  const notify = vi.fn();
  const context = scope.run(
    /** Supply a delayed existing synchronization transport. */ () =>
      createRepositoryDetailContext(
        ref('a'),
        {
          get: vi.fn(/** Return authorized detail before the action begins. */ async () => ({ data: repository('a') })),
          refresh: vi.fn(),
          sync: vi.fn(/** Hold the action request open. */ () => sync.promise),
        },
        notify,
      ),
  )!;
  await nextTick();
  const pending = context.syncRepository();
  expect(context.syncing.value).toBe(true);
  expect(context.repository.value?.syncState.status).toBe('IDLE');
  sync.resolve();
  await pending;
  expect(context.syncing.value).toBe(false);
  expect(context.repository.value?.syncState.status).toBe('PENDING');
  expect(notify).toHaveBeenCalledWith('syncWorkflowRunsQueued', 'success');
  scope.stop();
});
