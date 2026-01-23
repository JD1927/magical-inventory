import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { InventoryMovement } from './entities/inventory-movements.entity';
import { Inventory } from './entities/inventory.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, InventoryMovement]),
    forwardRef(() => ProductsModule),
    SuppliersModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [forwardRef(() => InventoryService), TypeOrmModule],
})
export class InventoryModule {}
