import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ORDER_EVENTS_QUEUE } from '../marketplace.constants';
import { OrderCreatedJobData } from '../marketplace.types';

@Processor(ORDER_EVENTS_QUEUE, { concurrency: 10 })
export class OrderEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderEventsProcessor.name);

  async process(job: Job<OrderCreatedJobData>): Promise<void> {
    const { orderId, sellerId, asin, quantity } = job.data;

    // Здесь отправляли бы уведомление селлеру (email, Slack, webhook):
    // медленная операция живёт в своей очереди и не тормозит синк
    this.logger.debug(
      `Notify ${sellerId}: new order ${orderId}, ${quantity} x ${asin}`,
    );
  }
}
