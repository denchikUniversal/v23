import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MarketplaceOrderStatus } from '../marketplace.types';

@Entity({
  name: 'marketplace_orders',
})
@Index(['sellerId', 'purchasedAt'])
export class MarketplaceOrderEntity {
  // id заказа из маркетплейса: по нему делаем upsert, повторный синк не создаёт дублей
  @PrimaryColumn({
    type: 'varchar',
    length: 64,
  })
  id: string;

  @Column({
    name: 'seller_id',
    type: 'varchar',
    length: 64,
  })
  sellerId: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  asin: string;

  @Column({
    type: 'int',
  })
  quantity: number;

  @Column({
    name: 'amount_cents',
    type: 'int',
  })
  amountCents: number;

  @Column({
    type: 'varchar',
    length: 3,
  })
  currency: string;

  @Column({
    type: 'enum',
    enum: MarketplaceOrderStatus,
  })
  status: MarketplaceOrderStatus;

  @Column({
    name: 'purchased_at',
    type: 'timestamptz',
  })
  purchasedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
