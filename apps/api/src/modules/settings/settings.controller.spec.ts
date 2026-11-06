import { ForbiddenException } from '@nestjs/common';

import { DefaultDateTimeFormat } from '../../generated/prisma/client.js';
import { SettingsController } from './settings.controller.js';
import type { SettingsService } from './settings.service.js';

describe('SettingsController', /** Groups scenarios for SettingsController. */ () => {
  const persisted = {
    dateTimeFormat: DefaultDateTimeFormat.ISO,
    issueRetentionDays: 30,
    pullRequestRetentionDays: 60,
    workflowRunRetentionDays: 180,
  };
  const settings = {
    get: jest.fn().mockResolvedValue(persisted),
    update: jest.fn().mockResolvedValue(persisted),
  };
  const controller = new SettingsController(settings as unknown as SettingsService);

  beforeEach(/** Prepares shared test state for beforeEach. */ () => jest.clearAllMocks());

  it('returns settings to an authenticated client', /** Verifies returns settings to an authenticated client. */ async () => {
    await expect(controller.get()).resolves.toBe(persisted);
    expect(settings.get).toHaveBeenCalledTimes(1);
  });

  it('updates settings for a system administrator', /** Verifies updates settings for a system administrator. */ async () => {
    await expect(
      controller.update(
        { user: { authProvider: 'LOCAL' as const, id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' } },
        persisted,
      ),
    ).resolves.toBe(persisted);
    expect(settings.update).toHaveBeenCalledWith(persisted);
  });

  it('rejects updates from non-administrators', /** Verifies rejects updates from non-administrators. */ () => {
    expect(
      /** Evaluates `controller.update( { user: { authProvider: 'LOCAL' as const, id: 'viewer', role: 'VIEWER', username: 'viewer' } }, persisted, )` when expect invokes this callback. */ () =>
        controller.update(
          { user: { authProvider: 'LOCAL' as const, id: 'viewer', role: 'VIEWER', username: 'viewer' } },
          persisted,
        ),
    ).toThrow(ForbiddenException);
    expect(settings.update).not.toHaveBeenCalled();
  });
});
