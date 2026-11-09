import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ForgejoActionsAdapter, ForgejoActionsUnsupportedError } from './forgejo-actions.adapter.js';

const fixtureDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)), 'fixtures');
/** Reads fixture. */
const readFixture = (name: string): unknown => JSON.parse(readFileSync(resolve(fixtureDirectory, name), 'utf8'));

describe('ForgejoActionsAdapter', /** Groups scenarios for ForgejoActionsAdapter. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://forgejo.example.test', providerAccountId: 'account' };

  it.each([
    [true, true, 'UNKNOWN'],
    [false, false, 'DISABLED'],
    [null, null, null],
  ])(
    'reuses repository CI metadata %s for lifecycle checks without another request',
    /** Verifies repository refresh and lifecycle checks share one authoritative provider response. */ async (
      setting,
      workflowCiEnabled,
      state,
    ) => {
      const raw = {
        id: 42,
        name: 'repository',
        html_url: 'https://forgejo.example.test/org/repository',
        owner: { login: 'org' },
        has_actions: setting,
      };
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(raw)));
      const adapter = new ForgejoActionsAdapter(fetchFn);
      const repository = await adapter.getRepository(context, {
        providerRepositoryId: '42',
        owner: 'org',
        name: 'repository',
      });
      expect(repository).toMatchObject({ workflowCiEnabled });
      if (!repository) throw new Error('Expected repository metadata');
      const observations = await adapter.listWorkflowLifecycles(context, repository, [
        { providerWorkflowId: 'ci' },
        { providerWorkflowId: 'release' },
      ]);
      expect(observations).toEqual(
        state === null
          ? []
          : [
              {
                providerWorkflowId: 'ci',
                state,
                rawState: workflowCiEnabled ? 'repository:ci:enabled' : 'repository:ci:disabled',
              },
              {
                providerWorkflowId: 'release',
                state,
                rawState: workflowCiEnabled ? 'repository:ci:enabled' : 'repository:ci:disabled',
              },
            ],
      );
      expect(fetchFn).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    [false, 'DISABLED', 'repository:ci:disabled'],
    [true, 'UNKNOWN', 'repository:ci:enabled'],
  ])(
    'normalizes the explicit repository CI setting %s',
    /** Verifies shared repository settings are read once and applied to unique workflow identities. */ async (
      setting,
      state,
      rawState,
    ) => {
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify({ has_actions: setting })));
      await expect(
        new ForgejoActionsAdapter(fetchFn).listWorkflowLifecycles(
          context,
          { providerRepositoryId: '42', owner: 'org', name: 'repository' },
          [{ providerWorkflowId: 'ci' }, { providerWorkflowId: 'release' }, { providerWorkflowId: 'ci' }],
        ),
      ).resolves.toEqual([
        { providerWorkflowId: 'ci', state, rawState },
        { providerWorkflowId: 'release', state, rawState },
      ]);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledWith('https://forgejo.example.test/api/v1/repositories/42', expect.any(Object));
    },
  );

  it.each([{}, { has_actions: null }, { has_actions: 'unrecognized' }])(
    'preserves lifecycle state when repository CI metadata is ambiguous: %j',
    /** Verifies missing and unknown settings cannot retire workflow history. */ async (payload) => {
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
      await expect(
        new ForgejoActionsAdapter(fetchFn).listWorkflowLifecycles(
          context,
          { providerRepositoryId: '42', owner: 'org', name: 'repository' },
          [{ providerWorkflowId: 'ci' }],
        ),
      ).resolves.toEqual([]);
    },
  );

  it('does not request repository CI metadata without known workflows', /** Verifies empty lifecycle checks require no provider access. */ async () => {
    const fetchFn = jest.fn();
    await expect(
      new ForgejoActionsAdapter(fetchFn).listWorkflowLifecycles(
        context,
        { providerRepositoryId: '42', owner: 'org', name: 'repository' },
        [],
      ),
    ).resolves.toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it.each([403, 429])(
    'propagates repository CI metadata failures with status %i',
    /** Verifies errors retain provider status and rate-limit retry metadata. */ async (status) => {
      const fetchFn = jest
        .fn()
        .mockResolvedValue(new Response('sensitive', { status, headers: { 'retry-after': '60' } }));
      await expect(
        new ForgejoActionsAdapter(fetchFn).listWorkflowLifecycles(
          context,
          { providerRepositoryId: '42', owner: 'org', name: 'repository' },
          [{ providerWorkflowId: 'ci' }],
        ),
      ).rejects.toMatchObject({
        message: `Forgejo API request failed with status ${status}.`,
        status,
        retryAt: expect.any(Date),
      });
    },
  );

  it('propagates repository CI metadata network failures', /** Verifies failed network reads cannot become lifecycle observations. */ async () => {
    const error = new TypeError('Network unavailable');
    const fetchFn = jest.fn().mockRejectedValue(error);
    await expect(
      new ForgejoActionsAdapter(fetchFn).listWorkflowLifecycles(
        context,
        { providerRepositoryId: '42', owner: 'org', name: 'repository' },
        [{ providerWorkflowId: 'ci' }],
      ),
    ).rejects.toBe(error);
  });

  it('retains Forgejo rate-limit timing without exposing the response body', /** Verifies retains Forgejo rate-limit timing without exposing the response body. */ async () => {
    const adapter = new ForgejoActionsAdapter(
      jest.fn().mockResolvedValue(new Response('sensitive', { headers: { 'retry-after': '60' }, status: 429 })),
    );

    await expect(adapter.listRepositories(context)).rejects.toMatchObject({
      message: 'Forgejo API request failed with status 429.',
      retryAt: expect.any(Date),
      status: 429,
    });
  });
  it('maps Actions workflow runs through the read-only API', /** Verifies maps Actions workflow runs through the read-only API. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(readFixture('workflow-runs.json'))));
    await expect(
      new ForgejoActionsAdapter(fetchFn).listWorkflowRuns(context, {
        providerRepositoryId: '1',
        owner: 'org',
        name: 'repo',
      }),
    ).resolves.toMatchObject([
      {
        awaitingApproval: false,
        changeRequestNumber: '42',
        displayTitle: 'Fix Forgejo synchronization',
        durationMs: 120_000,
        headBranch: 'feature/forgejo',
        headSha: '0123456789abcdef',
        providerRunId: '7',
        providerWorkflowId: 'ci.yml',
        scopeKey: 'change-request:42',
        status: 'SUCCESS',
        workflowName: 'ci',
        workflowPath: '.forgejo/workflows/ci.yml',
      },
    ]);
    expect(fetchFn).toHaveBeenCalledWith(
      'https://forgejo.example.test/api/v1/repos/org/repo/actions/runs?page=1&limit=100',
      expect.anything(),
    );
  });

  it('maps native approval state without final duration before the run starts', /** Verifies maps native approval state and duration when Forgejo has not started the run. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          total_count: 1,
          workflow_runs: [
            {
              created: '2026-08-01T10:00:00Z',
              duration: 3_000_000_000,
              event: 'pull_request',
              event_payload: '{not-json',
              html_url: 'https://forgejo.example.test/org/repo/actions/runs/8',
              id: 8,
              need_approval: true,
              prettyref: '#43',
              status: 'waiting',
              title: 'Await approval',
              updated: '2026-08-01T10:00:03Z',
              workflow_id: 'approval.yaml',
            },
          ],
        }),
      ),
    );

    await expect(
      new ForgejoActionsAdapter(fetchFn).listWorkflowRuns(context, {
        providerRepositoryId: '1',
        owner: 'org',
        name: 'repo',
      }),
    ).resolves.toMatchObject([
      {
        awaitingApproval: true,
        changeRequestNumber: null,
        durationMs: null,
        headBranch: '#43',
        reviewUrl: 'https://forgejo.example.test/org/repo/actions/runs/8',
        status: 'QUEUED',
      },
    ]);
  });

  it.each(['running', 'waiting', 'pending'])(
    'discards final timing for active provider state %s',
    /** Verify sentinel and stale completion values never finish an active run. */ async (status) => {
      for (const stopped of ['1970-01-01T00:00:00Z', '2026-08-01T10:05:00Z', null]) {
        const fetchFn = jest.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              workflow_runs: [
                {
                  id: 74,
                  status,
                  started: '2026-08-01T10:00:00Z',
                  stopped,
                  duration: 3_000_000_000,
                  created: '2026-08-01T09:59:00Z',
                  updated: '2026-08-01T10:00:00Z',
                  html_url: 'https://forgejo.example.test/org/repo/actions/runs/74',
                },
              ],
            }),
          ),
        );
        const runs = await new ForgejoActionsAdapter(fetchFn).listWorkflowRuns(context, {
          providerRepositoryId: '1',
          owner: 'org',
          name: 'repo',
        });
        expect(runs[0]).toMatchObject({ completedAt: null, durationMs: null });
      }
    },
  );

  it('paginates more than 100 incremental workflow runs', /** Verifies paginates more than 100 incremental workflow runs. */ async () => {
    const firstPage = Array.from(
      { length: 100 },
      /** Creates the indexed workflow-run fixtures used by this scenario. */ (_, index) => ({
        created: '2026-08-01T10:00:00Z',
        html_url: `https://forgejo.example.test/org/repo/actions/runs/${index + 1}`,
        id: index + 1,
        status: 'success',
        updated: '2026-08-01T10:05:00Z',
        workflow_id: 'ci.yml',
      }),
    );
    const secondPage = [
      {
        created: '2026-08-01T10:01:00Z',
        html_url: 'https://forgejo.example.test/org/repo/actions/runs/101',
        id: 101,
        status: 'success',
        updated: '2026-08-01T10:06:00Z',
        workflow_id: 'ci.yml',
      },
    ];
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ total_count: 101, workflow_runs: firstPage })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ total_count: 101, workflow_runs: secondPage })));

    await expect(
      new ForgejoActionsAdapter(fetchFn).listWorkflowRuns(
        context,
        { providerRepositoryId: '1', owner: 'org', name: 'repo' },
        new Date('2026-08-01T10:00:00Z'),
      ),
    ).resolves.toHaveLength(101);
    expect(fetchFn).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2&limit=100'), expect.anything());
  });
  it('loads current repository metadata through the stable Forgejo repository ID', /** Verifies loads current repository metadata through the stable Forgejo repository ID. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          name: 'renamed',
          html_url: 'https://forgejo.example.test/new-org/renamed',
          owner: { login: 'new-org' },
        }),
      ),
    );
    await expect(
      new ForgejoActionsAdapter(fetchFn).getRepository(context, {
        providerRepositoryId: '1',
        owner: 'org',
        name: 'repo',
      }),
    ).resolves.toMatchObject({ providerRepositoryId: '1', owner: 'new-org', name: 'renamed' });
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/api/v1/repositories/1'), expect.anything());
  });
  it('explains when a Forgejo server has no Actions run API', /** Verifies explains when a Forgejo server has no Actions run API. */ async () => {
    const adapter = new ForgejoActionsAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(
      adapter.listWorkflowRuns(context, { providerRepositoryId: '1', owner: 'org', name: 'repo' }),
    ).rejects.toBeInstanceOf(ForgejoActionsUnsupportedError);
  });
  it('verifies Forgejo HMAC signatures while retaining Gitea header compatibility', /** Verifies verifies Forgejo HMAC signatures while retaining Gitea header compatibility. */ async () => {
    const adapter = new ForgejoActionsAdapter();
    const payload = Buffer.from(JSON.stringify(readFixture('webhook.json')));
    const signature = createHmac('sha256', 'webhook-secret').update(payload).digest('hex');

    await expect(
      adapter.verifyWebhook({
        headers: {
          'x-forgejo-event': 'push',
          'x-forgejo-signature': signature,
        },
        payload,
        signingSecret: 'webhook-secret',
      }),
    ).resolves.toEqual({
      event: 'push',
      providerRepositoryId: '42',
      syncScopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'],
    });
  });
});

describe('ForgejoActionsAdapter change requests', /** Groups scenarios for ForgejoActionsAdapter change requests. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://forgejo.example.test', providerAccountId: 'account' };
  const repository = { name: 'repovio', owner: 'octo', providerRepositoryId: '1' };

  it.each([
    ['open', false, null, 'OPEN'],
    ['closed', false, null, 'CLOSED'],
    ['closed', true, '2026-09-12T10:00:00.000Z', 'MERGED'],
  ] as const)(
    'normalizes a %s pull request with merged=%s and merged-at %s as %s',
    /** Verifies normalizes a %s pull request with merged=%s and merged-at %s as %s. */
    async (state, merged, mergedAt, expected) => {
      const adapter = new ForgejoActionsAdapter(
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

  it('normalizes Forgejo issue and pull-request fixtures', /** Verifies normalizes Forgejo issue and pull-request fixtures. */ async () => {
    const adapter = new ForgejoActionsAdapter(
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
    const adapter = new ForgejoActionsAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(adapter.getChangeRequestState(context, repository, '42')).resolves.toBeNull();
  });
});
