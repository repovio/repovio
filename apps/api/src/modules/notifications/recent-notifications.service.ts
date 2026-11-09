import { accessibleBy } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { ApiRecentNotificationsSchema, type RecentNotifications } from '@repovio/schemas';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { CaslAction } from '../../casl/casl-action.js';
import { CaslSubject } from '../../casl/casl-subject.js';
import { resolveRepositoryAccess } from '../../casl/repository-access.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';

/** Queries only attributed personal deliveries under current resource permissions. */
@Injectable()
export class RecentNotificationsService {
  /**
   * Create the personal-history projection without granting administrative history access.
   * @param prisma Database holding delivery attribution and live access grants.
   * @param abilityFactory Existing application authorization policy.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  /**
   * Return the latest five distinct deliveries addressed to this user and still visible to them.
   * @param user Authenticated recipient; identity is never accepted from request parameters.
   * @returns Safe bounded personal history, ordered by logical creation time.
   */
  async recent(user: AuthenticatedUser): Promise<RecentNotifications> {
    const grants = await resolveRepositoryAccess(this.prisma, user.id);
    const ability = this.abilityFactory.createForUser(user, grants);
    const repositories = accessibleBy(ability, CaslAction.Read).ofType(
      CaslSubject.Repository as never,
    ) as Prisma.RepositoryWhereInput;
    const securityAlerts = ability.can(CaslAction.Read, CaslSubject.SecurityAlert)
      ? (accessibleBy(ability, CaslAction.Read).ofType(
          CaslSubject.SecurityAlert as never,
        ) as Prisma.SecurityAlertWhereInput)
      : { id: { in: [] } };
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        AND: [
          { attempts: { some: { recipientUserId: user.id } } },
          { notificationChannel: { type: 'BROWSER_PUSH' } },
          { OR: [{ kind: 'TEST', repositoryId: null }, { repository: { is: repositories } }] },
          { OR: [{ securityAlertId: null }, { securityAlert: { is: securityAlerts } }] },
        ],
      },
      take: 5,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        kind: true,
        eventType: true,
        nextAttemptAt: true,
        attempts: { where: { recipientUserId: user.id }, select: { deliveredAt: true } },
        repository: { select: { id: true, owner: true, name: true } },
        workflowRun: { select: { workflowName: true, url: true } },
        issue: { select: { number: true, title: true, url: true } },
        pullRequest: { select: { number: true, title: true, url: true } },
        securityAlert: { select: { title: true, providerUrl: true } },
      },
    });
    return ApiRecentNotificationsSchema.parse({
      items: deliveries.map(
        /** Project only the current user's attempts and authorized source metadata. */ (delivery) => ({
          id: delivery.id,
          createdAt: delivery.createdAt.toISOString(),
          kind: delivery.kind,
          eventType: delivery.eventType,
          repository: delivery.repository,
          subjectTitle:
            delivery.workflowRun?.workflowName ??
            delivery.issue?.title ??
            delivery.pullRequest?.title ??
            delivery.securityAlert?.title ??
            'Repovio test notification',
          subjectUrl: safeSubjectUrl(
            delivery.workflowRun?.url ??
              delivery.issue?.url ??
              delivery.pullRequest?.url ??
              delivery.securityAlert?.providerUrl ??
              null,
          ),
          status: delivery.attempts.some(
            /** A personal device was accepted by the push service. */ (attempt) => Boolean(attempt.deliveredAt),
          )
            ? 'DELIVERED'
            : delivery.nextAttemptAt
              ? 'PENDING'
              : 'FAILED',
        }),
      ),
    });
  }
}

/**
 * Keep unsafe schemes and credential-bearing destinations out of browser links.
 * @param value Provider subject destination, or null for a test delivery.
 * @returns An HTTP(S) link without embedded credentials, or null.
 */
function safeSubjectUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
