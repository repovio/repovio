import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateOrganizationWebhook, OrganizationWebhook as OrganizationWebhookDto } from '@repovio/schemas';

import { ENV } from '../../config/env.js';
import type { OrganizationWebhook, ProviderType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import type { AuthenticatedUser } from '../auth/types.js';

/** Manages local, administrator-owned organization webhook configuration without provider writes. */
@Injectable()
export class OrganizationWebhooksService {
  /**
   * Initialize configuration storage and encryption.
   * @param prisma - Local configuration database.
   * @param encryption - Authenticated encryption for write-only signing secrets.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  /**
   * List safe configurations belonging to one connection.
   * @param user - Administrator requesting configuration metadata.
   * @param providerAccountId - Local connection identifier.
   * @returns Safe configurations, ordered by namespace.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - The connection does not exist.
   */
  async list(user: AuthenticatedUser, providerAccountId: string): Promise<OrganizationWebhookDto[]> {
    const account = await this.requireAccount(user, providerAccountId);
    const hooks = await this.prisma.organizationWebhook.findMany({
      where: { providerAccountId },
      orderBy: { scope: 'asc' },
      include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } } },
    });
    return hooks.map(
      /** Exclude encrypted credentials from every response. */ (hook) =>
        this.toDto(hook, account.providerType, hook.deliveries[0]?.createdAt ?? null),
    );
  }

  /**
   * Create a local configuration for an immutable normalized scope.
   * @param user - Administrator configuring the hook manually at the provider.
   * @param providerAccountId - Connection owning the namespace.
   * @param input - Namespace and write-only signing secret.
   * @returns Safe configuration and its public callback URL.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - The connection does not exist.
   * @throws BadRequestException - Only GitLab accepts nested namespace paths.
   * @throws ConflictException - This connection already has a hook for the scope.
   */
  async create(
    user: AuthenticatedUser,
    providerAccountId: string,
    input: CreateOrganizationWebhook,
  ): Promise<OrganizationWebhookDto> {
    const account = await this.requireAccount(user, providerAccountId);
    const scope = input.scope.toLocaleLowerCase('en-US');
    if (account.providerType !== 'GITLAB' && scope.includes('/'))
      throw new BadRequestException('Only GitLab groups support nested namespace paths.');
    try {
      const hook = await this.prisma.organizationWebhook.create({
        data: { providerAccountId, scope, encryptedWebhookSecret: this.encryption.encrypt(input.webhookSecret) },
      });
      return this.toDto(hook, account.providerType, null);
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
        throw new ConflictException('An organization webhook already exists for this namespace.');
      throw error;
    }
  }

  /**
   * Rotate only the secret of a configuration owned by this connection.
   * @param user - Administrator supplying a replacement secret.
   * @param providerAccountId - Connection boundary checked before mutation.
   * @param webhookId - Configuration to rotate.
   * @param webhookSecret - Replacement plaintext, encrypted before persistence.
   * @returns Safe refreshed configuration.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - The connection or scoped configuration does not exist.
   */
  async rotate(
    user: AuthenticatedUser,
    providerAccountId: string,
    webhookId: string,
    webhookSecret: string,
  ): Promise<OrganizationWebhookDto> {
    await this.requireAccount(user, providerAccountId);
    const result = await this.prisma.organizationWebhook.updateMany({
      where: { id: webhookId, providerAccountId },
      data: { encryptedWebhookSecret: this.encryption.encrypt(webhookSecret) },
    });
    if (!result.count) throw new NotFoundException('Organization webhook not found.');
    const hook = (await this.list(user, providerAccountId)).find(
      /** Return only the rotated hook. */ (item) => item.id === webhookId,
    );
    if (!hook) throw new NotFoundException('Organization webhook not found.');
    return hook;
  }

  /**
   * Remove local configuration and receipts without contacting the provider.
   * @param user - Administrator removing the hook.
   * @param providerAccountId - Connection boundary checked in the delete query.
   * @param webhookId - Local configuration identifier.
   * @returns Resolves after removal.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - The connection or scoped configuration does not exist.
   */
  async remove(user: AuthenticatedUser, providerAccountId: string, webhookId: string): Promise<void> {
    await this.requireAccount(user, providerAccountId);
    const result = await this.prisma.organizationWebhook.deleteMany({ where: { id: webhookId, providerAccountId } });
    if (!result.count) throw new NotFoundException('Organization webhook not found.');
  }

  /**
   * Authorize before reading any connection metadata.
   * @param user - Caller whose global administrator role is required.
   * @param id - Local connection identifier.
   * @returns Connection identity and provider.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - The connection does not exist.
   */
  private async requireAccount(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ id: string; providerType: ProviderType }> {
    if (user.role !== 'SYSTEM_ADMIN') throw new ForbiddenException('System administrator access is required.');
    const account = await this.prisma.providerAccount.findUnique({
      where: { id },
      select: { id: true, providerType: true },
    });
    if (!account) throw new NotFoundException('Provider account not found.');
    return account;
  }

  /**
   * Explicitly map storage to safe public metadata.
   * @param hook - Stored configuration including its encrypted secret, which is never returned.
   * @param providerType - Provider owning the connection.
   * @param lastDeliveryAt - Latest verified receipt, including ping or ignored events.
   * @returns Public metadata without credentials.
   */
  private toDto(
    hook: OrganizationWebhook,
    providerType: ProviderType,
    lastDeliveryAt: Date | null,
  ): OrganizationWebhookDto {
    return {
      id: hook.id,
      providerAccountId: hook.providerAccountId,
      providerType,
      scope: hook.scope,
      callbackUrl: new URL(`/api/webhooks/organization/${hook.id}`, ENV.PUBLIC_URL).toString(),
      lastDeliveryAt: lastDeliveryAt?.toISOString() ?? null,
    };
  }
}
