<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <nav
      class="shrink-0 overflow-x-auto border-b border-default px-4"
      :aria-label="$t('securityAlerts.categoryNavigation')"
    >
      <UNavigationMenu class="w-max" :items="categories" />
    </nav>
    <ModulesSecurityAlertsTablePage
      :key="`${repositoryId}:${kind}`"
      embedded
      :repository-id="repositoryId"
      :kind="kind"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';
import type { SecurityAlertKind } from '~/types/api/resources';
definePageMeta({ fullWidth: true, middleware: 'manager' });
const { repositoryId } = useRepositoryDetail();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const kinds: SecurityAlertKind[] = ['DEPENDENCY', 'CODE', 'SECRET'];
const kind = computed<SecurityAlertKind>(
  /** Normalize all malformed category queries to the existing default. */ () =>
    typeof route.query.kind === 'string' && kinds.includes(route.query.kind as SecurityAlertKind)
      ? (route.query.kind as SecurityAlertKind)
      : 'DEPENDENCY',
);
const categories = computed(
  /** Category links push history without carrying another category's page or preset. */ () =>
    kinds.map(
      /** Build an explicitly active category link. */ (value) => ({
        label: t(`securityAlerts.kindTitles.${value}`),
        active: kind.value === value,
        to: { path: route.path, query: { kind: value } },
      }),
    ),
);
watch(
  /** Watch raw values, including repeated query parameters. */ () => route.query.kind,
  /** Canonicalize invalid/absent input without adding a browser history entry. */ () => {
    if (route.query.kind !== kind.value)
      void router.replace({
        path: route.path,
        query: { ...(route.query.page ? { page: route.query.page } : {}), kind: kind.value },
      });
  },
  { immediate: true },
);
</script>
