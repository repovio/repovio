import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRefreshTarget,
  normalizeRefreshInterval,
  readRefreshInterval,
  writeRefreshInterval,
} from './auto-refresh-state';

afterEach(/** Restore the real browser clock after each isolated scheduler test. */ () => vi.useRealTimers());

describe('refresh preference', /** Check untrusted browser storage boundaries. */ () => {
  it('accepts only listed numeric intervals', /** Preserve Off and reject coercion. */ () => {
    for (const value of [0, 15000, 30000, 60000, 300000]) expect(normalizeRefreshInterval(value)).toBe(value);
    for (const value of ['30000', {}, null, -1, Infinity, NaN, 10]) expect(normalizeRefreshInterval(value)).toBe(15000);
  });
  it('survives invalid and blocked storage', /** Storage availability must never block rendering. */ () => {
    expect(readRefreshInterval({ getItem: /** Supply malformed JSON. */ () => '{' })).toBe(15000);
    expect(
      readRefreshInterval({
        getItem: /** Model blocked browser storage. */ () => {
          throw Error('blocked');
        },
      }),
    ).toBe(15000);
    expect(readRefreshInterval({ getItem: /** Restore persisted Off. */ () => '0' })).toBe(0);
    expect(
      /** Attempt persistence under an exhausted quota. */ () =>
        writeRefreshInterval(
          {
            setItem: /** Model exhausted quota. */ () => {
              throw Error('quota');
            },
          },
          30000,
        ),
    ).not.toThrow();
  });
});

describe('refresh target', /** Verify scheduling against real deferred request lifetimes. */ () => {
  /** Build an isolated participant with mutable browser eligibility. */
  function fixture() {
    vi.useFakeTimers();
    const state = { interval: 15000, busy: false, eligible: true };
    const run = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const pending = vi.fn();
    const target = createRefreshTarget({
      interval: /** Read the selected cadence. */ () => normalizeRefreshInterval(state.interval),
      busy: /** Read independently owned query state. */ () => state.busy,
      eligible: /** Read browser visibility and connectivity. */ () => state.eligible,
      run,
      pending,
    });
    target.activate();
    return { state, run, pending, target };
  }
  it('waits a full interval and releases every deadline on disposal', /** Avoid duplicate initial fetches. */ async () => {
    const { run, target } = fixture();
    await vi.advanceTimersByTimeAsync(14999);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    target.dispose();
    await vi.advanceTimersByTimeAsync(60000);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('joins simultaneous triggers until every request finishes', /** Slow work must have one owner. */ async () => {
    const { run, pending, target } = fixture();
    let finish!: () => void;
    run.mockImplementationOnce(
      /** Hold the whole view operation. */ () =>
        new Promise<void>(
          /** Capture completion. */ (resolve) => {
            finish = resolve;
          },
        ),
    );
    const first = target.refresh();
    const second = target.refresh();
    expect(first).toBe(second);
    await vi.advanceTimersByTimeAsync(60000);
    expect(run).toHaveBeenCalledTimes(1);
    expect(pending).toHaveBeenLastCalledWith(true);
    finish();
    await first;
    expect(pending).toHaveBeenLastCalledWith(false);
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('skips independently busy queries and restarts after idle', /** Initial and query work suppress timer reads. */ async () => {
    const { state, run, target } = fixture();
    state.busy = true;
    target.sync();
    await vi.advanceTimersByTimeAsync(45000);
    await target.refresh();
    expect(run).not.toHaveBeenCalled();
    state.busy = false;
    target.sync();
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('pauses while ineligible and performs one catch-up', /** Suspension must not accumulate interval debt. */ async () => {
    const { state, run, target } = fixture();
    state.eligible = false;
    target.sync();
    await vi.advanceTimersByTimeAsync(300000);
    expect(run).not.toHaveBeenCalled();
    state.eligible = true;
    target.sync();
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('Off disables timers and catch-up but preserves explicit refresh', /** Off applies only to automatic work. */ async () => {
    const { state, run, target } = fixture();
    state.interval = 0;
    target.sync();
    state.eligible = false;
    target.sync();
    state.eligible = true;
    target.sync();
    await vi.advanceTimersByTimeAsync(300000);
    expect(run).not.toHaveBeenCalled();
    await target.refresh();
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('changes cadence without keeping an old deadline', /** Settings changes replace outstanding deadlines. */ async () => {
    const { state, run, target } = fixture();
    state.interval = 30000;
    target.sync();
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(1);
    target.dispose();
  });
  it('recovers after rejection without an unhandled timer promise', /** Failures release ownership and permit retry. */ async () => {
    const { run } = fixture();
    run.mockRejectedValueOnce(Error('offline'));
    await vi.advanceTimersByTimeAsync(30000);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('deactivation blocks explicit work and permits clean reactivation', /** Cached views must not keep refreshing. */ async () => {
    const { run, target } = fixture();
    target.deactivate();
    await target.refresh();
    await vi.advanceTimersByTimeAsync(60000);
    expect(run).not.toHaveBeenCalled();
    target.activate();
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
