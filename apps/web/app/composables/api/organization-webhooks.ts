import { ref } from 'vue';
import type { CreateOrganizationWebhook, OrganizationWebhook } from '~/types/api/resources';
import { useRepovioApi } from './repovio-api';

/** Own organization webhook request state for a single provider dialog. */
export function useOrganizationWebhooks(providerAccountId: string) {
  const api = useRepovioApi();
  const configurations = ref<OrganizationWebhook[]>([]);
  const pending = ref(false);
  const error = ref(false);
  const loaded = ref(false);

  /** Keep the whole awaited action pending and expose a sanitized error. */
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (pending.value) return;
    pending.value = true;
    error.value = false;
    try {
      return await action();
    } catch {
      error.value = true;
    } finally {
      pending.value = false;
    }
  }

  return {
    configurations,
    pending,
    error,
    loaded,
    /** Fetch safe metadata, preserving error state on unsuccessful retries. */
    load: () =>
      run(
        /** Replace the current connection's configuration list. */ async () => {
          configurations.value = (await api.providerAccounts.organizationWebhooks(providerAccountId)).data;
          loaded.value = true;
        },
      ),
    /** Create or rotate configuration and update state from the actual server response. */
    save: (input: CreateOrganizationWebhook, webhookId?: string) =>
      run(
        /** Persist the selected hook without retaining its secret. */ async () => {
          const { data } = webhookId
            ? await api.providerAccounts.rotateOrganizationWebhook(providerAccountId, webhookId, {
                webhookSecret: input.webhookSecret,
              })
            : await api.providerAccounts.createOrganizationWebhook(providerAccountId, input);
          configurations.value = [
            ...configurations.value.filter(/** Replace the saved configuration. */ (hook) => hook.id !== data.id),
            data,
          ];
          return data;
        },
      ),
    /** Remove local configuration and update the list only after successful completion. */
    remove: (webhookId: string) =>
      run(
        /** Delete the selected hook within its provider account. */ async () => {
          await api.providerAccounts.removeOrganizationWebhook(providerAccountId, webhookId);
          configurations.value = configurations.value.filter(
            /** Preserve every unrelated configuration. */ (hook) => hook.id !== webhookId,
          );
          return true;
        },
      ),
  };
}
