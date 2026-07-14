import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import {
  UserPermission,
  UserRole,
} from '../../users/user-access.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<UserPermission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === UserRole.Admin) {
      throw new ForbiddenException(
        'Administradores não podem acessar dados operacionais dos clientes',
      );
    }

    if (!user?.permissions?.includes(permission)) {
      throw new ForbiddenException(
        'Você não possui permissão para acessar este recurso',
      );
    }

    return true;
  }
}
