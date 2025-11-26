import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryMovement)
        private movementsRepository: Repository<InventoryMovement>,
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        private dataSource: DataSource,
    ) { }

    async create(createDto: CreateInventoryMovementDto, userId: string): Promise<InventoryMovement> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const product = await queryRunner.manager.findOne(Product, {
                where: { id: createDto.productId },
            });

            if (!product) {
                throw new NotFoundException('Producto no encontrado');
            }

            // Update stock and calculate weighted average cost if applicable
            if (createDto.type === MovementType.IN) {
                if (createDto.unitPrice !== undefined && createDto.unitPrice > 0) {
                    // Weighted Average Cost Formula:
                    // New Price = ((Current Stock * Current Price) + (New Qty * New Price)) / (Current Stock + New Qty)
                    const currentTotalValue = Number(product.stock) * Number(product.purchasePrice);
                    const newEntryValue = Number(createDto.quantity) * Number(createDto.unitPrice);
                    const totalQuantity = Number(product.stock) + Number(createDto.quantity);

                    if (totalQuantity > 0) {
                        const newAveragePrice = (currentTotalValue + newEntryValue) / totalQuantity;
                        product.purchasePrice = Number(newAveragePrice.toFixed(2)); // Round to 2 decimals
                    } else {
                        // Should not happen for IN, but safe fallback
                        product.purchasePrice = createDto.unitPrice;
                    }
                }
                product.stock += createDto.quantity;
            } else {
                if (product.stock < createDto.quantity) {
                    throw new BadRequestException('Stock insuficiente');
                }
                product.stock -= createDto.quantity;
            }

            await queryRunner.manager.save(product);

            // Create movement
            const movement = this.movementsRepository.create({
                ...createDto,
                userId,
            });

            const savedMovement = await queryRunner.manager.save(movement);

            await queryRunner.commitTransaction();
            return savedMovement;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(productId?: string): Promise<InventoryMovement[]> {
        const query = this.movementsRepository.createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.user', 'user')
            .orderBy('movement.createdAt', 'DESC');

        if (productId) {
            query.where('movement.productId = :productId', { productId });
        }

        return query.getMany();
    }
}
