import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class InInventoryMovementDto {
  @IsUUID()
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Min(100)
  @Max(300)
  profitMarginPercentage?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  salePrice?: number;

  @IsUUID()
  @IsString()
  @IsOptional()
  supplierId?: string;
}
