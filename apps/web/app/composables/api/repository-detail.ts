import axios from 'axios';
import { computed, inject, onScopeDispose, provide, ref, watch, type InjectionKey, type Ref } from 'vue';
import type { Repository, RepositoryDetail } from '~/types/api/resources';
import type { RepositoryDetailContext } from '~/types/repository-detail';
import { useRepovioApi } from './repovio-api';

/** Existing Repository operations needed by the route-local state boundary. */
interface RepositoryDetailTransport {
  get: (id: string) => Promise<{ data: RepositoryDetail }>;
  refresh: (id: string) => Promise<{ data: Repository }>;
  sync: (id: string) => Promise<unknown>;
}

const repositoryDetailKey: InjectionKey<RepositoryDetailContext> = Symbol('repository-detail');

/** Create state owned by the current effect scope; stale loads/actions never publish across lifetimes. */
export function createRepositoryDetailContext(
  repositoryId: Readonly<Ref<string>>,
  api: RepositoryDetailTransport,
  notify: (key: string, color: 'success' | 'error') => void,
): RepositoryDetailContext {
  const repository = ref<RepositoryDetail>();
  const loading = ref(true);
  const loadError = ref(false);
  const forbidden = ref(false);
  const refreshing = ref(false);
  const syncing = ref(false);
  let generation = 0;

  /** Load the permission-filtered repository without administrator-only supporting metadata. */
  async function reload(): Promise<void> {
    const current = ++generation;
    const id = repositoryId.value;
    repository.value = undefined;
    loading.value = true;
    loadError.value = false;
    forbidden.value = false;
    refreshing.value = false;
    syncing.value = false;
    try {
      const { data } = await api.get(id);
      if (current === generation) repository.value = data;
    } catch (error) {
      if (current === generation) {
        forbidden.value = axios.isAxiosError(error) && [403, 404].includes(error.response?.status ?? 0);
        loadError.value = true;
      }
    } finally {
      if (current === generation) loading.value = false;
    }
  }

  /** Retain detail-only synchronization metadata after a repository settings update. */
  function handleRepositoryUpdated(updatedRepository: Repository): void {
    if (repository.value && updatedRepository.id === repository.value.id)
      repository.value = { ...repository.value, ...updatedRepository };
  }

  /** Refresh provider-owned repository identity without discarding page status data. */
  async function refreshRepository(): Promise<void> {
    if (!repository.value || refreshing.value) return;
    const current = generation;
    const id = repositoryId.value;
    refreshing.value = true;
    try {
      const { data } = await api.refresh(id);
      if (current !== generation) return;
      handleRepositoryUpdated(data);
      notify('refreshSuccess', 'success');
    } catch {
      if (current === generation) notify('refreshError', 'error');
    } finally {
      if (current === generation) refreshing.value = false;
    }
  }

  /** Queue a read-only synchronization and immediately reflect the active job. */
  async function syncRepository(): Promise<void> {
    if (!repository.value || syncing.value) return;
    const current = generation;
    const id = repositoryId.value;
    syncing.value = true;
    try {
      await api.sync(id);
      if (current !== generation || !repository.value) return;
      repository.value.syncState.status = 'PENDING';
      notify('syncWorkflowRunsQueued', 'success');
    } catch {
      if (current === generation) notify('syncWorkflowRunsError', 'error');
    } finally {
      if (current === generation) syncing.value = false;
    }
  }

  watch(repositoryId, /** Reload whenever the route identity changes. */ () => void reload(), {
    immediate: true,
    flush: 'sync',
  });
  onScopeDispose(
    /** Invalidate every outstanding operation when leaving the parent route. */ () => {
      generation++;
    },
  );
  return {
    repositoryId,
    repository: computed(/** Expose data without a ref setter. */ () => repository.value),
    loading,
    loadError,
    forbidden,
    refreshing,
    syncing,
    reload,
    handleRepositoryUpdated,
    refreshRepository,
    syncRepository,
  };
}

/** Provide one context to the Repository parent and its descendants. */
export function provideRepositoryDetail(repositoryId: Readonly<Ref<string>>): RepositoryDetailContext {
  const api = useRepovioApi();
  const toast = useToast();
  const { t } = useI18n();
  const context = createRepositoryDetailContext(
    repositoryId,
    api.repositories,
    /** Report only operations that still belong to the current route lifetime. */ (key, color) => {
      toast.add({ color, title: t(`repositoryDetails.${key}`) });
    },
  );
  provide(repositoryDetailKey, context);
  return context;
}

/** Read the authorized Repository context provided by the enclosing parent route. */
export function useRepositoryDetail(): RepositoryDetailContext {
  const context = inject(repositoryDetailKey);
  if (!context) throw new Error('Repository detail context is unavailable.');
  return context;
}
