import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: '1712345678', description: 'Document number (CI or RUC)' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'Juan Perez', description: 'Full name of the customer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0991234567', description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email address', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Av. Amazonas y Naciones Unidas', description: 'Physical address', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}
