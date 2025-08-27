import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: User) {
    return this.salesService.create(createSaleDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las ventas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas obtenida' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get('my-sales')
  @ApiOperation({ summary: 'Obtener ventas del usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de ventas del usuario' })
  findMySales(@CurrentUser() user: User) {
    return this.salesService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una venta por ID' })
  @ApiResponse({ status: 200, description: 'Venta encontrada' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Get('by-date-range')
  @ApiOperation({ summary: 'Obtener ventas por rango de fechas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas por fecha' })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (YYYY-MM-DD)' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.salesService.findByDateRange(start, end);
  }
}
