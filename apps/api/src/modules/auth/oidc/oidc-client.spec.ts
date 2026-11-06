import {
  classifyOidcError,
  OidcClientError,
  selectIdTokenAlgorithm,
  selectTokenAuthenticationMethod,
  validateOidcUrl,
} from './oidc-client.js';

describe('OIDC client policy', /** Groups scenarios for OIDC client policy. */ () => {
  it('requires HTTPS unless the explicit lab exception is enabled', /** Verifies requires HTTPS unless the explicit lab exception is enabled. */ () => {
    expect(validateOidcUrl('https://id.example/realms/repovio', false).href).toBe('https://id.example/realms/repovio');
    expect(
      /** Evaluates `validateOidcUrl('http://id.example', false)` when expect invokes this callback. */ () =>
        validateOidcUrl('http://id.example', false),
    ).toThrow(new OidcClientError('endpoint_invalid'));
    expect(validateOidcUrl('http://id.example', true).protocol).toBe('http:');
    expect(
      /** Evaluates `validateOidcUrl('https://user:password@id.example', false)` when expect invokes this callback. */ () =>
        validateOidcUrl('https://user:password@id.example', false),
    ).toThrow(OidcClientError);
    expect(
      /** Evaluates `validateOidcUrl('https://id.example/#fragment', false)` when expect invokes this callback. */ () =>
        validateOidcUrl('https://id.example/#fragment', false),
    ).toThrow(OidcClientError);
  });

  it('selects only asymmetric ID-token algorithms', /** Verifies selects only asymmetric ID-token algorithms. */ () => {
    expect(selectIdTokenAlgorithm(['HS256', 'ES256', 'RS256'])).toBe('RS256');
    expect(
      /** Evaluates `selectIdTokenAlgorithm(['HS256', 'none'])` when expect invokes this callback. */ () =>
        selectIdTokenAlgorithm(['HS256', 'none']),
    ).toThrow(new OidcClientError('unsupported_id_token_alg'));
    expect(selectIdTokenAlgorithm(undefined)).toBe('RS256');
  });

  it('selects an advertised client authentication method without silent fallback', /** Verifies selects an advertised client authentication method without silent fallback. */ () => {
    expect(selectTokenAuthenticationMethod(undefined, true)).toBe('client_secret_basic');
    expect(selectTokenAuthenticationMethod(['client_secret_post'], true)).toBe('client_secret_post');
    expect(
      /** Evaluates `selectTokenAuthenticationMethod(['private_key_jwt'], true)` when expect invokes this callback. */ () =>
        selectTokenAuthenticationMethod(['private_key_jwt'], true),
    ).toThrow(new OidcClientError('unsupported_client_auth'));
    expect(selectTokenAuthenticationMethod(['private_key_jwt'], false)).toBe('none');
  });

  it('maps internal client failures to stable browser-safe codes', /** Verifies maps internal client failures to stable browser-safe codes. */ () => {
    expect(classifyOidcError(new OidcClientError('id_token_invalid'))).toBe('oidc_token_invalid');
    expect(classifyOidcError(new OidcClientError('redirect_not_allowed'))).toBe('oidc_unavailable');
    expect(classifyOidcError(new TypeError('provider host details'))).toBe('oidc_unavailable');
  });
});
