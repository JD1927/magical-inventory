import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InInventoryMovementDto } from './dto/in-inventory-movement.dto';
import { OutInventoryMovementDto } from './dto/out-inventory-movement.dto';
import { ProfitReportDto } from './dto/profit-report.dto';
import { InventoryService } from './inventory.service';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';

@Controller('inventory')
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
