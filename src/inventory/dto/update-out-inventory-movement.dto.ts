import { IsEnum } from 'class-validator';
import { EPurchaseOrderStatus } from '../entities/inventory-movements.entity';

export class UpdateOutInventoryMovementDto {
  @IsEnum(EPurchaseOrderStatus)
  purchaseOrderStatus: EPurchaseOrderStatus;
}
