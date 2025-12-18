import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Reminder, ReminderStatus, ReminderType } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
  ) {}

  async create(createReminderDto: CreateReminderDto): Promise<Reminder> {
    const reminder = this.remindersRepository.create(createReminderDto);
    return this.remindersRepository.save(reminder);
  }

  async findAll(): Promise<Reminder[]> {
    return this.remindersRepository.find({
      relations: ['vehicle', 'customer'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
      relations: ['vehicle', 'customer', 'originServiceOrder'],
    });

    if (!reminder) {
      throw new NotFoundException('Recordatorio no encontrado');
    }

    return reminder;
  }

  async findByVehicle(vehicleId: string): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { vehicleId },
      relations: ['vehicle', 'customer'],
      order: { dueDate: 'ASC' },
    });
  }

  async findByCustomer(customerId: string): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { customerId },
      relations: ['vehicle', 'customer'],
      order: { dueDate: 'ASC' },
    });
  }

  async findPending(): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { status: In([ReminderStatus.PENDING, ReminderStatus.SENT]) },
      relations: ['vehicle', 'customer'],
      order: { dueDate: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<Reminder[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.remindersRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.vehicle', 'vehicle')
      .leftJoinAndSelect('reminder.customer', 'customer')
      .where('reminder.status = :status', { status: ReminderStatus.PENDING })
      .andWhere('reminder.dueDate <= :futureDate', { futureDate: futureDate.toISOString().split('T')[0] })
      .orderBy('reminder.dueDate', 'ASC')
      .getMany();
  }

  async findOverdue(): Promise<Reminder[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.remindersRepository
      .createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.vehicle', 'vehicle')
      .leftJoinAndSelect('reminder.customer', 'customer')
      .where('reminder.status = :status', { status: ReminderStatus.PENDING })
      .andWhere('reminder.dueDate < :today', { today })
      .orderBy('reminder.dueDate', 'ASC')
      .getMany();
  }

  async update(id: string, updateReminderDto: UpdateReminderDto): Promise<Reminder> {
    const reminder = await this.findOne(id);
    Object.assign(reminder, updateReminderDto);
    return this.remindersRepository.save(reminder);
  }

  async markAsSent(id: string): Promise<Reminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.SENT;
    reminder.notifiedAt = new Date();
    return this.remindersRepository.save(reminder);
  }

  async markAsCompleted(id: string): Promise<Reminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.COMPLETED;
    return this.remindersRepository.save(reminder);
  }

  async markAsOverdue(id: string): Promise<Reminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.OVERDUE;
    return this.remindersRepository.save(reminder);
  }

  async cancel(id: string): Promise<Reminder> {
    const reminder = await this.findOne(id);
    reminder.status = ReminderStatus.CANCELLED;
    return this.remindersRepository.save(reminder);
  }

  async remove(id: string): Promise<void> {
    const reminder = await this.findOne(id);
    await this.remindersRepository.remove(reminder);
  }

  // Crear recordatorio automático después de un servicio
  async createAutoReminder(
    type: ReminderType,
    vehicleId: string,
    customerId: string,
    originServiceOrderId: string,
    daysFromNow?: number,
    mileageIncrement?: number,
    currentMileage?: number,
  ): Promise<Reminder> {
    const titles: Record<ReminderType, string> = {
      [ReminderType.MAINTENANCE]: 'Mantenimiento programado',
      [ReminderType.OIL_CHANGE]: 'Próximo cambio de aceite',
      [ReminderType.TIRE_ROTATION]: 'Rotación de llantas',
      [ReminderType.BRAKE_CHECK]: 'Revisión de frenos',
      [ReminderType.INSPECTION]: 'Inspección general',
      [ReminderType.FILTER_CHANGE]: 'Cambio de filtros',
      [ReminderType.TIMING_BELT]: 'Revisión banda de distribución',
      [ReminderType.CUSTOM]: 'Recordatorio personalizado',
    };

    let dueDate: string | undefined;
    let dueMileage: number | undefined;

    if (daysFromNow) {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      dueDate = date.toISOString().split('T')[0];
    }

    if (mileageIncrement && currentMileage) {
      dueMileage = currentMileage + mileageIncrement;
    }

    return this.create({
      type,
      title: titles[type],
      vehicleId,
      customerId,
      originServiceOrderId,
      dueDate,
      dueMileage,
      advanceNoticeDays: 7,
    });
  }

  async getStats(): Promise<{
    pending: number;
    upcoming: number;
    overdue: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const pending = await this.remindersRepository.count({
      where: { status: ReminderStatus.PENDING },
    });

    const upcoming = await this.remindersRepository
      .createQueryBuilder('reminder')
      .where('reminder.status = :status', { status: ReminderStatus.PENDING })
      .andWhere('reminder.dueDate <= :weekFromNow', { weekFromNow: weekFromNow.toISOString().split('T')[0] })
      .andWhere('reminder.dueDate >= :today', { today })
      .getCount();

    const overdue = await this.remindersRepository
      .createQueryBuilder('reminder')
      .where('reminder.status = :status', { status: ReminderStatus.PENDING })
      .andWhere('reminder.dueDate < :today', { today })
      .getCount();

    return { pending, upcoming, overdue };
  }
}
