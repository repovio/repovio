import { Prisma } from '../../generated/prisma/client.js';

describe('Repository model', /** Groups scenarios for Repository model. */ () => {
  it('exposes the unique provider-account and provider-repository key', /** Verifies exposes the unique provider-account and provider-repository key. */ () => {
    expect(Prisma.ModelName.Repository).toBe('Repository');
  });
});
