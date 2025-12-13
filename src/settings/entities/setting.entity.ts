import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Clave única de la configuración' })
  key: string;

  @Column()
  @ApiProperty({ description: 'Valor de la configuración' })
  value: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Descripción de la configuración' })
  description: string;

  @Column({ default: 'string' })
  @ApiProperty({ description: 'Tipo de dato: string, number, boolean, json' })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
