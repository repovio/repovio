import { CaslAction } from './casl-action.js';
import { CaslSubject } from './casl-subject.js';

describe('CASL authorization contract', () => {
  it('contains every planned protected Repovio resource', () => {
    expect(Object.values(CaslSubject)).toEqual([
      'all',
      'User',
      'ProviderAccount',
      'Repository',
      'WorkflowRun',
      'Issue',
      'PullRequest',
      'SecurityAlert',
      'NotificationChannel',
      'NotificationDelivery',
      'Settings',
    ]);
    expect(CaslAction.Manage).toBe('manage');
  });
});
