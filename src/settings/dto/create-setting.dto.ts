import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'Clave única de la configuración' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Valor de la configuración' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Descripción de la configuración' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tipo de dato', enum: ['string', 'number', 'boolean', 'json'] })
  @IsString()
  @IsIn(['string', 'number', 'boolean', 'json'])
  @IsOptional()
  type?: string;
}
