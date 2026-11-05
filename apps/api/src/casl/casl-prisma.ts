/**
 * Prisma 7-compatible CASL exports bound to Repovio's generated client setup.
 *
 * Keep these imports behind one module because Prisma 7 generates the client to
 * `src/generated/prisma` instead of the legacy `@prisma/client` location.
 */
import type { Model, PrismaQueryOf } from '@casl/prisma/runtime';

import type { Prisma } from '../generated/prisma/client.js';

export { accessibleBy, createPrismaAbility } from '@casl/prisma/runtime';

/** Prisma where-input factory for Repovio's generated Prisma 7 client. */
export type RepovioPrismaQuery = PrismaQueryOf<Prisma.TypeMap, Model<Record<string, never>, string>>;
