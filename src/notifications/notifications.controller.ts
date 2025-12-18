import { Controller, Get, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario actual' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  findAll(@Request() req, @Query('limit') limit?: number) {
    return this.notificationsService.findByUser(req.user.userId, limit || 50);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Obtener notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Notificaciones no leídas' })
  findUnread(@Request() req) {
    return this.notificationsService.findUnreadByUser(req.user.userId);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Cantidad de no leídas' })
  async countUnread(@Request() req) {
    const count = await this.notificationsService.countUnread(req.user.userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una notificación por ID' })
  @ApiResponse({ status: 200, description: 'Notificación encontrada' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: 'Todas las notificaciones han sido marcadas como leídas' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.notificationsService.remove(id, req.user.userId);
    return { message: 'Notificación eliminada' };
  }
}
