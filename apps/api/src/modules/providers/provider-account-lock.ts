import { NotFoundException } from '@nestjs/common';

import type { Prisma, ProviderAccount } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Serialize credential and account mutations across API processes using the account's database row.
 * @param prisma - Database client owning the interactive transaction.
 * @param id - Provider Account identifier; never used in interpolated SQL.
 * @param work - Work performed after locking and rereading the current account.
 * @returns The callback result after the transaction commits.
 * @throws NotFoundException - The account was deleted before acquiring the lock.
 * @typeParam T - Callback result preserved across the transaction.
 */
export async function withProviderAccountLock<T>(
  prisma: PrismaService,
  id: string,
  work: (transaction: Prisma.TransactionClient, account: ProviderAccount) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    /** Lock before rereading so waiting callers see the last committed credential generation. */ async (
      transaction,
    ) => {
      await transaction.$queryRaw`SELECT "id" FROM "provider_accounts" WHERE "id" = ${id}::uuid FOR UPDATE`;
      const account = await transaction.providerAccount.findUnique({ where: { id } });
      if (!account) throw new NotFoundException('Provider account not found.');
      return work(transaction, account);
    },
    { timeout: 20_000, maxWait: 20_000 },
  );
}
