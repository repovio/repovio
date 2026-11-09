import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ApiCreateMcpAccessTokenSchema,
  ApiCreateNotificationChannelSchema,
  ApiCreateProviderAccountSchema,
  ApiCreateUserSchema,
  ApiDashboardPeriodQuerySchema,
  ApiListMcpAccessTokensQuerySchema,
  ApiNotificationChannelSchema,
  ApiNotificationDeliverySchema,
  ApiNotificationEventSubscriptionInputSchema,
  ApiNotificationRulePreviewInputSchema,
  ApiRemoteAvatarSchema,
  ApiResetUserPasswordSchema,
  ApiSaveUserGroupSchema,
  ApiSetupSchema,
  ApiUpdateNotificationChannelSchema,
  ApiUpdateOidcConfigSchema,
  ApiUpdateProviderAccountSchema,
} from './api-contracts.js';

const repositoryId = '30b7b20a-159a-42c7-a283-0246848d5ab3';
const userId = '30b7b20a-159a-42c7-a283-0246848d5ab4';
const subscription = {
  eventType: 'WORKFLOW_RUN_FAILED' as const,
  repositoryIds: [repositoryId],
  workflowPatterns: ['ci-*'],
};

describe('shared API input compatibility', /** Groups scenarios for shared API input compatibility. */ () => {
  it('trims optional setup names and omits empty names without accepting nonstrings', /** Verifies trims optional setup names and omits empty names without accepting nonstrings. */ () => {
    const credentials = { username: ' admin ', password: 'long-enough-password' };
    assert.deepEqual(ApiSetupSchema.parse({ ...credentials, firstName: '  ', lastName: ' User ' }), {
      ...credentials,
      username: 'admin',
      firstName: undefined,
      lastName: 'User',
    });
    assert.equal(ApiSetupSchema.safeParse({ ...credentials, firstName: 1 }).success, false);
  });

  it('rejects forbidden OIDC claim and scope characters while allowing supported punctuation', /** Verifies rejects forbidden OIDC claim and scope characters while allowing supported punctuation. */ () => {
    assert.equal(
      ApiUpdateOidcConfigSchema.safeParse({ groupsClaim: 'realm_access.roles', scopes: ['openid', 'api/read'] })
        .success,
      true,
    );
    for (const groupsClaim of ['groups roles', 'groups[0]', '']) {
      assert.equal(ApiUpdateOidcConfigSchema.safeParse({ groupsClaim }).success, false);
    }
    for (const scope of ['profile email', 'quoted"scope', 'slash\\scope', '']) {
      assert.equal(ApiUpdateOidcConfigSchema.safeParse({ scopes: [scope] }).success, false);
    }
  });

  it('retains OIDC group and scope array limits and individual string bounds', /** Verifies retains OIDC group and scope array limits and individual string bounds. */ () => {
    for (const field of ['managerGroups', 'viewerGroups', 'systemAdministratorGroups']) {
      assert.equal(
        ApiUpdateOidcConfigSchema.safeParse({
          [field]: Array.from(
            { length: 100 },
            /** Evaluates `'group'` when Array.from invokes this callback. */ () => 'group',
          ),
        }).success,
        true,
      );
      assert.equal(
        ApiUpdateOidcConfigSchema.safeParse({
          [field]: Array.from(
            { length: 101 },
            /** Evaluates `'group'` when Array.from invokes this callback. */ () => 'group',
          ),
        }).success,
        false,
      );
      assert.equal(ApiUpdateOidcConfigSchema.safeParse({ [field]: ['g'.repeat(513)] }).success, false);
    }
    assert.equal(
      ApiUpdateOidcConfigSchema.safeParse({
        scopes: Array.from(
          { length: 20 },
          /** Evaluates `'openid'` when Array.from invokes this callback. */ () => 'openid',
        ),
      }).success,
      true,
    );
    assert.equal(
      ApiUpdateOidcConfigSchema.safeParse({
        scopes: Array.from(
          { length: 21 },
          /** Evaluates `'openid'` when Array.from invokes this callback. */ () => 'openid',
        ),
      }).success,
      false,
    );
    assert.equal(ApiUpdateOidcConfigSchema.safeParse({ scopes: ['s'.repeat(129)] }).success, false);
  });

  it('applies the same nested subscription constraints to preview, create and update', /** Verifies applies the same nested subscription constraints to preview, create and update. */ () => {
    const badSubscriptions = [
      { ...subscription, repositoryIds: ['not-a-uuid'] },
      { ...subscription, repositoryIds: [repositoryId, repositoryId] },
      { ...subscription, workflowPatterns: ['ci-*', 'ci-*'] },
      { ...subscription, workflowPatterns: ['x'.repeat(1025)] },
      { ...subscription, eventType: 'UNKNOWN' },
    ];
    for (const invalid of badSubscriptions) {
      assert.equal(ApiNotificationEventSubscriptionInputSchema.safeParse(invalid).success, false);
      assert.equal(ApiNotificationRulePreviewInputSchema.safeParse({ eventSubscriptions: [invalid] }).success, false);
      assert.equal(
        ApiCreateNotificationChannelSchema.safeParse({ name: 'Alerts', eventSubscriptions: [invalid] }).success,
        false,
      );
      assert.equal(ApiUpdateNotificationChannelSchema.safeParse({ eventSubscriptions: [invalid] }).success, false);
    }
    assert.equal(ApiNotificationRulePreviewInputSchema.safeParse({ eventSubscriptions: [subscription] }).success, true);
    assert.equal(ApiNotificationRulePreviewInputSchema.safeParse({ eventSubscriptions: [] }).success, false);
  });

  it('validates browser recipient and MCP owner UUIDs', /** Verifies validates browser recipient and MCP owner UUIDs. */ () => {
    const channel = { name: 'Browser alerts', eventSubscriptions: [subscription], type: 'BROWSER_PUSH' };
    assert.equal(
      ApiCreateNotificationChannelSchema.safeParse({ ...channel, browserRecipientUserIds: [userId] }).success,
      true,
    );
    for (const browserRecipientUserIds of [['invalid'], [userId, userId]]) {
      assert.equal(
        ApiCreateNotificationChannelSchema.safeParse({ ...channel, browserRecipientUserIds }).success,
        false,
      );
      assert.equal(ApiUpdateNotificationChannelSchema.safeParse({ browserRecipientUserIds }).success, false);
    }
    assert.equal(ApiListMcpAccessTokensQuerySchema.safeParse({ userId }).success, true);
    assert.equal(ApiListMcpAccessTokensQuerySchema.safeParse({ userId: 'invalid' }).success, false);
    assert.equal(ApiListMcpAccessTokensQuerySchema.safeParse({ page: '1' }).success, false);
  });

  it('accepts the existing date-only, local and offset ISO input forms', /** Verifies accepts the existing date-only, local and offset ISO input forms. */ () => {
    for (const date of ['2027-01-15', '2027-01-15T12:30:00', '2027-01-15 12:30:00Z', '2027-01-15T12:30:00+02:00']) {
      assert.equal(ApiDashboardPeriodQuerySchema.safeParse({ from: date, to: date }).success, true, date);
      assert.equal(ApiCreateMcpAccessTokenSchema.safeParse({ name: ' Token ', expiresAt: date }).success, true, date);
    }
    assert.equal(ApiCreateMcpAccessTokenSchema.safeParse({ name: 'Token', expiresAt: 'not-a-date' }).success, false);
    assert.equal(ApiDashboardPeriodQuerySchema.safeParse({ from: '2027-13-15', to: '2027-01-15' }).success, false);
  });

  it('preserves nullable updates and treats null optional nonnullable values as omitted', /** Verifies preserves nullable updates and treats null optional nonnullable values as omitted. */ () => {
    assert.deepEqual(ApiUpdateProviderAccountSchema.parse({ displayName: null, enabled: null, baseUrl: null }), {
      displayName: undefined,
      enabled: undefined,
      baseUrl: null,
    });
    assert.equal(ApiUpdateOidcConfigSchema.parse({ issuer: null }).issuer, null);
  });

  it('retains the former provider URL protocol and host restrictions', /** Verifies retains the former provider URL protocol and host restrictions. */ () => {
    const account = { providerType: 'GITLAB', displayName: 'GitLab', accessToken: 'token' };
    for (const baseUrl of [
      'https://git.example.com',
      'git.example.com',
      'ftp://git.example.com',
      'https://127.0.0.1',
    ]) {
      assert.equal(ApiCreateProviderAccountSchema.safeParse({ ...account, baseUrl }).success, true, baseUrl);
    }
    for (const baseUrl of [
      'javascript:alert(1)',
      'file:///tmp/provider',
      'https://localhost',
      'https://bad_host.example.com',
    ]) {
      assert.equal(ApiCreateProviderAccountSchema.safeParse({ ...account, baseUrl }).success, false, baseUrl);
    }
    assert.equal(ApiRemoteAvatarSchema.safeParse({ url: 'http://images.example.com/avatar.png' }).success, false);
    assert.equal(ApiRemoteAvatarSchema.safeParse({ url: 'https://images.example.com/avatar.png' }).success, true);
  });

  it('rejects unknown request keys instead of stripping a misspelled configuration field', /** Verifies rejects unknown request keys instead of stripping a misspelled configuration field. */ () => {
    assert.equal(ApiUpdateOidcConfigSchema.safeParse({ allowUnmatchedViewr: true }).success, false);
    assert.equal(
      ApiCreateNotificationChannelSchema.safeParse({
        name: 'Alerts',
        eventSubscriptions: [subscription],
        token: 'must-not-pass',
      }).success,
      false,
    );
  });
});

describe('local account and access group boundaries', /** Covers new administrative request validation. */ () => {
  it('normalizes creation names and rejects empty logins, external identities, and invalid passwords', /** Prevents malformed or externally managed account creation. */ () => {
    const valid = { username: ' ada ', password: 'initial-password', role: 'VIEWER' };
    assert.equal(ApiCreateUserSchema.parse(valid).username, 'ada');
    assert.equal(ApiCreateUserSchema.safeParse({ ...valid, username: '   ' }).success, false);
    assert.equal(ApiCreateUserSchema.safeParse({ ...valid, authProvider: 'OIDC' }).success, false);
    for (const password of ['short', 'x'.repeat(257)]) {
      assert.equal(ApiCreateUserSchema.safeParse({ ...valid, password }).success, false);
      assert.equal(ApiResetUserPasswordSchema.safeParse({ newPassword: password }).success, false);
    }
    assert.equal(
      ApiResetUserPasswordSchema.safeParse({ newPassword: 'replacement-password', userId: 'injected' }).success,
      false,
    );
  });
  it('requires nonempty bounded group names', /** Rejects invalid identifiers before persistence. */ () => {
    assert.deepEqual(ApiSaveUserGroupSchema.parse({ name: ' Readers ' }), { name: 'Readers' });
    for (const name of ['', '  ', 'x'.repeat(256)])
      assert.equal(ApiSaveUserGroupSchema.safeParse({ name }).success, false);
  });
});

import {
  ApiBrowserPushEnrollmentSchema,
  ApiBrowserPushLookupSchema,
  ApiRecentNotificationsSchema,
} from './api-contracts.js';

describe('notification personal boundaries', /** Groups private notification contract cases. */ () => {
  it('bounds lookup endpoints and hides all ownership details', /** Checks strict enrollment contracts. */ () => {
    assert.equal(ApiBrowserPushLookupSchema.safeParse({ endpoint: 'http://push.example.test' }).success, false);
    assert.equal(
      ApiBrowserPushLookupSchema.safeParse({ endpoint: 'https://push.example.test/' + 'a'.repeat(4096) }).success,
      false,
    );
    assert.deepEqual(ApiBrowserPushEnrollmentSchema.parse({ enrolled: false }), { enrolled: false });
    assert.equal(ApiBrowserPushEnrollmentSchema.safeParse({ enrolled: true, userId: 'secret' }).success, false);
  });
  it('accepts private test history but rejects excess entries and secret fields', /** Checks history nullability and limits. */ () => {
    const item = {
      id: repositoryId,
      createdAt: '2026-11-09T12:00:00.000Z',
      kind: 'TEST',
      eventType: null,
      repository: null,
      subjectTitle: 'Test',
      subjectUrl: null,
      status: 'FAILED',
    };
    assert.equal(ApiRecentNotificationsSchema.safeParse({ items: [item] }).success, true);
    assert.equal(ApiRecentNotificationsSchema.safeParse({ items: Array(6).fill(item) }).success, false);
    assert.equal(ApiRecentNotificationsSchema.safeParse({ items: [{ ...item, endpoint: 'secret' }] }).success, false);
    assert.equal(ApiRecentNotificationsSchema.safeParse({ items: [{ ...item, status: 'READ' }] }).success, false);
  });
});

it('preserves safe recipient names and accepts older identities', /** Checks additive public names without admitting private fields. */ () => {
  const identity = ApiNotificationChannelSchema.shape.browserRecipients.element;
  assert.deepEqual(identity.parse({ id: 'u', username: 'viewer', firstName: 'Vera', lastName: null }), {
    id: 'u',
    username: 'viewer',
    firstName: 'Vera',
    lastName: null,
  });
  assert.deepEqual(identity.parse({ id: 'u', username: 'viewer' }), { id: 'u', username: 'viewer' });
  assert.equal(identity.safeParse({ id: 'u', username: 'viewer', passwordHash: 'secret' }).success, false);
});

it('accepts optional nullable safe delivery requester identities', /** Keeps older deliveries readable while rejecting private identity fields. */ () => {
  const requester = ApiNotificationDeliverySchema.shape.requestedBy;
  assert.equal(requester.parse(undefined), undefined);
  assert.equal(requester.parse(null), null);
  assert.deepEqual(requester.parse({ id: 'u', username: 'viewer', firstName: 'Vera', lastName: null }), {
    id: 'u',
    username: 'viewer',
    firstName: 'Vera',
    lastName: null,
  });
  assert.equal(requester.safeParse({ id: 'u', username: 'viewer', token: 'secret' }).success, false);
});
