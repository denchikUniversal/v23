import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceOrderEntity } from './entities/marketplace-order.entity';
import { MarketplaceClient } from './marketplace.client';
import {
  MARKETPLACE_SYNC_QUEUE,
  ORDER_EVENTS_QUEUE,
} from './marketplace.constants';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceSyncScheduler } from './marketplace-sync.scheduler';
import { OrderEventsProcessor } from './processors/order-events.processor';
import { OrderSyncProcessor } from './processors/order-sync.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceOrderEntity]),
    BullModule.registerQueue(
      {
        name: MARKETPLACE_SYNC_QUEUE,
        defaultJobOptions: {
          // 5 попыток с паузами 2s, 4s, 8s, 16s; после последней задача остаётся в failed
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 3600, count: 100 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      },
      {
        name: ORDER_EVENTS_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          // Храним выполненные события сутки: за это время jobId защищает от повторной отправки
          removeOnComplete: { age: 24 * 3600 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      },
    ),
  ],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    MarketplaceClient,
    OrderSyncProcessor,
    OrderEventsProcessor,
    MarketplaceSyncScheduler,
  ],
})
export class MarketplaceModule {}
