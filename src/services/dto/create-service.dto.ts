import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'Oil Change', description: 'Name of the service' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Full synthetic oil change', description: 'Description of the service', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.00, description: 'Price of the service' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}
