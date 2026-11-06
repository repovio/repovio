import { UserRole } from '../../generated/prisma/client.js';

describe('UserRole', /** Groups scenarios for UserRole. */ () => {
  it('defines the Repovio authorization roles', /** Verifies defines the Repovio authorization roles. */ () => {
    expect(Object.values(UserRole)).toEqual(['SYSTEM_ADMIN', 'VIEWER', 'MANAGER']);
  });
});
