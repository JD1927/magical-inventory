import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [ProductsModule, CategoriesModule, InventoryModule, SuppliersModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
