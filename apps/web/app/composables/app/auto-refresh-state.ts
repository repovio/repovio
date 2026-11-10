/** Supported browser-local refresh cadences, in milliseconds; zero disables automatic work. */
export type RefreshInterval = 0 | 15000 | 30000 | 60000 | 300000;

export const refreshIntervalStorageKey = 'repovio:auto-refresh:interval-ms';

/** Accept only explicitly supported numeric values without coercing untrusted storage. */
export function normalizeRefreshInterval(value: unknown): RefreshInterval {
  return value === 0 || value === 15000 || value === 30000 || value === 60000 || value === 300000 ? value : 15000;
}

/** Restore a safe preference even when browser storage or JSON decoding fails. */
export function readRefreshInterval(storage: Pick<Storage, 'getItem'>): RefreshInterval {
  try {
    return normalizeRefreshInterval(JSON.parse(storage.getItem(refreshIntervalStorageKey) ?? 'null'));
  } catch {
    return 15000;
  }
}

/** Persist best effort; blocked storage must not prevent changing the in-memory preference. */
export function writeRefreshInterval(storage: Pick<Storage, 'setItem'>, value: RefreshInterval): void {
  try {
    storage.setItem(refreshIntervalStorageKey, JSON.stringify(value));
  } catch {
    // Browser privacy settings and exhausted quotas leave the in-memory choice usable.
  }
}

/** Inputs owned by the view and browser; the scheduler owns only deadlines and operation lifetime. */
export interface RefreshTargetOptions {
  interval: () => RefreshInterval;
  busy: () => boolean;
  eligible: () => boolean;
  run: () => Promise<unknown>;
  pending: (value: boolean) => void;
}

/** Coordinate manual, automatic, and sync triggers for one mounted view without overlapping work. */
export function createRefreshTarget(options: RefreshTargetOptions) {
  let active = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let operation: Promise<void> | undefined;
  let previouslyEligible = options.eligible();

  /** Cancel only the outstanding deadline, never user-initiated in-flight work. */
  function clear(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  /** Start a full interval after the previous operation or independently owned query settles. */
  function schedule(): void {
    clear();
    if (!active || disposed || operation || options.busy() || !options.eligible() || !options.interval()) return;
    timer = setTimeout(/** Refresh on the next eligible deadline. */ () => void refresh(), options.interval());
  }

  /** Join existing work or run one complete view operation; loaders own visible error feedback. */
  function refresh(): Promise<void> {
    if (operation) return operation;
    if (!active || disposed || options.busy()) return Promise.resolve();
    clear();
    options.pending(true);
    operation = Promise.resolve()
      .then(
        /** Start after publishing the shared promise, including synchronous loader failures. */ () => options.run(),
      )
      .then(/** Discard loader results; this contract describes completion only. */ () => undefined)
      .catch(/** Consume failure after the view has recorded its existing error state. */ () => undefined)
      .finally(
        /** Release ownership only after the loader's entire grouped operation settles. */ () => {
          operation = undefined;
          options.pending(false);
          schedule();
        },
      );
    return operation;
  }

  /** Reconcile reactive eligibility, pending query state, and interval changes. */
  function sync(): void {
    const eligible = options.eligible();
    const resume = !previouslyEligible && eligible;
    previouslyEligible = eligible;
    clear();
    if (resume && active && !disposed && options.interval() && !options.busy()) void refresh();
    else schedule();
  }

  /** Register this mounted/activated view after its initial request has started. */
  function activate(): void {
    if (disposed || active) return;
    active = true;
    previouslyEligible = options.eligible();
    schedule();
  }

  /** Suspend cached or unauthenticated content without affecting another target. */
  function deactivate(): void {
    active = false;
    clear();
  }

  /** Permanently release this instance; stale cleanup never touches a later instance. */
  function dispose(): void {
    disposed = true;
    deactivate();
  }

  return { activate, deactivate, dispose, refresh, sync };
}
