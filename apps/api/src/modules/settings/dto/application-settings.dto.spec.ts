import { DefaultDateTimeFormat } from '../../../generated/prisma/client.js';
import { UpdateApplicationSettingsDto } from './application-settings.dto.js';

describe('UpdateApplicationSettingsDto', /** Groups scenarios for UpdateApplicationSettingsDto. */ () => {
  it('accepts a supported date format and bounded whole-day retention', /** Verifies accepts a supported date format and bounded whole-day retention. */ () => {
    const input = {
      dateTimeFormat: DefaultDateTimeFormat.ISO,
      issueRetentionDays: 3650,
      pullRequestRetentionDays: 1,
      workflowRunRetentionDays: 3650,
    };

    const result = UpdateApplicationSettingsDto.schema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  it('rejects unsupported formats and invalid retention periods', /** Verifies rejects unsupported formats and invalid retention periods. */ () => {
    const result = UpdateApplicationSettingsDto.schema.safeParse({
      dateTimeFormat: 'CUSTOM',
      issueRetentionDays: 0,
      pullRequestRetentionDays: 3651,
      workflowRunRetentionDays: 0.5,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map(/** Projects each entry using `path[0]`. */ ({ path }) => path[0])).toEqual([
      'dateTimeFormat',
      'issueRetentionDays',
      'pullRequestRetentionDays',
      'workflowRunRetentionDays',
    ]);
  });

  it('rejects unknown settings keys', /** Verifies rejects unknown settings keys. */ () => {
    const result = UpdateApplicationSettingsDto.schema.safeParse({
      dateTimeFormat: DefaultDateTimeFormat.ISO,
      issueRetentionDays: 30,
      pullRequestRetentionDays: 30,
      schedulerEnabled: false,
      workflowRunRetentionDays: 30,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ code: 'unrecognized_keys', keys: ['schedulerEnabled'] }),
    ]);
  });
});
