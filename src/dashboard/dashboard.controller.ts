import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SalesOverTimeDto, TopProductsDto } from './dto/dashboard-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('dashboard')
@Auth(UserRole.USER, UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('sales-over-time')
  getSalesOverTime(@Query() dto: SalesOverTimeDto) {
    return this.dashboardService.getSalesOverTime(dto);
  }

  @Get('top-products')
  getTopProducts(@Query() dto: TopProductsDto) {
    return this.dashboardService.getTopProducts(dto);
  }

  @Get('stock-alerts')
  getStockAlerts() {
    return this.dashboardService.getStockAlerts();
  }

  @Get('stock-by-category')
  getStockByCategory() {
    return this.dashboardService.getStockByCategory();
  }
}
