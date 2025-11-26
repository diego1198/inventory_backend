import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('movements')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Registrar un movimiento de inventario (entrada/salida)' })
    @ApiResponse({ status: 201, description: 'Movimiento registrado exitosamente' })
    create(@Body() createDto: CreateInventoryMovementDto, @Request() req) {
        return this.inventoryService.create(createDto, req.user.userId);
    }

    @Get('movements')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
    @ApiOperation({ summary: 'Obtener historial de movimientos' })
    @ApiQuery({ name: 'productId', required: false })
    findAll(@Query('productId') productId?: string) {
        return this.inventoryService.findAll(productId);
    }
}
