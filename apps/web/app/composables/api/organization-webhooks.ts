import { ref } from 'vue';
import type { CreateOrganizationWebhook, OrganizationWebhook, OrganizationWebhookDraft } from '~/types/api/resources';
import { useRepovioApi } from './repovio-api';

/** Own organization webhook request state for a single provider dialog. */
export function useOrganizationWebhooks(providerAccountId: string) {
  const api = useRepovioApi();
  const configurations = ref<OrganizationWebhook[]>([]);
  const draft = ref<OrganizationWebhookDraft>();
  const pending = ref(false);
  const error = ref(false);
  const loaded = ref(false);
  const listPending = ref(false);
  const listError = ref(false);
  const draftPending = ref(false);
  const draftError = ref(false);
  let generation = 0;
  let draftRequest = 0;

  /** Discard all session-owned state and invalidate responses without retaining plaintext. */
  function discard(): void {
    generation++;
    draftRequest++;
    configurations.value = [];
    draft.value = undefined;
    pending.value = false;
    listPending.value = false;
    draftPending.value = false;
    error.value = false;
    listError.value = false;
    draftError.value = false;
    loaded.value = false;
  }

  /** Fetch safe metadata, preserving error state on unsuccessful retries. */
  async function load(): Promise<void> {
    if (listPending.value) return;
    const session = generation;
    listPending.value = true;
    listError.value = false;
    try {
      const { data } = await api.providerAccounts.organizationWebhooks(providerAccountId);
      if (session !== generation) return;
      // Replace the current connection's configuration list.
      configurations.value = data;
      loaded.value = true;
    } catch {
      if (session === generation) listError.value = true;
    } finally {
      if (session === generation) listPending.value = false;
    }
  }

  /** Initialize fresh canonical metadata independently of saved configuration loading. */
  async function loadDraft(): Promise<void> {
    const session = generation;
    const request = ++draftRequest;
    draft.value = undefined;
    draftPending.value = true;
    draftError.value = false;
    try {
      const { data } = await api.providerAccounts.organizationWebhookDraft(providerAccountId);
      if (session === generation && request === draftRequest) draft.value = data;
    } catch {
      if (session === generation && request === draftRequest) draftError.value = true;
    } finally {
      if (session === generation && request === draftRequest) draftPending.value = false;
    }
  }

  /** Keep the whole awaited action pending and expose a sanitized error. */
  async function run<T>(action: (session: number) => Promise<T>): Promise<T | undefined> {
    if (pending.value) return;
    const session = generation;
    pending.value = true;
    error.value = false;
    try {
      const result = await action(session);
      return session === generation ? result : undefined;
    } catch {
      if (session === generation) error.value = true;
    } finally {
      if (session === generation) pending.value = false;
    }
  }

  return {
    configurations,
    draft,
    pending,
    error,
    loaded,
    listPending,
    listError,
    draftPending,
    draftError,
    discard,
    load,
    loadDraft,
    /** Create or rotate configuration and update state from the actual server response. */
    save: (input: CreateOrganizationWebhook, webhookId?: string) =>
      run(
        /** Persist the selected hook without retaining its secret. */ async (session) => {
          let saved: OrganizationWebhook;
          try {
            const { data } = webhookId
              ? await api.providerAccounts.rotateOrganizationWebhook(providerAccountId, webhookId, {
                  webhookSecret: input.webhookSecret,
                })
              : await api.providerAccounts.createOrganizationWebhook(providerAccountId, input);
            saved = data;
          } catch (failure) {
            const status = (failure as { response?: { status?: number } } | null)?.response?.status;
            if (webhookId || !input.id || (status !== undefined && status < 500) || session !== generation)
              throw failure;
            const { data } = await api.providerAccounts.organizationWebhooks(providerAccountId);
            const recovered = data.find(
              /** Recover only this exact draft, never a namespace match. */ (hook) => hook.id === input.id,
            );
            if (!recovered) throw failure;
            saved = recovered;
          }
          if (session !== generation) return;
          configurations.value = [
            ...configurations.value.filter(/** Replace the saved configuration. */ (hook) => hook.id !== saved.id),
            saved,
          ];
          return saved;
        },
      ),
    /** Remove local configuration and update the list only after successful completion. */
    remove: (webhookId: string) =>
      run(
        /** Delete the selected hook within its provider account. */ async (session) => {
          await api.providerAccounts.removeOrganizationWebhook(providerAccountId, webhookId);
          if (session !== generation) return;
          configurations.value = configurations.value.filter(
            /** Preserve every unrelated configuration. */ (hook) => hook.id !== webhookId,
          );
          return true;
        },
      ),
  };
}
