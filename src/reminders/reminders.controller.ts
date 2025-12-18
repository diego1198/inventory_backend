import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Crear un nuevo recordatorio' })
  @ApiResponse({ status: 201, description: 'Recordatorio creado' })
  create(@Body() createReminderDto: CreateReminderDto) {
    return this.remindersService.create(createReminderDto);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener todos los recordatorios' })
  @ApiResponse({ status: 200, description: 'Lista de recordatorios' })
  findAll() {
    return this.remindersService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener estadísticas de recordatorios' })
  @ApiResponse({ status: 200, description: 'Estadísticas' })
  getStats() {
    return this.remindersService.getStats();
  }

  @Get('pending')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener recordatorios pendientes' })
  @ApiResponse({ status: 200, description: 'Recordatorios pendientes' })
  findPending() {
    return this.remindersService.findPending();
  }

  @Get('upcoming')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener recordatorios próximos' })
  @ApiQuery({ name: 'days', required: false, description: 'Días a futuro (default: 7)' })
  @ApiResponse({ status: 200, description: 'Recordatorios próximos' })
  findUpcoming(@Query('days') days?: number) {
    return this.remindersService.findUpcoming(days || 7);
  }

  @Get('overdue')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener recordatorios vencidos' })
  @ApiResponse({ status: 200, description: 'Recordatorios vencidos' })
  findOverdue() {
    return this.remindersService.findOverdue();
  }

  @Get('by-vehicle/:vehicleId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener recordatorios de un vehículo' })
  @ApiResponse({ status: 200, description: 'Recordatorios del vehículo' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.remindersService.findByVehicle(vehicleId);
  }

  @Get('by-customer/:customerId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener recordatorios de un cliente' })
  @ApiResponse({ status: 200, description: 'Recordatorios del cliente' })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.remindersService.findByCustomer(customerId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Obtener un recordatorio por ID' })
  @ApiResponse({ status: 200, description: 'Recordatorio encontrado' })
  @ApiResponse({ status: 404, description: 'Recordatorio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.remindersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Actualizar un recordatorio' })
  @ApiResponse({ status: 200, description: 'Recordatorio actualizado' })
  update(@Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    return this.remindersService.update(id, updateReminderDto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Marcar recordatorio como completado' })
  @ApiResponse({ status: 200, description: 'Recordatorio completado' })
  markAsCompleted(@Param('id') id: string) {
    return this.remindersService.markAsCompleted(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Cancelar recordatorio' })
  @ApiResponse({ status: 200, description: 'Recordatorio cancelado' })
  cancel(@Param('id') id: string) {
    return this.remindersService.cancel(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un recordatorio' })
  @ApiResponse({ status: 200, description: 'Recordatorio eliminado' })
  remove(@Param('id') id: string) {
    return this.remindersService.remove(id);
  }
}
