import { ForbiddenException } from '@nestjs/common';

import { OidcController } from './oidc.controller.js';

describe('OidcController authorization and browser handoff', () => {
  const service = {
    begin: jest.fn(),
    callback: jest.fn(),
    check: jest.fn(),
    config: jest.fn(),
    exchange: jest.fn(),
    status: jest.fn(),
    updateConfig: jest.fn(),
  };
  const controller = new OidcController(service as never);
  const administrator = {
    authProvider: 'LOCAL' as const,
    id: 'admin-id',
    role: 'SYSTEM_ADMIN' as const,
    username: 'admin',
  };
  const viewer = {
    authProvider: 'LOCAL' as const,
    id: 'viewer-id',
    role: 'VIEWER' as const,
    username: 'viewer',
  };

  beforeEach(() => jest.clearAllMocks());

  it('keeps status and exchange public while restricting configuration and checks to system administrators', async () => {
    service.status.mockResolvedValue({ enabled: false });
    service.exchange.mockResolvedValue({ accessToken: 'jwt', returnTo: '/', user: viewer });
    service.config.mockResolvedValue({ enabled: false });
    service.check.mockResolvedValue({ ok: true });

    await expect(controller.status()).resolves.toEqual({ enabled: false });
    await expect(controller.exchange({ code: 'x'.repeat(43) })).resolves.toMatchObject({ accessToken: 'jwt' });
    await expect(controller.config({ user: administrator })).resolves.toEqual({ enabled: false });
    await expect(controller.check({ user: administrator })).resolves.toEqual({ ok: true });
    expect(() => controller.config({ user: viewer })).toThrow(ForbiddenException);
    expect(() => controller.check({ user: viewer })).toThrow(ForbiddenException);
    expect(() => controller.updateConfig({ user: viewer }, {})).toThrow(ForbiddenException);
  });

  it('places only the opaque one-time code in the web URL fragment', async () => {
    service.callback.mockResolvedValue({ code: 'opaque-handoff-code' });
    const response = { header: jest.fn(), redirect: jest.fn() };

    await controller.callback(
      {
        headers: { cookie: 'repovio_oidc_binding=binding' },
        url: '/api/v1/auth/oidc/callback?code=provider-code&state=provider-state',
      } as never,
      response as never,
    );

    expect(response.header).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.redirect).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:3000\/auth\/oidc\/callback#code=opaque-handoff-code$/),
      302,
    );
    expect(response.redirect.mock.calls[0]?.[0]).not.toContain('jwt');
  });

  it('sets the Fastify binding cookie with a one-day lifetime in seconds', async () => {
    service.begin.mockResolvedValue({
      bindingIsNew: true,
      bindingValue: 'new-binding',
      redirectUrl: 'https://identity.example/authorize',
    });
    const response = { header: jest.fn(), redirect: jest.fn(), setCookie: jest.fn() };

    await controller.start({ headers: {} } as never, response as never, '/repositories');

    expect(service.begin).toHaveBeenCalledWith(undefined, '/repositories');
    expect(response.setCookie).toHaveBeenCalledWith(
      'repovio_oidc_binding',
      'new-binding',
      expect.objectContaining({ httpOnly: true, maxAge: 86_400, path: '/api/v1/auth/oidc', sameSite: 'lax' }),
    );
    expect(response.redirect).toHaveBeenCalledWith('https://identity.example/authorize', 302);
  });

  it('rejects duplicate callback parameters before invoking the OIDC service', async () => {
    const response = { header: jest.fn(), redirect: jest.fn() };

    await controller.callback(
      { headers: {}, url: '/api/v1/auth/oidc/callback?code=first&code=second' } as never,
      response as never,
    );

    expect(service.callback).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/auth/oidc/callback#error=oidc_invalid_request',
      302,
    );
  });
});
