import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { ServiceOrder } from '../../service-orders/entities/service-order.entity';

export enum ReminderType {
  MAINTENANCE = 'maintenance',     // Mantenimiento general
  OIL_CHANGE = 'oil_change',       // Cambio de aceite
  TIRE_ROTATION = 'tire_rotation', // Rotación de llantas
  BRAKE_CHECK = 'brake_check',     // Revisión de frenos
  INSPECTION = 'inspection',       // Inspección general
  FILTER_CHANGE = 'filter_change', // Cambio de filtros
  TIMING_BELT = 'timing_belt',     // Banda de distribución
  CUSTOM = 'custom',               // Personalizado
}

export enum ReminderStatus {
  PENDING = 'pending',       // Pendiente
  SENT = 'sent',             // Notificación enviada
  COMPLETED = 'completed',   // Completado
  CANCELLED = 'cancelled',   // Cancelado
  OVERDUE = 'overdue',       // Vencido
}

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.MAINTENANCE,
  })
  type: ReminderType;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({ type: 'date', nullable: true })
  dueDate: Date; // Fecha programada

  @Column({ type: 'int', nullable: true })
  dueMileage: number; // Kilometraje objetivo

  @Column({ type: 'int', default: 7 })
  advanceNoticeDays: number; // Días de anticipación para notificar

  @Column({ nullable: true })
  notifiedAt: Date; // Fecha en que se envió la notificación

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

  // Orden de servicio que originó este recordatorio (opcional)
  @ManyToOne(() => ServiceOrder, { nullable: true })
  @JoinColumn({ name: 'originServiceOrderId' })
  originServiceOrder: ServiceOrder;

  @Column({ nullable: true })
  originServiceOrderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
