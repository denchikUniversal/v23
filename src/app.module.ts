import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './typeorm/task/task.module';
import { MovieModule } from './typeorm/movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './typeorm/config/typeorm.config';
import { ReviewModule } from './typeorm/review/review.module';
import { ActorModule } from './typeorm/actor/actor.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { getRedisConnectionOptions } from './redis/redis.config';
import { RedisModule } from './redis/redis.module';
import { FakeMarketplaceModule } from './fake-marketplace/fake-marketplace.module';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConnectionOptions(configService),
      }),
    }),
    PrismaModule,
    RedisModule,
    TaskModule,
    MovieModule,
    ReviewModule, ActorModule,
    FakeMarketplaceModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
