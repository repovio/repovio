import { andWhere, filteringToWhere } from '@querry-kit/nuxt/utils';
import { tableGroups } from '@repovio/schemas';
import { computed, onScopeDispose, ref, watch } from 'vue';
import type { Endpoint } from '~/types/api/endpoints';
import { useApi } from './api';
import { useTable, type UseTableOptions, withRepositoryScope } from './table';

const dimensions = {
  issues: ['Issue', 'state'],
  'pull-requests': ['PullRequest', 'state'],
  'security-alerts': ['SecurityAlert', 'severity'],
  'workflow-runs': ['WorkflowRun', 'status'],
  'workflow-runs/needs-attention': ['WorkflowRun', 'status'],
} as const;

/** Keep the ordinary row renderer and paginate the open group independently of server-side group counts. */
export function useMonitoringTable<E extends keyof typeof dimensions & Endpoint>(options: UseTableOptions<E>) {
  const [model, field] = dimensions[options.endpoint];
  const grouping = ref<string[]>([]);
  const selected = ref<string>();
  const grouped = computed(/** Test whether grouping is enabled for this view. */ () => grouping.value.includes(field));
  const table = useTable({
    ...options,
    staticFields: [...new Set([...(options.staticFields ?? ['id']), field])],
    staticFilter: computed(
      /** Keep branch selection separate from the editable filters. */ () =>
        andWhere(
          options.staticFilter?.value,
          grouped.value ? (selected.value ? { [field]: selected.value } : { id: { in: [] } }) : undefined,
        ),
    ),
  });
  const api = useApi();
  const lifetime = new AbortController();
  onScopeDispose(/** Cancel count requests when leaving the table. */ () => lifetime.abort());
  const groups = ref<Array<{ value: string; count: number }>>([]);
  const groupsLoading = ref(false);
  const groupsFailed = ref(false);
  let generation = 0;
  const groupParams = computed(
    /** Count all matching rows before applying the selected group predicate. */ () => ({
      by: JSON.stringify([field]),
      where: JSON.stringify(
        withRepositoryScope(
          andWhere(options.staticFilter?.value, filteringToWhere(table.filtering.value)),
          options.repositoryId,
        ) ?? {},
      ),
      orderBy: JSON.stringify({
        [field]: table.sorting.value.find(/** Locate the group dimension's ordering. */ (rule) => rule.id === field)
          ?.desc
          ? 'desc'
          : 'asc',
      }),
      _count: JSON.stringify({ _all: true }),
    }),
  );
  /** Refresh authorized group counts and discard responses belonging to an older scope. */
  async function refreshGroups(): Promise<void> {
    const version = ++generation;
    groupsFailed.value = false;
    groupsLoading.value = grouped.value;
    if (!grouped.value) return;
    try {
      const response = await api.get<unknown>(`/${options.endpoint}/group-by`, {
        params: groupParams.value,
        signal: lifetime.signal,
      });
      if (version !== generation) return;
      groups.value = tableGroups[model].result.parse(response.data).map(
        /** Normalize the resource-specific enum key for presentation. */ (row) => ({
          value: 'state' in row ? row.state : 'status' in row ? row.status : row.severity,
          count: row._count._all,
        }),
      );
      if (
        !groups.value.some(/** Keep the open group only while it exists. */ (group) => group.value === selected.value)
      )
        selected.value = undefined;
    } catch {
      if (version === generation) {
        groupsFailed.value = true;
        groups.value = [];
        selected.value = undefined;
      }
    } finally {
      if (version === generation) groupsLoading.value = false;
    }
  }
  watch(
    [grouped, groupParams],
    /** Invalidate visible groups immediately when their scope changes. */ () => {
      selected.value = undefined;
      groups.value = [];
      if (grouped.value) table.page.value = 1;
      void refreshGroups();
    },
    { flush: 'sync' },
  );
  /** Open a fresh branch page, or collapse the active group. */
  function toggleGroup(value: string): void {
    table.page.value = 1;
    selected.value = selected.value === value ? undefined : value;
  }
  const items = computed(
    /** Keep branch rows isolated and show each identity once if live data shifts between pages. */ () => {
      const visible = grouped.value
        ? table.items.value.filter(/** Match the requested branch. */ (item) => item[field] === selected.value)
        : table.items.value;
      if (table.loadingMode.value !== 'infinite') return visible;
      return [
        ...new Map(
          visible.map(/** Retain the latest copy of each loaded row. */ (item) => [item.id, item] as const),
        ).values(),
      ];
    },
  );
  return {
    ...table,
    items,
    grouping,
    grouped,
    groups,
    groupsFailed,
    groupsLoading,
    selected,
    toggleGroup,
    refreshGroups,
    loading: computed(
      /** Include the count query in refresh feedback. */ () => groupsLoading.value || table.loading.value,
    ),
    /** Refresh counts and records within the same view lifetime. */
    async refresh(): Promise<void> {
      await Promise.all([table.refresh(), refreshGroups()]);
    },
  };
}
