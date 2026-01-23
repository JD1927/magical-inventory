import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';
import { EPurchaseOrderStatus } from '../entities/inventory-movements.entity';

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

  @IsEnum(EPurchaseOrderStatus)
  purchaseOrderStatus?: EPurchaseOrderStatus;
}
