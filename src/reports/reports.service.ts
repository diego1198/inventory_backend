import { Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  // Utilidad para obtener rangos de fechas
  private getDateRange(period: ReportPeriod, referenceDate: Date = new Date()) {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'day':
        // Ya está configurado para el día
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(end.getDate() + (6 - dayOfWeek));
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        end.setMonth(quarter * 3 + 3, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        break;
    }

    return { start, end };
  }

  // Obtener resumen de KPIs principales
  async getDashboardSummary() {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Obtener ventas del día
    const dailySales = await this.salesRepository.find({
      where: {
        createdAt: Between(todayStart, todayEnd),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });

    // Obtener ventas de la semana
    const weeklySales = await this.salesRepository.find({
      where: {
        createdAt: Between(weekStart, weekEnd),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });

    // Obtener ventas del mes
    const monthlySales = await this.salesRepository.find({
      where: {
        createdAt: Between(monthStart, monthEnd),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });

    // Calcular métricas diarias
    const dailyData = this.calculateSalesMetrics(dailySales);
    
    // Calcular métricas semanales
    const weeklyData = this.calculateSalesMetrics(weeklySales);
    
    // Calcular métricas mensuales
    const monthlyData = this.calculateSalesMetrics(monthlySales);

    // Calcular promedio de ticket
    const avgDailyTicket = dailyData.totalSales > 0 ? dailyData.totalRevenue / dailyData.totalSales : 0;
    const avgMonthlyTicket = monthlyData.totalSales > 0 ? monthlyData.totalRevenue / monthlyData.totalSales : 0;

    // Comparativa con período anterior (mes anterior)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    
    const lastMonthSales = await this.salesRepository.find({
      where: {
        createdAt: Between(lastMonthStart, lastMonthEnd),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });
    const lastMonthData = this.calculateSalesMetrics(lastMonthSales);

    // Calcular porcentaje de crecimiento
    const revenueGrowth = lastMonthData.totalRevenue > 0 
      ? ((monthlyData.totalRevenue - lastMonthData.totalRevenue) / lastMonthData.totalRevenue) * 100 
      : 0;

    const profitGrowth = lastMonthData.totalProfit > 0 
      ? ((monthlyData.totalProfit - lastMonthData.totalProfit) / lastMonthData.totalProfit) * 100 
      : 0;

    return {
      daily: {
        totalSales: dailyData.totalSales,
        totalRevenue: dailyData.totalRevenue,
        totalProfit: dailyData.totalProfit,
        totalTax: dailyData.totalTax,
        avgTicket: avgDailyTicket,
        totalItemsSold: dailyData.totalItemsSold,
      },
      weekly: {
        totalSales: weeklyData.totalSales,
        totalRevenue: weeklyData.totalRevenue,
        totalProfit: weeklyData.totalProfit,
        totalTax: weeklyData.totalTax,
        totalItemsSold: weeklyData.totalItemsSold,
      },
      monthly: {
        totalSales: monthlyData.totalSales,
        totalRevenue: monthlyData.totalRevenue,
        totalProfit: monthlyData.totalProfit,
        totalTax: monthlyData.totalTax,
        avgTicket: avgMonthlyTicket,
        totalItemsSold: monthlyData.totalItemsSold,
      },
      comparison: {
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        profitGrowth: Number(profitGrowth.toFixed(2)),
        lastMonthRevenue: lastMonthData.totalRevenue,
        lastMonthProfit: lastMonthData.totalProfit,
      },
      profitMargin: monthlyData.totalRevenue > 0 
        ? Number(((monthlyData.totalProfit / monthlyData.totalRevenue) * 100).toFixed(2)) 
        : 0,
    };
  }

  private calculateSalesMetrics(sales: Sale[]) {
    let totalRevenue = 0;
    let totalTax = 0;
    let totalProfit = 0;
    let totalItemsSold = 0;

    sales.forEach(sale => {
      totalRevenue += Number(sale.total);
      totalTax += Number(sale.tax);
      
      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        if (item.product) {
          totalProfit += (Number(item.unitPrice) - Number(item.product.purchasePrice)) * item.quantity;
        }
      });
    });

    return {
      totalSales: sales.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalItemsSold,
    };
  }

  // Reporte por período flexible
  async getSalesReportByPeriod(period: ReportPeriod, referenceDate: Date = new Date()) {
    const { start, end } = this.getDateRange(period, referenceDate);

    const sales = await this.salesRepository.find({
      where: {
        createdAt: Between(start, end),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });

    const metrics = this.calculateSalesMetrics(sales);

    // Agrupar ventas por sub-período
    const salesBySubPeriod = this.groupSalesBySubPeriod(sales, period);

    // Top productos
    const topProducts = this.getTopProducts(sales, 10);

    // Ventas por vendedor
    const salesByUser = this.getSalesByUser(sales);

    return {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      ...metrics,
      avgTicket: metrics.totalSales > 0 ? Number((metrics.totalRevenue / metrics.totalSales).toFixed(2)) : 0,
      profitMargin: metrics.totalRevenue > 0 ? Number(((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(2)) : 0,
      salesBySubPeriod,
      topProducts,
      salesByUser,
      sales: sales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        total: sale.total,
        createdAt: sale.createdAt,
        userName: sale.user?.firstName + ' ' + sale.user?.lastName,
        itemsCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    };
  }

  private groupSalesBySubPeriod(sales: Sale[], period: ReportPeriod) {
    const grouped = new Map<string, { label: string; sales: number; revenue: number; profit: number }>();

    sales.forEach(sale => {
      let key: string;
      let label: string;
      const date = new Date(sale.createdAt);

      switch (period) {
        case 'day':
          const hour = date.getHours();
          key = `${hour}`;
          label = `${hour}:00 - ${hour + 1}:00`;
          break;
        case 'week':
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          key = `${date.getDay()}`;
          label = dayNames[date.getDay()];
          break;
        case 'month':
          key = `${date.getDate()}`;
          label = `Día ${date.getDate()}`;
          break;
        case 'quarter':
        case 'year':
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          key = `${date.getMonth()}`;
          label = monthNames[date.getMonth()];
          break;
        default:
          key = date.toISOString().split('T')[0];
          label = key;
      }

      const existing = grouped.get(key) || { label, sales: 0, revenue: 0, profit: 0 };
      existing.sales += 1;
      existing.revenue += Number(sale.total);
      
      sale.items.forEach(item => {
        if (item.product) {
          existing.profit += (Number(item.unitPrice) - Number(item.product.purchasePrice)) * item.quantity;
        }
      });

      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([_, data]) => ({
        ...data,
        revenue: Number(data.revenue.toFixed(2)),
        profit: Number(data.profit.toFixed(2)),
      }));
  }

  private getTopProducts(sales: Sale[], limit: number = 10) {
    const productSales = new Map<string, { 
      id: string;
      name: string; 
      code: string;
      quantity: number; 
      revenue: number;
      profit: number;
    }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.product) return;
        
        const productId = item.productId;
        const existing = productSales.get(productId);
        const itemProfit = (Number(item.unitPrice) - Number(item.product.purchasePrice)) * item.quantity;

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total);
          existing.profit += itemProfit;
        } else {
          productSales.set(productId, {
            id: productId,
            name: item.product.name,
            code: item.product.code || '',
            quantity: item.quantity,
            revenue: Number(item.total),
            profit: itemProfit,
          });
        }
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
        profit: Number(p.profit.toFixed(2)),
      }));
  }

  private getSalesByUser(sales: Sale[]) {
    const userSales = new Map<string, { 
      userId: string;
      userName: string; 
      totalSales: number; 
      totalRevenue: number;
    }>();

    sales.forEach(sale => {
      const userId = sale.userId;
      const userName = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Usuario desconocido';
      const existing = userSales.get(userId);

      if (existing) {
        existing.totalSales += 1;
        existing.totalRevenue += Number(sale.total);
      } else {
        userSales.set(userId, {
          userId,
          userName,
          totalSales: 1,
          totalRevenue: Number(sale.total),
        });
      }
    });

    return Array.from(userSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map(u => ({
        ...u,
        totalRevenue: Number(u.totalRevenue.toFixed(2)),
      }));
  }

  async getDailyReport(date: Date = new Date()) {
    return this.getSalesReportByPeriod('day', date);
  }

  async getMonthlyReport(year: number, month: number) {
    const referenceDate = new Date(year, month - 1, 15);
    return this.getSalesReportByPeriod('month', referenceDate);
  }

  async getWeeklyReport(referenceDate: Date = new Date()) {
    return this.getSalesReportByPeriod('week', referenceDate);
  }

  async getQuarterlyReport(year: number, quarter: number) {
    const referenceDate = new Date(year, (quarter - 1) * 3 + 1, 15);
    return this.getSalesReportByPeriod('quarter', referenceDate);
  }

  async getYearlyReport(year: number) {
    const referenceDate = new Date(year, 6, 1);
    return this.getSalesReportByPeriod('year', referenceDate);
  }

  async getInventoryReport() {
    const products = await this.productsRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { stock: 'ASC' },
    });

    const lowStockProducts = products.filter(product => product.stock <= (product.minStock || 10));
    const outOfStockProducts = products.filter(product => product.stock === 0);
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.stock * Number(product.salePrice)), 0);
    const totalCost = products.reduce((sum, product) => sum + (product.stock * Number(product.purchasePrice)), 0);
    const potentialProfit = totalValue - totalCost;

    return {
      totalProducts,
      totalValue: Number(totalValue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        stock: product.stock,
        minStock: product.minStock || 10,
        salePrice: product.salePrice,
        category: product.category?.name || 'Sin categoría',
      })),
      outOfStockProducts: outOfStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        salePrice: product.salePrice,
        category: product.category?.name || 'Sin categoría',
      })),
      productsByCategory: this.groupProductsByCategory(products),
    };
  }

  private groupProductsByCategory(products: Product[]) {
    const grouped = new Map<string, { count: number; value: number; cost: number }>();
    
    products.forEach(product => {
      const categoryName = product.category?.name || 'Sin categoría';
      const existing = grouped.get(categoryName) || { count: 0, value: 0, cost: 0 };
      existing.count += 1;
      existing.value += product.stock * Number(product.salePrice);
      existing.cost += product.stock * Number(product.purchasePrice);
      grouped.set(categoryName, existing);
    });

    return Array.from(grouped.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      value: Number(data.value.toFixed(2)),
      cost: Number(data.cost.toFixed(2)),
      profit: Number((data.value - data.cost).toFixed(2)),
    }));
  }

  // ==================== EXPORTACIÓN EXCEL/CSV ====================

  async exportSalesReportExcel(
    period: ReportPeriod, 
    referenceDate: Date, 
    res: Response
  ) {
    const report = await this.getSalesReportByPeriod(period, referenceDate);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.created = new Date();

    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 20 },
    ];

    const periodLabels = {
      day: 'Diario',
      week: 'Semanal',
      month: 'Mensual',
      quarter: 'Trimestral',
      year: 'Anual',
    };

    summarySheet.addRows([
      { metric: 'Tipo de Reporte', value: periodLabels[period] },
      { metric: 'Fecha Inicio', value: new Date(report.startDate).toLocaleDateString('es-ES') },
      { metric: 'Fecha Fin', value: new Date(report.endDate).toLocaleDateString('es-ES') },
      { metric: '', value: '' },
      { metric: 'Total de Ventas', value: report.totalSales },
      { metric: 'Total Ingresos', value: `$${report.totalRevenue.toFixed(2)}` },
      { metric: 'Total Ganancia', value: `$${report.totalProfit.toFixed(2)}` },
      { metric: 'Total Impuestos', value: `$${report.totalTax.toFixed(2)}` },
      { metric: 'Ticket Promedio', value: `$${report.avgTicket.toFixed(2)}` },
      { metric: 'Margen de Ganancia', value: `${report.profitMargin}%` },
      { metric: 'Items Vendidos', value: report.totalItemsSold },
    ]);

    // Estilo para encabezados
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    // Hoja de Ventas
    const salesSheet = workbook.addWorksheet('Ventas');
    salesSheet.columns = [
      { header: 'Nº Factura', key: 'invoiceNumber', width: 20 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Vendedor', key: 'userName', width: 25 },
      { header: 'Items', key: 'itemsCount', width: 10 },
    ];

    report.sales.forEach(sale => {
      salesSheet.addRow({
        invoiceNumber: sale.invoiceNumber,
        date: new Date(sale.createdAt).toLocaleString('es-ES'),
        total: Number(sale.total).toFixed(2),
        userName: sale.userName,
        itemsCount: sale.itemsCount,
      });
    });

    salesSheet.getRow(1).font = { bold: true };
    salesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    salesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    // Hoja de Top Productos
    const productsSheet = workbook.addWorksheet('Top Productos');
    productsSheet.columns = [
      { header: 'Producto', key: 'name', width: 35 },
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Ingresos', key: 'revenue', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
    ];

    report.topProducts.forEach(product => {
      productsSheet.addRow({
        name: product.name,
        code: product.code,
        quantity: product.quantity,
        revenue: `$${product.revenue.toFixed(2)}`,
        profit: `$${product.profit.toFixed(2)}`,
      });
    });

    productsSheet.getRow(1).font = { bold: true };
    productsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    productsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    // Hoja de Ventas por Período
    const periodSheet = workbook.addWorksheet('Por Período');
    periodSheet.columns = [
      { header: 'Período', key: 'label', width: 20 },
      { header: 'Ventas', key: 'sales', width: 12 },
      { header: 'Ingresos', key: 'revenue', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
    ];

    report.salesBySubPeriod.forEach(item => {
      periodSheet.addRow({
        label: item.label,
        sales: item.sales,
        revenue: `$${item.revenue.toFixed(2)}`,
        profit: `$${item.profit.toFixed(2)}`,
      });
    });

    periodSheet.getRow(1).font = { bold: true };
    periodSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    periodSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    // Configurar respuesta
    const fileName = `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportSalesReportCSV(
    period: ReportPeriod, 
    referenceDate: Date, 
    res: Response
  ) {
    const report = await this.getSalesReportByPeriod(period, referenceDate);
    
    // Crear contenido CSV
    let csvContent = '';
    
    // Encabezado
    csvContent += 'REPORTE DE VENTAS\n';
    csvContent += `Período,${period}\n`;
    csvContent += `Fecha Inicio,${new Date(report.startDate).toLocaleDateString('es-ES')}\n`;
    csvContent += `Fecha Fin,${new Date(report.endDate).toLocaleDateString('es-ES')}\n\n`;
    
    // Resumen
    csvContent += 'RESUMEN\n';
    csvContent += `Total Ventas,${report.totalSales}\n`;
    csvContent += `Total Ingresos,$${report.totalRevenue.toFixed(2)}\n`;
    csvContent += `Total Ganancia,$${report.totalProfit.toFixed(2)}\n`;
    csvContent += `Total Impuestos,$${report.totalTax.toFixed(2)}\n`;
    csvContent += `Ticket Promedio,$${report.avgTicket.toFixed(2)}\n`;
    csvContent += `Margen de Ganancia,${report.profitMargin}%\n`;
    csvContent += `Items Vendidos,${report.totalItemsSold}\n\n`;
    
    // Ventas
    csvContent += 'DETALLE DE VENTAS\n';
    csvContent += 'Nº Factura,Fecha,Total,Vendedor,Items\n';
    report.sales.forEach(sale => {
      csvContent += `${sale.invoiceNumber},${new Date(sale.createdAt).toLocaleString('es-ES')},$${Number(sale.total).toFixed(2)},${sale.userName},${sale.itemsCount}\n`;
    });
    csvContent += '\n';
    
    // Top Productos
    csvContent += 'TOP PRODUCTOS\n';
    csvContent += 'Producto,Código,Cantidad,Ingresos,Ganancia\n';
    report.topProducts.forEach(product => {
      csvContent += `"${product.name}",${product.code},${product.quantity},$${product.revenue.toFixed(2)},$${product.profit.toFixed(2)}\n`;
    });

    const fileName = `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 compatibility
  }

  async exportInventoryReportExcel(res: Response) {
    const report = await this.getInventoryReport();
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.created = new Date();

    // Hoja de Resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Fecha del Reporte', value: new Date().toLocaleDateString('es-ES') },
      { metric: '', value: '' },
      { metric: 'Total de Productos', value: report.totalProducts },
      { metric: 'Valor Total (Venta)', value: `$${report.totalValue.toFixed(2)}` },
      { metric: 'Costo Total', value: `$${report.totalCost.toFixed(2)}` },
      { metric: 'Ganancia Potencial', value: `$${report.potentialProfit.toFixed(2)}` },
      { metric: 'Productos con Stock Bajo', value: report.lowStockCount },
      { metric: 'Productos Sin Stock', value: report.outOfStockCount },
    ]);

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    // Hoja de Productos con Stock Bajo
    const lowStockSheet = workbook.addWorksheet('Stock Bajo');
    lowStockSheet.columns = [
      { header: 'Producto', key: 'name', width: 35 },
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Stock Actual', key: 'stock', width: 15 },
      { header: 'Stock Mínimo', key: 'minStock', width: 15 },
      { header: 'Precio Venta', key: 'salePrice', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
    ];

    report.lowStockProducts.forEach(product => {
      lowStockSheet.addRow({
        name: product.name,
        code: product.code,
        stock: product.stock,
        minStock: product.minStock,
        salePrice: `$${Number(product.salePrice).toFixed(2)}`,
        category: product.category,
      });
    });

    lowStockSheet.getRow(1).font = { bold: true };
    lowStockSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC000' },
    };

    // Hoja por Categorías
    const categorySheet = workbook.addWorksheet('Por Categoría');
    categorySheet.columns = [
      { header: 'Categoría', key: 'category', width: 25 },
      { header: 'Productos', key: 'count', width: 12 },
      { header: 'Valor (Venta)', key: 'value', width: 15 },
      { header: 'Costo', key: 'cost', width: 15 },
      { header: 'Ganancia Pot.', key: 'profit', width: 15 },
    ];

    report.productsByCategory.forEach(cat => {
      categorySheet.addRow({
        category: cat.category,
        count: cat.count,
        value: `$${cat.value.toFixed(2)}`,
        cost: `$${cat.cost.toFixed(2)}`,
        profit: `$${cat.profit.toFixed(2)}`,
      });
    });

    categorySheet.getRow(1).font = { bold: true };
    categorySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    categorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    const fileName = `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportInventoryReportCSV(res: Response) {
    const report = await this.getInventoryReport();
    
    let csvContent = '';
    
    csvContent += 'REPORTE DE INVENTARIO\n';
    csvContent += `Fecha,${new Date().toLocaleDateString('es-ES')}\n\n`;
    
    csvContent += 'RESUMEN\n';
    csvContent += `Total Productos,${report.totalProducts}\n`;
    csvContent += `Valor Total (Venta),$${report.totalValue.toFixed(2)}\n`;
    csvContent += `Costo Total,$${report.totalCost.toFixed(2)}\n`;
    csvContent += `Ganancia Potencial,$${report.potentialProfit.toFixed(2)}\n`;
    csvContent += `Productos Stock Bajo,${report.lowStockCount}\n`;
    csvContent += `Productos Sin Stock,${report.outOfStockCount}\n\n`;
    
    csvContent += 'PRODUCTOS CON STOCK BAJO\n';
    csvContent += 'Producto,Código,Stock Actual,Stock Mínimo,Precio Venta,Categoría\n';
    report.lowStockProducts.forEach(product => {
      csvContent += `"${product.name}",${product.code},${product.stock},${product.minStock},$${Number(product.salePrice).toFixed(2)},"${product.category}"\n`;
    });
    csvContent += '\n';
    
    csvContent += 'POR CATEGORÍA\n';
    csvContent += 'Categoría,Productos,Valor (Venta),Costo,Ganancia Potencial\n';
    report.productsByCategory.forEach(cat => {
      csvContent += `"${cat.category}",${cat.count},$${cat.value.toFixed(2)},$${cat.cost.toFixed(2)},$${cat.profit.toFixed(2)}\n`;
    });

    const fileName = `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvContent);
  }
}
