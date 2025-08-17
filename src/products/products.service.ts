import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductWithEarnings } from './entities/product-earnings-view.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductWithEarnings)
    private readonly productWithEarningsRepository: Repository<ProductWithEarnings>,
    private readonly dataSource: DataSource,
  ) {
    this.logger.log('ProductsService initialized');
  }

  async create(
    createProductDto: CreateProductDto,
  ): Promise<Product | undefined> {
    try {
      const product = this.productRepository.create(createProductDto);

      return await this.productRepository.save(product);
    } catch (error) {
      this.logger.error('Error creating product', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    this.logger.log(
      `Finding all products with limit: ${limit}, offset: ${offset}`,
    );
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
    });

    return products;
  }

  findAllWithEarnings() {
    return this.productWithEarningsRepository.find({});
  }

  async findOne(criteria: string) {
    let product: Product | null = null;

    product = await this.productRepository.findOne({
      where: { id: criteria },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id or name "${criteria}" not found`,
      );
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const entityLike = { ...updateProductDto, id };
    const product = await this.productRepository.preload(entityLike);

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    // Create query runner to manage transaction
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Start transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Save the product
      await queryRunner.manager.save(product);
      // Commit transaction
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.logger.log(`Product with id "${id}" updated successfully`);
      // Return the updated product
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDatabaseExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  async removeAll() {
    try {
      const query = this.productRepository.createQueryBuilder('product');
      const result = await query.delete().where({}).execute();
      this.logger.log(`Deleted ${result.affected} products.`);
      return result;
    } catch (error) {
      this.logger.error('Error removing all products', error);
      this.handleDatabaseExceptions(error);
    }
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
