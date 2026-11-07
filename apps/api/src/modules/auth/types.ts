import type { AuthProvider, UserRole } from '../../generated/prisma/client.js';

/** Defines the authenticated user contract shared by its consumers. */ export interface AuthenticatedUser {
  authProvider: AuthProvider;
  avatarSource?: 'LOCAL' | 'OIDC' | null;
  avatarUpdatedAt?: Date | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  role: UserRole;
  username: string;
}

/** Defines the auth result contract shared by its consumers. */ export interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}
