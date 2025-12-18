import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTechnicianNoteDto {
  @ApiProperty({ description: 'Nota del técnico' })
  @IsString()
  note: string;
}
