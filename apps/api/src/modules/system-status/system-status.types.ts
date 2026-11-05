import type { ProviderSyncActivity } from '@repovio/schemas';

export { systemStatusEvent as SYSTEM_STATUS_EVENT } from '@repovio/schemas';
export type { ProviderSyncActivity, SystemStatusSnapshot } from '@repovio/schemas';

/** Detailed phase of a read-only provider workflow synchronization. */
export type ProviderSyncPhase = ProviderSyncActivity['phase'];

/** Complete update for an active provider synchronization. */
export type ProviderSyncActivityUpdate = Omit<ProviderSyncActivity, 'kind'>;
