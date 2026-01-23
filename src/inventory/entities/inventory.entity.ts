import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { DecimalTransformer } from '../../common/transformers/numeric.transformer';

@Entity({ name: 'inventory' })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({
    name: 'average_cost',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  averageCost: number; // COGS - Cost Of Goods Sold

  @Column({
    name: 'average_sale_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  averageSalePrice: number;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
