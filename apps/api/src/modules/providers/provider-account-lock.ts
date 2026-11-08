import { BadGatewayException, HttpException, NotFoundException } from '@nestjs/common';

import type { Prisma, ProviderAccount } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { ProviderRequestError } from './provider-request.error.js';

/**
 * Serialize credential and account mutations across API processes using the account's database row.
 * @param prisma - Database client owning the interactive transaction.
 * @param id - Provider Account identifier; never used in interpolated SQL.
 * @param work - Work performed after locking and rereading the current account.
 * @returns The callback result after the transaction commits.
 * @throws BadGatewayException - Persistence or stored-credential failures are sanitized without retaining write arguments.
 * @throws NotFoundException - The account was deleted before acquiring the lock.
 * @typeParam T - Callback result preserved across the transaction.
 */
export async function withProviderAccountLock<T>(
  prisma: PrismaService,
  id: string,
  work: (transaction: Prisma.TransactionClient, account: ProviderAccount) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(
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
  } catch (error) {
    if (error instanceof HttpException || error instanceof ProviderRequestError) throw error;
    // Prisma invocation errors can include encrypted write arguments; never attach their cause.
    throw new BadGatewayException('Provider account persistence failed. Retry or reauthorize the connection.');
  }
}
