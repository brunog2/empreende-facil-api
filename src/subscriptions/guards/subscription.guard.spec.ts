import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user-access.constants';
import { SubscriptionAccessService } from '../services/subscription-access.service';
import { SubscriptionGuard } from './subscription.guard';

function contextFor(role: UserRole): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 'user-id', role } }),
    }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

describe('SubscriptionGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const access = { assertAccess: jest.fn() } as unknown as SubscriptionAccessService;
  const guard = new SubscriptionGuard(reflector, access);

  beforeEach(() => jest.clearAllMocks());

  it('não exige assinatura de administrador', async () => {
    await expect(guard.canActivate(contextFor(UserRole.Admin))).resolves.toBe(true);
    expect(access.assertAccess).not.toHaveBeenCalled();
  });

  it('consulta a assinatura do cliente', async () => {
    (access.assertAccess as jest.Mock).mockResolvedValue({ id: 'subscription-id' });
    await expect(guard.canActivate(contextFor(UserRole.Customer))).resolves.toBe(true);
    expect(access.assertAccess).toHaveBeenCalledWith('user-id', undefined);
  });
});
