import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationsService } from '@/notifications/notifications.service';
import { ServiceOrder, ServiceOrderStatus, TechnicianNote } from './entities/service-order.entity';
import { VehiclesService } from '@/vehicles/vehicles.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UserRole } from '@/users/entities/user.entity';
import { NotificationType } from '@/notifications/entities/notification.entity';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private serviceOrdersRepository: Repository<ServiceOrder>,
    private vehiclesService: VehiclesService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await this.serviceOrdersRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `OT-${datePrefix}%` })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
      sequence = lastSequence + 1;
    }

    return `OT-${datePrefix}${sequence.toString().padStart(3, '0')}`;
  }

  async create(createServiceOrderDto: CreateServiceOrderDto, createdById: string): Promise<ServiceOrder> {
    const orderNumber = await this.generateOrderNumber();

    // Actualizar kilometraje del vehículo si se proporciona
    if (createServiceOrderDto.mileageAtService) {
      await this.vehiclesService.updateMileage(
        createServiceOrderDto.vehicleId,
        createServiceOrderDto.mileageAtService,
      );
    }

    const serviceOrder = this.serviceOrdersRepository.create({
      ...createServiceOrderDto,
      orderNumber,
      createdById,
    });

    const savedOrder = await this.serviceOrdersRepository.save(serviceOrder);

    // Notificar al técnico si está asignado
    if (createServiceOrderDto.assignedToId) {
      await this.notifyTechnicianAssignment(savedOrder);
    }

    return this.findOne(savedOrder.id);
  }

  async findAll(filters?: { status?: ServiceOrderStatus; assignedToId?: string }): Promise<ServiceOrder[]> {
    const query = this.serviceOrdersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.vehicle', 'vehicle')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.assignedTo', 'assignedTo')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.assignedToId) {
      query.andWhere('order.assignedToId = :assignedToId', { assignedToId: filters.assignedToId });
    }

    return query.getMany();
  }

  async findByTechnician(technicianId: string): Promise<ServiceOrder[]> {
    return this.serviceOrdersRepository.find({
      where: { assignedToId: technicianId },
      relations: ['vehicle', 'customer', 'assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByVehicle(vehicleId: string): Promise<ServiceOrder[]> {
    return this.serviceOrdersRepository.find({
      where: { vehicleId },
      relations: ['vehicle', 'customer', 'assignedTo', 'createdBy', 'sale'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServiceOrder> {
    const serviceOrder = await this.serviceOrdersRepository.findOne({
      where: { id },
      relations: ['vehicle', 'customer', 'assignedTo', 'createdBy', 'sale'],
    });

    if (!serviceOrder) {
      throw new NotFoundException('Orden de servicio no encontrada');
    }

    return serviceOrder;
  }

  async update(
    id: string,
    updateServiceOrderDto: UpdateServiceOrderDto,
    userId: string,
    userRole: UserRole,
  ): Promise<ServiceOrder> {
    const serviceOrder = await this.findOne(id);

    // Técnicos solo pueden actualizar órdenes asignadas a ellos
    if (userRole === UserRole.TECHNICIAN && serviceOrder.assignedToId !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar esta orden');
    }

    const previousStatus = serviceOrder.status;
    const previousAssignedToId = serviceOrder.assignedToId;

    // Actualizar fechas según el estado
    if (updateServiceOrderDto.status) {
      if (updateServiceOrderDto.status === ServiceOrderStatus.COMPLETED && !serviceOrder.completedAt) {
        serviceOrder.completedAt = new Date();
      }
      if (updateServiceOrderDto.status === ServiceOrderStatus.DELIVERED && !serviceOrder.deliveredAt) {
        serviceOrder.deliveredAt = new Date();
      }
    }

    Object.assign(serviceOrder, updateServiceOrderDto);
    const updatedOrder = await this.serviceOrdersRepository.save(serviceOrder);

    // Notificar cambio de técnico
    if (updateServiceOrderDto.assignedToId && updateServiceOrderDto.assignedToId !== previousAssignedToId) {
      await this.notifyTechnicianAssignment(updatedOrder);
    }

    // Notificar cambio de estado
    if (updateServiceOrderDto.status && updateServiceOrderDto.status !== previousStatus) {
      await this.notifyStatusChange(updatedOrder, previousStatus);
    }

    return this.findOne(id);
  }

  async addTechnicianNote(
    id: string,
    note: string,
    userId: string,
    userName: string,
    userRole: UserRole,
  ): Promise<ServiceOrder> {
    const serviceOrder = await this.findOne(id);

    // Técnicos solo pueden agregar notas a órdenes asignadas a ellos
    if (userRole === UserRole.TECHNICIAN && serviceOrder.assignedToId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar notas a esta orden');
    }

    const newNote: TechnicianNote = {
      userId,
      userName,
      note,
      timestamp: new Date().toISOString(),
    };

    serviceOrder.technicianNotes = [...(serviceOrder.technicianNotes || []), newNote];
    return this.serviceOrdersRepository.save(serviceOrder);
  }

  async updateStatus(
    id: string,
    status: ServiceOrderStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<ServiceOrder> {
    return this.update(id, { status }, userId, userRole);
  }

  async assignTechnician(id: string, technicianId: string): Promise<ServiceOrder> {
    const serviceOrder = await this.findOne(id);
    serviceOrder.assignedToId = technicianId;
    
    const updatedOrder = await this.serviceOrdersRepository.save(serviceOrder);
    await this.notifyTechnicianAssignment(updatedOrder);
    
    return this.findOne(id);
  }

  async linkSale(id: string, saleId: string): Promise<ServiceOrder> {
    const serviceOrder = await this.findOne(id);
    serviceOrder.saleId = saleId;
    return this.serviceOrdersRepository.save(serviceOrder);
  }

  private async notifyTechnicianAssignment(order: ServiceOrder): Promise<void> {
    if (!order.assignedToId) return;

    const fullOrder = await this.findOne(order.id);
    
    await this.notificationsService.create({
      type: NotificationType.ORDER_ASSIGNED,
      title: 'Nueva orden asignada',
      message: `Se te ha asignado la orden ${fullOrder.orderNumber} - ${fullOrder.vehicle?.brand} ${fullOrder.vehicle?.model} (${fullOrder.vehicle?.plate})`,
      userId: order.assignedToId,
      serviceOrderId: order.id,
      vehicleId: order.vehicleId,
    });
  }

  private async notifyStatusChange(order: ServiceOrder, previousStatus: ServiceOrderStatus): Promise<void> {
    // Notificar al creador de la orden
    await this.notificationsService.create({
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Estado de orden actualizado',
      message: `La orden ${order.orderNumber} cambió de ${previousStatus} a ${order.status}`,
      userId: order.createdById,
      serviceOrderId: order.id,
      vehicleId: order.vehicleId,
    });
  }

  async getStats(): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    delivered: number;
  }> {
    const stats = await this.serviceOrdersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return {
      pending: parseInt(stats.find(s => s.status === ServiceOrderStatus.PENDING)?.count || '0'),
      inProgress: parseInt(stats.find(s => s.status === ServiceOrderStatus.IN_PROGRESS)?.count || '0'),
      completed: parseInt(stats.find(s => s.status === ServiceOrderStatus.COMPLETED)?.count || '0'),
      delivered: parseInt(stats.find(s => s.status === ServiceOrderStatus.DELIVERED)?.count || '0'),
    };
  }
}
