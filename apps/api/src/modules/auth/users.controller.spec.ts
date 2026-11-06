import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UsersController } from './users.controller.js';

const admin = {
  user: { authProvider: 'LOCAL' as const, id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN' as const },
};

describe('administrative local accounts', /** Covers credential and identity boundaries. */ () => {
  const prisma = { user: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() } };
  const controller = new UsersController(prisma as never, {} as never, {} as never);
  beforeEach(/** Resets independent fixtures. */ () => jest.resetAllMocks());

  it('persists profile names and returns no credential material', /** Creates an explicit local identity. */ async () => {
    const data = {
      id: 'target',
      authProvider: 'LOCAL',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      role: 'VIEWER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.user.create.mockResolvedValue({ ...data, passwordHash: 'private' });
    const result = await controller.create(admin, {
      username: 'ada',
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: 'initial-password',
      role: 'VIEWER',
    });
    expect(result).not.toHaveProperty('passwordHash');
    const saved = prisma.user.create.mock.calls[0][0].data;
    expect(saved).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', authProvider: 'LOCAL' });
    expect(await bcrypt.compare('initial-password', saved.passwordHash)).toBe(true);
  });

  it('maps concurrent duplicate names to a conflict', /** Keeps database uniqueness authoritative. */ async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      controller.create(admin, { username: 'duplicate', password: 'initial-password', role: 'VIEWER' }),
    ).rejects.toThrow(ConflictException);
  });

  it('resets only local accounts and increments the authentication version atomically', /** Checks credential mutation scope. */ async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    await controller.resetPassword(admin, 'target', { newPassword: 'replacement-password' });
    const mutation = prisma.user.updateMany.mock.calls[0][0];
    expect(mutation.where).toEqual({ id: 'target', authProvider: 'LOCAL' });
    expect(mutation.data.authVersion).toEqual({ increment: 1 });
    expect(await bcrypt.compare('replacement-password', mutation.data.passwordHash)).toBe(true);
  });

  it('rejects OIDC accounts and missing targets', /** Never creates local credentials on external identities. */ async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.findUnique.mockResolvedValue({ id: 'oidc' });
    await expect(controller.resetPassword(admin, 'oidc', { newPassword: 'replacement-password' })).rejects.toThrow(
      ForbiddenException,
    );
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(controller.resetPassword(admin, 'gone', { newPassword: 'replacement-password' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects non-administrators before querying credentials', /** Prevents role escalation through the reset route. */ async () => {
    await expect(
      controller.resetPassword({ user: { ...admin.user, role: 'MANAGER' } }, 'target', {
        newPassword: 'replacement-password',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
