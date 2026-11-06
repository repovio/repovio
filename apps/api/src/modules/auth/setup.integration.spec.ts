import { ConflictException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import { AuthService } from './auth.service.js';

describe('first-run setup integration', /** Groups scenarios for first-run setup integration. */ () => {
  const prisma = new PrismaService();
  const database = new TestDatabaseService(prisma);
  const jwt = { signAsync: jest.fn().mockResolvedValue('jwt'), verifyAsync: jest.fn() };
  const auth = new AuthService(prisma, jwt as never);

  beforeAll(/** Prepares shared test state for beforeAll. */ async () => prisma.onModuleInit());
  beforeEach(/** Prepares shared test state for beforeEach. */ async () => database.cleanup());
  afterAll(/** Restores shared test state for afterAll. */ async () => prisma.onModuleDestroy());

  it('allows exactly one of two concurrent setup requests to create an administrator', /** Verifies allows exactly one of two concurrent setup requests to create an administrator. */ async () => {
    const results = await Promise.allSettled([
      auth.setup({ password: 'first-password', username: 'first-admin' }),
      auth.setup({ password: 'second-password', username: 'second-admin' }),
    ]);

    expect(
      results.filter(/** Keeps entries matching `status === 'fulfilled'`. */ ({ status }) => status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.find(
      /** Finds the first entry matching `status === 'rejected'`. */ ({ status }) => status === 'rejected',
    );
    expect(rejected).toMatchObject({ reason: expect.any(ConflictException), status: 'rejected' });
    await expect(prisma.user.count()).resolves.toBe(1);
  });
});
