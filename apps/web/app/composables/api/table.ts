import type { Filtering } from '@querry-kit/nuxt-ui/types';
import { useTable as useQueryKitTable } from '@querry-kit/nuxt/table';
import type { TableColumn as QueryKitTableColumn } from '@querry-kit/nuxt/types';
import { useRouteQuery } from '@vueuse/router';
import { computed, type Ref, watch } from 'vue';

import type { Endpoint, Endpoints } from '~/types/api/endpoints';
import type { ColumnDefinition } from '~/types/table';
import { useApi } from './api';

type TableRow<TEndpoint extends Endpoint> = Endpoints[TEndpoint]['dto'] & { id: string } & Record<string, unknown>;

/** Configuration for a typed Repovio Query Kit table. */
export interface UseTableOptions<TEndpoint extends Endpoint> {
  columnDefinition: Ref<readonly ColumnDefinition<TableRow<TEndpoint>>[]>;
  defaultItemsPerPage?: number;
  endpoint: TEndpoint;
  name: string;
  repositoryId?: string;
  scopeKind?: string;
  staticFields?: string[];
  staticFilter?: Ref<Record<string, unknown> | undefined>;
}

/**
 * Retain local renderer metadata while adapting columns to Query Kit's field-selection contract.
 *
 * @param columnDefinition - Reactive local table column definitions.
 * @returns Visible columns with their original metadata and a resolved Query Kit identifier.
 */
export function toQueryKitColumns<TItem extends Record<string, unknown>>(
  columnDefinition: readonly ColumnDefinition<TItem>[],
): QueryKitTableColumn<TItem>[] {
  return columnDefinition.flatMap(
    /** Flattens entries produced by the toQueryKitColumns mapping. */ (column) => {
      if (!column.id) return [];
      return [{ ...column } as QueryKitTableColumn<TItem>];
    },
  );
}

/**
 * Keep an actions column fixed at the far right without disturbing other user-selected pinned columns.
 *
 * @param columns - The currently visible renderer columns.
 * @param columnPinning - Persisted Query Kit pinning state.
 * @returns The original state when no actions column exists or it is already pinned right; otherwise corrected state.
 */
export function pinActionsColumnRight(
  columns: readonly { id?: string }[],
  columnPinning: Record<string, string[]>,
): Record<string, string[]> {
  if (
    !columns.some(
      /** Checks whether any entry satisfies `column.id === 'actions'`. */ (column) => column.id === 'actions',
    )
  )
    return columnPinning;

  const left = (columnPinning.left ?? []).filter(
    /** Keeps entries matching `columnId !== 'actions'`. */ (columnId) => columnId !== 'actions',
  );
  const right = (columnPinning.right ?? []).filter(
    /** Keeps entries matching `columnId !== 'actions'`. */ (columnId) => columnId !== 'actions',
  );
  if (left.length === (columnPinning.left ?? []).length && right.length !== (columnPinning.right ?? []).length) {
    return columnPinning;
  }

  return { ...columnPinning, left, right: [...right, 'actions'] };
}

/** Preserve global preferences while isolating Repository and category table identities. */
export function repositoryTableName(name: string, repositoryId?: string, kind?: string): string {
  return repositoryId ? `repository:${repositoryId}:${kind ? `security-alerts:${kind}` : name}` : name;
}

/** Keep fixed Repository scope outside all user-editable filtering constraints. */
export function withRepositoryScope(
  filter?: Record<string, unknown>,
  repositoryId?: string,
): Record<string, unknown> | undefined {
  return repositoryId ? { AND: [{ repositoryId }, ...(filter ? [filter] : [])] } : filter;
}

/** Accept only positive integer pagination addresses, including copied string query values. */
export function normalizeRepositoryPage(value: unknown): number {
  const page = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

/**
 * Provide persistent, route-aware Query Kit table state for a Repovio resource endpoint.
 *
 * @param options - Endpoint, query configuration, and full renderer column metadata.
 * @returns Query Kit table state plus Nuxt UI-compatible filtering state.
 */
export const useTable = <TEndpoint extends Endpoint>(options: UseTableOptions<TEndpoint>) => {
  const routePage = useRouteQuery('page', 1, { transform: Number });
  if (options.repositoryId) {
    watch(
      routePage,
      /** Normalize invalid scoped addresses without changing global table behavior. */ (value) => {
        const page = normalizeRepositoryPage(value);
        if (page !== value) routePage.value = page;
      },
      { immediate: true, flush: 'sync' },
    );
  }
  const columns = computed<QueryKitTableColumn<TableRow<TEndpoint>>[]>(
    /** Derives columns from the current reactive dependencies. */ () =>
      toQueryKitColumns(options.columnDefinition.value),
  );
  const table = useQueryKitTable<TableRow<TEndpoint>>({
    api: useApi(),
    columns,
    defaultItemsPerPage: options.defaultItemsPerPage,
    endpoint: options.endpoint,
    persistenceKey: repositoryTableName(options.name, options.repositoryId, options.scopeKind),
    routePage,
    staticFields: options.staticFields,
    staticFilter: computed(
      /** Compose server-side fixed scope with existing search constraints. */ () =>
        withRepositoryScope(options.staticFilter?.value, options.repositoryId),
    ),
  });

  watch(
    [columns, table.columnPinning],
    /** Synchronizes use table when the observed state changes. */
    ([currentColumns, currentPinning]) => {
      const correctedPinning = pinActionsColumnRight(currentColumns, currentPinning);
      if (correctedPinning !== currentPinning) table.columnPinning.value = correctedPinning;
    },
    { deep: true, immediate: true },
  );

  if (options.repositoryId) {
    watch(
      [table.loading, table.totalPages],
      /** Recover stale addresses only after a successful response. */ () => {
        if (!table.loading.value && !table.error.value && table.page.value > Math.max(1, table.totalPages.value))
          table.page.value = Math.max(1, table.totalPages.value);
      },
    );
  }
  const items = computed(
    /** Never present retained scoped rows as successful results after a failed query. */ () =>
      options.repositoryId && table.error.value ? [] : table.items.value,
  );
  return { ...table, items, filtering: table.filtering as Ref<Filtering> };
};
