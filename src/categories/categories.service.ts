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

  findAll() {
    this.logger.log('Finding all categories');
    return this.categoryRepository.find();
  }

  findOne(id: string): Promise<Category | null> {
    this.logger.log(`Finding category with id: ${id}`);
    return this.categoryRepository.findOneBy({ id });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    console.log(
      '🚀 ~ CategoriesService ~ update ~ updateCategoryDto:',
      updateCategoryDto,
    );
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
    const category: Category | null = await this.findOne(id);
    // Little guard clause to ensure product exists
    if (!category) return;
    await this.categoryRepository.remove(category);
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
