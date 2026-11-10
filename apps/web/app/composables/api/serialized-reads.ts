import { CanceledError, getAdapter, type AxiosInstance } from 'axios';
import { createReadQueue } from '../app/refresh-reads';

/** Serialize one view's actual transport, including Query Kit's internal query-watcher requests. */
export function serializeApiReads(client: AxiosInstance, signal: AbortSignal): void {
  const transport = getAdapter(client.defaults.adapter);
  const enqueue = createReadQueue();
  client.defaults.adapter = /** Queue the original query snapshot without replacing Query Kit response ownership. */ (
    config,
  ) =>
    enqueue(
      /** Dispatch only while this view still owns the request. */ async () => {
        if (signal.aborted || config.signal?.aborted) throw new CanceledError();
        const requestSignal = config.signal ? AbortSignal.any([signal, config.signal as AbortSignal]) : signal;
        return transport({ ...config, signal: requestSignal });
      },
    );
}
