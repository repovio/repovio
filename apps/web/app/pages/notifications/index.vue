<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="border-b border-default p-4 sm:px-6">
      <UAlert
        v-if="push.error.value"
        class="mb-4"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t('notifications.push.error')"
      />
      <UCard :ui="{ body: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' }">
        <div class="flex min-w-0 items-start gap-3">
          <UIcon class="mt-0.5 size-6 shrink-0 text-primary" name="i-lucide-monitor-smartphone" />
          <div>
            <p class="font-semibold">
              {{ $t('notifications.push.title') }}
            </p>
            <p class="text-sm text-muted">
              {{
                $t('notifications.push.description', {
                  count: push.subscriptionCount.value,
                })
              }}
            </p>
          </div>
        </div>
        <UButton
          color="neutral"
          :disabled="!push.supported.value || !push.available.value"
          :icon="push.currentDeviceEnabled.value ? 'i-lucide-bell-off' : 'i-lucide-bell-ring'"
          :label="
            !push.available.value
              ? $t('notifications.push.unavailable')
              : push.currentDeviceEnabled.value
                ? $t('notifications.push.disable')
                : $t('notifications.push.enable')
          "
          :loading="push.loading.value"
          @click="push.currentDeviceEnabled.value ? disablePush() : push.enable()"
        />
      </UCard>
    </div>

    <div
      class="flex min-w-0 flex-wrap items-center gap-2 border-b border-default p-3 sm:justify-end sm:px-4"
      data-table-toolbar
    >
      <QTableSorting v-model:sorting="sorting" :fields="sortableFields" shortcuts>
        <template #trigger="{ active, open, toggle }">
          <CommonTablePopoverTrigger kind="sorting" :active="active" :open="open" :toggle="toggle" />
        </template>
      </QTableSorting>
      <QTableFiltering v-model:filtering="filtering" :fields="filterFields" shortcuts>
        <template #trigger="{ active, open, toggle }">
          <CommonTablePopoverTrigger kind="filtering" :active="active" :open="open" :toggle="toggle" />
        </template>
      </QTableFiltering>
      <QTableOptions
        v-model:column-order="columnOrder"
        v-model:column-pinning="columnPinning"
        v-model:invisible-columns="columnVisibility"
        :columns="columnDefinition"
        shortcuts
      >
        <template #trigger="{ open, toggle }">
          <CommonTablePopoverTrigger kind="options" :open="open" :toggle="toggle" />
        </template>
      </QTableOptions>
      <UButton
        v-if="auth.user?.role === 'SYSTEM_ADMIN'"
        icon="i-lucide-plus"
        :label="$t('notifications.channels.add')"
        @click="openCreate"
      />
    </div>

    <UAlert
      v-if="tableError"
      class="m-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('notifications.loadError')"
    />
    <UTable
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1"
      :columns="columns"
      :data="items"
      :empty="$t('notifications.channels.empty')"
      :loading="loading"
      :ui="{
        th: 'first:pl-8 bg-neutral-100 data-[pinned=right]:bg-neutral-100 dark:bg-neutral-950/20 dark:data-[pinned=right]:bg-neutral-950',
        td: 'first:pl-8 data-[pinned=right]:bg-default',
      }"
    >
      <template #type-cell="{ row }">
        <UBadge color="neutral" variant="subtle">
          {{ typeLabel(row.original.type) }}
        </UBadge>
      </template>
      <template #urlScheme-cell="{ row }">
        <span class="text-sm text-muted">
          {{
            row.original.browserRecipients.length > 0
              ? row.original.browserRecipients.map(({ username }) => `@${username}`).join(', ')
              : row.original.urlScheme
          }}
        </span>
      </template>
      <template #eventSubscriptions-cell="{ row }">
        <div class="flex max-w-96 flex-wrap gap-1">
          <UBadge
            v-for="event in row.original.eventSubscriptions"
            :key="event.eventType"
            color="neutral"
            variant="outline"
          >
            {{ $t(`notifications.events.${event.eventType}`) }}
          </UBadge>
        </div>
      </template>
      <template #enabled-cell="{ row }">
        <UBadge variant="subtle" :color="row.original.enabled ? 'success' : 'neutral'">
          {{ row.original.enabled ? $t('notifications.enabled') : $t('notifications.disabled') }}
        </UBadge>
      </template>
      <template #updatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatDateTime(row.original.updatedAt) }}</span>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div v-if="row.original.canManage" class="flex justify-end gap-1">
          <UButton
            color="neutral"
            icon="i-lucide-send"
            variant="ghost"
            :aria-label="$t('notifications.channels.test')"
            :disabled="isPending(row.original.id) || !canTest()"
            :loading="isPending(`test:${row.original.id}`)"
            @click="testChannel(row.original)"
          />
          <UButton
            color="neutral"
            icon="i-lucide-pencil"
            variant="ghost"
            :aria-label="$t('notifications.channels.edit')"
            :disabled="isPending(row.original.id)"
            @click="openEdit(row.original)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            :aria-label="
              row.original.enabled ? $t('notifications.channels.disable') : $t('notifications.channels.enable')
            "
            :icon="row.original.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
            :loading="isPending(`toggle:${row.original.id}`)"
            @click="toggle(row.original)"
          />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            variant="ghost"
            :aria-label="$t('notifications.channels.delete')"
            :loading="isPending(`delete:${row.original.id}`)"
            @click="remove(row.original.id)"
          />
        </div>
      </template>
    </UTable>
    <QTablePagination
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      class="border-t border-default"
      :total-items="totalItems"
      shortcuts
    />

    <ModulesNotificationsChannelDialog
      v-model:open="dialogOpen"
      :channel="selectedChannel"
      :browser-push-available="push.available.value"
      :repositories="manageableRepositories"
      :users="users"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDestructiveAction } from '~/composables/app/destructive-action';

import { FilterFieldType, type FilterField, type SortingField } from '@querry-kit/nuxt-ui/types';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useBrowserPush } from '~/composables/app/browser-push';
import { useDateTime } from '~/composables/use-date-time';
import { usePendingActions } from '~/composables/use-pending-actions';
import { useAuthStore } from '~/store/auth';
import type { NotificationChannel, NotificationChannelType } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';

type ChannelRow = NotificationChannel & Record<string, unknown>;
type ChannelColumn = ColumnDefinition<ChannelRow> & { header: string; id: string };

const { confirmDestructiveAction } = useDestructiveAction();
const { t } = useI18n();
const toast = useToast();
const api = useRepovioApi();
const auth = useAuthStore();
const push = useBrowserPush();
const { formatDateTime } = useDateTime();
const { isPending, run: runPendingAction } = usePendingActions();
const dialogOpen = ref(false);
const selectedChannel = ref<NotificationChannel | null>(null);
const manageableRepositories = ref<Array<{ id: string; name: string; owner: string }>>([]);
const users = ref<Array<{ id: string; username: string }>>([]);
const channelTypes: NotificationChannelType[] = [
  'EMAIL',
  'GOTIFY',
  'NTFY',
  'DISCORD',
  'CUSTOM_APPRISE',
  'BROWSER_PUSH',
];
const columnDefinition = computed<ChannelColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'name', header: t('notifications.columns.name'), id: 'name' },
    { accessorKey: 'type', header: t('notifications.columns.type'), id: 'type' },
    { header: t('notifications.columns.target'), id: 'urlScheme' },
    { header: t('notifications.columns.events'), id: 'eventSubscriptions' },
    { accessorKey: 'enabled', header: t('notifications.columns.status'), id: 'enabled' },
    { accessorKey: 'updatedAt', header: t('notifications.columns.updatedAt'), id: 'updatedAt' },
    { enableHiding: false, header: t('notifications.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('notifications.columns.name'), value: 'name' },
    { label: t('notifications.columns.type'), value: 'type' },
    { label: t('notifications.columns.status'), value: 'enabled' },
    { label: t('notifications.columns.updatedAt'), value: 'updatedAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('notifications.columns.type'),
      type: FilterFieldType.Enum,
      value: 'type',
      values: channelTypes.map(
        /** Projects each entry using `({ label: typeLabel(value), value })`. */ (value) => ({
          label: typeLabel(value),
          value,
        }),
      ),
    },
    { label: t('notifications.columns.status'), type: FilterFieldType.Boolean, value: 'enabled' },
  ],
);
const channelTable = useTable({
  columnDefinition,
  defaultItemsPerPage: 10,
  endpoint: 'notification-channels/query',
  name: 'notification-channels',
  staticFields: ['id', 'type', 'urlScheme', 'browserRecipients', 'eventSubscriptions', 'enabled', 'canManage'],
});
const {
  columnOrder,
  columnVisibility,
  columns,
  error: tableError,
  filtering,
  items,
  itemsPerPage,
  loading,
  page,
  sorting,
  totalItems,
} = channelTable;
const columnPinning = computed({
  /** Reads the column pinning binding. */
  get: () => ({ left: channelTable.columnPinning.value.left, right: channelTable.columnPinning.value.right }),
  /** Writes the column pinning binding. */
  set: (value: { left?: string[]; right?: string[] }) => {
    channelTable.columnPinning.value = value;
  },
});

/** Provides the type label fixture for this scenario. */
function typeLabel(type: NotificationChannelType): string {
  return t(`notifications.channelTypes.${type}`);
}

/** Checks whether the caller can test. */
function canTest(): boolean {
  return auth.user?.role === 'SYSTEM_ADMIN';
}

/** Opens create. */
function openCreate(): void {
  selectedChannel.value = null;
  dialogOpen.value = true;
}

/** Opens edit. */
function openEdit(channel: NotificationChannel): void {
  selectedChannel.value = channel;
  dialogOpen.value = true;
}

/** Handles saved. */
async function handleSaved(): Promise<void> {
  await channelTable.refresh();
}

/** Confirm removal of this browser's push subscription. */
async function disablePush(): Promise<void> {
  await confirmDestructiveAction(
    t('notifications.push.disable'),
    /** Unsubscribe this device and surface errors inside the confirmation. */ async () => {
      await push.disable();
      if (push.error.value) throw new Error('Push subscription removal failed.');
    },
  );
}

/** Toggles index. */
async function toggle(channel: NotificationChannel): Promise<void> {
  await runPendingAction(
    `toggle:${channel.id}`,
    /** Performs toggle while retaining the initiating action’s pending state. */ async () => {
      await api.notificationChannels.update(channel.id, { enabled: !channel.enabled });
      await channelTable.refresh();
    },
  );
}

/** Removes index. */
async function remove(id: string): Promise<void> {
  await confirmDestructiveAction(
    items.value.find(/** Find the affected channel. */ (channel) => channel.id === id)?.name ?? id,
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      await runPendingAction(
        `delete:${id}`,
        /** Performs remove while retaining the initiating action’s pending state. */ async () => {
          await api.notificationChannels.delete(id);
          await channelTable.refresh();
        },
      );
    },
  );
}

/** Provides the test channel fixture for this scenario. */
async function testChannel(channel: NotificationChannel): Promise<void> {
  await runPendingAction(
    `test:${channel.id}`,
    /** Performs test channel while retaining the initiating action’s pending state. */ async () => {
      const { data } = await api.notificationChannels.test(channel.id);
      toast.add({
        color: data.status === 'DELIVERED' ? 'success' : 'error',
        title: t(
          data.status === 'DELIVERED' ? 'notifications.channels.testSuccess' : 'notifications.channels.testFailure',
        ),
      });
    },
  );
}

onMounted(
  /** Initializes component subscriptions and data after mounting. */ async () => {
    const requests: Promise<unknown>[] = [channelTable.initialize(), push.refresh()];
    if (auth.user?.role === 'SYSTEM_ADMIN') {
      requests.push(
        api.notificationChannels.manageableRepositories().then(
          /** Stores the repositories available to notification-channel rules. */ ({ data }) => {
            manageableRepositories.value = data;
          },
        ),
        api.users.list().then(
          /** Stores users available as browser-push recipients. */ ({ data }) => {
            users.value = data.items.map(
              /** Projects each entry using `({ id, username })`. */ ({ id, username }) => ({ id, username }),
            );
          },
        ),
      );
    }
    await Promise.all(requests);
  },
);
</script>
