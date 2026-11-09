import type { BrowserPushStatus } from '@repovio/schemas';
import { computed, ref } from 'vue';

/** Authenticated enrollment transport; responses contain no foreign identity. */
export interface PushApi {
  /** Read server availability. */
  status(): Promise<{ data: BrowserPushStatus }>;
  /** Check current-user enrollment. */
  enrolled(endpoint: string): Promise<{ data: { enrolled: boolean } }>;
  /** Persist the current subscription. */
  register(subscription: PushSubscriptionJSON): Promise<unknown>;
  /** Remove only current-user enrollment. */
  remove(endpoint: string): Promise<unknown>;
}

/** Browser capability boundary, injected in lifecycle tests. */
export interface PushPlatform {
  supported: boolean;
  /** Read notification permission without prompting. */
  permission(): NotificationPermission;
  /** Request explicit browser permission. */
  requestPermission(): Promise<NotificationPermission>;
  /** Inspect the root worker without creating one. */
  getRegistration(): Promise<ServiceWorkerRegistration | undefined>;
  /** Persist the current subscription. */
  register(): Promise<ServiceWorkerRegistration>;
  readonly ready: Promise<ServiceWorkerRegistration>;
}

/**
 * Manage the authenticated user's PushSubscription for the current browser.
 * @param api Authenticated current-user enrollment methods.
 * @param platform Secure-context browser capabilities, or null outside supported browsers.
 * @returns Reactive device state and explicit enrollment operations.
 */
export function createBrowserPushState(api: PushApi, platform: PushPlatform | null) {
  const available = ref(false);
  const currentDeviceEnabled = ref(false);
  const errorStage = ref<'availability' | 'permission' | 'worker' | 'enrollment' | null>(null);
  const error = computed(/** Reports actionable lifecycle failure. */ () => errorStage.value !== null);
  const loading = ref(false);
  const publicKey = ref<string | null>(null);
  const subscriptionCount = ref(0);
  const supported = computed(/** Checks secure browser support. */ () => Boolean(platform?.supported));
  const permission = ref<NotificationPermission>(platform?.permission() ?? 'default');
  let revision = 0;
  let readRevision = 0;

  /** Clear account-owned state and invalidate work started by an earlier session. */
  function reset(): void {
    revision++;
    readRevision++;
    available.value = false;
    currentDeviceEnabled.value = false;
    errorStage.value = null;
    publicKey.value = null;
    subscriptionCount.value = 0;
    loading.value = false;
  }

  /** Refresh server availability and the current browser's local subscription state. */
  async function refresh(internal = false): Promise<void> {
    if (loading.value && !internal) return;
    const epoch = revision;
    const request = ++readRevision;
    currentDeviceEnabled.value = false;
    errorStage.value = null;
    try {
      const { data } = await api.status();
      if (epoch !== revision || request !== readRevision) return;
      available.value = data.available;
      publicKey.value = data.publicKey;
      subscriptionCount.value = data.subscriptionCount;
      permission.value = platform?.permission() ?? 'default';
      if (!platform?.supported || !available.value || permission.value !== 'granted') return;
      const subscription = await (await platform.getRegistration())?.pushManager.getSubscription();
      if (epoch !== revision || request !== readRevision || !subscription || !matchesKey(subscription, publicKey.value))
        return;
      const enrollment = await api.enrolled(subscription.endpoint);
      if (epoch === revision && request === readRevision) currentDeviceEnabled.value = enrollment.data.enrolled;
    } catch {
      if (epoch === revision && request === readRevision) errorStage.value = 'availability';
    }
  }

  /** Returns the active service-worker registration, creating one if needed. */
  async function registration(): Promise<ServiceWorkerRegistration> {
    if (!platform) throw new Error('Browser push is unsupported.');
    const worker = (await platform.getRegistration()) ?? (await platform.register());
    if (worker.active) return worker;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        platform.ready,
        new Promise<never>(
          /** Reject an installation that never becomes active. */ (_, reject) => {
            timer = setTimeout(
              /** Report bounded worker readiness failure. */ () => reject(new Error('Worker activation timed out.')),
              15_000,
            );
          },
        ),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Request permission and register the current browser under the current user. */
  async function enable(): Promise<void> {
    if (loading.value || !platform?.supported || !available.value || !publicKey.value) return;
    readRevision++;
    loading.value = true;
    currentDeviceEnabled.value = false;
    const epoch = revision;
    let stage: NonNullable<typeof errorStage.value> = 'permission';
    try {
      errorStage.value = null;
      const granted = await platform.requestPermission();
      if (epoch !== revision) return;
      permission.value = granted;
      if (permission.value !== 'granted') throw new Error('permission denied');
      stage = 'worker';
      const worker = await registration();
      if (epoch !== revision) return;
      stage = 'enrollment';
      let subscription = await worker.pushManager.getSubscription();
      if (epoch !== revision) return;
      if (subscription) {
        const owned = (await api.enrolled(subscription.endpoint)).data.enrolled;
        if (epoch !== revision) return;
        if (!owned || !matchesKey(subscription, publicKey.value)) {
          if (owned) await api.remove(subscription.endpoint);
          if (epoch !== revision) return;
          if (!(await subscription.unsubscribe())) throw new Error('Subscription removal failed.');
          if (epoch !== revision) return;
          subscription = null;
        }
      }
      subscription ??= await worker.pushManager.subscribe({
        applicationServerKey: decodeBase64Url(publicKey.value),
        userVisibleOnly: true,
      });
      if (epoch !== revision) return;
      await api.register(subscription.toJSON());
      if (epoch !== revision) return;
      const enrollment = await api.enrolled(subscription.endpoint);
      if (!enrollment.data.enrolled) throw new Error('Enrollment was not confirmed.');
      if (epoch === revision) currentDeviceEnabled.value = true;
    } catch {
      if (epoch === revision) errorStage.value = stage;
    } finally {
      if (epoch === revision) loading.value = false;
    }
  }

  /** Remove and unsubscribe the current browser without affecting the user's other devices. */
  async function disable(): Promise<void> {
    if (loading.value || !platform?.supported) return;
    readRevision++;
    loading.value = true;
    errorStage.value = null;
    const epoch = revision;
    try {
      await removeBrowserEnrollment(
        api,
        platform,
        /** Ignore cleanup from a prior account. */ () => epoch === revision,
      );
      if (epoch !== revision) return;
      currentDeviceEnabled.value = false;
      await refresh(true);
    } catch {
      if (epoch !== revision) return;
      currentDeviceEnabled.value = false;
      errorStage.value = 'enrollment';
    } finally {
      if (epoch === revision) loading.value = false;
    }
  }

  return {
    available,
    currentDeviceEnabled,
    disable,
    enable,
    error,
    errorStage,
    loading,
    permission,
    publicKey,
    refresh,
    reset,
    subscriptionCount,
    supported,
  };
}

/**
 * Remove owned server enrollment while credentials are available, and always attempt local unsubscription.
 * @param api Authenticated enrollment transport.
 * @param platform Current browser capabilities.
 * @param current Guard preventing a prior account operation from mutating a newer subscription.
 * @returns Completion after both cleanup operations.
 */
export async function removeBrowserEnrollment(
  api: PushApi,
  platform: PushPlatform | null,
  current: () => boolean = /** Allow explicit sign-out cleanup. */ () => true,
): Promise<void> {
  if (!platform?.supported) return;
  const subscription = await (await platform.getRegistration())?.pushManager.getSubscription();
  if (!subscription || !current()) return;
  let failed = false;
  try {
    await api.remove(subscription.endpoint);
  } catch {
    failed = true;
  }
  if (current()) {
    try {
      if (!(await subscription.unsubscribe())) failed = true;
    } catch {
      failed = true;
    }
  }
  if (failed) throw new Error('Subscription removal failed.');
}

/**
 * Compare a device subscription's VAPID key to current server configuration.
 * @param subscription Local browser subscription.
 * @param key Current server public key, or null when unavailable.
 * @returns Whether both keys match byte for byte.
 */
function matchesKey(subscription: PushSubscription, key: string | null): boolean {
  if (!key || !subscription.options.applicationServerKey) return false;
  const expected = decodeBase64Url(key);
  const actual = new Uint8Array(subscription.options.applicationServerKey);
  return (
    actual.length === expected.length &&
    actual.every(/** Compare each VAPID byte. */ (value, index) => value === expected[index])
  );
}

/** Decodes a URL-safe Base64 VAPID key into subscription bytes. */
function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  return Uint8Array.from(
    binary,
    /** Evaluates `character.charCodeAt(0)` when Uint8Array.from invokes this callback. */ (character) =>
      character.charCodeAt(0),
  );
}
