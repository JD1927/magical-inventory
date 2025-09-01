import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
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
