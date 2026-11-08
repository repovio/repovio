import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';

import { ENV } from '../../../config/env.js';

/** Verify the actual additive migration against a task-created database containing pre-change records. */
it('preserves legacy credentials and tracked relationships through the GitLab OAuth schema expansion', /** Apply migration history and compare old columns byte for byte. */ async () => {
  const database = `oauth_${randomUUID().replaceAll('-', '')}_test`;
  const control = new Client({ connectionString: ENV.DATABASE_URL });
  const targetUrl = new URL(ENV.DATABASE_URL);
  targetUrl.pathname = `/${database}`;
  const target = new Client({ connectionString: targetUrl.toString() });
  await control.connect();
  try {
    await control.query(`CREATE DATABASE "${database}"`);
    await target.connect();
    const directory = resolve('prisma/migrations');
    const migration = '20261108170000_gitlab_oauth_credentials';
    for (const entry of (await readdir(directory)).sort()) {
      if (entry === migration || !/^\d/.test(entry)) continue;
      await target.query(await readFile(resolve(directory, entry, 'migration.sql'), 'utf8'));
    }
    const accountId = randomUUID();
    const repositoryId = randomUUID();
    const userId = randomUUID();
    await target.query(
      'INSERT INTO "provider_accounts" ("id", "updatedAt", "providerType", "displayName", "encryptedAccessToken", "enabled") VALUES ($1, NOW(), \'GITLAB\', \'Legacy OAuth or PAT\', \'synthetic-encrypted-envelope\', false)',
      [accountId],
    );
    await target.query(
      'INSERT INTO "repositories" ("id", "updatedAt", "providerAccountId", "providerRepositoryId", "owner", "name", "url") VALUES ($1, NOW(), $2, \'42\', \'example\', \'history\', \'https://gitlab.example.test/example/history\')',
      [repositoryId, accountId],
    );
    await target.query(
      'INSERT INTO "users" ("id", "updatedAt", "passwordHash", "username") VALUES ($1, NOW(), $2, \'synthetic-viewer\')',
      [userId, 'synthetic-hash'],
    );
    await target.query(
      'INSERT INTO "repository_memberships" ("id", "updatedAt", "userId", "repositoryId") VALUES ($1, NOW(), $2, $3)',
      [randomUUID(), userId, repositoryId],
    );
    const before = (await target.query('SELECT * FROM "provider_accounts"')).rows[0] as Record<string, unknown>;
    const repositoriesBefore = (await target.query('SELECT * FROM "repositories"')).rows;
    const membershipsBefore = (await target.query('SELECT * FROM "repository_memberships"')).rows;
    await target.query(await readFile(resolve(directory, migration, 'migration.sql'), 'utf8'));
    const after = (await target.query('SELECT * FROM "provider_accounts"')).rows[0] as Record<string, unknown>;
    expect(after).toMatchObject(before);
    expect(after).toMatchObject({
      oauthStatus: 'NONE',
      oauthAuthorizationRevision: 0,
      encryptedRefreshToken: null,
      oauthAccessTokenExpiresAt: null,
      oauthClientId: null,
      oauthRedirectUri: null,
      gitlabUserId: null,
    });
    expect((await target.query('SELECT * FROM "repositories"')).rows).toEqual(repositoriesBefore);
    expect((await target.query('SELECT * FROM "repository_memberships"')).rows).toEqual(membershipsBefore);
    // An old consumer still reads and updates its original columns on the expanded schema.
    await target.query('UPDATE "provider_accounts" SET "displayName" = \'Legacy renamed\' WHERE "id" = $1', [
      accountId,
    ]);
    expect(
      (await target.query('SELECT "encryptedAccessToken", "enabled", "authenticationMethod" FROM "provider_accounts"'))
        .rows[0],
    ).toEqual({ encryptedAccessToken: before.encryptedAccessToken, enabled: false, authenticationMethod: 'TOKEN' });
  } finally {
    await target.end();
    await control.query(`DROP DATABASE IF EXISTS "${database}"`);
    await control.end();
  }
}, 30_000);
