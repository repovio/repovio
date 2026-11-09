import { describe, expect, it } from 'vitest';

import type { ColumnDefinition } from '~/types/table';
import {
  normalizeRepositoryPage,
  pinActionsColumnRight,
  repositoryTableName,
  toQueryKitColumns,
  withRepositoryScope,
} from './table';

interface TestRow extends Record<string, unknown> {
  id: string;
  workflowName: string;
}

describe('toQueryKitColumns', /** Groups scenarios for toQueryKitColumns. */ () => {
  it('keeps all renderer metadata for visible columns', /** Verifies keeps all renderer metadata for visible columns. */ () => {
    const columns: ColumnDefinition<TestRow>[] = [
      { fields: ['repository.name'], header: 'Workflow', id: 'workflowName', renderer: { emphasis: true } },
      { header: 'Conditional action' },
    ];

    expect(toQueryKitColumns(columns)).toEqual([
      { fields: ['repository.name'], header: 'Workflow', id: 'workflowName', renderer: { emphasis: true } },
    ]);
  });
});

describe('pinActionsColumnRight', /** Groups scenarios for pinActionsColumnRight. */ () => {
  it('moves an actions column from the left into the right-pinned columns', /** Verifies moves an actions column from the left into the right-pinned columns. */ () => {
    expect(
      pinActionsColumnRight([{ id: 'name' }, { id: 'actions' }], { left: ['actions'], right: ['status'] }),
    ).toEqual({ left: [], right: ['status', 'actions'] });
  });

  it('preserves pinning state when the actions column is already pinned right', /** Verifies preserves pinning state when the actions column is already pinned right. */ () => {
    const pinning = { right: ['actions'] };

    expect(pinActionsColumnRight([{ id: 'actions' }], pinning)).toBe(pinning);
  });
});

describe('Repository table scope', /** Verify immutable query and persistence boundaries. */ () => {
  it('ANDs fixed scope with contradictory user constraints instead of overriding it', /** Check query ownership. */ () => {
    expect(withRepositoryScope({ OR: [{ repositoryId: 'other' }, { title: 'x' }] }, 'current')).toEqual({
      AND: [{ repositoryId: 'current' }, { OR: [{ repositoryId: 'other' }, { title: 'x' }] }],
    });
    expect(withRepositoryScope(undefined, 'current')).toEqual({ AND: [{ repositoryId: 'current' }] });
    expect(withRepositoryScope({ title: 'x' })).toEqual({ title: 'x' });
  });
  it('isolates Repository and category persistence while preserving global names', /** Check identity separation. */ () => {
    expect(repositoryTableName('issues')).toBe('issues');
    expect(repositoryTableName('issues', 'a')).toBe('repository:a:issues');
    expect(repositoryTableName('issues', 'b')).not.toBe(repositoryTableName('issues', 'a'));
    expect(repositoryTableName('security-alerts-dependency', 'a', 'CODE')).toBe('repository:a:security-alerts:CODE');
  });
  it('normalizes invalid page addresses without discarding valid history pages', /** Check numeric input boundaries. */ () => {
    for (const value of [0, -1, 1.5, NaN, Infinity, ['2', '3'], 'invalid'])
      expect(normalizeRepositoryPage(value)).toBe(1);
    expect(normalizeRepositoryPage('4')).toBe(4);
  });
});
