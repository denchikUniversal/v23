import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Response } from 'express';
import { setTimeout as sleep } from 'node:timers/promises';
import { FakeMarketplaceService } from './fake-marketplace.service';

@Controller('fake-marketplace')
export class FakeMarketplaceController {
  constructor(
    private readonly fakeMarketplaceService: FakeMarketplaceService,
  ) {}

  @Get('sellers/:sellerId/orders')
  async getOrders(
    @Param('sellerId') sellerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.simulateNetwork(res, 150);
    return this.fakeMarketplaceService.getOrdersPage(sellerId, page);
  }

  @Get('products/:asin')
  async getProduct(
    @Param('asin') asin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.simulateNetwork(res, 400);
    return this.fakeMarketplaceService.getProduct(asin);
  }

  private async simulateNetwork(res: Response, latencyMs: number) {
    const retryAfter = this.fakeMarketplaceService.checkRateLimit();
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await sleep(latencyMs);

    if (this.fakeMarketplaceService.shouldFail()) {
      throw new ServiceUnavailableException(
        'Marketplace is temporarily unavailable',
      );
    }
  }
}
