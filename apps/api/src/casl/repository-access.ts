import type { PrismaService } from '../prisma/prisma.service.js';
import type { RepositoryAccess } from './types.js';

/**
 * Resolve current direct and group grants without caching permissions in tokens.
 * @param prisma - Database client used to read persisted grants.
 * @param userId - Local account receiving direct or inherited access.
 * @param managersOnly - Restrict the result to effective manager grants.
 * @returns One strongest grant per repository, reflecting membership revocation on each request.
 */
export async function resolveRepositoryAccess(
  prisma: PrismaService,
  userId: string,
  managersOnly = false,
): Promise<RepositoryAccess[]> {
  const [direct, inherited] = await Promise.all([
    prisma.repositoryMembership.findMany({ where: { userId }, select: { repositoryId: true, role: true } }),
    prisma.repositoryGroupGrant.findMany({
      where: { group: { members: { some: { userId } } } },
      select: { repositoryId: true, role: true },
    }),
  ]);
  const grants = new Map<string, RepositoryAccess>();
  for (const grant of [...direct, ...inherited]) {
    if (!grants.has(grant.repositoryId) || grant.role === 'MANAGER') grants.set(grant.repositoryId, grant);
  }
  return [...grants.values()].filter(
    /** Limits security-sensitive reads to managed repositories. */ (grant) =>
      !managersOnly || grant.role === 'MANAGER',
  );
}
