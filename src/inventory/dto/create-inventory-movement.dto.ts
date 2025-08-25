import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { EMovementType } from '../entities/inventory-movements.entity';

export class CreateInventoryMovementDto {
  @IsUUID()
  @IsString()
  productId: string;

  @IsString()
  @IsEnum(EMovementType)
  type: EMovementType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @IsPositive()
  salePrice: number;

  @IsUUID()
  @IsString()
  @IsOptional()
  supplierId?: string;
}
