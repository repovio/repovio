import { getCorsOrigins } from './http.js';

describe('HTTP configuration', /** Groups scenarios for HTTP configuration. */ () => {
  it('parses and trims explicit CORS origins', /** Verifies parses and trims explicit CORS origins. */ () => {
    expect(getCorsOrigins('https://one.example, https://two.example')).toEqual([
      'https://one.example',
      'https://two.example',
    ]);
  });

  it('allows all origins only when explicitly configured', /** Verifies allows all origins only when explicitly configured. */ () => {
    expect(getCorsOrigins('*')).toBe(true);
  });
});
