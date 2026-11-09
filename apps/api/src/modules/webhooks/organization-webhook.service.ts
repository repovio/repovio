import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { matchesOrganizationScope } from '../organization-webhooks/organization-webhook-scope.js';
import type { VerifiedWebhook } from '../providers/provider-adapter.js';
import { ProviderAdapterRegistry } from '../providers/provider-adapter.registry.js';
import { ProviderSyncQueueService } from '../providers/sync-queue.service.js';
import { WebhookService, type WebhookAcceptance, type WebhookRequest } from './webhook.service.js';

/** Accepts signed organization events and atomically schedules only already tracked repositories. */
@Injectable()
export class OrganizationWebhookService {
  /**
   * Initialize organization webhook verification and durable processing.
   * @param prisma - Transactional receipt and repository storage.
   * @param encryption - Decrypts signing secrets only for verification.
   * @param adapters - Existing provider-specific verification implementations.
   * @param queue - Durable read-only repository synchronization queue.
   * @param repositoryWebhooks - Shared delivery-header interpretation.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
    private readonly adapters: ProviderAdapterRegistry,
    private readonly queue: ProviderSyncQueueService,
    private readonly repositoryWebhooks: WebhookService,
  ) {}

  /**
   * Verify before resolving payload repositories and commit receipts with queue work.
   * @param webhookId - Local configuration defining both provider and connection.
   * @param request - Unmodified raw payload and provider delivery headers.
   * @returns Durable acceptance, including duplicate status.
   * @throws UnauthorizedException - Configuration, signature, or delivery identifier is invalid.
   * @throws BadRequestException - The authenticated payload is malformed.
   * @throws Error - Storage, decryption, adapter lookup, or queue persistence fails.
   */
  async receive(webhookId: string, request: WebhookRequest): Promise<WebhookAcceptance> {
    const hook = await this.prisma.organizationWebhook.findUnique({
      where: { id: webhookId },
      include: { providerAccount: { select: { enabled: true, providerType: true } } },
    });
    if (!hook || !hook.providerAccount.enabled) throw new UnauthorizedException('Webhook signature validation failed.');
    const providerType = hook.providerAccount.providerType;
    let verified: VerifiedWebhook | null;
    try {
      verified = await this.adapters.get(providerType).verifyWebhook({
        ...request,
        signingSecret: this.encryption.decrypt(hook.encryptedWebhookSecret),
      });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof TypeError)
        throw new BadRequestException('Invalid organization webhook payload.');
      if (error instanceof RangeError) throw new UnauthorizedException('Webhook signature validation failed.');
      throw error;
    }
    const deliveryId = this.repositoryWebhooks.getDeliveryId(providerType, request.headers);
    if (!verified || !deliveryId || deliveryId.length > 255 || !verified.event || verified.event.length > 255)
      throw new UnauthorizedException('Webhook signature validation failed.');
    const value: unknown = JSON.parse(Buffer.from(request.payload).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new BadRequestException('Invalid organization webhook payload.');

    const duplicate = await this.prisma.transaction(
      /** Receipt uniqueness and repository uniqueness serialize concurrent deliveries without aborting the transaction. */ async (
        tx,
      ) => {
        const receipt = await tx.organizationWebhookDelivery.createMany({
          data: { organizationWebhookId: webhookId, deliveryId },
          skipDuplicates: true,
        });
        if (!receipt.count) return true;
        if (!verified.providerRepositoryId || verified.event.toLocaleLowerCase('en-US') === 'ping') return false;
        const repository = await tx.repository.findFirst({
          where: {
            providerAccountId: hook.providerAccountId,
            providerRepositoryId: verified.providerRepositoryId,
            enabled: true,
            providerAccount: { enabled: true },
          },
          select: { id: true, owner: true },
        });
        if (!repository || !matchesOrganizationScope(providerType, hook.scope, repository.owner)) return false;
        const delivery = await tx.webhookDelivery.createMany({
          data: { repositoryId: repository.id, deliveryId, event: verified.event },
          skipDuplicates: true,
        });
        if (!delivery.count) return true;
        await this.queue.enqueueWebhookRepository(repository.id, tx, verified.syncScopes);
        return false;
      },
    );
    return { accepted: true, duplicate };
  }
}
