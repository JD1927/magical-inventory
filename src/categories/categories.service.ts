import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  private readonly logger: Logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    this.logger.log('CategoriesService initialized');
  }

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category | undefined> {
    try {
      const category = this.categoryRepository.create(createCategoryDto);

      const result = await this.categoryRepository.save(category);

      return result;
    } catch (error) {
      this.logger.error('Error creating category', error);
      this.handleDatabaseExceptions(error);
    }
  }

  findAll(filterCategoryDto: FilterCategoryDto) {
    const { isMain } = filterCategoryDto;
    this.logger.log('Finding all categories');
    return this.categoryRepository.find({ where: { isMain } });
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const entityLike = { ...updateCategoryDto, id };

    try {
      const category: Category | undefined =
        await this.categoryRepository.preload(entityLike);

      if (!category) {
        throw new NotFoundException(`Category with id "${id}" not found`);
      }

      return await this.categoryRepository.save(category);
    } catch (error) {
      this.logger.error('Error updating category', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async remove(id: string) {
    const category: Category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    return {
      message: `Category '${category.name}' has been successfully removed from the inventory!`,
    };
  }

  async removeAll() {
    try {
      const query = this.categoryRepository.createQueryBuilder('category');
      const result = await query.delete().where({}).execute();
      this.logger.log(`Deleted ${result.affected} categories.`);
      return result;
    } catch (error) {
      this.logger.error('Error removing all categories', error);
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
