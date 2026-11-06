import type { BadgeProps } from '#ui/types';
import type { Ref } from 'vue';

import type { ProviderType } from '~/types/api/resources';

/** Resolve localized presentation metadata for a provider type. */
export const useProviderType = (value?: Ref<ProviderType | undefined>) => {
  const { t } = useI18n();

  /** Retrieves label. */
  const getLabel = (providerType?: ProviderType): string => {
    if (!providerType) return '';
    return t(`providers.types.${providerType}`);
  };

  /** Retrieves icon. */
  const getIcon = (providerType?: ProviderType): string | undefined => {
    switch (providerType) {
      case 'GITHUB':
        return 'i-tabler-brand-github';
      case 'GITLAB':
        return 'i-tabler-brand-gitlab';
      case 'FORGEJO':
        return 'i-simple-icons-forgejo';
      case 'GITEA':
        return 'i-simple-icons-gitea';
      default:
        return undefined;
    }
  };

  /** Retrieves color. */
  const getColor = (providerType?: ProviderType): BadgeProps['color'] | undefined => {
    switch (providerType) {
      case 'GITHUB':
        return 'neutral';
      case 'GITLAB':
        return 'warning';
      case 'FORGEJO':
        return 'error';
      case 'GITEA':
        return 'success';
      default:
        return undefined;
    }
  };

  const label = computed(/** Derives label from the current reactive dependencies. */ () => getLabel(toValue(value)));
  const icon = computed(/** Derives icon from the current reactive dependencies. */ () => getIcon(toValue(value)));
  const color = computed(/** Derives color from the current reactive dependencies. */ () => getColor(toValue(value)));

  return {
    color,
    getColor,
    getIcon,
    getLabel,
    icon,
    label,
  };
};
