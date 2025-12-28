import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EMovementType } from '../entities/inventory-movements.entity';

export enum EOrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class InventoryMovementQueryDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsEnum(EOrderBy)
  @IsOptional()
  orderBy?: EOrderBy;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  limit?: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  offset?: number;

  @IsEnum(EMovementType)
  @IsOptional()
  type?: EMovementType;
}
