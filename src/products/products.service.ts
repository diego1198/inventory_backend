import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductCategory } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
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

  async findByCategory(category: ProductCategory): Promise<Product[]> {
    return this.productsRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }
}
