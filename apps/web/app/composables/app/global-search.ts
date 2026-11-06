import { computed, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue';

import { useApi } from '~/composables/api/api';
import type { PaginatedDto } from '~/composables/api/module-api';
import { rankSearchResults } from '~/composables/app/global-search-ranking';
import { useNavigationItems } from '~/composables/app/navigation-items';
import { useAuthStore } from '~/store/auth';
import { apiEndpoints } from '~/types/api/endpoints';
import type { ProviderAccount, Repository, WorkflowRun } from '~/types/api/resources';

const maximumRequestedResults = 20;
export const globalSearchMinimumLength = 2;

/** Loading and error state for one independently requested search resource. */
export interface GlobalSearchGroup<T> {
  error: Ref<boolean>;
  items: Ref<T[]>;
  loading: Ref<boolean>;
}

/** Create isolated reactive state for one global-search result group. */
function createSearchGroup<T>(): GlobalSearchGroup<T> {
  return { error: ref(false), items: shallowRef<T[]>([]), loading: ref(false) };
}

/** Search all permission-aware Repovio resource groups with debounce, cancellation, and deterministic ranking. */
export function useGlobalSearch(query: Ref<string>) {
  const api = useApi();
  const auth = useAuthStore();
  const { navigationSearchItems } = useNavigationItems();
  const providerAccounts = createSearchGroup<ProviderAccount>();
  const repositories = createSearchGroup<Repository>();
  const workflowRuns = createSearchGroup<WorkflowRun>();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let requestController: AbortController | undefined;

  const normalizedQuery = computed(
    /** Derives normalized query from the current reactive dependencies. */ () => query.value.trim(),
  );
  const canSearch = computed(
    /** Derives can search from the current reactive dependencies. */ () =>
      normalizedQuery.value.length >= globalSearchMinimumLength,
  );
  const navigationResults = computed(
    /** Derives navigation results from the current reactive dependencies. */ () => {
      if (!canSearch.value) return [];
      const matchingItems = navigationSearchItems.value.filter(
        /** Keeps entries matching `item.label.toLocaleLowerCase().includes(normalizedQuery.value.toLocaleLowerCase())`. */ (
          item,
        ) => item.label.toLocaleLowerCase().includes(normalizedQuery.value.toLocaleLowerCase()),
      );
      return rankSearchResults(
        matchingItems,
        normalizedQuery.value,
        /** Evaluates `({ id: item.to, label: item.label })` when rankSearchResults invokes this callback. */ (
          item,
        ) => ({ id: item.to, label: item.label }),
      );
    },
  );
  const providerAccountResults = computed(
    /** Derives provider account results from the current reactive dependencies. */ () =>
      rankSearchResults(
        providerAccounts.items.value,
        normalizedQuery.value,
        /** Evaluates `({ id: account.id, label: account.displayName, supportingText: `${account.providerType} ${account.baseUrl ?? ''}`, })` when rankSearchResults invokes this callback. */ (
          account,
        ) => ({
          id: account.id,
          label: account.displayName,
          supportingText: `${account.providerType} ${account.baseUrl ?? ''}`,
        }),
      ),
  );
  const repositoryResults = computed(
    /** Derives repository results from the current reactive dependencies. */ () =>
      rankSearchResults(
        repositories.items.value,
        normalizedQuery.value,
        /** Evaluates `({ id: repository.id, label: `${repository.owner}/${repository.name}`, supportingText: repository.url, })` when rankSearchResults invokes this callback. */ (
          repository,
        ) => ({
          id: repository.id,
          label: `${repository.owner}/${repository.name}`,
          supportingText: repository.url,
        }),
      ),
  );
  const workflowRunResults = computed(
    /** Derives workflow run results from the current reactive dependencies. */ () =>
      rankSearchResults(
        workflowRuns.items.value,
        normalizedQuery.value,
        /** Selects workflow labels and supporting text used to rank search results. */ (workflowRun) => ({
          id: workflowRun.id,
          label: workflowRun.workflowName,
          supportingText: `${workflowRun.displayTitle} ${workflowRun.repositoryOwner}/${workflowRun.repositoryName}`,
        }),
      ),
  );
  const isSearching = computed(
    /** Derives is searching from the current reactive dependencies. */
    () => providerAccounts.loading.value || repositories.loading.value || workflowRuns.loading.value,
  );
  const hasResults = computed(
    /** Derives has results from the current reactive dependencies. */
    () =>
      navigationResults.value.length > 0 ||
      providerAccountResults.value.length > 0 ||
      repositoryResults.value.length > 0 ||
      workflowRunResults.value.length > 0,
  );

  /** Clear pending network and debounce work before starting a new search generation. */
  function cancelPendingSearch(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = undefined;
    requestController?.abort();
    requestController = undefined;
  }

  /** Reset one resource group before a new request generation. */
  function resetGroup<T>(group: GlobalSearchGroup<T>, loading: boolean): void {
    group.error.value = false;
    group.items.value = [];
    group.loading.value = loading;
  }

  /** Request and update one resource group without allowing stale responses to win. */
  async function loadGroup<T>(
    group: GlobalSearchGroup<T>,
    path: string,
    fields: string,
    searchTerm: string,
    controller: AbortController,
  ): Promise<void> {
    try {
      const response = await api.get<PaginatedDto<T>>(path, {
        params: { fields, page: 1, perPage: maximumRequestedResults, search: searchTerm },
        signal: controller.signal,
      });
      if (requestController === controller) group.items.value = response.data.items;
    } catch {
      if (requestController === controller && !controller.signal.aborted) group.error.value = true;
    } finally {
      if (requestController === controller) group.loading.value = false;
    }
  }

  /** Start the independently recoverable resource queries for the current search generation. */
  function runSearch(searchTerm: string): void {
    const controller = new AbortController();
    requestController = controller;
    const isAdmin = auth.user?.role === 'SYSTEM_ADMIN';
    resetGroup(providerAccounts, isAdmin);
    resetGroup(repositories, true);
    resetGroup(workflowRuns, true);

    if (isAdmin) {
      void loadGroup(
        providerAccounts,
        apiEndpoints.providerAccounts.base,
        'id,displayName,providerType,baseUrl',
        searchTerm,
        controller,
      );
    }
    void loadGroup(
      repositories,
      apiEndpoints.repositories,
      'id,owner,name,url,providerAccountId',
      searchTerm,
      controller,
    );
    void loadGroup(
      workflowRuns,
      `/${apiEndpoints.workflowRuns}`,
      'id,workflowName,displayTitle,url,status,repositoryId,repositoryName,repositoryOwner,providerType,providerCreatedAt',
      searchTerm,
      controller,
    );
  }

  watch(
    [normalizedQuery, /** Returns `auth.user?.role` to the caller. */ () => auth.user?.role],
    /** Synchronizes use global search when the observed state changes. */ ([searchTerm]) => {
      cancelPendingSearch();
      resetGroup(providerAccounts, false);
      resetGroup(repositories, false);
      resetGroup(workflowRuns, false);
      if (searchTerm.length < globalSearchMinimumLength) return;
      debounceTimer = setTimeout(
        /** Completes the deferred use global search operation after its delay. */ () => runSearch(searchTerm),
        250,
      );
    },
  );

  onBeforeUnmount(cancelPendingSearch);

  return {
    canSearch,
    cancelPendingSearch,
    hasResults,
    isSearching,
    navigationResults,
    providerAccountResults,
    providerAccounts,
    repositories,
    repositoryResults,
    workflowRunResults,
    workflowRuns,
  };
}
