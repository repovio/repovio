import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';

const mocks = vi.hoisted(
  /** Creates isolated API and device-cleanup adapters. */ () => ({
    cleanup: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
  }),
);

vi.mock(
  '~/composables/api/api',
  /** Replaces the authenticated transport without simplifying store lifecycle. */ () => ({
    accessTokenStorageKey: 'repovio.access-token',
    /** Returns the isolated transport for each store action. */
    useApi: () => ({ post: mocks.post, get: mocks.get }),
  }),
);
vi.mock(
  '~/composables/app/browser-push',
  /** Isolates device cleanup while checking ordering and failures. */ () => ({
    cleanupBrowserPush: mocks.cleanup,
  }),
);

const account = {
  id: 'user-a',
  username: 'alice',
  role: 'VIEWER' as const,
  authProvider: 'LOCAL' as const,
  avatarUpdatedAt: null,
  firstName: null,
  lastName: null,
};

describe('authentication device cleanup', /** Exercises sign-out without discarding recoverable enrollment failures. */ () => {
  beforeEach(
    /** Restores an isolated session and adapters for each scenario. */ () => {
      setActivePinia(createPinia());
      vi.clearAllMocks();
      mocks.cleanup.mockResolvedValue(undefined);
      mocks.post.mockResolvedValue({ data: { accessToken: 'token-a', user: account } });
    },
  );

  it('cleans the current device before invalidating authentication', /** Retains credentials throughout authenticated cleanup. */ async () => {
    const auth = useAuthStore();
    await auth.signIn('alice', 'password');
    mocks.cleanup.mockImplementation(
      /** Checks cleanup still has the authenticated caller. */ async () => {
        expect(auth.accessToken).toBe('token-a');
        expect(auth.user?.id).toBe('user-a');
      },
    );
    await auth.signOut();
    expect(mocks.cleanup).toHaveBeenCalledOnce();
    expect(mocks.cleanup.mock.invocationCallOrder[0]).toBeLessThan(mocks.post.mock.invocationCallOrder[1]!);
    expect(auth.accessToken).toBeNull();
    expect(auth.user).toBeNull();
  });

  it('retains the session when device cleanup fails so the user can retry', /** Does not silently leave old enrollment active after normal sign-out. */ async () => {
    const auth = useAuthStore();
    await auth.signIn('alice', 'password');
    mocks.cleanup.mockRejectedValue(new Error('offline cleanup'));
    await expect(auth.signOut()).rejects.toThrow('offline cleanup');
    expect(auth.accessToken).toBe('token-a');
    expect(auth.user?.id).toBe('user-a');
    expect(mocks.post).not.toHaveBeenCalledWith('/auth/signout');
  });

  it('explicit forced sign-out clears the session despite cleanup and API failures', /** Preserves the escape hatch for an offline device. */ async () => {
    const auth = useAuthStore();
    await auth.signIn('alice', 'password');
    mocks.cleanup.mockRejectedValue(new Error('offline cleanup'));
    mocks.post.mockRejectedValue(new Error('offline API'));
    await expect(auth.signOut(true)).rejects.toThrow('offline API');
    expect(mocks.cleanup).toHaveBeenCalledOnce();
    expect(auth.accessToken).toBeNull();
    expect(auth.user).toBeNull();
  });

  it('preserves local clearing when only remote sign-out fails', /** Keeps the established local sign-out guarantee after device removal. */ async () => {
    const auth = useAuthStore();
    await auth.signIn('alice', 'password');
    mocks.post.mockRejectedValue(new Error('offline API'));
    await expect(auth.signOut()).rejects.toThrow('offline API');
    expect(auth.user).toBeNull();
  });

  it('keeps sign-in and profile replacement independent of device cleanup', /** Protects existing account transitions. */ async () => {
    const auth = useAuthStore();
    await auth.signIn('alice', 'password');
    auth.updateUser({ ...account, username: 'updated' });
    expect(auth.accessToken).toBe('token-a');
    expect(auth.user?.username).toBe('updated');
    expect(mocks.cleanup).not.toHaveBeenCalled();
  });
});
