import {
  IsBoolean,
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
  @IsOptional()
  @Min(0)
  salePrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentPurchasePrice?: number;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
