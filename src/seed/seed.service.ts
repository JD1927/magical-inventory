import { faker } from '@faker-js/faker';
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
  INITIAL_DATA,
  SeedInInventoryMovement,
  SeedOutInventoryMovement,
  createInInventoryMovementDto,
  createOutInventoryMovementDto,
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
    // Remove all tables
    await this.removeAllTables();
    // Insert seed categories
    const categories = await this.insertSeedCategories();
    // Insert seed products
    const products = await this.insertSeedProducts(categories);
    // Insert seed suppliers
    const suppliers = await this.insertSeedSuppliers();
    // Insert seed inventory movements
    await this.insertSeedInventoryMovements(products, suppliers);
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

  private async insertSeedCategories(): Promise<Category[]> {
    // Insert seed categories
    const categories: any[] = [];
    for (const category of INITIAL_DATA.categories) {
      categories.push(this.categoriesService.create(category));
    }
    // Wait for all categories to be created
    return (await Promise.all(categories)) as Category[];
  }

  private async insertSeedSuppliers(): Promise<Supplier[]> {
    // Insert seed suppliers
    const suppliers: any[] = [];
    for (const supplier of INITIAL_DATA.suppliers) {
      suppliers.push(this.suppliersService.create(supplier));
    }
    // Wait for all suppliers to be created
    return (await Promise.all(suppliers)) as Supplier[];
  }

  private async insertSeedProducts(categories: Category[]): Promise<Product[]> {
    // Get the main and secondary categories
    const mainCategory = categories.filter((category) => category.isMain)[0];
    const secondaryCategory = categories.filter(
      (category) => !category.isMain,
    )[0];
    // Insert seed products
    const products: any[] = [];
    for (const product of INITIAL_DATA.products) {
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
        faker.helpers.multiple(createInInventoryMovementDto, { count: 10 });
      for (const movement of inInventoryMovements) {
        console.log(movement);
        const createInMovementDto: InInventoryMovementDto = {
          ...movement,
          productId: product.id,
          supplierId: supplier?.id,
        };
        await this.inventoryService.createInMovement(createInMovementDto);
      }
      // Create out movements
      const outInventoryMovements: SeedOutInventoryMovement[] =
        faker.helpers.multiple(createOutInventoryMovementDto, { count: 2 });
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
