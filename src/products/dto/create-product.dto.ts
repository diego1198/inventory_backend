import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop HP Pavilion' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Laptop de alta calidad con procesador Intel i7' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 1000.00, description: 'Precio de compra' })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 1299.99, description: 'Precio de venta' })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'uuid-de-categoria', description: 'ID de la categoría' })
  @IsString()
  categoryId: string;
}
