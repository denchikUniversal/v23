import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // 202: синк выполняется в фоне, статус смотрим по jobId
  @Post('sellers/:sellerId/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  startSync(@Param('sellerId') sellerId: string) {
    return this.marketplaceService.startSync(sellerId);
  }

  @Get('sync/:jobId')
  getSyncStatus(@Param('jobId') jobId: string) {
    return this.marketplaceService.getSyncStatus(jobId);
  }

  @Get('sellers/:sellerId/orders')
  getOrders(
    @Param('sellerId') sellerId: string,
    @Query() query: OrdersQueryDto,
  ) {
    return this.marketplaceService.getOrders(sellerId, query);
  }

  @Get('sellers/:sellerId/stats')
  getStats(@Param('sellerId') sellerId: string) {
    return this.marketplaceService.getStats(sellerId);
  }

  @Get('products/:asin')
  getProduct(@Param('asin') asin: string) {
    return this.marketplaceService.getProduct(asin);
  }
}
