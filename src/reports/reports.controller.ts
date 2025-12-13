import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, ReportPeriod } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Response } from 'express';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener resumen de KPIs del dashboard' })
  @ApiResponse({ status: 200, description: 'Resumen de métricas principales' })
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Obtener reporte de ventas por período' })
  @ApiResponse({ status: 200, description: 'Reporte de ventas generado' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year'], required: false, description: 'Período del reporte' })
  @ApiQuery({ name: 'date', description: 'Fecha de referencia (YYYY-MM-DD)', required: false })
  getSalesReport(
    @Query('period') period: ReportPeriod = 'month',
    @Query('date') date?: string,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    return this.reportsService.getSalesReportByPeriod(period, referenceDate);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Obtener reporte diario de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte diario generado' })
  @ApiQuery({ name: 'date', description: 'Fecha (YYYY-MM-DD)', required: false })
  getDailyReport(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailyReport(targetDate);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Obtener reporte semanal de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte semanal generado' })
  @ApiQuery({ name: 'date', description: 'Fecha de referencia (YYYY-MM-DD)', required: false })
  getWeeklyReport(@Query('date') date?: string) {
    const referenceDate = date ? new Date(date) : new Date();
    return this.reportsService.getWeeklyReport(referenceDate);
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

  @Get('quarterly')
  @ApiOperation({ summary: 'Obtener reporte trimestral de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte trimestral generado' })
  @ApiQuery({ name: 'year', description: 'Año', required: false })
  @ApiQuery({ name: 'quarter', description: 'Trimestre (1-4)', required: false })
  getQuarterlyReport(
    @Query('year') year?: number,
    @Query('quarter') quarter?: number,
  ) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetQuarter = quarter || Math.floor(currentDate.getMonth() / 3) + 1;
    
    return this.reportsService.getQuarterlyReport(targetYear, targetQuarter);
  }

  @Get('yearly')
  @ApiOperation({ summary: 'Obtener reporte anual de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte anual generado' })
  @ApiQuery({ name: 'year', description: 'Año', required: false })
  getYearlyReport(@Query('year') year?: number) {
    const targetYear = year || new Date().getFullYear();
    return this.reportsService.getYearlyReport(targetYear);
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener reporte de inventario' })
  @ApiResponse({ status: 200, description: 'Reporte de inventario generado' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  // ==================== EXPORTACIÓN ====================

  @Get('export/sales/excel')
  @ApiOperation({ summary: 'Exportar reporte de ventas a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel descargado' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year'], required: false })
  @ApiQuery({ name: 'date', description: 'Fecha de referencia (YYYY-MM-DD)', required: false })
  async exportSalesExcel(
    @Query('period') period: ReportPeriod = 'month',
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    await this.reportsService.exportSalesReportExcel(period, referenceDate, res);
  }

  @Get('export/sales/csv')
  @ApiOperation({ summary: 'Exportar reporte de ventas a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV descargado' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'quarter', 'year'], required: false })
  @ApiQuery({ name: 'date', description: 'Fecha de referencia (YYYY-MM-DD)', required: false })
  async exportSalesCSV(
    @Query('period') period: ReportPeriod = 'month',
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    await this.reportsService.exportSalesReportCSV(period, referenceDate, res);
  }

  @Get('export/inventory/excel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar reporte de inventario a Excel' })
  @ApiResponse({ status: 200, description: 'Archivo Excel descargado' })
  async exportInventoryExcel(@Res() res: Response) {
    await this.reportsService.exportInventoryReportExcel(res);
  }

  @Get('export/inventory/csv')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar reporte de inventario a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV descargado' })
  async exportInventoryCSV(@Res() res: Response) {
    await this.reportsService.exportInventoryReportCSV(res);
  }
}
