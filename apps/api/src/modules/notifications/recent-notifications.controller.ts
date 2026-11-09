import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { Authenticated } from '../auth/authenticated.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { RecentNotificationsDto } from './dto/recent-notification.dto.js';
import { RecentNotificationsService } from './recent-notifications.service.js';

/** Exposes private history without relaxing administrative delivery access. */
@ApiTags('notifications')
@Authenticated()
@Controller('notifications')
export class RecentNotificationsController {
  /**
   * Initialize the authenticated personal-history endpoint.
   * @param notifications Permission-restricted personal history query.
   */
  constructor(private readonly notifications: RecentNotificationsService) {}

  /**
   * Read the caller's recent deliveries using live recipient and resource restrictions.
   * @param request Request carrying the verified account identity.
   * @returns Five or fewer safe personal delivery summaries.
   */
  @Get('recent')
  @ApiOkResponse({ type: RecentNotificationsDto })
  @ApiUnauthorizedResponse({ description: 'An authenticated session is required.' })
  @ZodSerializerDto(RecentNotificationsDto)
  recent(@Req() request: { user: AuthenticatedUser }): Promise<RecentNotificationsDto> {
    return this.notifications.recent(request.user);
  }
}
