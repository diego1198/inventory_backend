import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderType } from '../entities/reminder.entity';

export class CreateReminderDto {
  @ApiProperty({ description: 'Tipo de recordatorio', enum: ReminderType })
  @IsEnum(ReminderType)
  type: ReminderType;

  @ApiProperty({ description: 'Título del recordatorio' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Fecha programada (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Kilometraje objetivo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dueMileage?: number;

  @ApiPropertyOptional({ description: 'Días de anticipación para notificar', default: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  advanceNoticeDays?: number;

  @ApiProperty({ description: 'ID del vehículo' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID de la orden de servicio que originó el recordatorio' })
  @IsOptional()
  @IsUUID()
  originServiceOrderId?: string;
}
