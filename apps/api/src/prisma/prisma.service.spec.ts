import { jest } from '@jest/globals';
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockTransaction = jest.fn<(callback: (transaction: { id: string }) => Promise<unknown>) => Promise<unknown>>();
const mockPrismaPg = jest.fn();

jest.unstable_mockModule(new URL('../generated/prisma/client.ts', import.meta.url).pathname, () => ({
  PrismaClient: class {
    $connect = mockConnect;
    $disconnect = mockDisconnect;
    $transaction = mockTransaction;
  },
}));

jest.unstable_mockModule('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(options: unknown) {
      mockPrismaPg(options);
    }
  },
}));

jest.unstable_mockModule(new URL('../config/env.ts', import.meta.url).pathname, () => ({
  ENV: {
    DATABASE_URL: 'postgresql://repovio:repovio@localhost:5432/repovio_test',
  },
}));

const { PrismaService } = await import('./prisma.service.js');

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a PostgreSQL adapter from the configured database URL', () => {
    new PrismaService();

    expect(mockPrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://repovio:repovio@localhost:5432/repovio_test',
    });
  });

  it('connects and disconnects with the Nest lifecycle', async () => {
    const service = new PrismaService();

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('executes a callback through an interactive transaction', async () => {
    const service = new PrismaService();
    const callback = jest.fn<() => Promise<string>>().mockResolvedValue('completed');
    mockTransaction.mockImplementation((transactionCallback) => transactionCallback({ id: 'transaction' }));

    await expect(service.transaction(callback)).resolves.toBe('completed');
    expect(callback).toHaveBeenCalledWith({ id: 'transaction' });
  });
});
