import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GiteaActionsAdapter, GiteaActionsUnsupportedError } from './gitea-actions.adapter.js';

const fixtureDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)), 'fixtures');

/** Reads fixture. */
function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(fixtureDirectory, name), 'utf8'));
}

describe('GiteaActionsAdapter', /** Groups scenarios for GiteaActionsAdapter. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://gitea.example.test', providerAccountId: 'account' };
  const repository = { providerRepositoryId: '42', owner: 'repovio', name: 'repovio' };

  it.each([
    ['in_progress', 'RUNNING'],
    ['queued', 'QUEUED'],
    ['completed', 'SUCCESS'],
  ])(
    'keeps final timing consistent for %s',
    /** Verify active timing is absent while valid terminal history remains intact. */ async (
      status,
      expectedStatus,
    ) => {
      const fetchFn = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 74,
            status,
            conclusion: status === 'completed' ? 'success' : null,
            created_at: '2026-11-09T09:59:00Z',
            run_started_at: '2026-11-09T10:00:00Z',
            updated_at: '2026-11-09T10:02:00Z',
            completed_at: '2026-11-09T10:02:00Z',
            html_url: 'https://example.test/runs/74',
            name: 'CI',
            event: 'push',
          }),
        ),
      );
      const run = await new GiteaActionsAdapter(fetchFn).getWorkflowRun(
        context,
        { providerRepositoryId: '1', owner: 'org', name: 'repo' },
        '74',
      );
      expect(run).toMatchObject({
        status: expectedStatus,
        completedAt: expectedStatus === 'SUCCESS' ? new Date('2026-11-09T10:02:00Z') : null,
        durationMs: expectedStatus === 'SUCCESS' ? 120_000 : null,
      });
    },
  );

  it.each([
    [{ state: 'active' }, 'ACTIVE', 'active'],
    [{ state: 'deleted' }, 'REMOVED', 'deleted'],
    [{ state: 'disabled' }, 'DISABLED', 'disabled'],
    [{ state: 'disabled_manually' }, 'DISABLED', 'disabled_manually'],
    [{ state: 'disabled_inactivity' }, 'DISABLED', 'disabled_inactivity'],
    [{ state: 'active', deleted_at: '2026-11-05T12:33:20Z' }, 'REMOVED', 'active'],
    [{ deleted_at: '2026-11-05T12:33:20Z' }, 'REMOVED', null],
    [{ state: 'active', deleted_at: null }, 'ACTIVE', 'active'],
    [{ state: 'active', deleted_at: '0001-01-01T00:00:00Z' }, 'ACTIVE', 'active'],
    [{ state: 'active', deleted_at: 'invalid' }, 'ACTIVE', 'active'],
  ])(
    'normalizes explicit workflow lifecycle %j',
    /** Verifies recognized provider lifecycle metadata. */ async (payload, state, rawState) => {
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
      const adapter = new GiteaActionsAdapter(fetchFn);

      await expect(
        adapter.listWorkflowLifecycles(context, repository, [{ providerWorkflowId: 'ci.yml' }]),
      ).resolves.toEqual([{ providerWorkflowId: 'ci.yml', rawState, state }]);
      expect(fetchFn).toHaveBeenCalledWith(
        'https://gitea.example.test/api/v1/repos/repovio/repovio/actions/workflows/ci.yml',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'token token' }) }),
      );
    },
  );

  it.each([{}, { state: 'future_state' }, { state: null }, { deleted_at: '0001-01-01T00:00:00Z' }, null])(
    'omits unrecognized lifecycle responses %j',
    /** Verifies absence of authoritative lifecycle data never means deletion. */ async (payload) => {
      const adapter = new GiteaActionsAdapter(jest.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
      await expect(
        adapter.listWorkflowLifecycles(context, repository, [{ providerWorkflowId: '17' }]),
      ).resolves.toEqual([]);
    },
  );

  it('omits missing workflows and unsupported lifecycle endpoints', /** Verifies 404 never becomes a removal observation. */ async () => {
    const adapter = new GiteaActionsAdapter(jest.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(adapter.listWorkflowLifecycles(context, repository, [{ providerWorkflowId: '17' }])).resolves.toEqual(
      [],
    );
  });

  it('deduplicates identities and encodes workflow paths', /** Verifies each identity is read at most once. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify({ state: 'active' })));
    const adapter = new GiteaActionsAdapter(fetchFn);
    await expect(
      adapter.listWorkflowLifecycles(context, repository, [
        { providerWorkflowId: '.gitea/workflows/ci.yml' },
        { providerWorkflowId: '.gitea/workflows/ci.yml' },
        { providerWorkflowId: 'legacy:name:CI' },
        { providerWorkflowId: 'name:CI' },
      ]),
    ).resolves.toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/actions/workflows/.gitea%2Fworkflows%2Fci.yml'),
      expect.anything(),
    );
  });

  it.each([401, 403, 429, 500])(
    'preserves lifecycle HTTP failure %i and retry metadata',
    /** Verifies provider failures propagate without exposing response bodies. */ async (status) => {
      const adapter = new GiteaActionsAdapter(
        jest.fn().mockResolvedValue(new Response('sensitive', { headers: { 'retry-after': '60' }, status })),
      );
      await expect(
        adapter.listWorkflowLifecycles(context, repository, [{ providerWorkflowId: '17' }]),
      ).rejects.toMatchObject({
        message: `Gitea API request failed with status ${status}.`,
        status,
        ...(status === 429 ? { retryAt: expect.any(Date) } : {}),
      });
    },
  );

  it('propagates lifecycle network failures', /** Verifies unknown network state cannot become deletion. */ async () => {
    const error = new TypeError('Network unavailable');
    const adapter = new GiteaActionsAdapter(jest.fn().mockRejectedValue(error));
    await expect(adapter.listWorkflowLifecycles(context, repository, [{ providerWorkflowId: '17' }])).rejects.toBe(
      error,
    );
  });

  it('retains Gitea rate-limit timing without exposing the response body', /** Verifies retains Gitea rate-limit timing without exposing the response body. */ async () => {
    const adapter = new GiteaActionsAdapter(
      jest.fn().mockResolvedValue(new Response('sensitive', { headers: { 'retry-after': '60' }, status: 429 })),
    );

    await expect(adapter.listRepositories(context)).rejects.toMatchObject({
      message: 'Gitea API request failed with status 429.',
      retryAt: expect.any(Date),
      status: 429,
    });
  });

  it('discovers repositories and maps Actions workflow runs from recorded read-only API fixtures', /** Verifies discovers repositories and maps Actions workflow runs from recorded read-only API fixtures. */ async () => {
    const fetchFn = jest.fn(
      /** Provides isolated fetchFn behavior for this test fixture. */ async (url: string) => {
        if (url.endsWith('/user')) return new Response(JSON.stringify(readFixture('user.json')));
        if (url.includes('/user/repos')) return new Response(JSON.stringify(readFixture('repositories.json')));
        if (url.endsWith('/repositories/42'))
          return new Response(JSON.stringify((readFixture('repositories.json') as unknown[])[0]));
        if (url.includes('/actions/runs?')) return new Response(JSON.stringify(readFixture('workflow-runs.json')));
        if (url.endsWith('/actions/runs/7')) return new Response(JSON.stringify(readFixture('workflow-run.json')));
        throw new Error(`Unexpected request: ${url}`);
      },
    );
    const adapter = new GiteaActionsAdapter(fetchFn);

    await expect(adapter.validateAccount(context)).resolves.toEqual({ displayName: 'repovio-bot', valid: true });
    await expect(adapter.listRepositories(context)).resolves.toEqual([
      {
        providerRepositoryId: '42',
        owner: 'repovio',
        name: 'repovio',
        url: 'https://gitea.example.test/repovio/repovio',
      },
    ]);
    await expect(adapter.getRepository(context, repository)).resolves.toMatchObject({ providerRepositoryId: '42' });
    await expect(adapter.listWorkflowRuns(context, repository)).resolves.toMatchObject([
      {
        providerRunId: '7',
        workflowName: 'CI',
        status: 'SUCCESS',
        durationMs: 120_000,
      },
    ]);
    await expect(adapter.getWorkflowRun(context, repository, '7')).resolves.toMatchObject({
      providerRunId: '7',
      status: 'SUCCESS',
    });
    expect(fetchFn).toHaveBeenCalledTimes(5);
  });

  it('paginates more than 100 incremental workflow runs', /** Verifies paginates more than 100 incremental workflow runs. */ async () => {
    /** Builds a workflow-run fixture for synchronization assertions. */
    const workflowRun = (id: number) => ({
      completed_at: '2026-09-13T10:01:00Z',
      created_at: '2026-09-13T10:00:00Z',
      html_url: `https://gitea.example.test/repovio/repovio/actions/runs/${id}`,
      id,
      name: 'CI',
      status: 'success',
      updated_at: '2026-09-13T10:01:00Z',
      workflow_id: 17,
    });
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total_count: 101,
            workflow_runs: Array.from(
              { length: 100 },
              /** Evaluates `workflowRun(index)` when Array.from invokes this callback. */ (_, index) =>
                workflowRun(index),
            ),
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ total_count: 101, workflow_runs: [workflowRun(100)] })));

    await expect(
      new GiteaActionsAdapter(fetchFn).listWorkflowRuns(context, repository, new Date('2026-09-13T09:00:00Z')),
    ).resolves.toHaveLength(101);
    expect(fetchFn).toHaveBeenNthCalledWith(2, expect.stringContaining('limit=100&page=2'), expect.anything());
  });

  it('reports unsupported Actions servers without attempting a provider write', /** Verifies reports unsupported Actions servers without attempting a provider write. */ async () => {
    const adapter = new GiteaActionsAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(adapter.listWorkflowRuns(context, repository)).rejects.toBeInstanceOf(GiteaActionsUnsupportedError);
  });

  it('validates a recorded Gitea webhook using the raw JSON payload', /** Verifies validates a recorded Gitea webhook using the raw JSON payload. */ async () => {
    const payload = Buffer.from(JSON.stringify(readFixture('webhook.json')));
    const signature = createHmac('sha256', 'webhook-secret').update(payload).digest('hex');
    const adapter = new GiteaActionsAdapter();

    await expect(
      adapter.verifyWebhook({
        headers: { 'x-gitea-event': 'workflow_run', 'x-gitea-signature': signature },
        payload,
        signingSecret: 'webhook-secret',
      }),
    ).resolves.toEqual({ event: 'workflow_run', providerRepositoryId: '42', syncScopes: ['WORKFLOWS'] });
  });
});

describe('GiteaActionsAdapter change requests', /** Groups scenarios for GiteaActionsAdapter change requests. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://gitea.example.test', providerAccountId: 'account' };
  const repository = { name: 'repovio', owner: 'octo', providerRepositoryId: '1' };

  it.each([
    ['open', false, null, 'OPEN'],
    ['closed', false, null, 'CLOSED'],
    ['closed', true, '2026-09-12T10:00:00.000Z', 'MERGED'],
  ] as const)(
    'normalizes a %s pull request with merged=%s and merged-at %s as %s',
    /** Verifies normalizes a %s pull request with merged=%s and merged-at %s as %s. */
    async (state, merged, mergedAt, expected) => {
      const adapter = new GiteaActionsAdapter(
        jest
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ base: { ref: 'main' }, merged, merged_at: mergedAt, state })),
          ),
      );

      await expect(adapter.getChangeRequestState(context, repository, '42')).resolves.toEqual({
        mergedAt: mergedAt ? new Date(mergedAt) : null,
        state: expected,
        targetBranch: 'main',
      });
    },
  );

  it('normalizes Gitea issue and pull-request fixtures', /** Verifies normalizes Gitea issue and pull-request fixtures. */ async () => {
    const adapter = new GiteaActionsAdapter(
      jest
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('issues.json'))))
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('pull-requests.json')))),
    );
    const query = { includeAllOpen: false, updatedAfter: new Date('2026-08-01T00:00:00Z') };
    await expect(adapter.listIssues(context, repository, query)).resolves.toMatchObject([
      { labels: [{ name: 'bug' }], number: '7', state: 'OPEN' },
    ]);
    await expect(adapter.listPullRequests(context, repository, query)).resolves.toMatchObject([
      { number: '8', sourceBranch: 'feature/work', targetBranch: 'main' },
    ]);
  });

  it('returns null when the pull request is unavailable', /** Verifies returns null when the pull request is unavailable. */ async () => {
    const adapter = new GiteaActionsAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(adapter.getChangeRequestState(context, repository, '42')).resolves.toBeNull();
  });
});
