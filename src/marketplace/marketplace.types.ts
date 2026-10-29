export enum MarketplaceOrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

// Контракт внешнего маркетплейс-API
export interface MarketplaceOrderDto {
  orderId: string;
  sellerId: string;
  asin: string;
  quantity: number;
  amountCents: number;
  currency: string;
  status: MarketplaceOrderStatus;
  purchasedAt: string;
}

export interface MarketplaceOrdersPage {
  items: MarketplaceOrderDto[];
  page: number;
  totalPages: number;
  nextPage: number | null;
}

export interface MarketplaceProduct {
  asin: string;
  title: string;
  priceCents: number;
  stock: number;
}

// Данные задач в очередях
export interface SyncOrdersJobData {
  sellerId: string;
  // Чекпоинт: страница, с которой продолжить после ретрая, и счётчики уже пройденных страниц
  cursor?: number;
  fetched?: number;
  created?: number;
}

export interface SyncOrdersJobResult {
  sellerId: string;
  fetched: number;
  created: number;
}

export interface OrderCreatedJobData {
  orderId: string;
  sellerId: string;
  asin: string;
  quantity: number;
  amountCents: number;
}
