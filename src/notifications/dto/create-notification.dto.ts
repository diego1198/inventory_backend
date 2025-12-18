import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'ID del usuario destinatario' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'ID de la orden de servicio relacionada' })
  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @ApiPropertyOptional({ description: 'ID del vehículo relacionado' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
