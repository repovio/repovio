import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Usage: openapi:export <output.json>');

// Replace inherited deployment settings before loading any application modules. NODE_ENV prevents dotenv loading.
process.env = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://schema:schema@127.0.0.1:1/schema',
  SHADOW_DATABASE_URL: 'postgresql://schema:schema@127.0.0.1:1/schema_shadow',
  AUTH_JWT_SECRET: 'synthetic-openapi-export-key',
  TOKEN_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
  SCHEDULER_ENABLED: 'false',
};

const { exportApiDocument } = await import('../openapi/export.js');
const document = await exportApiDocument();
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), JSON.stringify(document, null, 2) + '\n');
