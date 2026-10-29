import { RateLimitError } from 'bullmq';
import {
  MarketplaceApiError,
  MarketplaceRateLimitError,
} from '../marketplace.client';
import {
  MarketplaceOrderDto,
  MarketplaceOrderStatus,
  SyncOrdersJobData,
} from '../marketplace.types';
import { OrderSyncProcessor } from './order-sync.processor';

const order = (n: number): MarketplaceOrderDto => ({
  orderId: `seller-1-${n}`,
  sellerId: 'seller-1',
  asin: 'B0FAKE0001',
  quantity: 1,
  amountCents: 999,
  currency: 'USD',
  status: MarketplaceOrderStatus.SHIPPED,
  purchasedAt: '2026-10-29T10:00:00.000Z',
});

function setup() {
  const client = { getOrdersPage: vi.fn() };
  const cache = { deleteByPrefix: vi.fn().mockResolvedValue(0) };
  const repository = {
    find: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue(undefined),
  };
  const syncQueue = { rateLimit: vi.fn().mockResolvedValue(undefined) };
  const eventsQueue = { addBulk: vi.fn().mockResolvedValue([]) };

  const processor = new OrderSyncProcessor(
    client as any,
    cache as any,
    repository as any,
    syncQueue as any,
    eventsQueue as any,
  );

  const job = {
    id: '1',
    data: { sellerId: 'seller-1' } as SyncOrdersJobData,
    updateData: vi.fn(async (data: SyncOrdersJobData) => {
      job.data = data;
    }),
    updateProgress: vi.fn().mockResolvedValue(undefined),
  };

  return { processor, client, cache, repository, syncQueue, eventsQueue, job };
}

describe('OrderSyncProcessor', () => {
  it('syncs all pages, emits events only for new orders and invalidates the seller cache', async () => {
    const { processor, client, cache, repository, eventsQueue, job } = setup();
    client.getOrdersPage
      .mockResolvedValueOnce({
        items: [order(1), order(2)],
        page: 1,
        totalPages: 2,
        nextPage: 2,
      })
      .mockResolvedValueOnce({
        items: [order(3)],
        page: 2,
        totalPages: 2,
        nextPage: null,
      });
    repository.find.mockResolvedValueOnce([{ id: 'seller-1-1' }]);

    const result = await processor.process(job as any);

    expect(result).toEqual({ sellerId: 'seller-1', fetched: 3, created: 2 });
    expect(eventsQueue.addBulk).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ opts: { jobId: 'order-created-seller-1-2' } }),
    ]);
    expect(repository.upsert).toHaveBeenCalledTimes(2);
    expect(job.updateProgress).toHaveBeenLastCalledWith(100);
    expect(cache.deleteByPrefix).toHaveBeenCalledWith(
      'marketplace:seller:seller-1:',
    );
  });

  it('on 429 rate-limits the queue and resumes from the checkpoint', async () => {
    const { processor, client, cache, syncQueue, job } = setup();
    client.getOrdersPage
      .mockResolvedValueOnce({
        items: [order(1)],
        page: 1,
        totalPages: 2,
        nextPage: 2,
      })
      .mockRejectedValueOnce(new MarketplaceRateLimitError(1000));

    await expect(processor.process(job as any)).rejects.toBeInstanceOf(
      RateLimitError,
    );
    expect(syncQueue.rateLimit).toHaveBeenCalledWith(1000);
    expect(job.data).toEqual({
      sellerId: 'seller-1',
      cursor: 2,
      fetched: 1,
      created: 1,
    });
    expect(cache.deleteByPrefix).not.toHaveBeenCalled();

    client.getOrdersPage.mockResolvedValueOnce({
      items: [order(2)],
      page: 2,
      totalPages: 2,
      nextPage: null,
    });
    const result = await processor.process(job as any);

    expect(client.getOrdersPage).toHaveBeenLastCalledWith('seller-1', 2);
    // Счётчики учитывают и страницы, пройденные до 429
    expect(result).toEqual({ sellerId: 'seller-1', fetched: 2, created: 2 });
    expect(cache.deleteByPrefix).toHaveBeenCalledTimes(1);
  });

  it('rethrows 5xx errors so BullMQ retries the job with backoff', async () => {
    const { processor, client, syncQueue, job } = setup();
    client.getOrdersPage.mockRejectedValueOnce(new MarketplaceApiError(503));

    await expect(processor.process(job as any)).rejects.toBeInstanceOf(
      MarketplaceApiError,
    );
    expect(syncQueue.rateLimit).not.toHaveBeenCalled();
  });
});
