import { NotificationDeliveryDto, type DeliveryHistoryModel } from './notification-delivery.dto.js';

describe('delivery requester identity', /** Verifies explicit safe projection of related User identities. */ () => {
  it('maps names and excludes unselected private fields', /** Proves DTO mapping retains safe names without serializing raw User records. */ () => {
    const model = {
      id: 'delivery',
      kind: 'TEST',
      eventType: null,
      notificationChannelId: 'channel',
      notificationChannel: { id: 'channel', name: 'Synthetic', type: 'GOTIFY' },
      requestedBy: { id: 'viewer', username: 'viewer', firstName: 'Vera', lastName: null, passwordHash: 'secret' },
      status: 'PENDING',
      finalError: null,
      nextAttemptAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
    } as unknown as DeliveryHistoryModel;
    const response = NotificationDeliveryDto.fromModel(model);
    expect(response.requestedBy).toEqual({ id: 'viewer', username: 'viewer', firstName: 'Vera', lastName: null });
    expect(response.requestedByUsername).toBe('viewer');
    expect(JSON.stringify(response)).not.toContain('secret');
    expect(NotificationDeliveryDto.fromModel({ ...model, requestedBy: null }).requestedBy).toBeNull();
  });
});
