import { resolveAvatarMetadata } from './avatar-metadata.js';

it('selects manual, provider, and initials in that order', /** Preserve manual precedence independently of record timestamps. */ () => {
  const manual = { updatedAt: new Date('2026-01-01') };
  const provider = { updatedAt: new Date('2026-02-01') };
  expect(resolveAvatarMetadata({ avatar: manual, oidcAvatar: provider })).toEqual({
    avatarSource: 'LOCAL',
    avatarUpdatedAt: manual.updatedAt,
  });
  expect(resolveAvatarMetadata({ avatar: null, oidcAvatar: provider })).toEqual({
    avatarSource: 'OIDC',
    avatarUpdatedAt: provider.updatedAt,
  });
  expect(resolveAvatarMetadata({})).toEqual({ avatarSource: null, avatarUpdatedAt: null });
});
