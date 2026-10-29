export const MARKETPLACE_SYNC_QUEUE = 'marketplace-sync';
export const ORDER_EVENTS_QUEUE = 'order-events';

export const SYNC_ORDERS_JOB = 'sync-orders';
export const ORDER_CREATED_JOB = 'order-created';

// TTL в секундах
export const CACHE_TTL = {
  orders: 60,
  stats: 300,
  product: 600,
};

// Все ключи селлера под одним префиксом, чтобы после синка сбросить их разом
export const cacheKeys = {
  seller: (sellerId: string) => `marketplace:seller:${sellerId}:`,
  orders: (sellerId: string, page: number, limit: number) =>
    `marketplace:seller:${sellerId}:orders:${page}:${limit}`,
  stats: (sellerId: string) => `marketplace:seller:${sellerId}:stats`,
  product: (asin: string) => `marketplace:product:${asin}`,
};
