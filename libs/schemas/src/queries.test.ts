import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';

import {
  ApiIssueQuerySchema,
  ApiRepositoryQuerySchema,
  ApiSecurityAlertQuerySchema,
  ApiUserQuerySchema,
} from './api-contracts.js';
import { localizeFormSchema } from './forms.js';

test('query scalar types, operators, relation paths, and includes are validated before database access', /** Verifies query scalar types, operators, relation paths, and includes are validated before database access. */ () => {
  for (const value of [
    { where: { id: 5 } },
    { where: { enabled: { in: [true] } } },
    { where: { encryptedWebhookSecret: { contains: 'secret' } } },
    { orderBy: { providerAccountId: { title: 'asc' } } },
    { include: { id: true } },
  ])
    assert.equal(ApiRepositoryQuerySchema.safeParse(value).success, false, JSON.stringify(value));
  assert.equal(ApiRepositoryQuerySchema.safeParse({ orderBy: [{ workflowRunRetentionDays: 'asc' }] }).success, true);
  assert.equal(ApiUserQuerySchema.safeParse({ where: { role: 'OWNER' } }).success, false);
  assert.equal(
    ApiIssueQuerySchema.safeParse({ where: { labels: { some: { label: { normalizedName: 'bug' } } } } }).success,
    true,
  );
});

test('the existing security alert file-path filter remains supported', /** Verifies the existing security alert file-path filter remains supported. */ () => {
  assert.equal(
    ApiSecurityAlertQuerySchema.safeParse({ where: { location: { path: ['path'], equals: 'src/main.ts' } } }).success,
    true,
  );
  assert.equal(
    ApiSecurityAlertQuerySchema.safeParse({ where: { location: { path: ['unknown'], equals: 'src/main.ts' } } })
      .success,
    false,
  );
});

test('pagination accepts integer strings and preserves scalar projection fields', /** Verifies pagination accepts integer strings and preserves scalar projection fields. */ () => {
  assert.deepEqual(ApiIssueQuerySchema.parse({ page: '2', perPage: '25', fields: '123' }), {
    page: 2,
    perPage: 25,
    fields: '123',
  });
  for (const page of ['', null, true, '1.5', -1]) assert.equal(ApiIssueQuerySchema.safeParse({ page }).success, false);
});

test('form localization preserves parsed output and field error paths', /** Verifies form localization preserves parsed output and field error paths. */ () => {
  const schema = localizeFormSchema(z.strictObject({ name: z.string().trim().min(1) }), 'Gib einen gültigen Wert ein.');
  assert.deepEqual(schema.parse({ name: ' Vera ' }), { name: 'Vera' });
  const invalid = schema.safeParse({ name: '' });
  assert.equal(invalid.success, false);
  if (!invalid.success) {
    assert.deepEqual(invalid.error.issues[0]?.path, ['name']);
    assert.equal(invalid.error.issues[0]?.message, 'Gib einen gültigen Wert ein.');
  }
});
