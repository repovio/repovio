import { Prisma, RepositoryRole } from '../../generated/prisma/client.js';

describe('Repository membership model', /** Groups scenarios for Repository membership model. */ () => {
  it('provides viewer and manager roles for repository-level access', /** Verifies provides viewer and manager roles for repository-level access. */ () => {
    expect(Object.values(RepositoryRole)).toEqual(['VIEWER', 'MANAGER']);
  });

  it('exposes the repository membership model to Prisma consumers', /** Verifies exposes the repository membership model to Prisma consumers. */ () => {
    expect(Prisma.ModelName.RepositoryMembership).toBe('RepositoryMembership');
  });
});
