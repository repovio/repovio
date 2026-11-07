/** Timestamp-only relations needed to choose a user's displayed avatar. */
export interface AvatarRelations {
  avatar?: { updatedAt: Date } | null;
  oidcAvatar?: { updatedAt: Date } | null;
}

/** Relation selection shared by identity and resource queries; never selects image bytes. */
export const avatarMetadataInclude = {
  avatar: { select: { updatedAt: true } },
  oidcAvatar: { select: { updatedAt: true } },
} as const;

/**
 * Prefer a manual avatar over the identity provider's separately stored fallback.
 * @param user - Loaded timestamp-only avatar relations.
 * @returns The source and revision of the displayed image, or nulls for initials.
 */
export function resolveAvatarMetadata(user: AvatarRelations): {
  avatarSource: 'LOCAL' | 'OIDC' | null;
  avatarUpdatedAt: Date | null;
} {
  if (user.avatar) return { avatarSource: 'LOCAL', avatarUpdatedAt: user.avatar.updatedAt };
  if (user.oidcAvatar) return { avatarSource: 'OIDC', avatarUpdatedAt: user.oidcAvatar.updatedAt };
  return { avatarSource: null, avatarUpdatedAt: null };
}
