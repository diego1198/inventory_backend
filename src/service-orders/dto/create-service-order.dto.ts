import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsDateString, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderType, Diagnosis } from '../entities/service-order.entity';

export class CreateServiceOrderDto {
  @ApiProperty({ description: 'Tipo de servicio', enum: ServiceOrderType })
  @IsEnum(ServiceOrderType)
  type: ServiceOrderType;

  @ApiProperty({ description: 'Descripción del trabajo a realizar' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Kilometraje al momento del servicio' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageAtService?: number;

  @ApiPropertyOptional({ description: 'Diagnóstico estructurado' })
  @IsOptional()
  @IsObject()
  diagnosis?: Diagnosis;

  @ApiPropertyOptional({ description: 'Costo estimado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Fecha estimada de completado' })
  @IsOptional()
  @IsDateString()
  estimatedCompletionDate?: string;

  @ApiProperty({ description: 'ID del vehículo' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID del técnico asignado' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
