import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../../users/user-access.constants';
import { PlanFeature } from '../constants/subscription.constants';
import {
  REQUIRED_FEATURE_KEY,
} from '../decorators/require-feature.decorator';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionAccessService } from '../services/subscription-access.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
  subscription?: Subscription;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: SubscriptionAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.role === UserRole.Admin) return true;

    const feature = this.reflector.getAllAndOverride<PlanFeature>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    request.subscription = await this.accessService.assertAccess(
      request.user.id,
      feature,
    );
    return true;
  }
}
