import { BadRequestException } from '@nestjs/common';

import { ProviderOAuthStateService } from './provider-oauth-state.service.js';

describe('ProviderOAuthStateService', /** Groups scenarios for ProviderOAuthStateService. */ () => {
  const credentials = {
    decrypt: jest.fn(
      /** Provides isolated decrypt behavior for this test fixture. */ (value: string) =>
        value.replace('encrypted:', ''),
    ),
    encrypt: jest.fn(
      /** Provides isolated encrypt behavior for this test fixture. */ (value: string) => `encrypted:${value}`,
    ),
  };
  const service = new ProviderOAuthStateService(credentials as never);

  beforeEach(/** Prepares shared test state for beforeEach. */ () => jest.clearAllMocks());

  it('encrypts and restores a short-lived OAuth authorization context', /** Verifies encrypts and restores a short-lived OAuth authorization context. */ () => {
    const state = service.create({
      baseUrl: 'https://github.example.test',
      displayName: 'GitHub',
      providerType: 'GITHUB',
      userId: 'admin-id',
    });

    expect(state).toContain('encrypted:');
    expect(service.consume(state)).toEqual(
      expect.objectContaining({
        baseUrl: 'https://github.example.test',
        displayName: 'GitHub',
        providerType: 'GITHUB',
        userId: 'admin-id',
      }),
    );
  });

  it('rejects altered authorization state', /** Verifies rejects altered authorization state. */ () => {
    expect(
      /** Evaluates `service.consume('not-a-valid-state')` when expect invokes this callback. */ () =>
        service.consume('not-a-valid-state'),
    ).toThrow(BadRequestException);
  });
});
