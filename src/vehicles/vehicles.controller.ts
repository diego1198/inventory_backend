import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un vehículo con esta placa' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener todos los vehículos' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('search')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Buscar vehículos por placa, marca, modelo o cliente' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  search(@Query('q') query: string) {
    return this.vehiclesService.search(query);
  }

  @Get('by-plate/:plate')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener un vehículo por su placa' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get('by-customer/:customerId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener vehículos de un cliente' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos del cliente' })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.vehiclesService.findByCustomer(customerId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Patch(':id/mileage')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CASHIER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Actualizar kilometraje del vehículo' })
  @ApiResponse({ status: 200, description: 'Kilometraje actualizado' })
  updateMileage(@Param('id') id: string, @Body('mileage') mileage: number) {
    return this.vehiclesService.updateMileage(id, mileage);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un vehículo (desactivar)' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
