import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { avatarMetadataInclude } from './avatar-metadata.js';
import { AvatarService } from './avatar.service.js';
import { UserDto } from './dto/user.dto.js';
import { JwtStrategy } from './jwt.strategy.js';

/** Exercise avatar provenance against real PostgreSQL relations and public mappings. */
describe('OIDC avatar persistence', /** Keep provider and manual image ownership independent. */ () => {
  const prisma = new PrismaService();
  const avatars = new AvatarService(prisma);
  let userId: string;

  beforeAll(
    /** Connect only to the configured integration-test database. */ async () => {
      await prisma.onModuleInit();
      const user = await prisma.user.create({
        data: {
          username: 'avatar-integration-fixture',
          authProvider: 'OIDC',
          oidcIssuer: 'https://id.example',
          oidcSubject: 'avatar-fixture',
        },
      });
      userId = user.id;
    },
  );
  afterAll(
    /** Delete the synthetic account and close its test connection. */ async () => {
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.onModuleDestroy();
    },
  );

  it('preserves manual priority and restores provider bytes and DTO metadata on removal', /** Verify persisted bytes, identity projection, and removal response together. */ async () => {
    const provider = await sharp({ create: { background: 'red', channels: 3, width: 20, height: 40 } })
      .webp()
      .toBuffer();
    await prisma.oidcUserAvatar.create({ data: { userId, data: new Uint8Array(provider), etag: 'provider' } });
    const custom = await sharp({ create: { background: 'blue', channels: 3, width: 40, height: 20 } })
      .png()
      .toBuffer();
    await avatars.save(userId, { data: custom, mimeType: 'image/png' });
    const identity = await new JwtStrategy(prisma).validate({ sub: userId });
    expect(identity.avatarSource).toBe('LOCAL');
    expect((await avatars.get(userId)).etag).not.toBe('provider');
    const controller = new AuthController({} as never, avatars);
    const removed = await controller.deleteAvatar({ user: identity });
    expect(removed.avatarSource).toBe('OIDC');
    expect((await avatars.get(userId)).data).toEqual(new Uint8Array(provider));
    const model = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: avatarMetadataInclude });
    expect(UserDto.fromModel(model)).toMatchObject({
      avatarSource: 'OIDC',
      avatarUpdatedAt: model.oidcAvatar!.updatedAt.toISOString(),
    });
    expect((await new JwtStrategy(prisma).validate({ sub: userId })).avatarSource).toBe('OIDC');
    await avatars.synchronizeOidc(userId, undefined);
    expect((await avatars.metadata(userId)).avatarSource).toBeNull();
    await expect(avatars.get(userId)).rejects.toMatchObject({ status: 404 });
  });
});
