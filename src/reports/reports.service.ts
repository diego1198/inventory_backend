import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';

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

  async getDailyReport(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.salesRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);

    // Calcular total de ganancia
    let totalProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product) {
          totalProfit += (Number(item.unitPrice) - Number(item.product.purchasePrice)) * item.quantity;
        }
      });
    });

    // Productos más vendidos del día
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const existing = productSales.get(productId);
        
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total);
        } else {
          productSales.set(productId, {
            name: item.product.name,
            quantity: item.quantity,
            revenue: Number(item.total),
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalSales,
      totalRevenue,
      totalTax,
      totalProfit,
      topProducts,
      sales: sales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        total: sale.total,
        createdAt: sale.createdAt,
      })),
    };
  }

  async getMonthlyReport(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sales = await this.salesRepository.find({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
        status: SaleStatus.COMPLETED,
      },
      relations: ['items', 'items.product'],
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);

    // Calcular total de ganancia
    let totalProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product) {
          totalProfit += (Number(item.unitPrice) - Number(item.product.purchasePrice)) * item.quantity;
        }
      });
    });

    // Ventas por día del mes
    const dailySales = new Map<number, { sales: number; revenue: number }>();
    
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      dailySales.set(day, { sales: 0, revenue: 0 });
    }

    sales.forEach(sale => {
      const day = sale.createdAt.getDate();
      const existing = dailySales.get(day);
      existing.sales += 1;
      existing.revenue += Number(sale.total);
    });

    // Productos más vendidos del mes
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const existing = productSales.get(productId);
        
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total);
        } else {
          productSales.set(productId, {
            name: item.product.name,
            quantity: item.quantity,
            revenue: Number(item.total),
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' }),
      totalSales,
      totalRevenue,
      totalTax,
      totalProfit,
      dailySales: Array.from(dailySales.entries()).map(([day, data]) => ({
        day,
        ...data,
      })),
      topProducts,
    };
  }

  async getInventoryReport() {
    const products = await this.productsRepository.find({
      where: { isActive: true },
      order: { stock: 'ASC' },
    });

    const lowStockProducts = products.filter(product => product.stock < 10);
    const outOfStockProducts = products.filter(product => product.stock === 0);
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.stock * Number(product.salePrice)), 0);

    return {
      totalProducts,
      totalValue,
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        salePrice: product.salePrice,
      })),
      outOfStockProducts: outOfStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        salePrice: product.salePrice,
      })),
      productsByCategory: this.groupProductsByCategory(products),
    };
  }

  private groupProductsByCategory(products: Product[]) {
    const grouped = new Map<string, { count: number; value: number }>();
    
    products.forEach(product => {
      const categoryName = product.category?.name || 'Sin categoría';
      const existing = grouped.get(categoryName) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += product.stock * Number(product.salePrice);
      grouped.set(categoryName, existing);
    });

    return Array.from(grouped.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
}
}
