import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { AddTechnicianNoteDto } from './dto/add-technician-note.dto';
import { ServiceOrderStatus } from './entities/service-order.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('service-orders')
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Crear una nueva orden de servicio' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
  create(@Body() createServiceOrderDto: CreateServiceOrderDto, @Request() req) {
    return this.serviceOrdersService.create(createServiceOrderDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener todas las órdenes de servicio' })
  @ApiQuery({ name: 'status', required: false, enum: ServiceOrderStatus })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de órdenes' })
  findAll(
    @Query('status') status?: ServiceOrderStatus,
    @Query('assignedToId') assignedToId?: string,
    @Request() req?: any,
  ) {
    // Técnicos solo ven sus órdenes asignadas
    if (req.user.role === UserRole.TECHNICIAN) {
      return this.serviceOrdersService.findByTechnician(req.user.userId);
    }
    return this.serviceOrdersService.findAll({ status, assignedToId });
  }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener estadísticas de órdenes' })
  @ApiResponse({ status: 200, description: 'Estadísticas de órdenes' })
  getStats() {
    return this.serviceOrdersService.getStats();
  }

  @Get('my-orders')
  @Roles(UserRole.TECHNICIAN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener órdenes asignadas al usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes asignadas' })
  getMyOrders(@Request() req) {
    return this.serviceOrdersService.findByTechnician(req.user.userId);
  }

  @Get('by-vehicle/:vehicleId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener historial de órdenes de un vehículo' })
  @ApiResponse({ status: 200, description: 'Historial del vehículo' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.serviceOrdersService.findByVehicle(vehicleId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener una orden de servicio por ID' })
  @ApiResponse({ status: 200, description: 'Orden encontrada' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  findOne(@Param('id') id: string) {
    return this.serviceOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Actualizar una orden de servicio' })
  @ApiResponse({ status: 200, description: 'Orden actualizada' })
  update(
    @Param('id') id: string,
    @Body() updateServiceOrderDto: UpdateServiceOrderDto,
    @Request() req,
  ) {
    return this.serviceOrdersService.update(id, updateServiceOrderDto, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Cambiar estado de una orden' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceOrderStatus,
    @Request() req,
  ) {
    return this.serviceOrdersService.updateStatus(id, status, req.user.userId, req.user.role);
  }

  @Patch(':id/assign')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Asignar técnico a una orden' })
  @ApiResponse({ status: 200, description: 'Técnico asignado' })
  assignTechnician(
    @Param('id') id: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.serviceOrdersService.assignTechnician(id, technicianId);
  }

  @Patch(':id/technician-notes')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Agregar nota del técnico' })
  @ApiResponse({ status: 200, description: 'Nota agregada' })
  addTechnicianNote(
    @Param('id') id: string,
    @Body() addTechnicianNoteDto: AddTechnicianNoteDto,
    @Request() req,
  ) {
    const userName = `${req.user.firstName} ${req.user.lastName}`;
    return this.serviceOrdersService.addTechnicianNote(
      id,
      addTechnicianNoteDto.note,
      req.user.userId,
      userName,
      req.user.role,
    );
  }

  @Patch(':id/link-sale')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Vincular venta a la orden' })
  @ApiResponse({ status: 200, description: 'Venta vinculada' })
  linkSale(@Param('id') id: string, @Body('saleId') saleId: string) {
    return this.serviceOrdersService.linkSale(id, saleId);
  }
}
