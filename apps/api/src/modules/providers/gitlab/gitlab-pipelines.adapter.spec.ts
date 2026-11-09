import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GitLabPipelinesAdapter } from './gitlab-pipelines.adapter.js';

const fixtureDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)), 'fixtures');
/** Reads fixture. */
const readFixture = (name: string): unknown => JSON.parse(readFileSync(resolve(fixtureDirectory, name), 'utf8'));

describe('GitLabPipelinesAdapter', /** Groups scenarios for GitLabPipelinesAdapter. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://gitlab.example.test', providerAccountId: 'account' };

  it.each([
    ['enabled', true, 'UNKNOWN'],
    ['private', true, 'UNKNOWN'],
    ['disabled', false, 'DISABLED'],
    [null, null, null],
  ])(
    'reuses repository CI metadata %s for lifecycle checks without another request',
    /** Verifies repository refresh and lifecycle checks share one authoritative provider response. */ async (
      setting,
      workflowCiEnabled,
      state,
    ) => {
      const raw = { ...(readFixture('projects.json') as object[])[0], builds_access_level: setting };
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(raw)));
      const adapter = new GitLabPipelinesAdapter(fetchFn);
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
    ['disabled', 'DISABLED', 'repository:ci:disabled'],
    ['enabled', 'UNKNOWN', 'repository:ci:enabled'],
    ['private', 'UNKNOWN', 'repository:ci:enabled'],
  ])(
    'normalizes the explicit repository CI setting %s',
    /** Verifies shared repository settings are read once and applied to unique workflow identities. */ async (
      setting,
      state,
      rawState,
    ) => {
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify({ builds_access_level: setting })));
      await expect(
        new GitLabPipelinesAdapter(fetchFn).listWorkflowLifecycles(
          context,
          { providerRepositoryId: 'group/repository', owner: 'org', name: 'repository' },
          [{ providerWorkflowId: 'ci' }, { providerWorkflowId: 'release' }, { providerWorkflowId: 'ci' }],
        ),
      ).resolves.toEqual([
        { providerWorkflowId: 'ci', state, rawState },
        { providerWorkflowId: 'release', state, rawState },
      ]);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledWith(
        'https://gitlab.example.test/api/v4/projects/group%2Frepository',
        expect.any(Object),
      );
    },
  );

  it.each([{}, { builds_access_level: null }, { builds_access_level: 'unrecognized' }])(
    'preserves lifecycle state when repository CI metadata is ambiguous: %j',
    /** Verifies missing and unknown settings cannot retire workflow history. */ async (payload) => {
      const fetchFn = jest.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
      await expect(
        new GitLabPipelinesAdapter(fetchFn).listWorkflowLifecycles(
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
      new GitLabPipelinesAdapter(fetchFn).listWorkflowLifecycles(
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
        new GitLabPipelinesAdapter(fetchFn).listWorkflowLifecycles(
          context,
          { providerRepositoryId: '42', owner: 'org', name: 'repository' },
          [{ providerWorkflowId: 'ci' }],
        ),
      ).rejects.toMatchObject({
        message: `GitLab API request failed with status ${status}.`,
        status,
        retryAt: expect.any(Date),
      });
    },
  );

  it('propagates repository CI metadata network failures', /** Verifies failed network reads cannot become lifecycle observations. */ async () => {
    const error = new TypeError('Network unavailable');
    const fetchFn = jest.fn().mockRejectedValue(error);
    await expect(
      new GitLabPipelinesAdapter(fetchFn).listWorkflowLifecycles(
        context,
        { providerRepositoryId: '42', owner: 'org', name: 'repository' },
        [{ providerWorkflowId: 'ci' }],
      ),
    ).rejects.toBe(error);
  });

  it('retains GitLab rate-limit timing without exposing the response body', /** Verifies retains GitLab rate-limit timing without exposing the response body. */ async () => {
    const adapter = new GitLabPipelinesAdapter(
      jest.fn().mockResolvedValue(new Response('sensitive', { headers: { 'retry-after': '60' }, status: 429 })),
    );

    await expect(adapter.listRepositories(context)).rejects.toMatchObject({
      message: 'GitLab API request failed with status 429.',
      retryAt: expect.any(Date),
      status: 429,
    });
  });

  it('maps projects and pipelines using only GitLab read endpoints', /** Verifies maps projects and pipelines using only GitLab read endpoints. */ async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('projects.json'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('pipelines.json'))));
    const adapter = new GitLabPipelinesAdapter(fetchFn);

    await expect(adapter.listRepositories(context)).resolves.toEqual([
      {
        providerRepositoryId: '1',
        owner: 'group',
        name: 'repovio',
        url: 'https://gitlab.example.test/group/repovio',
      },
    ]);
    await expect(
      adapter.listWorkflowRuns(context, { providerRepositoryId: '1', owner: 'group', name: 'repovio' }),
    ).resolves.toMatchObject([
      {
        displayTitle: 'main',
        durationMs: 120_000,
        event: 'push',
        headBranch: 'main',
        headSha: '0123456789abcdef',
        providerRunId: '7',
        providerWorkflowId: 'pipeline',
        scopeKey: 'branch:main',
        status: 'SUCCESS',
        workflowName: 'Pipeline',
      },
    ]);
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/api/v4/projects'), expect.anything());
  });

  it('paginates more than 100 incremental pipelines', /** Verifies paginates more than 100 incremental pipelines. */ async () => {
    /** Builds a provider pipeline fixture for synchronization assertions. */
    const pipeline = (id: number) => ({
      created_at: '2026-09-13T10:00:00Z',
      duration: 60,
      finished_at: '2026-09-13T10:01:00Z',
      id,
      started_at: '2026-09-13T10:00:00Z',
      status: 'success',
      updated_at: '2026-09-13T10:01:00Z',
      web_url: `https://gitlab.example.test/group/repovio/-/pipelines/${id}`,
    });
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            Array.from(
              { length: 100 },
              /** Evaluates `pipeline(index)` when Array.from invokes this callback. */ (_, index) => pipeline(index),
            ),
          ),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([pipeline(100)])));

    await expect(
      new GitLabPipelinesAdapter(fetchFn).listWorkflowRuns(
        context,
        { providerRepositoryId: '1', owner: 'group', name: 'repovio' },
        new Date('2026-09-13T09:00:00Z'),
      ),
    ).resolves.toHaveLength(101);
    expect(fetchFn).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2&per_page=100'), expect.anything());
  });

  it('loads current project metadata through the stable GitLab project ID', /** Verifies loads current project metadata through the stable GitLab project ID. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          name: 'renamed',
          namespace: { full_path: 'new-group' },
          web_url: 'https://gitlab.example.test/new-group/renamed',
        }),
      ),
    );

    await expect(
      new GitLabPipelinesAdapter(fetchFn).getRepository(context, {
        providerRepositoryId: '1',
        owner: 'group',
        name: 'repovio',
      }),
    ).resolves.toMatchObject({ providerRepositoryId: '1', owner: 'new-group', name: 'renamed' });
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/api/v4/projects/1'), expect.anything());
  });

  it('verifies current GitLab HMAC signing tokens against the raw delivery body', /** Verifies verifies current GitLab HMAC signing tokens against the raw delivery body. */ async () => {
    const adapter = new GitLabPipelinesAdapter();
    const payload = Buffer.from(JSON.stringify(readFixture('webhook.json')));
    const signingSecret = `whsec_${Buffer.from('signing-key').toString('base64')}`;
    const id = 'delivery-id';
    const timestamp = '1787745600';
    const signature = `v1,${createHmac('sha256', 'signing-key')
      .update(`${id}.${timestamp}.${payload.toString('utf8')}`)
      .digest('base64')}`;

    await expect(
      adapter.verifyWebhook({
        headers: {
          'webhook-id': id,
          'webhook-signature': signature,
          'webhook-timestamp': timestamp,
          'x-gitlab-event': 'Pipeline Hook',
        },
        payload,
        signingSecret,
      }),
    ).resolves.toEqual({ event: 'Pipeline Hook', providerRepositoryId: '42', syncScopes: ['WORKFLOWS'] });
  });

  it('maps manual merge-request pipelines without issuing a provider write', /** Verifies maps manual merge-request pipelines without issuing a provider write. */ async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            created_at: '2026-09-09T08:00:00Z',
            duration: null,
            finished_at: null,
            id: 8,
            merge_request: { iid: 12 },
            ref: 'feature/approval',
            started_at: null,
            status: 'manual',
            updated_at: '2026-09-09T08:00:00Z',
            web_url: 'https://gitlab.example.test/group/repovio/-/pipelines/8',
          },
        ]),
      ),
    );
    const adapter = new GitLabPipelinesAdapter(fetchFn);

    await expect(
      adapter.listWorkflowRuns(context, { providerRepositoryId: '1', owner: 'group', name: 'repovio' }),
    ).resolves.toMatchObject([
      {
        awaitingApproval: true,
        reviewUrl: 'https://gitlab.example.test/group/repovio/-/merge_requests/12',
        status: 'QUEUED',
      },
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('GitLabPipelinesAdapter change requests', /** Groups scenarios for GitLabPipelinesAdapter change requests. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://gitlab.example.test', providerAccountId: 'account' };
  const repository = { name: 'repovio', owner: 'octo', providerRepositoryId: '1' };

  it.each([
    ['opened', null, 'OPEN'],
    ['closed', null, 'CLOSED'],
    ['merged', '2026-09-12T10:00:00.000Z', 'MERGED'],
  ] as const)(
    'normalizes a %s merge request with merged-at %s as %s',
    /** Verifies normalizes a %s merge request with merged-at %s as %s. */ async (state, mergedAt, expected) => {
      const adapter = new GitLabPipelinesAdapter(
        jest
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({ merged_at: mergedAt, state, target_branch: 'main' }))),
      );

      await expect(adapter.getChangeRequestState(context, repository, '42')).resolves.toEqual({
        mergedAt: mergedAt ? new Date(mergedAt) : null,
        state: expected,
        targetBranch: 'main',
      });
    },
  );

  it('normalizes separate GitLab issue and merge-request fixtures', /** Verifies normalizes separate GitLab issue and merge-request fixtures. */ async () => {
    const adapter = new GitLabPipelinesAdapter(
      jest
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('issues.json'))))
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('labels.json'))))
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('pull-requests.json'))))
        .mockResolvedValueOnce(new Response(JSON.stringify(readFixture('labels.json')))),
    );
    const query = { includeAllOpen: false, updatedAfter: new Date('2026-08-01T00:00:00Z') };
    await expect(adapter.listIssues(context, repository, query)).resolves.toMatchObject([
      { labels: [{ color: 'd73a4a', name: 'bug', providerLabelId: '1' }], number: '7', state: 'OPEN' },
    ]);
    await expect(adapter.listPullRequests(context, repository, query)).resolves.toMatchObject([
      { draft: true, number: '8', sourceBranch: 'feature/work', targetBranch: 'main' },
    ]);
  });

  it('returns null when the merge request is unavailable', /** Verifies returns null when the merge request is unavailable. */ async () => {
    const adapter = new GitLabPipelinesAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(adapter.getChangeRequestState(context, repository, '42')).resolves.toBeNull();
  });
});

describe('GitLabPipelinesAdapter security alerts', /** Groups scenarios for GitLabPipelinesAdapter security alerts. */ () => {
  const context = { accessToken: 'token', baseUrl: 'https://gitlab.example.test', providerAccountId: 'account' };
  const repository = { name: 'repovio', owner: 'group', providerRepositoryId: '1' };

  it('paginates and normalizes supported report types', /** Verifies paginates and normalizes supported report types. */ async () => {
    /** Builds the paginated provider response fixture. */
    const page = (nodes: object[], hasNextPage: boolean, endCursor: string | null) =>
      new Response(
        JSON.stringify({
          data: { project: { vulnerabilities: { nodes, pageInfo: { endCursor, hasNextPage } } } },
        }),
      );
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(
        page(
          [
            {
              detectedAt: '2026-09-01T00:00:00Z',
              id: 'gid://gitlab/Vulnerability/1',
              location: {
                blobPath: 'package-lock.json',
                dependency: { package: { name: 'vite' }, version: '7.0.0' },
              },
              reportType: 'DEPENDENCY_SCANNING',
              severity: 'HIGH',
              state: 'DETECTED',
              title: 'Dependency issue',
            },
            {
              detectedAt: '2026-09-01T00:00:00Z',
              id: 'gid://gitlab/Vulnerability/ignored',
              reportType: 'CONTAINER_SCANNING',
              severity: 'LOW',
              state: 'DETECTED',
              title: 'Ignored issue',
            },
          ],
          true,
          'next',
        ),
      )
      .mockResolvedValueOnce(
        page(
          [
            {
              description: 'Detected value: must-not-survive',
              detectedAt: '2026-09-01T00:00:00Z',
              id: 'gid://gitlab/Vulnerability/2',
              identifiers: [{ name: 'AWS key' }],
              location: { file: 'config.ts', secret: 'must-not-survive' },
              reportType: 'SECRET_DETECTION',
              severity: 'CRITICAL',
              state: 'DISMISSED',
              title: 'Secret issue',
            },
          ],
          false,
          null,
        ),
      );

    const result = await new GitLabPipelinesAdapter(fetchFn).listSecurityAlerts(context, repository);

    expect(result).toMatchObject([
      {
        alerts: [
          {
            kind: 'DEPENDENCY',
            manifest: 'package-lock.json',
            packageName: 'vite',
            providerUrl: 'https://gitlab.example.test/group/repovio/-/security/vulnerability_report',
            state: 'OPEN',
            vulnerableRange: '7.0.0',
          },
        ],
      },
      { alerts: [] },
      { alerts: [{ kind: 'SECRET', location: { path: 'config.ts' }, state: 'DISMISSED' }] },
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(fetchFn.mock.calls[1]?.[1]?.body)).toContain('next');
    expect(JSON.stringify(result)).not.toContain('must-not-survive');
  });

  it('returns unavailable kinds for inaccessible GraphQL data', /** Verifies returns unavailable kinds for inaccessible GraphQL data. */ async () => {
    const adapter = new GitLabPipelinesAdapter(jest.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(adapter.listSecurityAlerts(context, repository)).resolves.toEqual([
      expect.objectContaining({ availability: 'UNAVAILABLE', kind: 'DEPENDENCY' }),
      expect.objectContaining({ availability: 'UNAVAILABLE', kind: 'CODE' }),
      expect.objectContaining({ availability: 'UNAVAILABLE', kind: 'SECRET' }),
    ]);
  });
});
