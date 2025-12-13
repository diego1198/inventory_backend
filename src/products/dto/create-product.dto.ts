import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop HP Pavilion' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Laptop de alta calidad con procesador Intel i7' })
  @IsString()
  @MinLength(5)
  description: string;

  @ApiProperty({ example: 'SKU-12345', description: 'Código o nomenclatura del producto' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'HP', description: 'Marca del producto' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 1000.00, description: 'Precio de compra' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice: number;

  @ApiProperty({ example: 1299.99, description: 'Precio de venta' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ example: 10, description: 'Stock mínimo para alertas', required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStock?: number;

  @ApiProperty({ example: 'uuid-de-categoria', description: 'ID de la categoría' })
  @IsString()
  categoryId: string;
}
