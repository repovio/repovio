import type { Ref } from 'vue';
import type { Repository, RepositoryDetail } from './api/resources';

/** Addressable sections inside one authorized Repository. */
export type RepositorySection =
  'overview' | 'workflow-runs' | 'issues' | 'pull-requests' | 'security-alerts' | 'settings';

/** Route-local Repository data and operations; consumers cannot replace its refs. */
export interface RepositoryDetailContext {
  repositoryId: Readonly<Ref<string>>;
  repository: Readonly<Ref<RepositoryDetail | undefined>>;
  loading: Readonly<Ref<boolean>>;
  loadError: Readonly<Ref<boolean>>;
  forbidden: Readonly<Ref<boolean>>;
  refreshing: Readonly<Ref<boolean>>;
  syncing: Readonly<Ref<boolean>>;
  reload: () => Promise<void>;
  handleRepositoryUpdated: (repository: Repository) => void;
  refreshRepository: () => Promise<void>;
  syncRepository: () => Promise<void>;
}
