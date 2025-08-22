import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const supplier = this.suppliersRepository.create(createSupplierDto);

      const result = await this.suppliersRepository.save(supplier);

      return result;
    } catch (error) {
      this.logger.error('Error creating supplier', error);
      this.handleDatabaseExceptions(error);
    }
  }

  findAll() {
    this.logger.log('Finding all categories');
    return this.suppliersRepository.find();
  }

  findOne(id: string) {
    this.logger.log(`Finding category with id: ${id}`);
    return this.suppliersRepository.findOneBy({ id });
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const entityLike = { ...updateSupplierDto, id };

    try {
      const supplier: Supplier | undefined =
        await this.suppliersRepository.preload(entityLike);

      if (!supplier) {
        throw new NotFoundException(`Category with id "${id}" not found`);
      }

      return await this.suppliersRepository.save(supplier);
    } catch (error) {
      this.logger.error('Error updating category', error);
      this.handleDatabaseExceptions(error);
    }
  }

  async remove(id: string) {
    const supplier: Supplier | null = await this.findOne(id);
    // Little guard clause to ensure supplier exists
    if (!supplier) return;
    await this.suppliersRepository.remove(supplier);
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
