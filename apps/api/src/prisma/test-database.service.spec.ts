import { buildTestDatabaseCleanupStatement } from './test-database.service.js';

describe('buildTestDatabaseCleanupStatement', () => {
  it('requires a test database name', () => {
    expect(() =>
      buildTestDatabaseCleanupStatement('postgresql://repovio:repovio@localhost:5432/repovio', ['users']),
    ).toThrow('test database');
  });

  it('creates a deterministic truncation statement for discovered tables', () => {
    expect(
      buildTestDatabaseCleanupStatement('postgresql://repovio:repovio@localhost:5432/repovio_test', [
        'workflow_runs',
        'users',
      ]),
    ).toBe('TRUNCATE TABLE "users", "workflow_runs" RESTART IDENTITY CASCADE');
  });

  it('does not execute a statement when no application tables exist', () => {
    expect(
      buildTestDatabaseCleanupStatement('postgresql://repovio:repovio@localhost:5432/repovio_test', []),
    ).toBeNull();
  });
});
