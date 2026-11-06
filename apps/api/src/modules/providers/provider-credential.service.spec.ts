import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { ProviderCredentialService } from './provider-credential.service.js';

describe('ProviderCredentialService', /** Groups scenarios for ProviderCredentialService. */ () => {
  const service = new ProviderCredentialService(new CredentialEncryptionService());
  it('round-trips credentials without keeping plaintext in ciphertext', /** Verifies round-trips credentials without keeping plaintext in ciphertext. */ () => {
    const encrypted = service.encrypt('provider-secret');
    expect(encrypted).not.toContain('provider-secret');
    expect(service.decrypt(encrypted)).toBe('provider-secret');
  });

  it('uses a fresh authenticated ciphertext for each encryption', /** Verifies uses a fresh authenticated ciphertext for each encryption. */ () => {
    const first = service.encrypt('provider-secret');
    const second = service.encrypt('provider-secret');

    expect(first).not.toBe(second);
    expect(service.decrypt(first)).toBe('provider-secret');
    expect(service.decrypt(second)).toBe('provider-secret');
    const tampered = `${first.slice(0, -1)}${first.endsWith('A') ? 'B' : 'A'}`;
    expect(
      /** Evaluates `service.decrypt(tampered)` when expect invokes this callback. */ () => service.decrypt(tampered),
    ).toThrow();
  });
  it('rejects malformed encrypted credentials', /** Verifies rejects malformed encrypted credentials. */ () => {
    expect(
      /** Evaluates `service.decrypt('invalid')` when expect invokes this callback. */ () => service.decrypt('invalid'),
    ).toThrow('Invalid encrypted credential.');
  });
});
