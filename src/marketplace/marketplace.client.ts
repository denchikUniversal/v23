import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplaceOrdersPage, MarketplaceProduct } from './marketplace.types';

export class MarketplaceRateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super(`Marketplace rate limit exceeded, retry after ${retryAfterMs} ms`);
  }
}

export class MarketplaceApiError extends Error {
  constructor(readonly status: number) {
    super(`Marketplace API responded with ${status}`);
  }
}

@Injectable()
export class MarketplaceClient {
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.get<string>(
      'MARKETPLACE_API_URL',
      `http://localhost:${configService.get('PORT', 3000)}/fake-marketplace`,
    );
  }

  getOrdersPage(
    sellerId: string,
    page: number,
  ): Promise<MarketplaceOrdersPage> {
    return this.request(
      `/sellers/${encodeURIComponent(sellerId)}/orders?page=${page}`,
    );
  }

  getProduct(asin: string): Promise<MarketplaceProduct> {
    return this.request(`/products/${encodeURIComponent(asin)}`);
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 429) {
      const retryAfterSeconds = Number(res.headers.get('retry-after') ?? 1);
      throw new MarketplaceRateLimitError(retryAfterSeconds * 1000);
    }
    if (res.status === 404) {
      throw new NotFoundException(`Marketplace resource not found: ${path}`);
    }
    if (!res.ok) {
      throw new MarketplaceApiError(res.status);
    }

    return (await res.json()) as T;
  }
}
