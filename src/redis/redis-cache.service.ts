import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.config';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // Cache-aside: читаем из Redis, при промахе идём в источник и кладём результат с TTL.
  // Кэш — оптимизация, а не источник правды: если Redis недоступен, отдаём данные из источника.
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        this.logger.debug(`HIT ${key}`);
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      this.logger.warn(
        `Cache read failed for ${key}: ${(error as Error).message}`,
      );
      return loader();
    }

    this.logger.debug(`MISS ${key}`);
    const value = await loader();

    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Cache write failed for ${key}: ${(error as Error).message}`,
      );
    }

    return value;
  }

  // SCAN вместо KEYS: не блокирует Redis на большом количестве ключей
  async deleteByPrefix(prefix: string): Promise<number> {
    let deleted = 0;
    const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });

    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length) deleted += await this.redis.unlink(...keys);
    }

    this.logger.debug(`Invalidated ${deleted} keys by prefix ${prefix}`);
    return deleted;
  }
}
