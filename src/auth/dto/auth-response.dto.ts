import {
  UserPermission,
  UserRole,
} from '../../users/user-access.constants';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    businessName: string | null;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    permissions: UserPermission[];
  };
}

