<template>
  <UPopover v-model:open="open" :content="{ align: 'end' }">
    <UButton
      data-navbar-notifications
      color="neutral"
      icon="i-lucide-bell"
      variant="ghost"
      :aria-label="$t('notifications.navbar.open')"
    />
    <template #content>
      <section class="w-80 max-w-[calc(100vw-2rem)] space-y-4 p-4" :aria-label="$t('notifications.navbar.title')">
        <h2 class="font-semibold">
          {{ $t('notifications.navbar.title') }}
        </h2>
        <div class="space-y-2 border-b border-default pb-4">
          <p class="text-sm text-muted">
            {{ $t('notifications.push.description', { count: push.subscriptionCount.value }) }}
          </p>
          <p v-if="!push.supported.value" class="text-sm text-muted">
            {{ $t('notifications.push.states.unsupported') }}
          </p>
          <p v-else-if="!push.available.value" class="text-sm text-muted">
            {{ $t('notifications.push.unavailable') }}
          </p>
          <p v-else-if="push.permission.value === 'denied'" class="text-sm text-muted">
            {{ $t('notifications.push.states.permission') }}
          </p>
          <p v-if="push.errorStage.value" role="alert" class="text-sm text-error">
            {{ $t(`notifications.push.states.${push.errorStage.value}`) }}
          </p>
          <UButton
            v-if="push.supported.value && push.available.value"
            color="neutral"
            variant="soft"
            :icon="push.currentDeviceEnabled.value ? 'i-lucide-bell-off' : 'i-lucide-bell-ring'"
            :label="$t(push.currentDeviceEnabled.value ? 'notifications.push.disable' : 'notifications.push.enable')"
            :loading="push.loading.value"
            :disabled="refreshing"
            @click="push.currentDeviceEnabled.value ? push.disable() : push.enable()"
          />
          <UButton
            v-if="push.errorStage.value === 'availability'"
            color="neutral"
            variant="soft"
            :label="$t('notifications.navbar.retry')"
            :loading="refreshing"
            @click="refreshDevice"
          />
        </div>
        <div v-if="history.loading.value" role="status" class="text-sm text-muted">
          {{ $t('notifications.navbar.loading') }}
        </div>
        <div v-else-if="history.error.value" class="space-y-2">
          <p role="alert" class="text-sm text-error">
            {{ $t('notifications.loadError') }}
          </p>
          <UButton color="neutral" variant="soft" :label="$t('notifications.navbar.retry')" @click="history.load()" />
        </div>
        <p v-else-if="!history.items.value.length" class="text-sm text-muted">
          {{ $t('notifications.navbar.empty') }}
        </p>
        <ul v-else class="max-h-80 space-y-3 overflow-y-auto">
          <li v-for="item in history.items.value" :key="item.id" class="space-y-1 border-b border-default pb-2 text-sm">
            <p class="font-medium">
              {{
                item.eventType ? $t(`notifications.events.${item.eventType}`) : $t('notifications.deliveryKinds.TEST')
              }}
            </p>
            <a
              v-if="item.subjectUrl"
              class="block break-words text-primary hover:underline"
              rel="noopener noreferrer"
              target="_blank"
              :href="item.subjectUrl"
            >
              {{ item.subjectTitle }}
            </a>
            <p v-else class="break-words">
              {{ item.subjectTitle }}
            </p>
            <p v-if="item.repository" class="truncate text-xs text-muted">
              {{ item.repository.owner }}/{{ item.repository.name }}
            </p>
            <p class="text-xs text-muted">
              {{ formatDateTime(item.createdAt) }} · {{ $t(`notifications.navbar.status.${item.status}`) }}
            </p>
          </li>
        </ul>
        <p class="text-xs text-muted">
          {{ $t('notifications.navbar.acceptanceHint') }}
        </p>
        <UButton
          v-if="auth.user?.role === 'SYSTEM_ADMIN'"
          color="neutral"
          variant="link"
          to="/notifications/history"
          :label="$t('notifications.tabs.history')"
          @click="open = false"
        />
      </section>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useBrowserPush } from '~/composables/app/browser-push';
import { useRecentNotifications } from '~/composables/app/recent-notifications';
import { useDateTime } from '~/composables/use-date-time';
import { useAuthStore } from '~/store/auth';
const auth = useAuthStore();
const open = ref(false);
const refreshing = ref(false);
const push = useBrowserPush();
const history = useRecentNotifications();
const { formatDateTime } = useDateTime();

/** Refresh device state independently of history loading and error handling. */
async function refreshDevice(): Promise<void> {
  refreshing.value = true;
  try {
    await push.refresh();
  } finally {
    refreshing.value = false;
  }
}
watch(
  open,
  /** Fetch both independent surfaces each time the user opens notifications. */ (shown) => {
    if (shown) {
      void refreshDevice();
      void history.load();
    }
  },
);
watch(
  /** Observe account changes. */ () => auth.user?.id,
  /** Close private content on account transition. */ () => {
    open.value = false;
  },
  { flush: 'sync' },
);
</script>
