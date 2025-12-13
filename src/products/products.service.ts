import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/categories.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Buscar la categoría por ID y asociarla al producto
    const { categoryId, ...rest } = createProductDto;
    const category = await this.productsRepository.manager.findOne(Category, { where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException('Categoría no encontrada');
    }
    const product = this.productsRepository.create({ ...rest, category });
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const { categoryId, ...rest } = updateProductDto;
    const category = await this.productsRepository.manager.findOne(Category, { where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException('Categoría no encontrada');
    }
    const product = await this.findOne(id);
    Object.assign(product, { ...rest, category });
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepository.save(product);
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const product = await this.findOne(id);

    if (operation === 'subtract' && product.stock < quantity) {
      throw new BadRequestException('Stock insuficiente');
    }

    product.stock = operation === 'add'
      ? product.stock + quantity
      : product.stock - quantity;

    return this.productsRepository.save(product);
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    // Buscar productos por el id de la categoría (entidad)
    return this.productsRepository.find({
      where: { category: { id: categoryId }, isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { code, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado con este código');
    }

    return product;
  }

  async getLowStockAlerts(): Promise<{
    lowStockCount: number;
    outOfStockCount: number;
    lowStockProducts: Product[];
    outOfStockProducts: Product[];
    totalAlerts: number;
  }> {
    const products = await this.productsRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { stock: 'ASC' },
    });

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock <= (product.minStock || 10)
    );
    
    const outOfStockProducts = products.filter(
      (product) => product.stock === 0
    );

    return {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
      totalAlerts: lowStockProducts.length + outOfStockProducts.length,
    };
  }
}
