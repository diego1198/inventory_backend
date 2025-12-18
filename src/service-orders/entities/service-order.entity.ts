import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

export enum ServiceOrderStatus {
  PENDING = 'pending',           // Pendiente de iniciar
  IN_PROGRESS = 'in_progress',   // En progreso
  WAITING_PARTS = 'waiting_parts', // Esperando repuestos
  COMPLETED = 'completed',       // Completado
  DELIVERED = 'delivered',       // Entregado al cliente
  CANCELLED = 'cancelled',       // Cancelado
}

export enum ServiceOrderType {
  MAINTENANCE = 'maintenance',     // Mantenimiento preventivo
  REPAIR = 'repair',               // Reparación
  DIAGNOSIS = 'diagnosis',         // Diagnóstico
  INSPECTION = 'inspection',       // Inspección
  OIL_CHANGE = 'oil_change',       // Cambio de aceite
  TIRE_SERVICE = 'tire_service',   // Servicio de llantas
  BRAKE_SERVICE = 'brake_service', // Servicio de frenos
  OTHER = 'other',                 // Otro
}

export interface DiagnosisItem {
  status: 'ok' | 'warning' | 'critical';
  notes: string;
}

export interface DiagnosisInspection {
  date: string;
  mileage: number;
  items: {
    brakes?: DiagnosisItem;
    oil?: DiagnosisItem;
    tires?: DiagnosisItem;
    battery?: DiagnosisItem;
    lights?: DiagnosisItem;
    fluids?: DiagnosisItem;
    suspension?: DiagnosisItem;
    engine?: DiagnosisItem;
    transmission?: DiagnosisItem;
    airFilter?: DiagnosisItem;
    belts?: DiagnosisItem;
    wipers?: DiagnosisItem;
  };
  generalNotes: string;
}

export interface Diagnosis {
  initialInspection?: DiagnosisInspection;
  finalInspection?: DiagnosisInspection;
  workPerformed?: string;
  recommendations?: string;
}

export interface TechnicianNote {
  userId: string;
  userName: string;
  note: string;
  timestamp: string;
}

@Entity('service_orders')
export class ServiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // Formato: OT-YYYYMMDD###

  @Column({
    type: 'enum',
    enum: ServiceOrderType,
    default: ServiceOrderType.MAINTENANCE,
  })
  type: ServiceOrderType;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceOrderStatus,
    default: ServiceOrderStatus.PENDING,
  })
  status: ServiceOrderStatus;

  @Column({ type: 'int', nullable: true })
  mileageAtService: number; // Kilometraje al momento del servicio

  @Column({ type: 'jsonb', nullable: true })
  diagnosis: Diagnosis;

  @Column({ type: 'jsonb', default: [] })
  technicianNotes: TechnicianNote[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ nullable: true })
  estimatedCompletionDate: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  // Relaciones
  @ManyToOne(() => Vehicle, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User; // Técnico asignado

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User; // Usuario que creó la orden

  @Column()
  createdById: string;

  @OneToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'saleId' })
  sale: Sale; // Venta asociada

  @Column({ nullable: true })
  saleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
