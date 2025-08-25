import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('/movements')
  findAllInventoryMovements() {
    return this.inventoryService.findAllInventoryMovements();
  }

  @Post('/movement')
  createMovement(@Body() createInventoryDto: CreateInventoryMovementDto) {
    return this.inventoryService.createMovement(createInventoryDto);
  }

  @Get('/movement/:id')
  findInventoryMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findInventoryMovement(id);
  }

  @Delete('/movement/:id')
  undoMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.undoMovement(id);
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
    return this.inventoryService.remove(id);
  }
}
