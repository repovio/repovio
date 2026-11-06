import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { GitHubAppService } from '../providers/github/github-app.service.js';
import { providerWebhookSyncScopes } from '../providers/provider-adapter.js';
import { ProviderSyncQueueService } from '../providers/sync-queue.service.js';
import type { WebhookAcceptance, WebhookRequest } from './webhook.service.js';

interface AppEvent {
  action?: string;
  installation?: { id?: number; app_id?: number };
  repository?: { id?: number };
}

/** Verifies central App deliveries and atomically records lifecycle changes and targeted sync jobs. */
@Injectable()
export class GitHubAppWebhookService {
  /**
   * Initialize central webhook verification and queue persistence.
   * @param prisma - Transactional delivery and account storage.
   * @param app - Deployment-owned App configuration.
   * @param encryption - Decrypts only the webhook signing secret.
   * @param queue - Durable repository synchronization queue.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly app: GitHubAppService,
    private readonly encryption: CredentialEncryptionService,
    private readonly queue: ProviderSyncQueueService,
  ) {}

  /**
   * Accept one signed App event, deduplicating lifecycle and repository work in the same transaction.
   * @param request - Raw request bytes and GitHub headers.
   * @returns Delivery acceptance and duplicate status.
   * @throws UnauthorizedException - Signature or required headers are invalid.
   * @throws BadRequestException - The authenticated payload is malformed.
   */
  async receive(request: WebhookRequest): Promise<WebhookAcceptance> {
    const config = await this.app.requireConfiguration();
    const signature = request.headers['x-hub-signature-256'];
    const deliveryId = request.headers['x-github-delivery'];
    const event = request.headers['x-github-event'];
    const expected = `sha256=${createHmac('sha256', this.encryption.decrypt(config.encryptedWebhookSecret)).update(request.payload).digest('hex')}`;
    if (
      typeof signature !== 'string' ||
      !/^sha256=[a-f0-9]{64}$/.test(signature) ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ||
      typeof deliveryId !== 'string' ||
      !deliveryId.length ||
      deliveryId.length > 255 ||
      typeof event !== 'string' ||
      !event.length ||
      event.length > 255
    )
      throw new UnauthorizedException('Webhook signature validation failed.');
    let payload: AppEvent;
    try {
      const value: unknown = JSON.parse(Buffer.from(request.payload).toString('utf8'));
      if (typeof value !== 'object' || !value || Array.isArray(value)) throw new Error('Invalid payload.');
      payload = value as AppEvent;
      if (payload.installation?.id !== undefined && !Number.isSafeInteger(payload.installation.id))
        throw new Error('Invalid installation.');
      if (payload.repository?.id !== undefined && !Number.isSafeInteger(payload.repository.id))
        throw new Error('Invalid repository.');
    } catch {
      throw new BadRequestException('Invalid GitHub App webhook payload.');
    }
    try {
      await this.prisma.transaction(
        /** Atomically records delivery state, updates installation availability, and schedules affected repositories. */ async (
          tx,
        ) => {
          await tx.gitHubAppDelivery.create({ data: { deliveryId } });
          if (
            !payload.installation?.id ||
            (payload.installation.app_id && String(payload.installation.app_id) !== config.appId)
          )
            return;
          const account = await tx.providerAccount.findUnique({
            where: { githubInstallationId: String(payload.installation.id) },
          });
          if (!account || account.authenticationMethod !== 'GITHUB_APP') return;
          if (event === 'installation') {
            const state =
              payload.action === 'deleted'
                ? 'REMOVED'
                : payload.action === 'suspend'
                  ? 'SUSPENDED'
                  : ['created', 'unsuspend', 'new_permissions_accepted'].includes(payload.action ?? '')
                    ? 'ACTIVE'
                    : null;
            if (state) {
              await tx.providerAccount.update({ where: { id: account.id }, data: { githubInstallationState: state } });
              // Invalidate token caches in every API worker on lifecycle changes.
              await tx.gitHubAppConfiguration.updateMany({ where: { id: 'default' }, data: { updatedAt: new Date() } });
            }
            if (state !== 'ACTIVE') return;
          }
          if (!account.enabled || (account.githubInstallationState !== 'ACTIVE' && event !== 'installation')) return;
          if (event === 'installation_repositories')
            await tx.gitHubAppConfiguration.updateMany({ where: { id: 'default' }, data: { updatedAt: new Date() } });
          const lifecycle = event === 'installation' || event === 'installation_repositories';
          const scopes = providerWebhookSyncScopes(event);
          if (!lifecycle && (!payload.repository?.id || !scopes.length)) return;
          const repositories = await tx.repository.findMany({
            where: {
              providerAccountId: account.id,
              enabled: true,
              ...(!lifecycle ? { providerRepositoryId: String(payload.repository!.id) } : {}),
            },
            select: { id: true },
          });
          for (const repository of repositories)
            await this.queue.enqueueWebhookRepository(
              repository.id,
              tx,
              lifecycle ? ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'] : scopes,
            );
        },
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'P2002' &&
        'meta' in error &&
        typeof error.meta === 'object' &&
        error.meta &&
        'modelName' in error.meta &&
        error.meta.modelName === 'GitHubAppDelivery'
      )
        return { accepted: true, duplicate: true };
      throw error;
    }
    return { accepted: true, duplicate: false };
  }
}
