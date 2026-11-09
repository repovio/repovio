import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);

test('every translated Keycloak installation embeds the runnable Compose and environment examples', /** Verify copied examples cannot drift from the runnable stack. */ async () => {
  const locales = JSON.parse(await readFile(new URL('locales.json', root), 'utf8'));
  const compose = await readFile(new URL('examples/compose-keycloak.yml', root), 'utf8');
  const environment = await readFile(new URL('examples/keycloak.env.example', root), 'utf8');
  for (const locale of Object.keys(locales)) {
    const page = await readFile(new URL(`${locale}/docs/next/installation.md`, root), 'utf8');
    const section = page.split('<a id="docker-compose-with-keycloak"></a>')[1]?.split('<a id=')[0];
    assert.ok(section, `${locale}: Keycloak installation section`);
    assert.equal(/```yaml\n([\s\S]*?)\n```/.exec(section)?.[1], compose.trimEnd(), `${locale}: Compose`);
    assert.equal(/```dotenv\n([\s\S]*?)\n```/.exec(section)?.[1], environment.trimEnd(), `${locale}: environment`);
  }
});

test('the documented Auth0 Action scopes trusted group claims to the Repovio application', /** Execute the documented Action with representative trusted and untrusted metadata. */ async () => {
  const page = await readFile(new URL('en/docs/next/authentication.md', root), 'utf8');
  const source = /```javascript\n([\s\S]*?)\n```/.exec(page)?.[1];
  assert.ok(source);
  const actions = {};
  runInNewContext(source, { exports: actions }, { timeout: 1000 });
  for (const groups of [['repovio-admins'], ['repovio-managers'], ['repovio-viewers'], undefined, 'repovio-admins']) {
    const claims = new Map();
    await actions.onExecutePostLogin(
      {
        client: { client_id: 'REPLACE_WITH_REPOVIO_CLIENT_ID' },
        user: { app_metadata: { repovio_groups: groups }, user_metadata: { repovio_groups: ['repovio-admins'] } },
      },
      {
        idToken: {
          /** Capture emitted claims without an Auth0 connection. */ setCustomClaim: (name, value) =>
            claims.set(name, value),
        },
      },
    );
    assert.equal(claims.size, 1);
    assert.equal(
      JSON.stringify(claims.get('https://repovio.example.com/groups')),
      JSON.stringify(Array.isArray(groups) ? groups : []),
    );
  }
  await actions.onExecutePostLogin(
    { client: { client_id: 'another-application' } },
    {
      idToken: {
        /** Reject claims emitted for unrelated clients. */ setCustomClaim: () => assert.fail('unrelated application'),
      },
    },
  );
});
