import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ServiceOrder } from '../../service-orders/entities/service-order.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

export enum NotificationType {
  ORDER_ASSIGNED = 'order_assigned',       // Orden asignada al técnico
  ORDER_STATUS_CHANGED = 'order_status_changed', // Cambio de estado de orden
  ORDER_COMPLETED = 'order_completed',     // Orden completada
  REMINDER_DUE = 'reminder_due',           // Recordatorio próximo
  REMINDER_OVERDUE = 'reminder_overdue',   // Recordatorio vencido
  LOW_STOCK_ALERT = 'low_stock_alert',     // Alerta de stock bajo
  GENERAL = 'general',                     // Notificación general
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  // Usuario destinatario
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Referencias opcionales
  @ManyToOne(() => ServiceOrder, { nullable: true })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder: ServiceOrder;

  @Column({ nullable: true })
  serviceOrderId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  vehicleId: string;

  // Metadata adicional (JSON flexible)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
