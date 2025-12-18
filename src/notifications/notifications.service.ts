import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['serviceOrder', 'vehicle'],
    });
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
      relations: ['serviceOrder', 'vehicle'],
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['serviceOrder', 'vehicle'],
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.notificationsRepository.remove(notification);
  }

  async removeOld(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationsRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isRead = :isRead', { isRead: true })
      .execute();

    return result.affected || 0;
  }

  // Métodos de ayuda para crear notificaciones específicas
  async notifyOrderAssigned(
    userId: string,
    orderNumber: string,
    vehicleInfo: string,
    serviceOrderId: string,
    vehicleId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.ORDER_ASSIGNED,
      title: 'Nueva orden asignada',
      message: `Se te ha asignado la orden ${orderNumber} - ${vehicleInfo}`,
      userId,
      serviceOrderId,
      vehicleId,
    });
  }

  async notifyOrderStatusChanged(
    userId: string,
    orderNumber: string,
    newStatus: string,
    serviceOrderId: string,
    vehicleId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Estado de orden actualizado',
      message: `La orden ${orderNumber} cambió a: ${newStatus}`,
      userId,
      serviceOrderId,
      vehicleId,
    });
  }

  async notifyReminderDue(
    userId: string,
    reminderTitle: string,
    vehicleInfo: string,
    vehicleId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.REMINDER_DUE,
      title: 'Recordatorio próximo',
      message: `${reminderTitle} - ${vehicleInfo}`,
      userId,
      vehicleId,
    });
  }
}
