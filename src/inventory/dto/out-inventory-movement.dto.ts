import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';

export class OutInventoryMovementDto {
  @IsUUID()
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Max(100)
  discountPercent?: number;

  @IsUUID()
  @IsString()
  @IsOptional()
  supplierId?: string;
}
