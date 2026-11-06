<template>
  <UModal
    v-model:open="open"
    :content="{ onOpenAutoFocus: captureFocus, onCloseAutoFocus: restoreFocus }"
    :description="t('commandPalette.description')"
    :title="t('commandPalette.title')"
    :ui="{ body: 'p-0 sm:p-0', content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <UCommandPalette
        v-if="open"
        v-model:search-term="query"
        close
        preserve-group-order
        :aria-label="t('commandPalette.title')"
        :groups="groups"
        :loading="isSearching"
        :placeholder="t('commandPalette.searchPlaceholder')"
        :ui="{ root: 'max-h-[min(70vh,36rem)]' }"
        @update:model-value="closePalette"
        @update:open="open = $event"
      >
        <template #empty>
          <p class="px-4 py-8 text-center text-sm text-muted">
            {{ !canSearch && query ? t('layout.searchHint') : t('commandPalette.noResults') }}
          </p>
        </template>

        <template #footer>
          <div v-if="failedGroups.length" class="border-t border-default px-4 py-3" role="status">
            <p class="text-xs text-warning">{{ t('layout.searchPartialError') }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ failedGroups.join(', ') }}</p>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>

  <ModulesProvidersAddDialog v-if="isAdmin" v-model:open="providerDialogOpen" />
  <ModulesRepositoriesAddDialog v-if="isAdmin" v-model:open="repositoryDialogOpen" />
</template>

<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from '#ui/types';
import { computed, nextTick, ref, watch } from 'vue';

import { useCommandPalette } from '~/composables/app/command-palette';
import { useGlobalSearch } from '~/composables/app/global-search';
import { useNavigationItems } from '~/composables/app/navigation-items';
import { useAuthStore } from '~/store/auth';

const { t } = useI18n();
const auth = useAuthStore();
const { close: closePalette, open } = useCommandPalette();
const { navigationSearchItems } = useNavigationItems();
const query = ref('');
let previousFocus: HTMLElement | null = null;
const providerDialogOpen = ref(false);
const repositoryDialogOpen = ref(false);
const isAdmin = computed(
  /** Derives is admin from the current reactive dependencies. */ () => auth.user?.role === 'SYSTEM_ADMIN',
);
const {
  canSearch,
  cancelPendingSearch,
  isSearching,
  navigationResults,
  providerAccountResults,
  providerAccounts,
  repositories,
  repositoryResults,
  workflowRunResults,
  workflowRuns,
} = useGlobalSearch(query);
const failedGroups = computed(
  /** Derives failed groups from the current reactive dependencies. */ () => [
    ...(providerAccounts.error.value ? [t('layout.searchProviders')] : []),
    ...(repositories.error.value ? [t('layout.searchRepositories')] : []),
    ...(workflowRuns.error.value ? [t('layout.searchWorkflowRuns')] : []),
  ],
);
const navigationCommands = computed<CommandPaletteItem[]>(
  /** Derives navigation commands from the current reactive dependencies. */ () =>
    (canSearch.value ? navigationResults.value : navigationSearchItems.value).map(
      /** Projects each entry using `({ id: `navigation:${item.to}`, icon: item.icon, label: item.label, onSelect: closePalette, to: item.to, })`. */ (
        item,
      ) => ({
        id: `navigation:${item.to}`,
        icon: item.icon,
        label: item.label,
        onSelect: closePalette,
        to: item.to,
      }),
    ),
);
const actionCommands = computed<CommandPaletteItem[]>(
  /** Derives action commands from the current reactive dependencies. */ () => {
    if (!isAdmin.value) return [];
    return [
      {
        description: t('commandPalette.addProviderDescription'),
        icon: 'i-lucide-plug-zap',
        id: 'action:add-provider',
        label: t('commandPalette.addProvider'),
        /** Runs the selected menu action. */
        onSelect: () => openDialog(providerDialogOpen),
      },
      {
        description: t('commandPalette.addRepositoryDescription'),
        icon: 'i-lucide-git-fork',
        id: 'action:add-repository',
        label: t('commandPalette.addRepository'),
        /** Runs the selected menu action. */
        onSelect: () => openDialog(repositoryDialogOpen),
      },
    ];
  },
);
const groups = computed<CommandPaletteGroup[]>(
  /** Derives groups from the current reactive dependencies. */ () => {
    const result: CommandPaletteGroup[] = [
      {
        id: 'navigation',
        ignoreFilter: canSearch.value,
        items: navigationCommands.value,
        label: t('layout.searchNavigation'),
      },
    ];

    if (providerAccountResults.value.length) {
      result.push({
        id: 'providers',
        ignoreFilter: true,
        items: providerAccountResults.value.map(
          /** Projects each entry using the items mapping. */ (provider) => ({
            description: provider.baseUrl ?? provider.providerType,
            icon: 'i-lucide-plug-zap',
            id: `provider:${provider.id}`,
            label: provider.displayName,
            onSelect: closePalette,
            suffix: provider.providerType,
            to: '/admin/providers',
          }),
        ),
        label: t('layout.searchProviders'),
      });
    }
    if (repositoryResults.value.length) {
      result.push({
        id: 'repositories',
        ignoreFilter: true,
        items: repositoryResults.value.map(
          /** Projects each entry using the items mapping. */ (repository) => ({
            description: repository.url,
            icon: 'i-lucide-git-fork',
            id: `repository:${repository.id}`,
            label: `${repository.owner}/${repository.name}`,
            onSelect: closePalette,
            to: { path: '/repositories', query: { repository: repository.id } },
          }),
        ),
        label: t('layout.searchRepositories'),
      });
    }
    if (workflowRunResults.value.length) {
      result.push({
        id: 'workflow-runs',
        ignoreFilter: true,
        items: workflowRunResults.value.map(
          /** Projects each entry using the items mapping. */ (workflowRun) => ({
            description: `${workflowRun.repositoryOwner}/${workflowRun.repositoryName} · ${workflowRun.displayTitle}`,
            external: true,
            icon: 'i-tabler-activity',
            id: `workflow-run:${workflowRun.id}`,
            label: workflowRun.workflowName,
            onSelect: closePalette,
            suffix: t(`workflowStatus.${workflowRun.status}`),
            target: '_blank',
            to: workflowRun.url,
          }),
        ),
        label: t('layout.searchWorkflowRuns'),
      });
    }
    if (actionCommands.value.length) {
      result.push({ id: 'actions', items: actionCommands.value, label: t('commandPalette.actions') });
    }

    return result;
  },
);

/** Close the palette before handing focus and loading state to an existing creation dialog. */
function openDialog(dialogOpen: { value: boolean }): void {
  closePalette();
  void nextTick(
    /** Focuses the command input after the dialog has mounted. */ () => {
      dialogOpen.value = true;
    },
  );
}

/** Remember the search trigger or shortcut origin before focus enters the palette. */
function captureFocus(): void {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

/** A controlled search dialog has no built-in trigger to restore focus to. */
function restoreFocus(event: Event): void {
  event.preventDefault();
  if (previousFocus?.isConnected) previousFocus.focus();
  previousFocus = null;
}

watch(
  open,
  /** Synchronizes command palette when the observed state changes. */
  (isOpen) => {
    if (!isOpen) {
      query.value = '';
      cancelPendingSearch();
    }
  },
  { flush: 'sync' },
);
</script>
