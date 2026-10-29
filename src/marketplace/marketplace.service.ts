import { InjectQueue } from '@nestjs/bullmq';
import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { RedisCacheService } from '../redis/redis-cache.service';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { MarketplaceOrderEntity } from './entities/marketplace-order.entity';
import {
  MarketplaceApiError,
  MarketplaceClient,
  MarketplaceRateLimitError,
} from './marketplace.client';
import {
  CACHE_TTL,
  cacheKeys,
  MARKETPLACE_SYNC_QUEUE,
  SYNC_ORDERS_JOB,
} from './marketplace.constants';
import { MarketplaceOrderStatus, SyncOrdersJobData } from './marketplace.types';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly marketplaceClient: MarketplaceClient,
    private readonly cacheService: RedisCacheService,
    @InjectRepository(MarketplaceOrderEntity)
    private readonly orderRepository: Repository<MarketplaceOrderEntity>,
    @InjectQueue(MARKETPLACE_SYNC_QUEUE)
    private readonly syncQueue: Queue<SyncOrdersJobData>,
  ) {}

  async startSync(sellerId: string) {
    // Пока синк селлера ждёт или выполняется, повторный запрос не создаёт новую задачу
    const job = await this.syncQueue.add(
      SYNC_ORDERS_JOB,
      { sellerId },
      { deduplication: { id: `sync-${sellerId}` } },
    );

    return { jobId: job.id, sellerId };
  }

  async getSyncStatus(jobId: string) {
    const job = await this.syncQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Sync job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      sellerId: job.data.sellerId,
      state: await job.getState(),
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    };
  }

  getOrders(sellerId: string, query: OrdersQueryDto) {
    const { page = 1, limit = 20 } = query;

    return this.cacheService.getOrSet(
      cacheKeys.orders(sellerId, page, limit),
      CACHE_TTL.orders,
      async () => {
        const [items, total] = await this.orderRepository.findAndCount({
          where: { sellerId },
          order: { purchasedAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          items,
          meta: { total, page, limit, pages: Math.ceil(total / limit) },
        };
      },
    );
  }

  getStats(sellerId: string) {
    return this.cacheService.getOrSet(
      cacheKeys.stats(sellerId),
      CACHE_TTL.stats,
      async () => {
        const byStatus = await this.orderRepository
          .createQueryBuilder('o')
          .select('o.status', 'status')
          .addSelect('COUNT(*)::int', 'orders')
          .addSelect('COALESCE(SUM(o.amountCents), 0)::int', 'amountCents')
          .where('o.sellerId = :sellerId', { sellerId })
          .groupBy('o.status')
          .getRawMany<{
            status: MarketplaceOrderStatus;
            orders: number;
            amountCents: number;
          }>();

        return {
          sellerId,
          totalOrders: byStatus.reduce((sum, row) => sum + row.orders, 0),
          revenueCents: byStatus
            .filter((row) => row.status !== MarketplaceOrderStatus.CANCELED)
            .reduce((sum, row) => sum + row.amountCents, 0),
          byStatus,
        };
      },
    );
  }

  // Кэшируем ответ внешнего API: повторные запросы не тратят его лимит
  async getProduct(asin: string) {
    try {
      return await this.cacheService.getOrSet(
        cacheKeys.product(asin),
        CACHE_TTL.product,
        () => this.marketplaceClient.getProduct(asin),
      );
    } catch (error) {
      if (error instanceof MarketplaceRateLimitError) {
        throw new HttpException(
          'Marketplace rate limit exceeded, try again later',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (error instanceof MarketplaceApiError) {
        throw new BadGatewayException('Marketplace is unavailable');
      }
      throw error;
    }
  }
}
