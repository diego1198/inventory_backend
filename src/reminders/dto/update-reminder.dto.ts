import { PartialType } from '@nestjs/swagger';
import { CreateReminderDto } from './create-reminder.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderStatus } from '../entities/reminder.entity';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
  @ApiPropertyOptional({ description: 'Estado del recordatorio', enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
