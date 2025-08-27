import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @ManyToOne(() => Sale, sale => sale.items)
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  saleId: string;

  @ManyToOne(() => Product, product => product.saleItems)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
