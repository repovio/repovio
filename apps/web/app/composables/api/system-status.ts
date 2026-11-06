import { io, type Socket } from 'socket.io-client';
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';

import {
  systemStatusEvent,
  systemStatusSnapshotSchema,
  type ProviderSyncActivity,
  type SystemStatusSnapshot,
} from '../../types/api/system-status';
import { accessTokenStorageKey } from './api';

/** Defines the system status connection contract shared by its consumers. */ export type SystemStatusConnection =
  'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

interface StatusProgress {
  current: number;
  total: number;
}

interface ServerToClientEvents {
  [systemStatusEvent]: (snapshot: unknown) => void;
}

/** Access the shared status snapshot without creating another Socket.IO connection. */
export function useSystemStatusState() {
  const connection = useState<SystemStatusConnection>(
    'system-status-connection',
    /** Evaluates `'CONNECTING'` when useState invokes this callback. */ () => 'CONNECTING',
  );
  const snapshot = useState<SystemStatusSnapshot>(
    'system-status-snapshot',
    /** Evaluates `({ activity: null, runningWorkflowCount: 0, updatedAt: '', })` when useState invokes this callback. */ () => ({
      activity: null,
      runningWorkflowCount: 0,
      updatedAt: '',
    }),
  );
  const progress = computed(
    /** Derives progress from the current reactive dependencies. */ () =>
      getSystemStatusProgress(snapshot.value.activity),
  );
  return { connection, progress, snapshot };
}

/** Convert the configured HTTP API base URL to the Socket.IO status namespace URL. */
export function getSystemStatusSocketUrl(apiBaseUrl: string, browserOrigin: string): string {
  const url = new URL(apiBaseUrl, browserOrigin);
  url.pathname = url.pathname.replace(/\/api(?:\/v\d+)?\/?$/, '');
  url.search = '';
  url.hash = '';
  return `${url.toString().replace(/\/$/, '')}/status`;
}

/** Select the most precise progress counter available for a provider synchronization. */
export function getSystemStatusProgress(activity: ProviderSyncActivity | null): StatusProgress | null {
  if (!activity) return null;
  if (
    activity.phase === 'PROCESSING_WORKFLOWS' &&
    activity.workflowRunsCompleted !== null &&
    activity.workflowRunsTotal !== null
  ) {
    return { current: activity.workflowRunsCompleted, total: activity.workflowRunsTotal };
  }
  return { current: activity.repositoriesCompleted, total: activity.repositoriesTotal };
}

/** Connect the global layout to the authenticated, read-only API status channel. */
export function useSystemStatus() {
  const config = useRuntimeConfig();
  const { connection, progress, snapshot } = useSystemStatusState();
  const socket = shallowRef<Socket<ServerToClientEvents> | null>(null);

  onMounted(
    /** Initializes component subscriptions and data after mounting. */ () => {
      const accessToken = window.localStorage.getItem(accessTokenStorageKey);
      if (!accessToken) {
        connection.value = 'DISCONNECTED';
        return;
      }

      const client = io(getSystemStatusSocketUrl(config.public.apiBaseUrl, window.location.origin), {
        auth: { token: accessToken },
        transports: ['websocket'],
      });
      socket.value = client;
      client.on(
        'connect',
        /** Marks the system-status socket as connected. */ () => {
          connection.value = 'CONNECTED';
        },
      );
      client.on(
        'connect_error',
        /** Marks the system-status socket as disconnected after a connection failure. */ () => {
          connection.value = 'DISCONNECTED';
        },
      );
      client.on(
        'disconnect',
        /** Marks the system-status socket as disconnected. */ () => {
          connection.value = 'DISCONNECTED';
        },
      );
      client.on(
        systemStatusEvent,
        /** Stores system-status snapshots only after validating their payload. */ (value) => {
          const result = systemStatusSnapshotSchema.safeParse(value);
          if (result.success) snapshot.value = result.data;
        },
      );
    },
  );

  onBeforeUnmount(
    /** Releases component resources and subscriptions before disposal. */ () => {
      socket.value?.disconnect();
      socket.value = null;
    },
  );

  return { connection, progress, snapshot };
}
