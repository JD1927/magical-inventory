import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoryService: CategoriesService,
    private readonly dataSource: DataSource,
  ) {
    this.logger.log('ProductsService initialized');
  }

  async create(
    createProductDto: CreateProductDto,
  ): Promise<Product | undefined> {
    // Validate products categories
    const { mainCategoryId, secondaryCategoryId, ...toCreate } =
      createProductDto;

    // Validate if mainCategoryId and secondaryCategoryId are valid categories
    const { mainCategory, secondaryCategory } =
      await this.validateMainAndSecondaryCategories(
        mainCategoryId,
        secondaryCategoryId,
      );

    try {
      const product: Product = this.productRepository.create({
        ...toCreate,
        mainCategory,
        secondaryCategory,
      });

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

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null | undefined> {
    const entityLike = { ...updateProductDto, id };

    // Validate if mainCategoryId and secondaryCategoryId are valid categories
    const product: Product | undefined = await this.productRepository.preload({
      ...entityLike,
    });
    // Little guard clause to ensure product exists
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    // Get the mainCategoryId and secondaryCategoryId from the DTO
    const { mainCategoryId, secondaryCategoryId } = updateProductDto;
    // Validate categories
    const { mainCategory, secondaryCategory } =
      await this.validateMainAndSecondaryCategories(
        mainCategoryId,
        secondaryCategoryId,
      );

    // Create query runner to manage transaction
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Start transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Update product with new values
      // If mainCategoryId is provided (either with a value or null), set the category
      if (mainCategoryId !== undefined) product.mainCategory = mainCategory;
      // If secondaryCategory is provided (either with a value or null), set the category
      if (secondaryCategoryId !== undefined)
        product.secondaryCategory = secondaryCategory;
      // Save the product
      await queryRunner.manager.save(product);
      // Commit transaction
      await queryRunner.commitTransaction();
      this.logger.log(`Product with id '${id}' updated successfully`);
      // Return the updated product
      return this.findOne(id);
    } catch (error) {
      this.logger.error('Error updating product', error);
      await queryRunner.rollbackTransaction();
      this.handleDatabaseExceptions(error);
    } finally {
      await queryRunner.release();
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

  private async checkIfHasValidCategory(id: string, isMainCategory = false) {
    const foundCategory: Category | null =
      await this.categoryService.findOne(id);

    if (!foundCategory)
      throw new BadRequestException(`Category with id '${id}' not found`);

    if (isMainCategory !== foundCategory.isMain) {
      throw new BadRequestException(
        `Category with id '${id}' is not a ${isMainCategory ? 'main' : 'secondary'} category`,
      );
    }

    return foundCategory;
  }

  private async validateMainAndSecondaryCategories(
    mainCategoryId: string | null | undefined,
    secondaryCategoryId: string | null | undefined,
  ) {
    let mainCategory: Category | null = null;
    let secondaryCategory: Category | null = null;

    if (mainCategoryId) {
      mainCategory = await this.checkIfHasValidCategory(mainCategoryId, true);
    }
    if (secondaryCategoryId) {
      secondaryCategory =
        await this.checkIfHasValidCategory(secondaryCategoryId);
    }

    return { mainCategory, secondaryCategory };
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
