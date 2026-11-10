import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrganizationWebhooks } from './organization-webhooks';

const api = vi.hoisted(
  /** Mock only the transport while testing real asynchronous state. */ () => ({
    organizationWebhooks: vi.fn(),
    organizationWebhookDraft: vi.fn(),
    createOrganizationWebhook: vi.fn(),
    rotateOrganizationWebhook: vi.fn(),
    removeOrganizationWebhook: vi.fn(),
  }),
);
vi.mock(
  './repovio-api',
  /** Supply a typed-client-shaped transport boundary. */ () => ({
    /** Return the transport mock for this isolated composable. */ useRepovioApi: () => ({ providerAccounts: api }),
  }),
);
const draft = { id: '33333333-3333-4333-8333-333333333333', callbackUrl: 'https://public.test/hook' };
const hook = { ...draft, providerAccountId: 'account', providerType: 'GITHUB', scope: 'acme', lastDeliveryAt: null };

beforeEach(
  /** Reset responses between isolated sessions. */ () => {
    vi.resetAllMocks();
    api.organizationWebhooks.mockResolvedValue({ data: [] });
    api.organizationWebhookDraft.mockResolvedValue({ data: draft });
  },
);
describe('organization webhook setup requests', /** Verify session isolation and retry boundaries without persisting secrets. */ () => {
  it('loads draft independently when listing fails and retries listing', /** Preserve usable setup through a list error. */ async () => {
    api.organizationWebhooks.mockRejectedValueOnce(new Error('offline'));
    const state = useOrganizationWebhooks('account');
    await Promise.all([state.load(), state.loadDraft()]);
    expect(state.draft.value).toEqual(draft);
    expect(state.listError.value).toBe(true);
    await state.load();
    expect(state.listError.value).toBe(false);
  });
  it('discards stale draft and list responses after session invalidation', /** Closing or replacing the dialog cannot repopulate its state. */ async () => {
    let resolveDraft!: (value: unknown) => void;
    let resolveList!: (value: unknown) => void;
    api.organizationWebhookDraft.mockImplementationOnce(
      /** Defer metadata until dismissal. */ () =>
        new Promise(
          /** Retain metadata resolver. */ (resolve) => {
            resolveDraft = resolve;
          },
        ),
    );
    api.organizationWebhooks.mockImplementationOnce(
      /** Defer list until dismissal. */ () =>
        new Promise(
          /** Retain list resolver. */ (resolve) => {
            resolveList = resolve;
          },
        ),
    );
    const state = useOrganizationWebhooks('account');
    const requests = [state.load(), state.loadDraft()];
    state.discard();
    resolveDraft({ data: draft });
    resolveList({ data: [hook] });
    await Promise.all(requests);
    expect(state.draft.value).toBeUndefined();
    expect(state.configurations.value).toEqual([]);
    expect(state.draftPending.value).toBe(false);
    expect(state.listPending.value).toBe(false);
  });
  it('keeps mutations pending through exact-ID recovery of a lost create response', /** Recover only the requested identity, never duplicate the insert. */ async () => {
    api.createOrganizationWebhook.mockRejectedValueOnce(new Error('lost response'));
    api.organizationWebhooks.mockResolvedValue({ data: [hook] });
    const state = useOrganizationWebhooks('account');
    await state.loadDraft();
    const result = await state.save({ id: draft.id, scope: 'acme', webhookSecret: 'synthetic-secret' });
    expect(result).toEqual(hook);
    expect(state.error.value).toBe(false);
    expect(state.pending.value).toBe(false);
    expect(api.createOrganizationWebhook).toHaveBeenCalledTimes(1);
  });
  it('does not adopt a conflict or another configuration as successful creation', /** A same-scope or conflicting identifier never implies success. */ async () => {
    const state = useOrganizationWebhooks('account');
    await state.loadDraft();
    api.createOrganizationWebhook.mockRejectedValueOnce({ response: { status: 409 } });
    expect(await state.save({ id: draft.id, scope: 'acme', webhookSecret: 'synthetic-secret' })).toBeUndefined();
    expect(api.organizationWebhooks).not.toHaveBeenCalled();
    expect(state.draft.value).toEqual(draft);
    expect(state.error.value).toBe(true);
  });
});

it('keeps the save gate pending until recovery finishes and blocks duplicates', /** Verify the entire lost-response recovery boundary. */ async () => {
  let release!: (response: unknown) => void;
  api.createOrganizationWebhook.mockRejectedValueOnce(new Error('lost response'));
  api.organizationWebhooks.mockImplementationOnce(
    /** Delay reconciliation. */ () =>
      new Promise(
        /** Retain reconciliation resolver. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  const state = useOrganizationWebhooks('account');
  const input = { id: draft.id, scope: 'acme', webhookSecret: 'synthetic-secret' };
  const request = state.save(input);
  await vi.waitFor(
    /** Wait for the recovery request instead of relying on elapsed time. */ () =>
      expect(api.organizationWebhooks).toHaveBeenCalled(),
  );
  expect(state.pending.value).toBe(true);
  expect(await state.save(input)).toBeUndefined();
  expect(api.createOrganizationWebhook).toHaveBeenCalledTimes(1);
  release({ data: [{ ...hook, id: 'another-id' }] });
  expect(await request).toBeUndefined();
  expect(state.pending.value).toBe(false);
  expect(state.error.value).toBe(true);
});

it('retains saved hooks when draft loading fails and ignores late mutations', /** Preserve independent management and discard old-session save results. */ async () => {
  api.organizationWebhooks.mockResolvedValue({ data: [hook] });
  api.organizationWebhookDraft.mockRejectedValueOnce(new Error('offline'));
  const state = useOrganizationWebhooks('account');
  await Promise.all([state.load(), state.loadDraft()]);
  expect(state.configurations.value).toEqual([hook]);
  expect(state.draftError.value).toBe(true);
  await state.loadDraft();
  expect(state.draft.value).toEqual(draft);
  let release!: (response: unknown) => void;
  api.createOrganizationWebhook.mockImplementationOnce(
    /** Delay a save across dismissal. */ () =>
      new Promise(
        /** Retain save resolver. */ (resolve) => {
          release = resolve;
        },
      ),
  );
  const request = state.save({ id: draft.id, scope: 'acme', webhookSecret: 'synthetic-secret' });
  state.discard();
  release({ data: hook });
  expect(await request).toBeUndefined();
  expect(state.configurations.value).toEqual([]);
});
