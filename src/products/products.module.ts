import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { InventoryModule } from '../inventory/inventory.module';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [forwardRef(() => ProductsService), TypeOrmModule],
})
export class ProductsModule {}
