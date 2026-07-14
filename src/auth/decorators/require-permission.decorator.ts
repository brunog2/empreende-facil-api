import { SetMetadata } from '@nestjs/common';
import { UserPermission } from '../../users/user-access.constants';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (permission: UserPermission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

