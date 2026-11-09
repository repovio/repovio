import type { NavigationMenuItem } from '#ui/types';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

import { useAuthStore } from '~/store/auth';

/** Optional workflow attention counters displayed only by the sidebar. */
export interface NavigationAttentionCounts {
  awaitingApproval?: MaybeRefOrGetter<number | null>;
  needsAttention?: MaybeRefOrGetter<number | null>;
}

/** Search-friendly representation of a reachable application destination. */
export interface NavigationSearchItem {
  icon: string;
  label: string;
  to: string;
}

interface AppNavigationItem extends NavigationSearchItem {
  active: boolean;
  badge?: { color: 'error' | 'warning'; label: number; variant: 'soft' };
}

/** Retain a destination's visible label as its accessible name when the sidebar collapses to icons. */
function toMenuItem(item: AppNavigationItem): NavigationMenuItem {
  return { ...item, 'aria-label': item.label };
}

/** Provide one permission-aware route definition for the sidebar, search, and future command palette. */
export function useNavigationItems(attentionCounts: NavigationAttentionCounts = {}) {
  const { t } = useI18n();
  const route = useRoute();
  const auth = useAuthStore();

  /** Match an exact route or its nested details without also selecting sibling workflow-run routes. */
  function isActive(path: string, exact = false): boolean {
    return exact ? route.path === path : route.path === path || route.path.startsWith(`${path}/`);
  }

  const dashboard = computed<AppNavigationItem>(
    /** Derives dashboard from the current reactive dependencies. */ () => ({
      active: isActive('/', true),
      icon: 'i-lucide-layout-dashboard',
      label: t('layout.dashboard'),
      to: '/',
    }),
  );
  const workflowRuns = computed<AppNavigationItem[]>(
    /** Derives workflow runs from the current reactive dependencies. */ () => [
      {
        active: isActive('/workflow-runs', true),
        icon: 'i-lucide-list-tree',
        label: t('workflowRuns.allRuns'),
        to: '/workflow-runs',
      },
      {
        active: isActive('/workflows/awaiting-approval'),
        badge:
          (toValue(attentionCounts.awaitingApproval) ?? 0) > 0
            ? { color: 'warning', label: toValue(attentionCounts.awaitingApproval)!, variant: 'soft' }
            : undefined,
        icon: 'i-lucide-shield-alert',
        label: t('awaitingApproval.title'),
        to: '/workflows/awaiting-approval',
      },
      {
        active: isActive('/workflow-runs/needs-attention'),
        badge:
          (toValue(attentionCounts.needsAttention) ?? 0) > 0
            ? { color: 'error', label: toValue(attentionCounts.needsAttention)!, variant: 'soft' }
            : undefined,
        icon: 'i-lucide-triangle-alert',
        label: t('needsAttention.title'),
        to: '/workflow-runs/needs-attention',
      },
    ],
  );
  const repositories = computed<AppNavigationItem>(
    /** Derives repositories from the current reactive dependencies. */ () => ({
      active: isActive('/repositories'),
      icon: 'i-lucide-git-fork',
      label: t('layout.repositories'),
      to: '/repositories',
    }),
  );
  const jobs = computed<AppNavigationItem>(
    /** Derives jobs from the current reactive dependencies. */ () => ({
      active: isActive('/jobs'),
      icon: 'i-lucide-list-checks',
      label: t('layout.jobs'),
      to: '/jobs',
    }),
  );
  const issues = computed<AppNavigationItem>(
    /** Derives issues from the current reactive dependencies. */ () => ({
      active: isActive('/issues'),
      icon: 'i-tabler-circle-dot',
      label: t('layout.issues'),
      to: '/issues',
    }),
  );
  const pullRequests = computed<AppNavigationItem>(
    /** Derives pull requests from the current reactive dependencies. */ () => ({
      active: isActive('/pull-requests'),
      icon: 'i-tabler-git-pull-request',
      label: t('layout.pullRequests'),
      to: '/pull-requests',
    }),
  );
  const alerts = computed<AppNavigationItem[]>(
    /** Derives alerts from the current reactive dependencies. */ () => {
      if (!['MANAGER', 'SYSTEM_ADMIN'].includes(auth.user?.role ?? '')) return [];
      return [
        {
          active: isActive('/alerts/dependencies'),
          icon: 'i-lucide-package-search',
          label: t('securityAlerts.dependencies'),
          to: '/alerts/dependencies',
        },
        {
          active: isActive('/alerts/code'),
          icon: 'i-lucide-file-search-2',
          label: t('securityAlerts.code'),
          to: '/alerts/code',
        },
        {
          active: isActive('/alerts/secrets'),
          icon: 'i-lucide-key-round',
          label: t('securityAlerts.secrets'),
          to: '/alerts/secrets',
        },
      ];
    },
  );
  const notifications = computed<AppNavigationItem>(
    /** Derives notifications from the current reactive dependencies. */ () => ({
      active: isActive('/notifications'),
      icon: 'i-lucide-bell',
      label: t('layout.notifications'),
      to: '/notifications',
    }),
  );
  const administration = computed<AppNavigationItem[]>(
    /** Derives administration from the current reactive dependencies. */ () => {
      if (auth.user?.role !== 'SYSTEM_ADMIN') return [];
      return [
        {
          active: isActive('/admin/providers'),
          icon: 'i-lucide-plug-zap',
          label: t('layout.providers'),
          to: '/admin/providers',
        },
        {
          active: isActive('/admin/users'),
          icon: 'i-lucide-users',
          label: t('layout.users'),
          to: '/admin/users',
        },
        {
          active: isActive('/admin/user-groups'),
          icon: 'i-lucide-users-round',
          label: t('userGroups.title'),
          to: '/admin/user-groups',
        },
        {
          active: isActive('/admin/settings'),
          icon: 'i-lucide-settings',
          label: t('layout.settings'),
          to: '/admin/settings',
        },
      ];
    },
  );

  const navigationItems = computed<NavigationMenuItem[]>(
    /** Derives navigation items from the current reactive dependencies. */ () => {
      const items: NavigationMenuItem[] = [
        { label: t('layout.overview'), type: 'label' },
        toMenuItem(dashboard.value),
        {
          'aria-label': t('layout.workflowRuns'),
          active: workflowRuns.value.some(
            /** Checks whether any entry satisfies `item.active`. */ (item) => item.active,
          ),
          children: workflowRuns.value.map(toMenuItem),
          defaultOpen: true,
          icon: 'i-lucide-list-tree',
          label: t('layout.workflowRuns'),
          type: 'trigger',
        },
        toMenuItem(issues.value),
        toMenuItem(pullRequests.value),
        ...(alerts.value.length > 0
          ? [
              {
                'aria-label': t('securityAlerts.title'),
                active: alerts.value.some(
                  /** Checks whether any entry satisfies `item.active`. */ (item) => item.active,
                ),
                children: alerts.value.map(toMenuItem),
                defaultOpen: true,
                icon: 'i-lucide-shield-alert',
                label: t('securityAlerts.title'),
                type: 'trigger' as const,
              },
            ]
          : []),
        { label: t('layout.operations'), type: 'label' },
        toMenuItem(repositories.value),
        toMenuItem(jobs.value),
        toMenuItem(notifications.value),
      ];

      if (administration.value.length > 0) {
        items.push({ label: t('layout.administration'), type: 'label' }, ...administration.value.map(toMenuItem));
      }

      return items;
    },
  );

  const navigationSearchItems = computed<NavigationSearchItem[]>(
    /** Derives navigation search items from the current reactive dependencies. */ () => [
      dashboard.value,
      ...workflowRuns.value,
      issues.value,
      pullRequests.value,
      ...alerts.value,
      repositories.value,
      jobs.value,
      notifications.value,
      ...administration.value,
    ],
  );

  return { navigationItems, navigationSearchItems };
}
