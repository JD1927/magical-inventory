import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Decimal } from 'decimal.js';
import { SuppliersService } from 'src/suppliers/suppliers.service';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import {
  EMovementType,
  InventoryMovement,
} from './entities/inventory-movements.entity';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  private readonly logger: Logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productService: ProductsService,
    private readonly supplierService: SuppliersService,
  ) {}

  async createMovement(createInventoryMovementDto: CreateInventoryMovementDto) {
    let { purchasePrice } = createInventoryMovementDto;
    const { productId, quantity, type, salePrice, supplierId } =
      createInventoryMovementDto;

    const product: Product = await this.productService.findOne(productId);

    let supplier: Supplier | null = null;
    if (supplierId) {
      supplier = await this.supplierService.findOne(supplierId);
    }
    // Find current stock for the product
    let inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
    });

    // Check if inventory exists for the product, if not create it
    if (!inventory) {
      inventory = this.inventoryRepository.create({
        product,
        stock: 0,
      });
      await this.inventoryRepository.save(inventory);
    }

    if (type === EMovementType.IN) {
      if (!purchasePrice) {
        throw new BadRequestException(
          'Purchase price is required inventory movements',
        );
      }

      // 1. Calculate new Total Cost for Inventory
      const currentTotalValue = new Decimal(inventory.stock).times(
        new Decimal(inventory.averageCost),
      );
      const newMovementValue = new Decimal(quantity).times(
        new Decimal(purchasePrice),
      );
      const newStock = new Decimal(inventory.stock).plus(new Decimal(quantity));
      // 2. Update stock
      inventory.stock = newStock.toNumber();
      // 3. Update averageCost
      if (newStock.greaterThan(0)) {
        // Calculate average cost (totalValue + newValue) / stock
        const averageCost = currentTotalValue
          .plus(newMovementValue)
          .dividedBy(newStock);

        inventory.averageCost = averageCost.toNumber();
        product.currentPurchasePrice = averageCost.toNumber();
      } else {
        // If stock comes down to 0, then cost is 0
        inventory.averageCost = 0;
        product.currentPurchasePrice = 0;
      }
      // 4. Update product sale price
      product.salePrice = salePrice;
    } else if (type === EMovementType.OUT) {
      // If there is not enough stock, do nothing
      if (inventory.stock < quantity) {
        throw new PreconditionFailedException(
          `Not enough stock for product ${product.name}`,
        );
      }
      // SAVE COGS: For a sale, movement 'purchasePrice'
      // must be current 'averageCost' from inventory
      // This is crucial for profit reporting later.
      purchasePrice = new Decimal(inventory.averageCost).toNumber();

      inventory.stock -= quantity;
    }

    try {
      const movement = this.inventoryMovementRepository.create({
        product,
        quantity,
        type,
        purchasePrice,
        salePrice,
        supplier,
      });

      await this.productRepository.save(product);

      await this.inventoryMovementRepository.save(movement);

      await this.inventoryRepository.save(inventory);

      const updatedInventory = await this.findInventoryRecord(inventory.id);
      const updatedMovement = await this.findInventoryMovement(movement.id);

      return { updatedInventory, updatedMovement };
    } catch (error) {
      this.logger.error('Error adding inventory movement', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async remove(id: string) {
    const inventoryRecord: Inventory | null =
      await this.findInventoryRecord(id);
    // Little guard clause to ensure product exists
    if (!inventoryRecord) return;
    await this.inventoryRepository.remove(inventoryRecord);
  }

  async undoMovement(id: string) {
    const movement = await this.findInventoryMovement(id);

    const inventory = await this.findInventoryRecordByProduct(
      movement.product.id,
    );

    if (movement.purchasePrice && movement.type === EMovementType.IN) {
      // If there is not enough stock, do nothing
      if (inventory.stock < movement.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${movement.product.name} to undo movement`,
        );
      }

      const currentTotalValue = new Decimal(inventory.stock).times(
        new Decimal(inventory.averageCost),
      );
      const movementValue = new Decimal(movement.quantity).times(
        new Decimal(movement.purchasePrice),
      );
      const newTotalValue = currentTotalValue.minus(movementValue);
      const newStock = new Decimal(inventory.stock).minus(
        new Decimal(movement.quantity),
      );

      inventory.stock = newStock.toNumber();

      // Recalculate averageCost if newStock is not zero
      if (newStock.greaterThan(0)) {
        inventory.averageCost = newTotalValue.dividedBy(newStock).toNumber();
      } else {
        inventory.averageCost = 0;
      }
    } else if (movement.type === EMovementType.OUT) {
      // Undoing an OUT movement increases the stock
      const newStock = new Decimal(inventory.stock).plus(
        new Decimal(movement.quantity),
      );
      inventory.stock = newStock.toNumber();
    }

    try {
      await this.inventoryRepository.save(inventory);
      await this.inventoryMovementRepository.remove(movement);

      const updatedInventory = await this.findInventoryRecord(inventory.id);

      return { movement, updatedInventory };
    } catch (error) {
      this.logger.error('Error undoing inventory movement', error);
      this.handleDatabaseExceptions(error);
    }
  }

  findAllInventoryRecords() {
    return this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.product', 'product')
      .select([
        'inventory.id',
        'inventory.stock',
        'inventory.averageCost',
        'inventory.updatedAt',
        'product.id',
        'product.name',
        'product.salePrice',
      ])
      .getMany();
  }

  findAllInventoryMovements() {
    return this.inventoryMovementRepository
      .createQueryBuilder('inventory_movement')
      .leftJoin('inventory_movement.product', 'product')
      .leftJoin('inventory_movement.supplier', 'supplier')
      .select([
        'inventory_movement.id',
        'inventory_movement.type',
        'inventory_movement.quantity',
        'inventory_movement.salePrice',
        'inventory_movement.purchasePrice',
        'inventory_movement.createdAt',
        'product.id',
        'product.name',
        'product.salePrice',
        'supplier.id',
        'supplier.name',
      ])
      .getMany();
  }

  async findInventoryRecord(id: string) {
    const inventoryRecord = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.product', 'product')
      .where('inventory.id = :id', { id })
      .select([
        'inventory.id',
        'inventory.stock',
        'inventory.averageCost',
        'inventory.updatedAt',
        'product.id',
        'product.name',
        'product.salePrice',
      ])
      .getOne();

    if (!inventoryRecord) {
      throw new NotFoundException(`Inventory record with id '${id}' not found`);
    }

    return inventoryRecord;
  }

  async findInventoryMovement(id: string) {
    const inventoryMovement = await this.inventoryMovementRepository
      .createQueryBuilder('inventory_movement')
      .leftJoin('inventory_movement.product', 'product')
      .leftJoin('inventory_movement.supplier', 'supplier')
      .where('inventory_movement.id = :id', { id })
      .select([
        'inventory_movement.id',
        'inventory_movement.type',
        'inventory_movement.quantity',
        'inventory_movement.purchasePrice',
        'inventory_movement.salePrice',
        'inventory_movement.createdAt',
        'product.id',
        'product.name',
        'product.salePrice',
        'supplier.id',
        'supplier.name',
      ])
      .getOne();

    if (!inventoryMovement) {
      throw new NotFoundException(
        `Inventory movement with id '${id}' not found`,
      );
    }

    return inventoryMovement;
  }

  async findInventoryRecordByProduct(productId: string) {
    const inventoryRecord = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
    });

    if (!inventoryRecord) {
      throw new NotFoundException(
        `Inventory record for product with id '${productId}' not found`,
      );
    }

    return inventoryRecord;
  }

  private handleDatabaseExceptions(error: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error['code'] === '23505') {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error['detail'],
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.logger.error(error.toString());
    throw new InternalServerErrorException(
      `Could not perform database action. Please, review server logs.`,
    );
  }
}
