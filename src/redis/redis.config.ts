import type { ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

// Одни и те же настройки для кэша (ioredis) и для очередей (BullMQ)
export function getRedisConnectionOptions(configService: ConfigService): {
  host: string;
  port: number;
} {
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: Number(configService.get('REDIS_PORT', 6379)),
  };
}
