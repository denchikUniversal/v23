import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  MARKETPLACE_SYNC_QUEUE,
  SYNC_ORDERS_JOB,
} from './marketplace.constants';
import { SyncOrdersJobData } from './marketplace.types';

@Injectable()
export class MarketplaceSyncScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketplaceSyncScheduler.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(MARKETPLACE_SYNC_QUEUE)
    private readonly syncQueue: Queue<SyncOrdersJobData>,
  ) {}

  async onApplicationBootstrap() {
    const sellers = this.configService
      .get<string>('MARKETPLACE_SYNC_SELLERS', 'seller-1,seller-2')
      .split(',')
      .map((sellerId) => sellerId.trim())
      .filter(Boolean);
    const every = Number(
      this.configService.get('MARKETPLACE_SYNC_EVERY_MS', 15 * 60_000),
    );

    // Scheduler хранится в Redis, upsert идемпотентен: рестарт приложения обновляет расписание, а не плодит дубли
    for (const sellerId of sellers) {
      await this.syncQueue.upsertJobScheduler(
        `sync-${sellerId}`,
        { every },
        { name: SYNC_ORDERS_JOB, data: { sellerId } },
      );
    }

    this.logger.log(
      `Orders sync scheduled every ${every / 60_000} min for: ${sellers.join(', ')}`,
    );
  }
}
