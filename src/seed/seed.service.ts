import { Injectable } from '@nestjs/common';
import { InInventoryMovementDto } from 'src/inventory/dto/in-inventory-movement.dto';
import { OutInventoryMovementDto } from 'src/inventory/dto/out-inventory-movement.dto';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import {
  SeedCategory,
  SeedInInventoryMovement,
  SeedOutInventoryMovement,
  SeedProduct,
  SeedSupplier,
  createInInventoryMovementDto,
  createOutInventoryMovementDto,
  getInitialData,
} from './data/seed.data';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly inventoryService: InventoryService,
    private readonly suppliersService: SuppliersService,
  ) {}

  async executeSeed() {
    const { faker } = await import('@faker-js/faker');
    const initialData = getInitialData(faker);

    // Remove all tables
    await this.removeAllTables();
    // Insert seed categories
    const categories = await this.insertSeedCategories(initialData.categories);
    // Insert seed products
    const products = await this.insertSeedProducts(
      categories,
      initialData.products,
    );
    // Insert seed suppliers
    const suppliers = await this.insertSeedSuppliers(initialData.suppliers);
    // Insert seed inventory movements
    await this.insertSeedInventoryMovements(faker, products, suppliers);
  }

  private async removeAllTables() {
    // Remove all inventory movements
    await this.inventoryService.removeAllInventoryMovements();
    // Remove all inventory
    await this.inventoryService.removeAllInventory();
    // Remove all products
    await this.productsService.removeAll();
    // Remove all suppliers
    await this.suppliersService.removeAll();
    // Remove all categories
    await this.categoriesService.removeAll();
  }

  private async insertSeedCategories(
    seedCategories: SeedCategory[],
  ): Promise<Category[]> {
    // Insert seed categories
    const categories: any[] = [];
    for (const category of seedCategories) {
      categories.push(this.categoriesService.create(category));
    }
    // Wait for all categories to be created
    return (await Promise.all(categories)) as Category[];
  }

  private async insertSeedSuppliers(
    seedSuppliers: SeedSupplier[],
  ): Promise<Supplier[]> {
    // Insert seed suppliers
    const suppliers: any[] = [];
    for (const supplier of seedSuppliers) {
      suppliers.push(this.suppliersService.create(supplier));
    }
    // Wait for all suppliers to be created
    return (await Promise.all(suppliers)) as Supplier[];
  }

  private async insertSeedProducts(
    categories: Category[],
    seedProducts: SeedProduct[],
  ): Promise<Product[]> {
    // Get the main and secondary categories
    const mainCategory = categories.filter((category) => category.isMain)[0];
    const secondaryCategory = categories.filter(
      (category) => !category.isMain,
    )[0];
    // Insert seed products
    const products: any[] = [];
    for (const product of seedProducts) {
      const createProductDto: CreateProductDto = {
        ...product,
        mainCategoryId: mainCategory.id,
        secondaryCategoryId: secondaryCategory.id,
      };
      products.push(this.productsService.create(createProductDto));
    }
    // Wait for all products to be created
    return (await Promise.all(products)) as Product[];
  }

  private async insertSeedInventoryMovements(
    faker: any,
    products: Product[],
    suppliers: Supplier[],
  ) {
    // Insert seed inventory movements
    const supplier = suppliers?.at(
      faker.number.int({ min: 0, max: suppliers.length - 1 }),
    );
    for (const product of products) {
      // Create in movements
      const inInventoryMovements: SeedInInventoryMovement[] =
        faker.helpers.multiple(() => createInInventoryMovementDto(faker), {
          count: 10,
        });
      for (const movement of inInventoryMovements) {
        const createInMovementDto: InInventoryMovementDto = {
          ...movement,
          productId: product.id,
          supplierId: supplier?.id,
        };
        await this.inventoryService.createInMovement(createInMovementDto);
      }
      // Create out movements
      const outInventoryMovements: SeedOutInventoryMovement[] =
        faker.helpers.multiple(() => createOutInventoryMovementDto(faker), {
          count: 2,
        });
      for (const movement of outInventoryMovements) {
        const createOutMovementDto: OutInventoryMovementDto = {
          ...movement,
          productId: product.id,
          supplierId: supplier?.id,
        };
        await this.inventoryService.createOutMovement(createOutMovementDto);
      }
    }
  }
}
