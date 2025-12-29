import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Category } from '../../categories/entities/category.entity';
import { DecimalTransformer } from '../../common/transformers/numeric.transformer';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', unique: true })
  sku: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description?: string;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  salePrice: number;

  @Column({
    name: 'current_purchase_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  currentPurchasePrice: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relationship to main category
  @ManyToOne(() => Category, (category) => category.productsMainCategory, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'main_category_id' })
  mainCategory: Category | null;

  // Relationship to secondary category
  @ManyToOne(() => Category, (category) => category.productsSecondaryCategory, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'secondary_category_id' })
  secondaryCategory: Category | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.sku = this.getSKUCode(this.name);
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    const skuSegments: string[] = this.sku.split('-');
    const skuName: string = this.getSKUFormatName(this.name);
    if (skuSegments[1] !== skuName) {
      this.sku = `${skuSegments[0]}-${skuName}-${skuSegments[2]}`;
    }
  }

  private getSKUFormatName(name: string): string {
    const formattedProductName = name
      .replaceAll("'", '')
      .replaceAll(',', '')
      .replaceAll('.', '')
      .split(' ')
      .map((word) => word[0].toUpperCase())
      .join('');
    return formattedProductName;
  }

  private getSKUCode(name: string): string {
    const storeCode: string = uuid().split('-')[0].toUpperCase();
    const sku = `KND-${this.getSKUFormatName(name)}-${storeCode}`;

    return sku;
  }
}
