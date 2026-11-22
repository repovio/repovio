import { tableGroups } from '@repovio/schemas';
import { PublicQueryPipe } from './resource-contract.js';

test.each([
  ['Issue', 'state'],
  ['PullRequest', 'state'],
  ['SecurityAlert', 'severity'],
  ['WorkflowRun', 'status'],
] as const)(
  '%s accepts its Querry-Kit wire request only for the public dimension',
  /** Exercises Fastify query keys through the production pipe and schema. */ (resource, field) => {
    const wire = {
      'by[0]': field,
      [`orderBy[${field}]`]: 'desc',
      '_count[_all]': 'true',
      take: '26',
      skip: '0',
      where: '{"repositoryId":"r"}',
    };
    const normalized = new PublicQueryPipe().transform(wire, { type: 'query' });
    const query = tableGroups[resource].query.parse(normalized);
    expect(query).toEqual({
      by: [field],
      orderBy: { [field]: 'desc' },
      _count: { _all: true },
      take: 26,
      skip: 0,
      where: { repositoryId: 'r' },
    });
    for (const invalid of [{ by: ['id'] }, { orderBy: { id: 'desc' } }, { take: 1001 }, { _count: { id: true } }])
      expect(tableGroups[resource].query.safeParse({ ...query, ...invalid }).success).toBe(false);
  },
);
