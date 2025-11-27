import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics', description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Devices and gadgets', description: 'The description of the category', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
