import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Obtener reporte diario de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte diario generado' })
  @ApiQuery({ name: 'date', description: 'Fecha (YYYY-MM-DD)', required: false })
  getDailyReport(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailyReport(targetDate);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Obtener reporte mensual de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte mensual generado' })
  @ApiQuery({ name: 'year', description: 'Año', required: false })
  @ApiQuery({ name: 'month', description: 'Mes (1-12)', required: false })
  getMonthlyReport(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;
    
    return this.reportsService.getMonthlyReport(targetYear, targetMonth);
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener reporte de inventario' })
  @ApiResponse({ status: 200, description: 'Reporte de inventario generado' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }
}
