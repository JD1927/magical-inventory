import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isMain: boolean; // true = main category, false = secondary category

  // Inverse relations
  @OneToMany(() => Product, (product) => product.mainCategory)
  productsMainCategory: Product[];

  @OneToMany(() => Product, (product) => product.secondaryCategory)
  productsSecondaryCategory: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
