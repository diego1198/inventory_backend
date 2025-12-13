import { IsArray, IsString, IsOptional, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({ example: 'product-id-here', required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'service-id-here', required: false })
  @IsString()
  @IsOptional()
  serviceId?: string;

    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsNumber()
    quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ example: 'Notas adicionales sobre la venta', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'customer-id-here', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: true, description: 'Si se aplica IVA a la venta', required: false })
  @IsOptional()
  applyTax?: boolean;
}
