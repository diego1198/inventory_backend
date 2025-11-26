import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../entities/inventory-movement.entity';

export class CreateInventoryMovementDto {
    @ApiProperty({ example: 'uuid-del-producto' })
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ enum: MovementType, example: MovementType.IN })
    @IsEnum(MovementType)
    @IsNotEmpty()
    type: MovementType;

    @ApiProperty({ example: 10, minimum: 1 })
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ example: 0.50, required: false, description: 'Precio de compra unitario (solo para entradas)' })
    @IsNumber()
    @Min(0)
    @IsOptional()
    unitPrice?: number;

    @ApiProperty({ example: 'Compra mensual', required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}
