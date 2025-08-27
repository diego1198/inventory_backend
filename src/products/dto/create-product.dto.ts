import { IsString, IsNumber, IsEnum, IsOptional, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop HP Pavilion' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Laptop de alta calidad con procesador Intel i7' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 1299.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.ELECTRONICS })
  @IsEnum(ProductCategory)
  category: ProductCategory;
}
