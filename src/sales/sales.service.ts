import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) { }

  async create(createSaleDto: CreateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generar número de factura único
      const invoiceNumber = await this.generateInvoiceNumber();

      let subtotal = 0;
      const saleItems: SaleItem[] = [];

      // Validar stock y calcular totales
      for (const item of createSaleDto.items) {
        const product = await this.productsRepository.findOne({
          where: { id: item.productId, isActive: true },
        });

        if (!product) {
          throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product.name}`);
        }

        // Actualizar stock
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // Crear item de venta
        const saleItem = this.saleItemsRepository.create({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.salePrice,
          purchasePrice: product.purchasePrice,
          total: product.salePrice * item.quantity,
        });

        saleItems.push(saleItem);
        subtotal += saleItem.total;
      }

      // Obtener IVA desde variable de entorno o usar 0 si no está definida
      const ivaRaw = process.env.IVA;
      const ivaRate = ivaRaw ? parseFloat(ivaRaw) : 0;
      const tax = subtotal * ivaRate;
      const total = subtotal + tax;

      // Crear la venta
      const sale = this.salesRepository.create({
        invoiceNumber,
        subtotal,
        tax,
        total,
        userId,
        status: SaleStatus.COMPLETED,
        notes: createSaleDto.notes,
      });

      const savedSale = await queryRunner.manager.save(sale);

      // Guardar items de venta
      for (const item of saleItems) {
        item.saleId = savedSale.id;
        await queryRunner.manager.save(item);
      }

      await queryRunner.commitTransaction();

      // Retornar la venta completa con items
      return this.findOne(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Sale[]> {
    return this.salesRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return sale;
  }

  async findByUser(userId: string): Promise<Sale[]> {
    return this.salesRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('sale.createdAt >= :startDate', { startDate })
      .andWhere('sale.createdAt <= :endDate', { endDate })
      .orderBy('sale.createdAt', 'DESC')
      .getMany();
  }

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const baseNumber = `F${year}${month}${day}`;

    const lastSale = await this.salesRepository.findOne({
      where: { invoiceNumber: Like(`${baseNumber}%`) },
      order: { invoiceNumber: 'DESC' },
    });

    if (!lastSale) {
      return `${baseNumber}001`;
    }

    const lastNumber = parseInt(lastSale.invoiceNumber.slice(-3));
    const newNumber = lastNumber + 1;

    return `${baseNumber}${String(newNumber).padStart(3, '0')}`;
  }
}
