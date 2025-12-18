import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum EngineType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  GAS = 'gas',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plate: string; // Placa del vehículo

  @Column()
  brand: string; // Marca (Toyota, Chevrolet, etc.)

  @Column()
  model: string; // Modelo (Corolla, Aveo, etc.)

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  vin: string; // Número de identificación vehicular

  @Column({
    type: 'enum',
    enum: EngineType,
    default: EngineType.GASOLINE,
  })
  engineType: EngineType;

  @Column({ type: 'int', default: 0 })
  currentMileage: number; // Kilometraje actual

  @Column('text', { nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  // Relación con Cliente
  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
