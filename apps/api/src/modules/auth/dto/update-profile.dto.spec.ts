import { UpdateProfileDto } from './update-profile.dto.js';

describe('UpdateProfileDto', () => {
  it('accepts nullable personal names and trims every identity field', () => {
    const result = UpdateProfileDto.schema.safeParse({
      firstName: ' Vera ',
      lastName: null,
      username: ' viewer ',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ firstName: 'Vera', lastName: null, username: 'viewer' });
  });

  it('requires both personal-name keys and a non-empty trimmed username', () => {
    const result = UpdateProfileDto.schema.safeParse({ username: '   ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map(({ path }) => path[0]).sort()).toEqual(['firstName', 'lastName', 'username']);
  });

  it('rejects unknown request keys instead of accepting writable role changes', () => {
    const result = UpdateProfileDto.schema.safeParse({
      firstName: null,
      lastName: null,
      role: 'SYSTEM_ADMIN',
      username: 'viewer',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([expect.objectContaining({ code: 'unrecognized_keys', keys: ['role'] })]);
  });
});
