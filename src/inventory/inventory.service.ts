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
import { DEFAULT_PROFIT_MARGIN_PERCENTAGE } from '../common/constants';
import { DateHelper } from '../common/date/date.helper';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InInventoryMovementDto } from './dto/in-inventory-movement.dto';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
import { OutInventoryMovementDto } from './dto/out-inventory-movement.dto';
import { OrderBy, ProfitReportDto } from './dto/profit-report.dto';
import {
  EMovementType,
  InventoryMovement,
} from './entities/inventory-movements.entity';
import { Inventory } from './entities/inventory.entity';
import { ELimitSettings } from 'src/common/dto/pagination.dto';

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

  async createInMovement(inputInventoryMovementDto: InInventoryMovementDto) {
    // Get purchase and sale price
    let { salePrice } = inputInventoryMovementDto;
    // Get IN movement details
    const {
      productId,
      profitMarginPercentage,
      purchasePrice,
      quantity,
      supplierId,
    } = inputInventoryMovementDto;
    // Set sale price depending on profit margin if not provided
    salePrice =
      salePrice ??
      this.calculateSalePrice(
        purchasePrice,
        profitMarginPercentage ?? DEFAULT_PROFIT_MARGIN_PERCENTAGE,
      );
    // Get product
    const product: Product = await this.productService.findOne(productId);
    // Get supplier if provided
    let supplier: Supplier | null = null;
    if (supplierId) supplier = await this.supplierService.findOne(supplierId);
    // Find current stock for the product
    const inventory: Inventory =
      await this.getOrCreatedInventoryRecord(product);
    // Calculate Total Cost for Inventory
    const currentTotalValue = new Decimal(inventory.stock).times(
      new Decimal(inventory.averageCost),
    );
    // New movement total value
    const newMovementValue = new Decimal(quantity).times(
      new Decimal(purchasePrice),
    );
    const newStock = new Decimal(inventory.stock).plus(new Decimal(quantity));
    // Update stock
    inventory.stock = newStock.toNumber();
    // Update averageCost
    if (newStock.greaterThan(0)) {
      // Calculate average cost (currentTotalValue + newMovementValue) / newStock
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
    // Update product sale price
    product.salePrice = salePrice;

    try {
      // Create IN inventory movement
      const inMovement = this.inventoryMovementRepository.create({
        product,
        quantity,
        type: EMovementType.IN,
        purchasePrice,
        salePrice,
        supplier,
      });
      // Save product changes
      await this.productRepository.save(product);
      // Save IN movement
      await this.inventoryMovementRepository.save(inMovement);
      // Save product inventory record
      await this.inventoryRepository.save(inventory);
      // Get updated inventory record
      const inventoryRecord = await this.findInventoryRecord(inventory.id);
      // Get updated inventory movement
      const movement = await this.findInventoryMovement(inMovement.id);

      return { inventoryRecord, movement };
    } catch (error) {
      this.logger.error('Error adding IN inventory movement', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async createOutMovement(outInventoryMovementDto: OutInventoryMovementDto) {
    // Get OUT movement details
    const { productId, quantity, supplierId, discountPercent } =
      outInventoryMovementDto;
    // Get product
    const product: Product = await this.productService.findOne(productId);
    // Get supplier if provided
    let supplier: Supplier | null = null;
    if (supplierId) supplier = await this.supplierService.findOne(supplierId);
    // Find current stock for the product
    const inventory: Inventory =
      await this.getOrCreatedInventoryRecord(product);
    // If there is not enough stock, do nothing
    if (inventory.stock < quantity)
      throw new PreconditionFailedException(
        `Not enough stock for product "${product.name}"`,
      );
    // SAVE COGS: For a sale, movement 'purchasePrice'
    // must be current 'averageCost' from inventory
    // This is crucial for profit reporting later.
    const purchasePrice: number = new Decimal(inventory.averageCost).toNumber();
    // Apply discount if any
    const discount = new Decimal(1).minus(
      new Decimal(discountPercent ?? 0).dividedBy(100),
    );
    // Calculate sale price after discount
    const salePrice: number = new Decimal(product.salePrice)
      .times(discount)
      .toNumber();
    // Update stock
    inventory.stock -= quantity;
    try {
      // Create OUT inventory movement
      const outMovement = this.inventoryMovementRepository.create({
        product,
        quantity,
        type: EMovementType.OUT,
        purchasePrice,
        salePrice,
        supplier,
      });
      // Save product changes
      await this.productRepository.save(product);
      // Save OUT movement
      await this.inventoryMovementRepository.save(outMovement);
      // Save product inventory record
      await this.inventoryRepository.save(inventory);
      // Get updated inventory record
      const inventoryRecord = await this.findInventoryRecord(inventory.id);
      // Get updated inventory movement
      const movement = await this.findInventoryMovement(outMovement.id);

      return { inventoryRecord, movement };
    } catch (error) {
      this.logger.error('Error adding OUT inventory movement', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async removeInventoryRecord(id: string) {
    const inventoryRecord: Inventory | null =
      await this.findInventoryRecord(id);
    // Little guard clause to ensure product exists
    if (!inventoryRecord) return;
    await this.inventoryRepository.remove(inventoryRecord);
  }

  async undoInventoryMovement(id: string) {
    const movement = await this.findInventoryMovement(id);

    const inventory = await this.findInventoryRecordByProduct(
      movement.product.id,
    );

    if (movement.type === EMovementType.IN && movement.purchasePrice) {
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

  async findAllInventoryMovements(movementQueryDto: InventoryMovementQueryDto) {
    const {
      orderBy = OrderBy.DESC,
      productId,
      limit = ELimitSettings.DEFAULT,
      offset = 0,
      type = EMovementType.ALL,
    } = movementQueryDto;
    // Validate product ID
    if (!productId) throw new BadRequestException('Product ID is required');
    // Handle date range
    const startDate = DateHelper.toStartOfDay(movementQueryDto.startDate);
    const endDate = DateHelper.toEndOfDay(movementQueryDto.endDate);

    // Check if start date is after end date
    if (startDate && endDate && startDate.getTime() > endDate.getTime())
      throw new BadRequestException('End date must be after the start date');

    const qb = this.inventoryMovementRepository.createQueryBuilder('movement');

    qb.leftJoin('movement.product', 'product')
      .leftJoin('movement.supplier', 'supplier')
      .addSelect('movement.id', 'movementId')
      .addSelect('movement.type', 'movementType')
      .addSelect('movement.quantity', 'movementQuantity')
      .addSelect('movement.salePrice', 'movementSalePrice')
      .addSelect('movement.purchasePrice', 'movementPurchasePrice')
      .addSelect('movement.createdAt', 'movementCreatedAt')
      .addSelect('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.salePrice', 'productSalePrice')
      .addSelect('supplier.id', 'supplierId')
      .addSelect('supplier.name', 'supplierName')
      .where('product.id = :productId', { productId });
    // Check for date range
    if (startDate && endDate) {
      qb.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere('movement.createdAt >= :startDate', {
        startDate,
      });
    } else if (endDate) {
      qb.andWhere('movement.createdAt <= :endDate', {
        endDate,
      });
    }
    // Check if type is valid
    if (type !== EMovementType.ALL) {
      qb.andWhere('movement.type = :type', { type });
    }
    // Add order by, limit, and offset
    qb.orderBy('movement.createdAt', orderBy).limit(limit).offset(offset);
    // Get movement results
    const result = await qb.getRawMany();
    // Organize result object
    const count = await qb.getCount();
    return {
      startDate,
      endDate,
      limit,
      offset,
      movements: result,
      totalRecords: count,
    };
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

  async getProfitReport(profitReportDto: ProfitReportDto) {
    const qb = this.inventoryMovementRepository.createQueryBuilder('movement');
    const { orderBy = OrderBy.DESC } = profitReportDto;
    const startDate = DateHelper.toStartOfDay(profitReportDto.startDate);
    const endDate = DateHelper.toEndOfDay(profitReportDto.endDate);
    const orderByStatement: string = `SUM(CASE WHEN movement.type = :type THEN (movement.salePrice - movement.purchasePrice) * movement.quantity ELSE 0 END)`;

    qb.leftJoin('movement.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.salePrice', 'productSalePrice')
      // Total Sold Quantity
      .addSelect(
        `SUM(CASE WHEN movement.type = :type THEN movement.quantity ELSE 0 END)`,
        'totalSoldQuantity',
      )
      // Total Sales Revenue
      .addSelect(
        `SUM(CASE WHEN movement.type = :type THEN movement.salePrice * movement.quantity ELSE 0 END)`,
        'totalSalesRevenue',
      )
      // Total Cost (COGS)
      .addSelect(
        `SUM(CASE WHEN movement.type = :type THEN movement.purchasePrice * movement.quantity ELSE 0 END)`,
        'totalCost',
      )
      // Total Profit
      .addSelect(orderByStatement, 'totalProfit')
      .where('movement.type = :type', { type: EMovementType.OUT })
      .groupBy('product.id');

    // Apply date filters if provided
    if (startDate && endDate) {
      if (startDate.getTime() > endDate.getTime())
        throw new BadRequestException('End date must be after the start date');

      qb.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere('movement.createdAt >= :startDate', {
        startDate,
      });
    } else if (endDate) {
      qb.andWhere('movement.createdAt <= :endDate', {
        endDate,
      });
    }

    qb.orderBy(orderByStatement, orderBy);

    const result = await qb.getRawMany();

    const count = await qb.getCount();

    return { startDate, endDate, report: result, totalRecords: count };
  }

  async removeAllInventoryMovements() {
    try {
      const query =
        this.inventoryMovementRepository.createQueryBuilder('movement');
      const result = await query.delete().where({}).execute();
      this.logger.log(`Deleted ${result.affected} inventory movements.`);
      return result;
    } catch (error) {
      this.logger.error('Error removing all inventory movements', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async removeAllInventory() {
    try {
      const query = this.inventoryRepository.createQueryBuilder('inventory');
      const result = await query.delete().where({}).execute();
      this.logger.log(`Deleted ${result.affected} inventory items.`);
      return result;
    } catch (error) {
      this.logger.error('Error removing all inventory items', error);
      this.handleDatabaseExceptions(error);
    }
  }

  private calculateSalePrice(
    purchasePrice: number,
    profitMarginPercentage: number,
  ) {
    const marginMultiplier = new Decimal(1).plus(
      new Decimal(profitMarginPercentage).dividedBy(100),
    );
    return new Decimal(purchasePrice).times(marginMultiplier).toNumber();
  }

  private async getOrCreatedInventoryRecord(product: Product) {
    let inventory: Inventory | null = await this.inventoryRepository.findOne({
      where: { product: { id: product.id } },
    });
    // Check if inventory exists for the product, if not create it
    if (!inventory) {
      inventory = this.inventoryRepository.create({
        product,
        stock: 0,
      });
      await this.inventoryRepository.save(inventory);
    }

    return inventory;
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
