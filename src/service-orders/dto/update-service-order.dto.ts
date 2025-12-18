import { PartialType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../entities/service-order.entity';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiPropertyOptional({ description: 'Estado de la orden', enum: ServiceOrderStatus })
  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({ description: 'ID de la venta asociada' })
  @IsOptional()
  @IsUUID()
  saleId?: string;
}
