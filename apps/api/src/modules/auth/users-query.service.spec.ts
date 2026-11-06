import { ForbiddenException } from '@nestjs/common';

import { UsersQueryService } from './users-query.service.js';

describe('UsersQueryService', /** Groups scenarios for UsersQueryService. */ () => {
  const ability = {};
  const abilityFactory = {
    createForUser: jest.fn(/** Provides isolated createForUser behavior for this test fixture. */ () => ability),
  };
  const prisma = { user: {} };
  const service = new UsersQueryService(prisma as never, abilityFactory as never);

  beforeEach(/** Prepares shared test state for beforeEach. */ () => jest.clearAllMocks());

  it('gives system administrators an unrestricted user ability', /** Verifies gives system administrators an unrestricted user ability. */ () => {
    expect(
      service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' }),
    ).toBe(ability);
    expect(abilityFactory.createForUser).toHaveBeenCalledWith(
      { authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' },
      [],
    );
  });

  it('rejects non-administrators before building a user query', /** Verifies rejects non-administrators before building a user query. */ () => {
    expect(
      /** Evaluates `service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'manager', role: 'MANAGER', username: 'manager' })` when expect invokes this callback. */ () =>
        service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'manager', role: 'MANAGER', username: 'manager' }),
    ).toThrow(ForbiddenException);
  });

  it('uses a stable username order when the table has no selected sort', /** Verifies uses a stable username order when the table has no selected sort. */ () => {
    expect(service.toQueryOptions({ page: 1, perPage: 10 })).toMatchObject({
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
      page: 1,
      perPage: 10,
    });
  });
});
