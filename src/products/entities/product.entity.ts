import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SaleItem } from '../../sales/entities/sale-item.entity';
import { Category } from '../../categories/categories.entity';

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  FOOD = 'food',
  BOOKS = 'books',
  OTHER = 'other',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  salePrice: number;

  @Column('int')
  stock: number;

  @Column('int', { default: 10 })
  minStock: number;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  brand: string;

  @ManyToOne(() => Category, category => category.products, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SaleItem, saleItem => saleItem.product)
  saleItems: SaleItem[];
}
