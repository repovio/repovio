import { ProviderRequestError } from './provider-request.error.js';
import { maximumProviderSyncAttempts, providerRetryDecision } from './provider-retry.js';

describe('provider retry decisions', /** Groups scenarios for provider retry decisions. */ () => {
  const now = new Date('2026-09-12T10:00:00.000Z');

  it('uses a provider rate-limit reset without adding an early retry', /** Verifies uses a provider rate-limit reset without adding an early retry. */ () => {
    const retryAt = new Date('2026-09-12T10:10:00.000Z');

    expect(
      providerRetryDecision(
        new ProviderRequestError('GitHub', 429, retryAt),
        1,
        now,
        /** Evaluates `1` when providerRetryDecision invokes this callback. */ () => 1,
      ),
    ).toEqual({
      rateLimitedUntil: retryAt,
      retry: true,
      runAfter: retryAt,
    });
  });

  it('defers GitHub primary rate limits returned as 403', /** Verifies defers GitHub primary rate limits returned as 403. */ () => {
    const retryAt = new Date('2026-09-12T10:10:00.000Z');

    expect(providerRetryDecision(new ProviderRequestError('GitHub', 403, retryAt, true), 1, now)).toEqual({
      rateLimitedUntil: retryAt,
      retry: true,
      runAfter: retryAt,
    });
  });

  it('uses bounded rate-limit backoff when no header is available', /** Verifies uses bounded rate-limit backoff when no header is available. */ () => {
    expect(
      providerRetryDecision(
        new ProviderRequestError('GitLab', 429, null),
        2,
        now,
        /** Evaluates `0` when providerRetryDecision invokes this callback. */ () => 0,
      ).runAfter,
    ).toEqual(new Date('2026-09-12T10:02:00.000Z'));
  });

  it('retries transient provider and network failures with jitter', /** Verifies retries transient provider and network failures with jitter. */ () => {
    expect(
      providerRetryDecision(
        new ProviderRequestError('Forgejo', 503, null),
        2,
        now,
        /** Evaluates `0.5` when providerRetryDecision invokes this callback. */ () => 0.5,
      ).runAfter,
    ).toEqual(new Date('2026-09-12T10:00:02.200Z'));
    expect(
      providerRetryDecision(
        new TypeError('fetch failed'),
        1,
        now,
        /** Evaluates `0` when providerRetryDecision invokes this callback. */ () => 0,
      ).retry,
    ).toBe(true);
  });

  it('does not retry permanent responses or exhausted attempts', /** Verifies does not retry permanent responses or exhausted attempts. */ () => {
    expect(providerRetryDecision(new ProviderRequestError('Gitea', 401, null), 1, now)).toEqual({
      rateLimitedUntil: null,
      retry: false,
      runAfter: null,
    });
    expect(
      providerRetryDecision(new ProviderRequestError('Gitea', 503, null), maximumProviderSyncAttempts, now),
    ).toEqual({ rateLimitedUntil: null, retry: false, runAfter: null });
  });

  it('retains a supplied account rate-limit delay after retry exhaustion', /** Verifies retains a supplied account rate-limit delay after retry exhaustion. */ () => {
    const retryAt = new Date('2026-09-12T10:10:00.000Z');

    expect(
      providerRetryDecision(new ProviderRequestError('GitHub', 429, retryAt), maximumProviderSyncAttempts, now),
    ).toEqual({ rateLimitedUntil: retryAt, retry: false, runAfter: null });
  });
});
