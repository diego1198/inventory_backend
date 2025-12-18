import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EngineType } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-1234' })
  @IsString()
  plate: string;

  @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2020 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Color del vehículo', example: 'Rojo' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Número de identificación vehicular (VIN)', example: '1HGBH41JXMN109186' })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional({ description: 'Tipo de motor', enum: EngineType, example: EngineType.GASOLINE })
  @IsOptional()
  @IsEnum(EngineType)
  engineType?: EngineType;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentMileage?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ID del cliente propietario' })
  @IsUUID()
  customerId: string;
}
