import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../inventory/entities/inventory.entity';
import {
  InventoryMovement,
  EMovementType,
} from '../inventory/entities/inventory-movements.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { SalesOverTimeDto, TopProductsDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async getSummary() {
    try {
      const [
        totalProducts,
        activeProducts,
        totalCategories,
        totalSuppliers,
        inventoryAgg,
        salesAgg,
      ] = await Promise.all([
        // Total products count
        this.productRepository.count(),

        // Active products count
        this.productRepository.count({ where: { isActive: true } }),

        // Total categories count
        this.categoryRepository.count(),

        // Total suppliers count
        this.supplierRepository.count(),

        // Inventory aggregation: total stock units & total inventory value
        this.inventoryRepository
          .createQueryBuilder('inventory')
          .select('SUM(inventory.stock)', 'totalStockUnits')
          .addSelect(
            'SUM(inventory.stock * inventory.average_cost)',
            'totalInventoryValue',
          )
          .getRawOne<{
            totalStockUnits: string;
            totalInventoryValue: string;
          }>(),

        // Sales aggregation: total revenue, cost (COGS), profit
        this.inventoryMovementRepository
          .createQueryBuilder('movement')
          .select(`SUM(movement.salePrice * movement.quantity)`, 'totalRevenue')
          .addSelect(
            `SUM(movement.purchasePrice * movement.quantity)`,
            'totalCost',
          )
          .addSelect(
            `SUM((movement.salePrice - movement.purchasePrice) * movement.quantity)`,
            'totalProfit',
          )
          .where('movement.type = :type', { type: EMovementType.OUT })
          .getRawOne<{
            totalRevenue: string;
            totalCost: string;
            totalProfit: string;
          }>(),
      ]);

      return {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        totalCategories,
        totalSuppliers,
        totalStockUnits: Number(inventoryAgg?.totalStockUnits ?? 0),
        totalInventoryValue: Number(inventoryAgg?.totalInventoryValue ?? 0),
        totalRevenue: Number(salesAgg?.totalRevenue ?? 0),
        totalCost: Number(salesAgg?.totalCost ?? 0),
        totalProfit: Number(salesAgg?.totalProfit ?? 0),
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard summary', error);
      throw new InternalServerErrorException(
        'Failed to fetch dashboard summary',
      );
    }
  }

  async getSalesOverTime(dto: SalesOverTimeDto) {
    const months: number = dto.months ?? 6;
    try {
      const rows = await this.inventoryMovementRepository
        .createQueryBuilder('movement')
        .select(`TO_CHAR(movement.created_at, 'YYYY-MM')`, 'month')
        .addSelect(`SUM(movement.salePrice * movement.quantity)`, 'revenue')
        .addSelect(`SUM(movement.purchasePrice * movement.quantity)`, 'cost')
        .addSelect(
          `SUM((movement.salePrice - movement.purchasePrice) * movement.quantity)`,
          'profit',
        )
        .where('movement.type = :type', { type: EMovementType.OUT })
        .andWhere(`movement.created_at >= NOW() - INTERVAL '${months} months'`)
        .groupBy(`TO_CHAR(movement.created_at, 'YYYY-MM')`)
        .orderBy(`TO_CHAR(movement.created_at, 'YYYY-MM')`, 'ASC')
        .getRawMany<{
          month: string;
          revenue: string;
          cost: string;
          profit: string;
        }>();

      return rows.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue ?? 0),
        cost: Number(r.cost ?? 0),
        profit: Number(r.profit ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching sales over time', error);
      throw new InternalServerErrorException('Failed to fetch sales over time');
    }
  }

  async getTopProducts(dto: TopProductsDto) {
    const limit: number = dto.limit ?? 5;
    try {
      const rows = await this.inventoryMovementRepository
        .createQueryBuilder('movement')
        .leftJoin('movement.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'productName')
        .addSelect('product.sku', 'productSku')
        .addSelect(`SUM(movement.quantity)`, 'totalSoldQuantity')
        .addSelect(
          `SUM(movement.salePrice * movement.quantity)`,
          'totalRevenue',
        )
        .addSelect(
          `SUM((movement.salePrice - movement.purchasePrice) * movement.quantity)`,
          'totalProfit',
        )
        .where('movement.type = :type', { type: EMovementType.OUT })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .addGroupBy('product.sku')
        .orderBy('SUM(movement.quantity)', 'DESC')
        .limit(limit)
        .getRawMany<{
          productId: string;
          productName: string;
          productSku: string;
          totalSoldQuantity: string;
          totalRevenue: string;
          totalProfit: string;
        }>();

      return rows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        productSku: r.productSku,
        totalSoldQuantity: Number(r.totalSoldQuantity ?? 0),
        totalRevenue: Number(r.totalRevenue ?? 0),
        totalProfit: Number(r.totalProfit ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching top products', error);
      throw new InternalServerErrorException('Failed to fetch top products');
    }
  }

  async getStockAlerts() {
    try {
      // Get inventory records where stock <= product's minStock
      const rows: Inventory[] = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoin('inventory.product', 'product')
        .select([
          'inventory.id',
          'inventory.stock',
          'inventory.updatedAt',
          'product.id',
          'product.name',
          'product.sku',
          'product.minStock',
          'product.isActive',
        ])
        .where('inventory.stock <= product.minStock')
        .andWhere('product.isActive = true')
        .orderBy('inventory.stock', 'ASC')
        .getMany();

      return rows.map((inventory) => ({
        inventoryId: inventory.id,
        productId: inventory.product.id,
        productName: inventory.product.name,
        productSku: inventory.product.sku,
        currentStock: inventory.stock,
        minStock: inventory.product.minStock,
        deficit: inventory.product.minStock - inventory.stock,
        lastUpdated: inventory.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Error fetching stock alerts', error);
      throw new InternalServerErrorException('Failed to fetch stock alerts');
    }
  }

  async getStockByCategory() {
    try {
      const rows = await this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoin('inventory.product', 'product')
        .leftJoin('product.mainCategory', 'category')
        .select("COALESCE(category.name, 'No Category')", 'categoryName')
        .addSelect('SUM(inventory.stock)', 'totalStock')
        .addSelect(
          'SUM(inventory.stock * inventory.average_cost)',
          'totalValue',
        )
        .groupBy('category.name')
        .orderBy('SUM(inventory.stock)', 'DESC')
        .getRawMany<{
          categoryName: string;
          totalStock: string;
          totalValue: string;
        }>();

      return rows.map((r) => ({
        categoryName: r.categoryName,
        totalStock: Number(r.totalStock ?? 0),
        totalValue: Number(r.totalValue ?? 0),
      }));
    } catch (error) {
      this.logger.error('Error fetching stock by category', error);
      throw new InternalServerErrorException(
        'Failed to fetch stock by category',
      );
    }
  }
}
