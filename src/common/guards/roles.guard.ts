import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Implementar jerarquía de roles
    // SUPERADMIN tiene acceso a todo
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    // ADMIN tiene acceso a roles ADMIN y CASHIER
    if (user.role === UserRole.ADMIN) {
      return requiredRoles.some((role) => role === UserRole.ADMIN || role === UserRole.CASHIER);
    }

    // CASHIER solo tiene acceso a roles CASHIER
    return requiredRoles.some((role) => user.role === role);
  }
}
