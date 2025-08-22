import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, default: '' })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isMain: boolean; // true = main category, false = secondary category

  // Inverse relations
  @OneToMany(() => Product, (product) => product.mainCategory)
  productsMainCategory: Product[];

  @OneToMany(() => Product, (product) => product.secondaryCategory)
  productsSecondaryCategory: Product[];
}
