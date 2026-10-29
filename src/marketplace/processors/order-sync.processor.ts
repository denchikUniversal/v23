import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue, Worker } from 'bullmq';
import { In, Repository } from 'typeorm';
import { RedisCacheService } from '../../redis/redis-cache.service';
import { MarketplaceOrderEntity } from '../entities/marketplace-order.entity';
import {
  MarketplaceClient,
  MarketplaceRateLimitError,
} from '../marketplace.client';
import {
  cacheKeys,
  MARKETPLACE_SYNC_QUEUE,
  ORDER_CREATED_JOB,
  ORDER_EVENTS_QUEUE,
} from '../marketplace.constants';
import {
  MarketplaceOrderDto,
  MarketplaceOrdersPage,
  OrderCreatedJobData,
  SyncOrdersJobData,
  SyncOrdersJobResult,
} from '../marketplace.types';

@Processor(MARKETPLACE_SYNC_QUEUE, {
  concurrency: 2,
  // Не больше 5 запусков синка в секунду на все воркеры: счётчик лимита хранится в Redis
  limiter: { max: 5, duration: 1000 },
})
export class OrderSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderSyncProcessor.name);

  constructor(
    private readonly marketplaceClient: MarketplaceClient,
    private readonly cacheService: RedisCacheService,
    @InjectRepository(MarketplaceOrderEntity)
    private readonly orderRepository: Repository<MarketplaceOrderEntity>,
    @InjectQueue(MARKETPLACE_SYNC_QUEUE)
    private readonly syncQueue: Queue<SyncOrdersJobData>,
    @InjectQueue(ORDER_EVENTS_QUEUE)
    private readonly orderEventsQueue: Queue<OrderCreatedJobData>,
  ) {
    super();
  }

  async process(
    job: Job<SyncOrdersJobData, SyncOrdersJobResult>,
  ): Promise<SyncOrdersJobResult> {
    const { sellerId } = job.data;
    let page: number | null = job.data.cursor ?? 1;
    let fetched = job.data.fetched ?? 0;
    let created = job.data.created ?? 0;

    while (page) {
      let result: MarketplaceOrdersPage;

      try {
        result = await this.marketplaceClient.getOrdersPage(sellerId, page);
      } catch (error) {
        if (error instanceof MarketplaceRateLimitError) {
          // 429: ставим очередь на паузу на Retry-After и возвращаем задачу в waiting.
          // Попытка не тратится, продолжим с сохранённой страницы
          this.logger.warn(
            `429 for ${sellerId} on page ${page}, pausing queue for ${error.retryAfterMs} ms`,
          );
          await this.syncQueue.rateLimit(error.retryAfterMs);
          throw Worker.RateLimitError();
        }
        // 5xx, таймаут, сеть: обычный ретрай с exponential backoff из настроек очереди
        throw error;
      }

      created += await this.saveOrders(result.items);
      fetched += result.items.length;
      page = result.nextPage;

      // Чекпоинт после каждой страницы: ретрай не качает заново уже пройденные страницы
      await job.updateData({
        sellerId,
        cursor: page ?? undefined,
        fetched,
        created,
      });
      await job.updateProgress(
        Math.round((result.page / result.totalPages) * 100),
      );
    }

    // Данные селлера изменились: сбрасываем весь его кэш (заказы, статистика)
    await this.cacheService.deleteByPrefix(cacheKeys.seller(sellerId));

    return { sellerId, fetched, created };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SyncOrdersJobData, SyncOrdersJobResult>) {
    const { sellerId, fetched, created } = job.returnvalue;
    this.logger.log(
      `Sync ${job.id} for ${sellerId} completed: ${fetched} fetched, ${created} new`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SyncOrdersJobData> | undefined, error: Error) {
    // Пока attemptsMade < attempts, задача уйдёт на ретрай; после последней остаётся в failed для разбора
    this.logger.warn(
      `Sync ${job?.id} for ${job?.data.sellerId} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}): ${error.message}`,
    );
  }

  // Возвращает количество новых заказов
  private async saveOrders(orders: MarketplaceOrderDto[]): Promise<number> {
    if (!orders.length) return 0;

    const existing = await this.orderRepository.find({
      where: { id: In(orders.map((order) => order.orderId)) },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((order) => order.id));
    const newOrders = orders.filter((order) => !existingIds.has(order.orderId));

    // События ставим до записи в БД: если упадём между шагами, ретрай поставит их снова,
    // а jobId не даст создать дубль
    if (newOrders.length) {
      await this.orderEventsQueue.addBulk(
        newOrders.map((order) => ({
          name: ORDER_CREATED_JOB,
          data: {
            orderId: order.orderId,
            sellerId: order.sellerId,
            asin: order.asin,
            quantity: order.quantity,
            amountCents: order.amountCents,
          },
          opts: { jobId: `${ORDER_CREATED_JOB}-${order.orderId}` },
        })),
      );
    }

    // Upsert по id заказа: повторный синк обновляет статусы, а не создаёт дубли
    await this.orderRepository.upsert(
      orders.map((order) => ({
        id: order.orderId,
        sellerId: order.sellerId,
        asin: order.asin,
        quantity: order.quantity,
        amountCents: order.amountCents,
        currency: order.currency,
        status: order.status,
        purchasedAt: new Date(order.purchasedAt),
      })),
      ['id'],
    );

    return newOrders.length;
  }
}
