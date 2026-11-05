import { strict as assert } from 'node:assert';
import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiImage = process.env.REPOVIO_TEST_API_IMAGE ?? 'repovio-api:local';
const database = 'repovio_upgrade_test';
const password = 'disposable-upgrade-fixture';

/** Execute Docker against task-created fixtures; fail on unsuccessful commands. */
function docker(args, input, env = {}) {
  const result = spawnSync('docker', args, {
    input,
    env: { ...process.env, ...env },
    maxBuffer: 32 * 1024 * 1024,
    timeout: 180_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
}

/** Run SQL only inside a fixture container created by this test. */
function sql(container, query, db = database) {
  return docker(['exec', container, 'psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-U', 'repovio', '-d', db, '-c', query])
    .toString()
    .trim();
}

/** Wait for the container's final PostgreSQL server, including completion of initialization scripts. */
async function ready(container) {
  for (let attempt = 0; attempt < 90; attempt++) {
    const result = spawnSync('docker', [
      'exec',
      container,
      'pg_isready',
      '-h',
      '127.0.0.1',
      '-U',
      'repovio',
      '-d',
      database,
    ]);
    if (result.status === 0) return;
    await setTimeout(500);
  }
  assert.fail(`PostgreSQL fixture did not become ready: ${container}`);
}

/** Apply the application's actual Prisma migration history through its production image. */
function migrate(network, container) {
  docker([
    'run',
    '--rm',
    '--network',
    network,
    '--env',
    `DATABASE_URL=postgresql://repovio:${password}@${container}:5432/${database}`,
    '--env',
    `SHADOW_DATABASE_URL=postgresql://repovio:${password}@${container}:5432/${database}_shadow`,
    '--entrypoint',
    'node',
    apiImage,
    'node_modules/prisma/build/index.js',
    'migrate',
    'deploy',
    '--config',
    'prisma.config.ts',
  ]);
}

/** Snapshot every public table, including migration history, with deterministic row ordering. */
function snapshot(container) {
  const tables = sql(container, "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename").split(
    '\n',
  );
  return Object.fromEntries(
    tables.map((table) => [
      table,
      JSON.parse(
        sql(
          container,
          `SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text), '[]') FROM "${table.replaceAll('"', '""')}" AS t`,
        ),
      ),
    ]),
  );
}

test(
  'fresh PostgreSQL 18 and a PostgreSQL 17 dump/restore preserve application data and credentials',
  { timeout: 300_000 },
  async () => {
    docker(['image', 'inspect', apiImage]);
    const compose = JSON.parse(
      docker(
        ['compose', '-f', resolve(root, 'compose.yml'), 'config', '--no-env-resolution', '--format', 'json'],
        undefined,
        { POSTGRES_DB: database, POSTGRES_USER: 'repovio', POSTGRES_PASSWORD: password },
      ),
    );
    assert.equal(compose.services.postgres.image, 'postgres:18-alpine');
    assert.ok(
      compose.services.postgres.volumes.some(
        (volume) => volume.type === 'volume' && volume.target === '/var/lib/postgresql',
      ),
    );
    assert.deepEqual(compose.services.postgres.entrypoint, [
      '/bin/sh',
      '/usr/local/bin/repovio-postgres-entrypoint.sh',
    ]);
    assert.deepEqual(compose.services.postgres.command, ['postgres']);
    const prefix = `repovio-upgrade-${randomUUID()}`;
    const network = `${prefix}-network`;
    const source = `${prefix}-17`;
    const target = `${prefix}-18`;
    const volumes = [];
    const containers = [];
    let networkCreated = false;
    try {
      docker(['network', 'create', '--label', 'repovio.fixture=postgres-upgrade', network]);
      networkCreated = true;
      for (const [container, major, destination] of [
        [source, 17, '/var/lib/postgresql/data'],
        [target, 18, '/var/lib/postgresql'],
      ]) {
        const volume = `${container}-data`;
        docker(['volume', 'create', '--label', 'repovio.fixture=postgres-upgrade', volume]);
        volumes.push(volume);
        docker([
          'run',
          '--detach',
          '--name',
          container,
          '--network',
          network,
          '--label',
          'repovio.fixture=postgres-upgrade',
          '--env',
          'POSTGRES_USER=repovio',
          '--env',
          `POSTGRES_PASSWORD=${password}`,
          '--env',
          `POSTGRES_DB=${database}`,
          '--mount',
          `type=volume,src=${volume},dst=${destination}`,
          '--mount',
          `type=bind,src=${resolve(root, 'docker/postgres-init')},dst=/docker-entrypoint-initdb.d,readonly`,
          ...(major === 18
            ? [
                '--mount',
                `type=bind,src=${resolve(root, 'docker/postgres-entrypoint.sh')},dst=/usr/local/bin/repovio-postgres-entrypoint.sh,readonly`,
                '--entrypoint',
                '/bin/sh',
              ]
            : []),
          `postgres:${major}-alpine`,
          ...(major === 18 ? ['/usr/local/bin/repovio-postgres-entrypoint.sh', 'postgres'] : []),
        ]);
        containers.push(container);
        await ready(container);
        assert.equal(sql(container, `SELECT count(*) FROM pg_database WHERE datname = '${database}_shadow'`), '1');
        assert.equal(Math.floor(Number(sql(container, 'SHOW server_version_num')) / 10_000), major);
        migrate(network, container);
        assert.ok(Number(sql(container, 'SELECT count(*) FROM "_prisma_migrations"')) > 0);
      }
      assert.match(sql(target, 'SHOW data_directory'), /^\/var\/lib\/postgresql\/18\//);
      const key = randomBytes(32);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update('synthetic-provider-token', 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      const envelope = [iv, tag, encrypted].map((value) => value.toString('base64url')).join('.');
      sql(
        source,
        `
      INSERT INTO users (id, "updatedAt", username, "passwordHash", role) VALUES
        ('00000000-0000-0000-0000-000000000001', now(), 'upgrade-fixture', 'synthetic-fixture-hash', 'SYSTEM_ADMIN');
      INSERT INTO provider_accounts (id, "updatedAt", "providerType", "displayName", "encryptedAccessToken", enabled) VALUES
        ('00000000-0000-0000-0000-000000000002', now(), 'GITHUB', 'Upgrade fixture', '${envelope}', false);
      INSERT INTO repositories (id, "updatedAt", "providerRepositoryId", owner, name, url, "providerAccountId", "retainedRunDurationMs") VALUES
        ('00000000-0000-0000-0000-000000000003', now(), 'fixture', 'example', 'fixture', 'https://example.invalid',
         '00000000-0000-0000-0000-000000000002', 4000000000);
      INSERT INTO repository_memberships (id, "updatedAt", "userId", "repositoryId") VALUES
        ('00000000-0000-0000-0000-000000000004', now(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003');
      INSERT INTO notification_channels (id, "updatedAt", name, type, "encryptedUrl", "urlScheme") VALUES
        ('00000000-0000-0000-0000-000000000005', now(), 'Upgrade fixture', 'CUSTOM_APPRISE', '${envelope}', 'json');
      INSERT INTO notification_event_subscriptions (id, "updatedAt", "eventType", "workflowPatterns", "notificationChannelId") VALUES
        ('00000000-0000-0000-0000-000000000006', now(), 'WORKFLOW_RUN_FAILED', ARRAY['deploy-*', 'test-*'], '00000000-0000-0000-0000-000000000005');
    `,
      );
      const before = snapshot(source);
      const rejected = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--mount',
          `type=volume,src=${source}-data,dst=/var/lib/postgresql,readonly`,
          '--mount',
          `type=bind,src=${resolve(root, 'docker/postgres-entrypoint.sh')},dst=/usr/local/bin/repovio-postgres-entrypoint.sh,readonly`,
          '--entrypoint',
          '/bin/sh',
          'postgres:18-alpine',
          '/usr/local/bin/repovio-postgres-entrypoint.sh',
          'postgres',
        ],
        { encoding: 'utf8', timeout: 30_000 },
      );
      assert.equal(rejected.status, 1);
      assert.match(rejected.stderr, /Legacy PostgreSQL data layout detected/);
      assert.deepEqual(snapshot(source), before);
      const dump = docker([
        'run',
        '--rm',
        '--network',
        network,
        '--env',
        `PGPASSWORD=${password}`,
        'postgres:18-alpine',
        'pg_dump',
        '--host',
        source,
        '--username',
        'repovio',
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        database,
      ]);
      sql(target, `DROP DATABASE ${database}`, 'postgres');
      sql(target, `CREATE DATABASE ${database}`, 'postgres');
      docker(
        [
          'exec',
          '--interactive',
          target,
          'pg_restore',
          '--exit-on-error',
          '--no-owner',
          '--no-privileges',
          '-U',
          'repovio',
          '-d',
          database,
        ],
        dump,
      );
      assert.deepEqual(snapshot(target), before);
      const restored = sql(target, 'SELECT "encryptedAccessToken" FROM provider_accounts');
      assert.equal(restored, envelope);
      const [restoredIv, restoredTag, restoredCiphertext] = restored
        .split('.')
        .map((value) => Buffer.from(value, 'base64url'));
      const decipher = createDecipheriv('aes-256-gcm', key, restoredIv);
      decipher.setAuthTag(restoredTag);
      assert.equal(
        Buffer.concat([decipher.update(restoredCiphertext), decipher.final()]).toString(),
        'synthetic-provider-token',
      );
      migrate(network, target);
      assert.deepEqual(snapshot(target), before);
      docker(['restart', target]);
      await ready(target);
      assert.deepEqual(snapshot(target), before);
      sql(target, 'UPDATE users SET "firstName" = \'Post-upgrade write\'');
      assert.deepEqual(snapshot(source), before);
      assert.notDeepEqual(snapshot(target), before);
    } finally {
      for (const container of containers.reverse()) docker(['rm', '--force', container]);
      for (const volume of volumes.reverse()) docker(['volume', 'rm', volume]);
      if (networkCreated) docker(['network', 'rm', network]);
    }
  },
);
