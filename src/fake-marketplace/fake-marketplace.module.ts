import { Module } from '@nestjs/common';
import { FakeMarketplaceController } from './fake-marketplace.controller';
import { FakeMarketplaceService } from './fake-marketplace.service';

@Module({
  controllers: [FakeMarketplaceController],
  providers: [FakeMarketplaceService],
})
export class FakeMarketplaceModule {}
