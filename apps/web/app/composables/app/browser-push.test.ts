import { describe, expect, it, vi } from 'vitest';
import { createBrowserPushState } from './browser-push-state';

/** Builds an isolated browser and authenticated transport. */
function fixture() {
  const subscription = {
    endpoint: 'https://push.example.test/device',
    options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer },
    /** Serialize the synthetic browser subscription. */
    toJSON: () => ({ endpoint: 'https://push.example.test/device' }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  const worker = {
    active: null,
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(subscription),
      subscribe: vi.fn().mockResolvedValue(subscription),
    },
  };
  const platform = {
    supported: true,
    /** Report granted permission without prompting. */
    permission: () => 'granted' as NotificationPermission,
    requestPermission: vi.fn().mockResolvedValue('granted'),
    getRegistration: vi.fn().mockResolvedValue(worker),
    register: vi.fn().mockResolvedValue(worker),
    ready: Promise.resolve(worker),
  };
  const api = {
    status: vi.fn().mockResolvedValue({ data: { available: true, publicKey: 'AQID', subscriptionCount: 1 } }),
    enrolled: vi.fn().mockResolvedValue({ data: { enrolled: false } }),
    register: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}),
  };
  return { api, worker, platform, subscription };
}

describe('browser push enrollment', /** Groups enrollment regressions. */ () => {
  it('does not create a worker or trust an unregistered local subscription during refresh', /** Tests passive inspection. */ async () => {
    const f = fixture();
    const state = createBrowserPushState(f.api, f.platform as never);
    await state.refresh();
    expect(state.currentDeviceEnabled.value).toBe(false);
    expect(f.platform.register).not.toHaveBeenCalled();
    expect(f.platform.requestPermission).not.toHaveBeenCalled();
  });
  it('waits for activation before subscribing and confirms server enrollment', /** Tests the first-install race. */ async () => {
    const f = fixture();
    let activate!: (worker: unknown) => void;
    f.platform.ready = new Promise(
      /** Expose a deferred browser operation. */ (resolve) => {
        activate = resolve;
      },
    ) as never;
    f.worker.pushManager.getSubscription.mockResolvedValue(null);
    f.api.enrolled.mockResolvedValue({ data: { enrolled: true } });
    const state = createBrowserPushState(f.api, f.platform as never);
    await state.refresh();
    const pending = state.enable();
    await Promise.resolve();
    await Promise.resolve();
    expect(f.worker.pushManager.subscribe).not.toHaveBeenCalled();
    activate(f.worker);
    await pending;
    expect(f.worker.pushManager.subscribe).toHaveBeenCalledOnce();
    expect(state.currentDeviceEnabled.value).toBe(true);
  });
  it('bounds stalled activation and clears pending state', /** Tests readiness timeout. */ async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.platform.ready = new Promise(/** Simulate a worker that never activates. */ () => {});
    const state = createBrowserPushState(f.api, f.platform as never);
    await state.refresh();
    const pending = state.enable();
    await vi.advanceTimersByTimeAsync(15001);
    await pending;
    expect(state.errorStage.value).toBe('worker');
    expect(state.loading.value).toBe(false);
    vi.useRealTimers();
  });
  it('keeps failed registration disabled and rejects denied permission', /** Tests retryable enrollment failures. */ async () => {
    const f = fixture();
    f.api.register.mockRejectedValue(new Error('offline'));
    const state = createBrowserPushState(f.api, f.platform as never);
    await state.refresh();
    await state.enable();
    expect(state.currentDeviceEnabled.value).toBe(false);
    expect(state.errorStage.value).toBe('enrollment');
    f.platform.requestPermission.mockResolvedValue('denied');
    await state.enable();
    expect(state.errorStage.value).toBe('permission');
  });
});

it('does not let an old account operation unsubscribe a new account device', /** Checks async account-switch isolation. */ async () => {
  const f = fixture();
  let release!: (value: unknown) => void;
  const state = createBrowserPushState(f.api, f.platform as never);
  await state.refresh();
  f.worker.active = {} as never;
  f.worker.pushManager.getSubscription.mockImplementationOnce(
    /** Hold the old account lookup across an identity change. */ () =>
      new Promise(
        /** Expose a deferred browser operation. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  const pending = state.enable();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  state.reset();
  release(f.subscription);
  await pending;
  expect(f.subscription.unsubscribe).not.toHaveBeenCalled();
  expect(f.api.register).not.toHaveBeenCalled();
});

it('does not enroll an unsupported browser', /** Checks capability gating. */ async () => {
  const f = fixture();
  f.platform.supported = false;
  const state = createBrowserPushState(f.api, f.platform as never);
  await state.refresh();
  await state.enable();
  expect(state.supported.value).toBe(false);
  expect(f.api.register).not.toHaveBeenCalled();
});

it('renews a subscription after VAPID key rotation without transferring ownership', /** Checks explicit key recovery. */ async () => {
  const f = fixture();
  f.worker.active = {} as never;
  f.api.status.mockResolvedValue({ data: { available: true, publicKey: 'AQIE', subscriptionCount: 1 } });
  f.api.enrolled.mockResolvedValue({ data: { enrolled: true } });
  const state = createBrowserPushState(f.api, f.platform as never);
  await state.refresh();
  expect(state.currentDeviceEnabled.value).toBe(false);
  await state.enable();
  expect(f.api.remove).toHaveBeenCalledOnce();
  expect(f.subscription.unsubscribe).toHaveBeenCalledOnce();
  expect(f.worker.pushManager.subscribe).toHaveBeenCalledOnce();
  expect(state.currentDeviceEnabled.value).toBe(true);
});

it('ignores a passive lookup started before successful enrollment', /** Prevents old status reads from overwriting a mutation. */ async () => {
  const f = fixture();
  f.worker.active = {} as never;
  const state = createBrowserPushState(f.api, f.platform as never);
  await state.refresh();
  let release!: (value: { data: { enrolled: boolean } }) => void;
  f.api.enrolled.mockImplementationOnce(
    /** Defer the earlier passive status. */ () =>
      new Promise(
        /** Capture the stale lookup response. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  const old = state.refresh();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  f.api.enrolled.mockResolvedValue({ data: { enrolled: true } });
  await state.enable();
  expect(state.currentDeviceEnabled.value).toBe(true);
  release({ data: { enrolled: false } });
  await old;
  expect(state.currentDeviceEnabled.value).toBe(true);
});

describe('server push readiness', /** Keep server readiness independent of device enrollment. */ () => {
  it('distinguishes pending, failed, disabled, and configured reads with retry', /** Exercise all readiness outcomes. */ async () => {
    const f = fixture();
    const state = createBrowserPushState(f.api, null);
    expect(state.availability.value).toBe('idle');
    let release!: (value: unknown) => void;
    f.api.status.mockImplementationOnce(
      /** Defer server readiness. */ () =>
        new Promise(
          /** Capture status completion. */ (resolve) => {
            release = resolve;
          },
        ),
    );
    const pending = state.refresh();
    expect(state.availability.value).toBe('loading');
    expect(state.refreshing.value).toBe(true);
    release({ data: { available: false, publicKey: null, subscriptionCount: 0 } });
    await pending;
    expect(state.availability.value).toBe('server-unconfigured');
    expect(state.refreshing.value).toBe(false);
    f.api.status.mockRejectedValueOnce(new Error('offline'));
    await state.refresh();
    expect(state.availability.value).toBe('request-failed');
    expect(state.available.value).toBe(false);
    await state.refresh();
    expect(state.availability.value).toBe('available');
    expect(state.available.value).toBe(true);
    expect(f.platform.requestPermission).not.toHaveBeenCalled();
  });

  it('retains successful server readiness after a device inspection failure', /** A broken worker lookup must not disable global channels. */ async () => {
    const f = fixture();
    f.platform.getRegistration.mockRejectedValueOnce(new Error('worker blocked'));
    const state = createBrowserPushState(f.api, f.platform as never);
    await state.refresh();
    expect(state.availability.value).toBe('available');
    expect(state.available.value).toBe(true);
    expect(state.errorStage.value).toBe('worker');
    expect(state.refreshing.value).toBe(false);
  });

  it('ignores superseded, cancelled, and prior-account status results', /** Protect readiness against stale async completions. */ async () => {
    const f = fixture();
    const state = createBrowserPushState(f.api, null);
    let release!: (value: unknown) => void;
    f.api.status.mockImplementationOnce(
      /** Hold a stale read. */ () =>
        new Promise(
          /** Capture the stale response. */ (resolve) => {
            release = resolve;
          },
        ),
    );
    const stale = state.refresh();
    await state.refresh();
    release({ data: { available: false, publicKey: null, subscriptionCount: 0 } });
    await stale;
    expect(state.availability.value).toBe('available');
    f.api.status.mockImplementationOnce(
      /** Hold a cancelled read. */ () =>
        new Promise(
          /** Capture the cancelled response. */ (resolve) => {
            release = resolve;
          },
        ),
    );
    const cancelled = state.refresh();
    state.cancelRefresh();
    release({ data: { available: true, publicKey: 'AQID', subscriptionCount: 0 } });
    await cancelled;
    expect(state.availability.value).toBe('idle');
    expect(state.refreshing.value).toBe(false);
    f.api.status.mockImplementationOnce(
      /** Hold the old account read. */ () =>
        new Promise(
          /** Capture the old account response. */ (resolve) => {
            release = resolve;
          },
        ),
    );
    const oldAccount = state.refresh();
    state.reset();
    release({ data: { available: true, publicKey: 'AQID', subscriptionCount: 1 } });
    await oldAccount;
    expect(state.availability.value).toBe('idle');
    expect(state.available.value).toBe(false);
    expect(state.subscriptionCount.value).toBe(0);
  });
});
