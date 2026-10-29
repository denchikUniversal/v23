import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MarketplaceOrderDto,
  MarketplaceOrdersPage,
  MarketplaceOrderStatus,
  MarketplaceProduct,
} from '../marketplace/marketplace.types';

const PAGE_SIZE = 20;
const BASE_ORDERS = 45;
const MAX_REQUESTS_PER_SECOND = 5;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const PRODUCTS: Omit<MarketplaceProduct, 'stock'>[] = Array.from(
  { length: 10 },
  (_, i) => ({
    asin: `B0FAKE${String(i + 1).padStart(4, '0')}`,
    title: `Fake Product #${i + 1}`,
    priceCents: 999 + i * 500,
  }),
);

// Имитация внешнего API: детерминированные данные, лимит запросов и случайные сбои
@Injectable()
export class FakeMarketplaceService {
  private readonly startedAt = Date.now();
  private readonly failureRate: number;
  private currentWindow = 0;
  private requestsInWindow = 0;

  constructor(configService: ConfigService) {
    this.failureRate = Number(
      configService.get('FAKE_MARKETPLACE_FAILURE_RATE', 0.1),
    );
  }

  // Fixed window: возвращает Retry-After в секундах, если лимит на эту секунду исчерпан
  checkRateLimit(): number | null {
    const window = Math.floor(Date.now() / 1000);

    if (window !== this.currentWindow) {
      this.currentWindow = window;
      this.requestsInWindow = 0;
    }

    this.requestsInWindow++;
    return this.requestsInWindow > MAX_REQUESTS_PER_SECOND ? 1 : null;
  }

  shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  getOrdersPage(sellerId: string, page: number): MarketplaceOrdersPage {
    // Каждую минуту у селлера появляется новый заказ, поэтому повторные синки находят новые данные.
    // Старые заказы идут первыми: новые дописываются в конец и не сдвигают уже пройденные страницы.
    const total =
      BASE_ORDERS + Math.floor((Date.now() - this.startedAt) / MINUTE);
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const from = (page - 1) * PAGE_SIZE;
    const to = Math.min(from + PAGE_SIZE, total);

    const items: MarketplaceOrderDto[] = [];
    for (let index = from; index < to; index++) {
      items.push(this.buildOrder(sellerId, index));
    }

    return {
      items,
      page,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
    };
  }

  getProduct(asin: string): MarketplaceProduct {
    const product = PRODUCTS.find((p) => p.asin === asin);
    if (!product) {
      throw new NotFoundException(`Product ${asin} not found`);
    }

    return { ...product, stock: Math.floor(Math.random() * 100) };
  }

  private buildOrder(sellerId: string, index: number): MarketplaceOrderDto {
    const product = PRODUCTS[index % PRODUCTS.length];
    const quantity = (index % 3) + 1;
    const purchasedAt =
      index < BASE_ORDERS
        ? this.startedAt - (BASE_ORDERS - index) * HOUR
        : this.startedAt + (index - BASE_ORDERS + 1) * MINUTE;

    return {
      orderId: `${sellerId}-${String(index + 1).padStart(6, '0')}`,
      sellerId,
      asin: product.asin,
      quantity,
      amountCents: product.priceCents * quantity,
      currency: 'USD',
      status: this.getStatus(index, Date.now() - purchasedAt),
      purchasedAt: new Date(purchasedAt).toISOString(),
    };
  }

  private getStatus(index: number, ageMs: number): MarketplaceOrderStatus {
    if (index % 13 === 0) return MarketplaceOrderStatus.CANCELED;
    if (ageMs < 2 * HOUR) return MarketplaceOrderStatus.PENDING;
    if (ageMs < 24 * HOUR) return MarketplaceOrderStatus.SHIPPED;
    return MarketplaceOrderStatus.DELIVERED;
  }
}
