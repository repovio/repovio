import { ForbiddenException } from '@nestjs/common';

import type { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { SecurityAlertsQueryService } from './security-alerts-query.service.js';

describe('SecurityAlertsQueryService', /** Groups scenarios for SecurityAlertsQueryService. */ () => {
  it('rejects viewers before any alert query can run', /** Verifies rejects viewers before any alert query can run. */ async () => {
    const { service } = createService();

    await expect(
      service.getReadAbility({ authProvider: 'LOCAL' as const, id: 'viewer', role: 'VIEWER', username: 'viewer' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('builds manager abilities from manager memberships only', /** Verifies builds manager abilities from manager memberships only. */ async () => {
    const { abilityFactory, prisma, service } = createService();
    prisma.repositoryMembership.findMany.mockResolvedValue([{ repositoryId: 'managed', role: 'MANAGER' }]);
    const ability = { can: jest.fn() };
    abilityFactory.createForUser.mockReturnValue(ability);
    const user = { authProvider: 'LOCAL' as const, id: 'manager', role: 'MANAGER' as const, username: 'manager' };

    await expect(service.getReadAbility(user)).resolves.toBe(ability);
    await expect(service.visibleRepositoryIds(user)).resolves.toEqual(['managed']);
    expect(prisma.repositoryMembership.findMany).toHaveBeenCalledWith({
      select: { repositoryId: true, role: true },
      where: { userId: 'manager' },
    });
  });

  it('leaves system administrators unrestricted', /** Verifies leaves system administrators unrestricted. */ async () => {
    const { abilityFactory, prisma, service } = createService();
    abilityFactory.createForUser.mockReturnValue({});
    const user = { authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN' as const, username: 'admin' };

    await service.getReadAbility(user);
    await expect(service.visibleRepositoryIds(user)).resolves.toBeUndefined();
    expect(prisma.repositoryMembership.findMany).not.toHaveBeenCalled();
  });
});

/** Creates service. */
function createService() {
  const prisma = {
    repositoryGroupGrant: { findMany: jest.fn().mockResolvedValue([]) },
    repositoryMembership: { findMany: jest.fn().mockResolvedValue([]) },
    securityAlert: {},
  };
  const abilityFactory = { createForUser: jest.fn() };
  return {
    abilityFactory,
    prisma,
    service: new SecurityAlertsQueryService(
      prisma as unknown as PrismaService,
      abilityFactory as unknown as CaslAbilityFactory,
    ),
  };
}
