<template>
  <div v-if="repository" class="flex min-h-0 min-w-0 flex-1 flex-col">
    <nav
      class="shrink-0 overflow-x-auto border-b border-default px-4"
      :aria-label="$t('repositoryDetails.settingsNavigation')"
    >
      <UNavigationMenu class="w-max" :items="navigation" />
    </nav>
    <section class="min-w-0 space-y-4 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 class="text-lg font-semibold">
          {{ $t('repositoryDetails.settings') }}
        </h2>
        <p class="text-sm text-muted">
          {{ $t('repositoryDetails.generalDescription') }}
        </p>
      </div>
      <div v-if="visited.has('general')" v-show="section === 'general'" data-settings-section="general">
        <ModulesRepositoriesDetailsGeneralCard
          :editable="true"
          :show-identity="false"
          :repository="repository"
          @updated="handleRepositoryUpdated"
        />
      </div>
      <div v-if="visited.has('webhook')" v-show="section === 'webhook'" data-settings-section="webhook">
        <ModulesRepositoriesDetailsSettingsWebhookPanel />
      </div>
      <div
        v-if="visited.has('workflow-filters')"
        v-show="section === 'workflow-filters'"
        data-settings-section="workflow-filters"
      >
        <ModulesRepositoriesDetailsWorkflowFiltersCard :repository-id="repository.id" />
      </div>
      <div v-if="visited.has('members')" v-show="section === 'members'" data-settings-section="members">
        <ModulesRepositoriesDetailsMembersCard :repository-id="repository.id" />
      </div>
      <div v-if="visited.has('groups')" v-show="section === 'groups'" data-settings-section="groups">
        <ModulesRepositoriesDetailsGroupsCard :repository-id="repository.id" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';

/** Settings destinations retain their cards only for the current route visit. */
type SettingsSection = 'general' | 'webhook' | 'workflow-filters' | 'members' | 'groups';
const sections: SettingsSection[] = ['general', 'webhook', 'workflow-filters', 'members', 'groups'];
const { repository, handleRepositoryUpdated } = useRepositoryDetail();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const visited = ref(new Set<SettingsSection>());
const section = computed<SettingsSection>(
  /** Resolve malformed and missing query values to the default section. */ () =>
    typeof route.query.tab === 'string' && sections.includes(route.query.tab as SettingsSection)
      ? (route.query.tab as SettingsSection)
      : 'general',
);
const navigation = computed(
  /** Keep section links shareable while preserving unrelated address state. */ () => {
    const labels: Record<SettingsSection, string> = {
      general: t('repositoryDetails.general'),
      webhook: t('repositoryDetails.webhook'),
      'workflow-filters': t('repositoryDetails.workflowFilters'),
      members: t('repositoryDetails.members'),
      groups: t('userGroups.repositoryTitle'),
    };
    return sections.map(
      /** Push history for deliberate section selections without remounting Settings. */ (value) => {
        const query = { ...route.query };
        delete query.tab;
        if (value !== 'general') query.tab = value;
        return {
          label: labels[value],
          active: section.value === value,
          to: { path: route.path, query, hash: route.hash },
        };
      },
    );
  },
);
watch(
  /** Include repeated and null query values in normalization. */ () => route.query.tab,
  /** Retain visited panels and canonicalize only invalid explicit selections. */ (raw) => {
    visited.value.add(section.value);
    if (raw !== undefined && raw !== section.value) {
      const query = { ...route.query };
      delete query.tab;
      void router.replace({ path: route.path, query, hash: route.hash });
    }
  },
  { immediate: true },
);
</script>
