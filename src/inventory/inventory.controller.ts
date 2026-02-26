import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  InInventoryMovementDto,
  OutInventoryMovementDto,
  UpdateOutInventoryMovementDto,
} from './dto';
import { ProfitReportDto } from './dto/profit-report.dto';
import { InventoryService } from './inventory.service';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('inventory')
@Auth(UserRole.USER, UserRole.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('/profit-report')
  getProfitReport(@Query() profitReportDto: ProfitReportDto) {
    return this.inventoryService.getProfitReport(profitReportDto);
  }

  @Get('/movements')
  findAllInventoryMovements(
    @Query() movementQueryDto: InventoryMovementQueryDto,
  ) {
    return this.inventoryService.findAllInventoryMovements(movementQueryDto);
  }

  @Get('/movements/product/:id')
  removeAllInventoryMovementsByProduct(
    @Param('id', ParseUUIDPipe) productId: string,
  ) {
    return this.inventoryService.removeAllInventoryMovementsByProduct(
      productId,
    );
  }

  @Post('/movement/in')
  createInMovement(@Body() inInventoryMovementDto: InInventoryMovementDto) {
    return this.inventoryService.createInMovement(inInventoryMovementDto);
  }

  @Post('/movement/out')
  createOutMovement(@Body() outInventoryMovementDto: OutInventoryMovementDto) {
    return this.inventoryService.createOutMovement(outInventoryMovementDto);
  }

  @Patch('/movement/out/:id')
  updateOutMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInventoryMovementDto: UpdateOutInventoryMovementDto,
  ) {
    return this.inventoryService.updateOutMovement(
      id,
      updateInventoryMovementDto,
    );
  }

  @Get('/movement/:id')
  findInventoryMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findInventoryMovement(id);
  }

  @Delete('/movement/:id')
  undoMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.undoInventoryMovement(id);
  }

  @Get()
  findAll() {
    return this.inventoryService.findAllInventoryRecords();
  }

  @Get(':id')
  findInventoryRecord(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findInventoryRecord(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeInventoryRecord(id);
  }
}
