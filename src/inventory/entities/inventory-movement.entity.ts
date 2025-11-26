import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
}

@Entity('inventory_movements')
export class InventoryMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({
        type: 'enum',
        enum: MovementType,
    })
    type: MovementType;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    unitPrice: number;

    @Column({ nullable: true })
    reason: string;

    @Column({ nullable: true })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
