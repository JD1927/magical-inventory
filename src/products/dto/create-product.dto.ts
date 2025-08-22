import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @IsPositive()
  minStock: number;

  @IsString()
  @IsOptional()
  @IsUUID()
  mainCategoryId?: string | null;

  @IsString()
  @IsOptional()
  @IsUUID()
  secondaryCategoryId?: string | null;
  // supplierId: string;
}
