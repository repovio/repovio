import { BadRequestException } from '@nestjs/common';

import { NotificationChannelType } from '../../generated/prisma/client.js';
import { NotificationChannelUrlService } from './notification-channel-url.service.js';

describe('NotificationChannelUrlService', /** Groups scenarios for NotificationChannelUrlService. */ () => {
  const service = new NotificationChannelUrlService();

  it('builds a secure Gotify URL from structured fields', /** Verifies builds a secure Gotify URL from structured fields. */ () => {
    expect(
      service.prepare(NotificationChannelType.GOTIFY, {
        priority: 'high',
        serverUrl: 'https://gotify.example.com/alerts',
        token: 'application-token',
      }),
    ).toEqual({ scheme: 'gotifys', value: 'gotifys://gotify.example.com/alerts/application-token?priority=high' });
  });

  it('builds an SMTP URL without logging or returning separate credentials', /** Verifies builds an SMTP URL without logging or returning separate credentials. */ () => {
    const prepared = service.prepare(NotificationChannelType.EMAIL, {
      from: 'repovio@example.com',
      password: 'secret',
      port: 587,
      recipients: ['on-call@example.com'],
      security: 'STARTTLS',
      smtpHost: 'smtp.example.com',
      username: 'repovio',
    });

    expect(prepared?.scheme).toBe('mailtos');
    expect(prepared?.value).toContain('smtp=smtp.example.com');
    expect(prepared?.value).toContain('to=on-call%40example.com');
  });

  it('rejects local file destinations', /** Verifies rejects local file destinations. */ () => {
    expect(
      /** Evaluates `service.prepare(NotificationChannelType.CUSTOM_APPRISE, { url: 'file:///tmp/secret' })` when expect invokes this callback. */ () =>
        service.prepare(NotificationChannelType.CUSTOM_APPRISE, { url: 'file:///tmp/secret' }),
    ).toThrow(BadRequestException);
  });

  it('rejects malformed email domains without ambiguous matching', /** Verifies rejects malformed email domains without ambiguous matching. */ () => {
    expect(
      /** Attempts channel preparation so the assertion can verify malformed-domain rejection. */ () =>
        service.prepare(NotificationChannelType.EMAIL, {
          from: `sender@${'domain.'.repeat(10_000)}`,
          recipients: ['on-call@example.com'],
          security: 'STARTTLS',
          smtpHost: 'smtp.example.com',
        }),
    ).toThrow(BadRequestException);
  });
});
