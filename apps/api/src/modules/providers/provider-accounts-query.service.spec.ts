import { ForbiddenException } from '@nestjs/common';

import { ProviderAccountsQueryService } from './provider-accounts-query.service.js';

describe('ProviderAccountsQueryService', /** Groups scenarios for ProviderAccountsQueryService. */ () => {
  const ability = {};
  const abilityFactory = {
    createForUser: jest.fn(/** Provides isolated createForUser behavior for this test fixture. */ () => ability),
  };
  const prisma = { providerAccount: {} };
  const service = new ProviderAccountsQueryService(prisma as never, abilityFactory as never);

  beforeEach(/** Prepares shared test state for beforeEach. */ () => jest.clearAllMocks());

  it('gives system administrators an unrestricted provider-account ability', /** Verifies gives system administrators an unrestricted provider-account ability. */ () => {
    expect(
      service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' }),
    ).toBe(ability);
    expect(abilityFactory.createForUser).toHaveBeenCalledWith(
      { authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' },
      [],
    );
  });

  it('rejects non-administrators before building a provider-account query', /** Verifies rejects non-administrators before building a provider-account query. */ () => {
    expect(
      /** Evaluates `service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'viewer', role: 'VIEWER', username: 'viewer' })` when expect invokes this callback. */ () =>
        service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'viewer', role: 'VIEWER', username: 'viewer' }),
    ).toThrow(ForbiddenException);
    expect(abilityFactory.createForUser).not.toHaveBeenCalled();
  });

  it('uses a stable display-name order when the table has no selected sort', /** Verifies uses a stable display-name order when the table has no selected sort. */ () => {
    expect(service.toQueryOptions({ page: 1, perPage: 10 })).toMatchObject({
      orderBy: [{ displayName: 'asc' }, { id: 'asc' }],
      page: 1,
      perPage: 10,
    });
  });

  it('searches provider identity fields while preserving caller filters', /** Verifies searches provider identity fields while preserving caller filters. */ () => {
    expect(service.toQueryOptions({ page: 1, perPage: 10, search: 'github', where: { enabled: true } })).toMatchObject({
      where: {
        AND: [
          { enabled: true },
          {
            OR: [
              { displayName: { contains: 'github', mode: 'insensitive' } },
              { baseUrl: { contains: 'github', mode: 'insensitive' } },
            ],
          },
        ],
      },
    });
  });
});
