import { IsArray, IsString, IsOptional, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({ example: 'product-id-here' })
  @IsString()
  productId: string;

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
}
